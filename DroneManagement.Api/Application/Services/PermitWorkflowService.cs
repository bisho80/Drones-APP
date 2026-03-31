using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using DroneManagement.Api.Application.Dtos;
using DroneManagement.Api.Application.Exceptions;
using DroneManagement.Api.Data;
using DroneManagement.Api.Models;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace DroneManagement.Api.Application.Services;

/// <summary>
/// Application-layer implementation for military permit workflow.
/// </summary>
public class PermitWorkflowService(
    AppDbContext dbContext,
    IValidator<PermitDto> permitValidator,
    INotificationService notificationService,
    IInAppNotificationService inAppNotificationService) : IPermitWorkflowService
{
    // Static AES key requirement.
    // NOTE: In production move to secret vault / secure key management.
    private const string SystemSecretKey = "MILITARY_STATIC_SYSTEM_SECRET_KEY_2026_AES256!";
    private const string IntelligencePhone = "+961-1-700-111";
    private const string AirForcePhone = "+961-1-700-222";

    public async Task<IReadOnlyCollection<PermitListItemDto>> GetAllPermitsAsync(CancellationToken cancellationToken = default)
    {
        await UpdateAirForceAlertsAsync(cancellationToken);
        return await BuildPermitQuery()
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<PermitListItemDto>> GetPermitsByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        var normalizedUsername = username.Trim();
        await UpdateAirForceAlertsAsync(cancellationToken);

        return await BuildPermitQuery()
            .Where(p => p.Username == normalizedUsername)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<PermitListItemDto>> GetAirForceOpsViewAsync(CancellationToken cancellationToken = default)
    {
        await UpdateAirForceAlertsAsync(cancellationToken);
        return await BuildPermitQuery()
            .Where(p =>
                p.Status == PermitStatus.Approved ||
                p.Status == PermitStatus.AwaitingLicense ||
                p.Status == PermitStatus.PaymentSubmitted ||
                p.Status == PermitStatus.PendingPayment ||
                p.Status == PermitStatus.AwaitingInternalApproval)
            .OrderBy(p => p.ScheduledStartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<FlightPermit> SubmitPermitRequestAsync(PermitDto request, CancellationToken cancellationToken = default)
    {
        await permitValidator.ValidateAndThrowAsync(request, cancellationToken);

        var drone = await dbContext.Drones
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == request.DroneId, cancellationToken);

        if (drone is null)
            throw new InvalidOperationException("Drone not found.");

        if (drone.User is null || !drone.User.IsApproved)
            throw new InvalidOperationException("Drone owner account is not approved.");

        var baseLocation = drone.User?.BaseLocation ?? string.Empty;
        var intersection = await FindIntersectedNoFlyZoneAsync(
            request.UrcLat, request.UrcLng, request.LlcLat, request.LlcLng, baseLocation, cancellationToken);
        if (intersection is not null)
            throw new AreaRestrictedException(intersection.RestrictionReason);

        await using var tx = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var permit = new FlightPermit
            {
                DroneId = request.DroneId,
                FlightPurpose = request.FlightPurpose.Trim(),
                LocationLabel = request.LocationLabel.Trim(),
                Phone = request.Phone.Trim(),
                UrcLat = request.UrcLat,
                UrcLng = request.UrcLng,
                LlcLat = request.LlcLat,
                LlcLng = request.LlcLng,
                MaxAltitude = request.MaxAltitude,
                ScheduledStartTime = request.ScheduledStartTime,
                ScheduledEndTime = request.ScheduledEndTime,
                Status = PermitStatus.AwaitingInternalApproval
            };

            dbContext.Set<FlightPermit>().Add(permit);
            await dbContext.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return permit;
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<FlightPermit> ApproveInternallyAsync(int permitId, CancellationToken cancellationToken = default)
    {
        await using var tx = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var permit = await dbContext.Set<FlightPermit>().FirstOrDefaultAsync(p => p.Id == permitId, cancellationToken)
                ?? throw new InvalidOperationException("Permit not found.");

            if (permit.Status != PermitStatus.AwaitingInternalApproval)
                throw new InvalidOperationException("Only AwaitingInternalApproval permits can move to PendingPayment.");

            permit.Status = PermitStatus.PendingPayment;
            await dbContext.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return permit;
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<FlightPermit> SubmitCashPaymentAsync(
        int permitId,
        string actorUsername,
        bool isAdminLike,
        CancellationToken cancellationToken = default)
    {
        await using var tx = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var permit = await dbContext.Set<FlightPermit>()
                .Include(p => p.Drone)
                .ThenInclude(d => d!.User)
                .FirstOrDefaultAsync(p => p.Id == permitId, cancellationToken)
                ?? throw new InvalidOperationException("Permit not found.");

            if (permit.Status != PermitStatus.PendingPayment)
                throw new InvalidOperationException("Only PendingPayment permits can submit cash payment.");

            var ownerUsername = permit.Drone?.User?.Username ?? string.Empty;
            if (!isAdminLike && !ownerUsername.Equals(actorUsername, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("You can only submit payment for your own permit.");

            permit.Status = PermitStatus.PaymentSubmitted;
            await dbContext.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
            return permit;
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<FlightPermit> ConfirmCashPaymentAsync(int permitId, CancellationToken cancellationToken = default)
    {
        await using var tx = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var permit = await dbContext.Set<FlightPermit>().FirstOrDefaultAsync(p => p.Id == permitId, cancellationToken)
                ?? throw new InvalidOperationException("Permit not found.");

            if (permit.Status != PermitStatus.PaymentSubmitted)
                throw new InvalidOperationException("Only PaymentSubmitted permits can be confirmed.");

            permit.IsPaymentProcessed = true;
            permit.Status = PermitStatus.AwaitingLicense;

            await dbContext.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
            return permit;
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<FlightPermit> IssueLicenseAsync(int permitId, CancellationToken cancellationToken = default)
    {
        await using var tx = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var permit = await dbContext.Set<FlightPermit>()
                .Include(p => p.Drone)
                .FirstOrDefaultAsync(p => p.Id == permitId, cancellationToken)
                ?? throw new InvalidOperationException("Permit not found.");

            if (permit.Status != PermitStatus.AwaitingLicense)
                throw new InvalidOperationException("Only AwaitingLicense permits can be issued.");

            permit.Status = PermitStatus.Approved;
            permit.ApprovedAt = DateTime.UtcNow;
            permit.ExpiresAt = permit.ScheduledEndTime ?? DateTime.UtcNow.AddHours(2);
            permit.PermitSerialNumber = $"PERMIT-{DateTime.UtcNow:yyyyMMdd}-{permit.Id:D6}";

            var hasLicense = await dbContext.Licenses.AnyAsync(l => l.DroneId == permit.DroneId, cancellationToken);
            if (!hasLicense)
            {
                dbContext.Licenses.Add(new License
                {
                    DroneId = permit.DroneId,
                    LicenseNumber = $"LIC-{DateTime.UtcNow:yyyyMMdd}-{permit.DroneId:D5}",
                    ExpiresAt = permit.ExpiresAt,
                    Status = LicenseStatus.Active
                });
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            await NotifyOnFinalApprovalAsync(permit, cancellationToken);
            await tx.CommitAsync(cancellationToken);
            return permit;
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<FlightPermit> RejectPermitAsync(
        int permitId,
        string reason,
        DateTime? refundPickupAt,
        string? refundPickupDesk,
        string actorUsername,
        CancellationToken cancellationToken = default)
    {
        await using var tx = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var permit = await dbContext.Set<FlightPermit>().FirstOrDefaultAsync(p => p.Id == permitId, cancellationToken)
                ?? throw new InvalidOperationException("Permit not found.");

            if (permit.Status is PermitStatus.Approved or PermitStatus.Rejected)
                throw new InvalidOperationException("Approved or rejected permits cannot be rejected again.");

            var rejectionReason = string.IsNullOrWhiteSpace(reason) ? "Rejected by internal authority." : reason.Trim();
            permit.Status = PermitStatus.Rejected;
            permit.RejectionReason = rejectionReason;
            permit.RejectedAt = DateTime.UtcNow;
            permit.RefundPickupAt = refundPickupAt;
            permit.RefundPickupDesk = string.IsNullOrWhiteSpace(refundPickupDesk) ? null : refundPickupDesk.Trim();

            if (permit.IsPaymentProcessed)
            {
                permit.IsRefundIssued = true;
                permit.RefundStatus = RefundStatus.Requested;
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            var permitWithOwner = await dbContext.Set<FlightPermit>()
                .Include(p => p.Drone).ThenInclude(d => d!.User)
                .FirstAsync(p => p.Id == permitId, cancellationToken);
            var ownerUsername = permitWithOwner.Drone?.User?.Username ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(ownerUsername))
            {
                var message = $"Permit #{permitId} rejected. Reason: {rejectionReason}.";
                if (permitWithOwner.RefundPickupAt is not null)
                {
                    message += $" Refund pickup: {permitWithOwner.RefundPickupAt.Value:u} at {permitWithOwner.RefundPickupDesk}.";
                }
                inAppNotificationService.Send(actorUsername, ownerUsername, message, permitId);
            }

            if (permitWithOwner.RefundStatus == RefundStatus.Requested)
            {
                var supers = await dbContext.Users.Where(u => u.Role == UserRole.SuperAdmin).Select(u => u.Username).ToListAsync(cancellationToken);
                foreach (var super in supers)
                {
                    inAppNotificationService.Send(actorUsername, super, $"Refund requested for rejected permit #{permitId}.", permitId);
                }
            }
            await tx.CommitAsync(cancellationToken);

            return permit;
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<FlightPermit> SendRefundToAdminAsync(int permitId, string actorUsername, CancellationToken cancellationToken = default)
    {
        await using var tx = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var permit = await dbContext.Set<FlightPermit>()
                .Include(p => p.Drone).ThenInclude(d => d!.User)
                .FirstOrDefaultAsync(p => p.Id == permitId, cancellationToken)
                ?? throw new InvalidOperationException("Permit not found.");

            if (permit.RefundStatus != RefundStatus.Requested)
                throw new InvalidOperationException("Refund must be in Requested state.");

            permit.RefundStatus = RefundStatus.SentToAdmin;
            permit.RefundSentToAdminAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);

            var targetBase = permit.Drone?.User?.BaseLocation ?? string.Empty;
            var admins = await dbContext.Users
                .Where(u => u.Role == UserRole.Admin && u.BaseLocation == targetBase)
                .Select(u => u.Username)
                .ToListAsync(cancellationToken);

            foreach (var adminUsername in admins)
            {
                inAppNotificationService.Send(actorUsername, adminUsername, $"Refund for permit #{permit.Id} has been sent to your base desk.", permit.Id);
            }

            await tx.CommitAsync(cancellationToken);
            return permit;
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<FlightPermit> ReceiveRefundByAdminAsync(int permitId, string actorUsername, CancellationToken cancellationToken = default)
    {
        await using var tx = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var permit = await dbContext.Set<FlightPermit>()
                .FirstOrDefaultAsync(p => p.Id == permitId, cancellationToken)
                ?? throw new InvalidOperationException("Permit not found.");

            if (permit.RefundStatus != RefundStatus.SentToAdmin)
                throw new InvalidOperationException("Refund must be in SentToAdmin state.");

            permit.RefundStatus = RefundStatus.ReceivedByAdmin;
            permit.RefundReceivedByAdminAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);

            var superAdmins = await dbContext.Users
                .Where(u => u.Role == UserRole.SuperAdmin)
                .Select(u => u.Username)
                .ToListAsync(cancellationToken);
            foreach (var super in superAdmins)
            {
                inAppNotificationService.Send(actorUsername, super, $"Admin received refund package for permit #{permit.Id}.", permit.Id);
            }

            await tx.CommitAsync(cancellationToken);
            return permit;
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<FlightPermit> PayRefundToUserAsync(int permitId, string actorUsername, CancellationToken cancellationToken = default)
    {
        await using var tx = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var permit = await dbContext.Set<FlightPermit>()
                .Include(p => p.Drone).ThenInclude(d => d!.User)
                .FirstOrDefaultAsync(p => p.Id == permitId, cancellationToken)
                ?? throw new InvalidOperationException("Permit not found.");

            if (permit.RefundStatus != RefundStatus.ReceivedByAdmin)
                throw new InvalidOperationException("Refund must be in ReceivedByAdmin state.");

            permit.RefundStatus = RefundStatus.PaidToUser;
            permit.RefundPaidToUserAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);

            var ownerUsername = permit.Drone?.User?.Username ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(ownerUsername))
            {
                inAppNotificationService.Send(actorUsername, ownerUsername, $"Your refund for permit #{permit.Id} has been paid.", permit.Id);
            }

            var superAdmins = await dbContext.Users
                .Where(u => u.Role == UserRole.SuperAdmin)
                .Select(u => u.Username)
                .ToListAsync(cancellationToken);
            foreach (var super in superAdmins)
            {
                inAppNotificationService.Send(actorUsername, super, $"Refund paid to user for permit #{permit.Id}.", permit.Id);
            }

            await tx.CommitAsync(cancellationToken);
            return permit;
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<FlightPermit> ProcessPaymentAsync(int permitId, CancellationToken cancellationToken = default)
    {
        var permit = await dbContext.Set<FlightPermit>().AsNoTracking().FirstOrDefaultAsync(p => p.Id == permitId, cancellationToken)
            ?? throw new InvalidOperationException("Permit not found.");

        if (permit.Status is PermitStatus.PendingPayment or PermitStatus.PaymentSubmitted)
            await ConfirmCashPaymentAsync(permitId, cancellationToken);

        return await IssueLicenseAsync(permitId, cancellationToken);
    }

    public string BuildEncryptedQrPayload(FlightPermit permit, string droneSerialNumber)
    {
        if (permit.Status != PermitStatus.Approved || permit.ExpiresAt is null)
            throw new InvalidOperationException("QR payload is available only for approved permits.");

        var payload = new
        {
            DroneSerial = droneSerialNumber,
            Coordinates = new
            {
                permit.UrcLat,
                permit.UrcLng,
                permit.LlcLat,
                permit.LlcLng
            },
            ExpiryTime = permit.ExpiresAt.Value
        };

        var plainText = JsonSerializer.Serialize(payload);
        return EncryptAes256(plainText, SystemSecretKey);
    }

    public QrVerificationResultDto VerifyEncryptedQrPayload(string encryptedPayload)
    {
        try
        {
            var plainText = DecryptAes256(encryptedPayload, SystemSecretKey);
            using var doc = JsonDocument.Parse(plainText);
            var root = doc.RootElement;

            var droneSerial = root.GetProperty("DroneSerial").GetString() ?? string.Empty;
            var coords = root.GetProperty("Coordinates");
            var expiry = root.GetProperty("ExpiryTime").GetDateTime();
            var now = DateTime.UtcNow;
            var valid = expiry > now;

            return new QrVerificationResultDto
            {
                IsValid = valid,
                DroneSerial = droneSerial,
                UrcLat = coords.GetProperty("UrcLat").GetDecimal(),
                UrcLng = coords.GetProperty("UrcLng").GetDecimal(),
                LlcLat = coords.GetProperty("LlcLat").GetDecimal(),
                LlcLng = coords.GetProperty("LlcLng").GetDecimal(),
                ExpiryTime = expiry,
                Message = valid ? "QR permit is valid." : "QR permit is expired."
            };
        }
        catch
        {
            return new QrVerificationResultDto
            {
                IsValid = false,
                Message = "Invalid QR payload."
            };
        }
    }

    public async Task<FlightReceiptDto> GetOfficialReceiptAsync(
        int permitId,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken = default)
    {
        EnsureClassifiedAccess(principal);

        var permit = await dbContext.Set<FlightPermit>()
            .Include(p => p.Drone)
            .FirstOrDefaultAsync(p => p.Id == permitId, cancellationToken)
            ?? throw new InvalidOperationException("Permit not found.");

        if (permit.Status != PermitStatus.Approved || permit.Drone is null || permit.ExpiresAt is null || string.IsNullOrWhiteSpace(permit.PermitSerialNumber))
            throw new InvalidOperationException("Official receipt is only available for approved permits.");

        var qr = BuildEncryptedQrPayload(permit, permit.Drone.SerialNumber);
        return new FlightReceiptDto
        {
            PermitId = permit.Id,
            PermitSerialNumber = permit.PermitSerialNumber,
            DroneId = permit.DroneId,
            DroneSerialNumber = permit.Drone.SerialNumber,
            FlightPurpose = permit.FlightPurpose,
            LocationLabel = permit.LocationLabel,
            Phone = permit.Phone,
            UrcLat = permit.UrcLat,
            UrcLng = permit.UrcLng,
            LlcLat = permit.LlcLat,
            LlcLng = permit.LlcLng,
            MaxAltitude = permit.MaxAltitude,
            ScheduledStartTime = permit.ScheduledStartTime,
            ScheduledEndTime = permit.ScheduledEndTime,
            IssuedAt = permit.ApprovedAt ?? DateTime.UtcNow,
            ExpiryTime = permit.ExpiresAt.Value,
            IntelligencePhone = IntelligencePhone,
            AirForcePhone = AirForcePhone,
            EncryptedQrPayload = qr
        };
    }

    public async Task<FlightPermit> ReportIncidentAsync(
        int permitId,
        string note,
        DateTime? refundPickupAt,
        string? refundPickupDesk,
        CancellationToken cancellationToken = default)
    {
        await using var tx = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var permit = await dbContext.Set<FlightPermit>()
                .Include(p => p.Drone)
                .ThenInclude(d => d!.User)
                .FirstOrDefaultAsync(p => p.Id == permitId, cancellationToken)
                ?? throw new InvalidOperationException("Permit not found.");

            permit.IncidentReported = true;
            permit.IncidentAt = DateTime.UtcNow;
            permit.IsLicenseRevoked = true;
            permit.IsRefundIssued = permit.IsPaymentProcessed;
            permit.RefundStatus = permit.IsPaymentProcessed ? RefundStatus.Requested : RefundStatus.None;
            permit.RejectedAt = DateTime.UtcNow;
            permit.RefundPickupAt = refundPickupAt;
            permit.RefundPickupDesk = string.IsNullOrWhiteSpace(refundPickupDesk) ? null : refundPickupDesk.Trim();
            permit.Status = PermitStatus.Rejected;
            permit.RejectionReason = string.IsNullOrWhiteSpace(note)
                ? "Permit revoked due to reported incident."
                : $"Permit revoked due to incident: {note.Trim()}";

            await dbContext.SaveChangesAsync(cancellationToken);

            var ownerEmail = permit.Drone?.User?.Email ?? "owner@unknown.local";
            var ownerPhone = !string.IsNullOrWhiteSpace(permit.Phone) ? permit.Phone : permit.Drone?.User?.Phone ?? string.Empty;
            var ownerUsername = permit.Drone?.User?.Username ?? string.Empty;

            var refundMessage = permit.IsRefundIssued
                ? BuildRefundMessage(refundPickupAt, refundPickupDesk)
                : "Refund is not applicable because payment was not confirmed yet.";

            await notificationService.SendEmailAsync(
                [ownerEmail],
                "Incident Notice - Permit Revoked",
                $"Permit {permit.PermitSerialNumber ?? permit.Id.ToString()} has been revoked. {refundMessage}",
                cancellationToken);

            await notificationService.SendEmailAsync(
                ["ops-airforce@mil.local", "intel-desk@mil.local"],
                "Incident Escalation",
                $"Permit #{permit.Id} reported incident. Air force notified. Note: {note}. {refundMessage}",
                cancellationToken);

            if (!string.IsNullOrWhiteSpace(ownerPhone))
            {
                await notificationService.SendPhoneNotificationAsync([ownerPhone], $"Your permit was revoked. {refundMessage}", cancellationToken);
            }

            if (!string.IsNullOrWhiteSpace(ownerUsername))
            {
                inAppNotificationService.Send(
                    "ops-airforce",
                    ownerUsername,
                    $"Incident on permit #{permit.Id}. {refundMessage}",
                    permit.Id);
            }

            await tx.CommitAsync(cancellationToken);
            return permit;
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static string BuildRefundMessage(DateTime? refundPickupAt, string? refundPickupDesk)
    {
        var desk = string.IsNullOrWhiteSpace(refundPickupDesk) ? "your assigned air base desk" : refundPickupDesk.Trim();
        if (refundPickupAt is null)
            return $"Please come to {desk} to collect your refund.";

        return $"Please come on {refundPickupAt.Value:u} to {desk} to collect your refund.";
    }

    private async Task<NoFlyZone?> FindIntersectedNoFlyZoneAsync(
        decimal urcLat,
        decimal urcLng,
        decimal llcLat,
        decimal llcLng,
        string baseLocation,
        CancellationToken cancellationToken)
    {
        var reqMinLat = Math.Min(urcLat, llcLat);
        var reqMaxLat = Math.Max(urcLat, llcLat);
        var reqMinLng = Math.Min(urcLng, llcLng);
        var reqMaxLng = Math.Max(urcLng, llcLng);

        var zones = await dbContext.Set<NoFlyZone>()
            .Where(z => z.BaseLocation == baseLocation)
            .ToListAsync(cancellationToken);
        foreach (var zone in zones)
        {
            var zoneMinLat = Math.Min(zone.UrcLat, zone.LlcLat);
            var zoneMaxLat = Math.Max(zone.UrcLat, zone.LlcLat);
            var zoneMinLng = Math.Min(zone.UrcLng, zone.LlcLng);
            var zoneMaxLng = Math.Max(zone.UrcLng, zone.LlcLng);

            var intersects =
                reqMinLat <= zoneMaxLat &&
                reqMaxLat >= zoneMinLat &&
                reqMinLng <= zoneMaxLng &&
                reqMaxLng >= zoneMinLng;

            if (intersects)
                return zone;
        }

        return null;
    }

    private static void EnsureClassifiedAccess(ClaimsPrincipal principal)
    {
        var isClassified = principal.Claims.Any(c =>
            c.Type.Equals("IsClassified", StringComparison.OrdinalIgnoreCase) &&
            c.Value.Equals("true", StringComparison.OrdinalIgnoreCase));

        if (!isClassified)
            throw new ClassifiedAccessDeniedException("Classified permit details require IsClassified=true claim.");
    }

    private static string EncryptAes256(string plainText, string secret)
    {
        var key = SHA256.HashData(Encoding.UTF8.GetBytes(secret));

        using var aes = Aes.Create();
        aes.KeySize = 256;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;
        aes.Key = key;
        aes.GenerateIV();

        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        var inputBytes = Encoding.UTF8.GetBytes(plainText);
        var encryptedBytes = encryptor.TransformFinalBlock(inputBytes, 0, inputBytes.Length);

        var output = new byte[aes.IV.Length + encryptedBytes.Length];
        Buffer.BlockCopy(aes.IV, 0, output, 0, aes.IV.Length);
        Buffer.BlockCopy(encryptedBytes, 0, output, aes.IV.Length, encryptedBytes.Length);

        return Convert.ToBase64String(output);
    }

    private static string DecryptAes256(string cipherTextBase64, string secret)
    {
        var key = SHA256.HashData(Encoding.UTF8.GetBytes(secret));
        var input = Convert.FromBase64String(cipherTextBase64);

        using var aes = Aes.Create();
        aes.KeySize = 256;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;
        aes.Key = key;

        var iv = new byte[16];
        Buffer.BlockCopy(input, 0, iv, 0, iv.Length);
        aes.IV = iv;

        var cipherBytes = new byte[input.Length - iv.Length];
        Buffer.BlockCopy(input, iv.Length, cipherBytes, 0, cipherBytes.Length);

        using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
        var plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);
        return Encoding.UTF8.GetString(plainBytes);
    }

    private IQueryable<PermitListItemDto> BuildPermitQuery()
    {
        var now = DateTime.UtcNow;
        return dbContext.Set<FlightPermit>()
            .AsNoTracking()
            .Include(p => p.Drone)
            .ThenInclude(d => d!.User)
            .Select(p => new PermitListItemDto
            {
                Id = p.Id,
                DroneId = p.DroneId,
                DroneSerialNumber = p.Drone != null ? p.Drone.SerialNumber : string.Empty,
                UserId = p.Drone != null ? p.Drone.UserId : 0,
                Username = p.Drone != null && p.Drone.User != null ? p.Drone.User.Username : string.Empty,
                UserBaseLocation = p.Drone != null && p.Drone.User != null ? p.Drone.User.BaseLocation : string.Empty,
                FlightPurpose = p.FlightPurpose,
                LocationLabel = p.LocationLabel,
                Phone = p.Phone,
                UrcLat = p.UrcLat,
                UrcLng = p.UrcLng,
                LlcLat = p.LlcLat,
                LlcLng = p.LlcLng,
                MaxAltitude = p.MaxAltitude,
                ScheduledStartTime = p.ScheduledStartTime,
                ScheduledEndTime = p.ScheduledEndTime,
                MinutesToStart = EF.Functions.DateDiffMinute(now, p.ScheduledStartTime),
                RequiresAirForceAlert = !p.AirForceAlertSent && EF.Functions.DateDiffMinute(now, p.ScheduledStartTime) <= 30 && EF.Functions.DateDiffMinute(now, p.ScheduledStartTime) >= 0,
                Status = p.Status,
                RejectionReason = p.RejectionReason,
                IsPaymentProcessed = p.IsPaymentProcessed,
                PermitSerialNumber = p.PermitSerialNumber,
                OwnerEmailSent = p.OwnerEmailSent,
                AuthorityEmailSent = p.AuthorityEmailSent,
                AirForceAlertSent = p.AirForceAlertSent,
                IsLicenseRevoked = p.IsLicenseRevoked,
                IsRefundIssued = p.IsRefundIssued,
                RefundStatus = p.RefundStatus,
                RefundSentToAdminAt = p.RefundSentToAdminAt,
                RefundReceivedByAdminAt = p.RefundReceivedByAdminAt,
                RefundPaidToUserAt = p.RefundPaidToUserAt,
                RefundPickupAt = p.RefundPickupAt,
                RefundPickupDesk = p.RefundPickupDesk,
                IncidentReported = p.IncidentReported,
                IncidentAt = p.IncidentAt,
                RejectedAt = p.RejectedAt,
                CreatedAt = p.CreatedAt,
                ApprovedAt = p.ApprovedAt,
                ExpiresAt = p.ExpiresAt
            });
    }

    private async Task NotifyOnFinalApprovalAsync(FlightPermit permit, CancellationToken cancellationToken)
    {
        var drone = await dbContext.Drones
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == permit.DroneId, cancellationToken);

        if (drone?.User is null)
            return;

        var authorityRecipients = ResolveAuthorityRecipients(permit.LocationLabel, permit.FlightPurpose);
        await notificationService.SendEmailAsync(
            authorityRecipients,
            "Final Permit Approval",
            $"Permit {permit.PermitSerialNumber} approved for drone {drone.SerialNumber} in {permit.LocationLabel}.",
            cancellationToken);

        await notificationService.SendEmailAsync(
            [drone.User.Email],
            "Your Permit is Approved",
            $"Permit {permit.PermitSerialNumber} approved. Contact numbers: {IntelligencePhone}, {AirForcePhone}.",
            cancellationToken);

        await notificationService.SendPhoneNotificationAsync([IntelligencePhone, AirForcePhone], $"Approved permit {permit.PermitSerialNumber} scheduled at {permit.ScheduledStartTime:u}", cancellationToken);

        permit.AuthorityEmailSent = true;
        permit.OwnerEmailSent = true;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static IReadOnlyCollection<string> ResolveAuthorityRecipients(string locationLabel, string flightPurpose)
    {
        var recipients = new List<string> { "ops-airforce@mil.local" };
        var location = locationLabel.ToLowerInvariant();
        var purpose = flightPurpose.ToLowerInvariant();

        if (location.Contains("north")) recipients.Add("north-command@mil.local");
        else if (location.Contains("south")) recipients.Add("south-command@mil.local");
        else if (location.Contains("bekaa")) recipients.Add("bekaa-command@mil.local");
        else recipients.Add("central-command@mil.local");

        if (purpose.Contains("media") || purpose.Contains("photo") || purpose.Contains("video"))
            recipients.Add("guidance-directorate@mil.local");

        return recipients.Distinct().ToList();
    }

    private async Task UpdateAirForceAlertsAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var upcoming = await dbContext.Set<FlightPermit>()
            .Where(p => p.Status == PermitStatus.Approved &&
                        !p.AirForceAlertSent &&
                        p.ScheduledStartTime >= now &&
                        p.ScheduledStartTime <= now.AddMinutes(30))
            .ToListAsync(cancellationToken);

        foreach (var permit in upcoming)
        {
            await notificationService.SendPhoneNotificationAsync(
                [AirForcePhone],
                $"Alert: permit {permit.PermitSerialNumber ?? permit.Id.ToString()} starts in less than 30 minutes.",
                cancellationToken);
            permit.AirForceAlertSent = true;
        }

        if (upcoming.Count > 0)
            await dbContext.SaveChangesAsync(cancellationToken);
    }
}
