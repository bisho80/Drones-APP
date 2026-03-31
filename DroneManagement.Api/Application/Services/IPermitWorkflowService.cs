using System.Security.Claims;
using DroneManagement.Api.Application.Dtos;
using DroneManagement.Api.Models;

namespace DroneManagement.Api.Application.Services;

public interface IPermitWorkflowService
{
    Task<IReadOnlyCollection<PermitListItemDto>> GetAllPermitsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<PermitListItemDto>> GetPermitsByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<FlightPermit> SubmitPermitRequestAsync(PermitDto request, CancellationToken cancellationToken = default);
    Task<FlightPermit> ApproveInternallyAsync(int permitId, CancellationToken cancellationToken = default);
    Task<FlightPermit> SubmitCashPaymentAsync(int permitId, string actorUsername, bool isAdminLike, CancellationToken cancellationToken = default);
    Task<FlightPermit> ConfirmCashPaymentAsync(int permitId, CancellationToken cancellationToken = default);
    Task<FlightPermit> IssueLicenseAsync(int permitId, CancellationToken cancellationToken = default);
    Task<FlightPermit> RejectPermitAsync(int permitId, string reason, DateTime? refundPickupAt, string? refundPickupDesk, string actorUsername, CancellationToken cancellationToken = default);
    Task<FlightPermit> SendRefundToAdminAsync(int permitId, string actorUsername, CancellationToken cancellationToken = default);
    Task<FlightPermit> ReceiveRefundByAdminAsync(int permitId, string actorUsername, CancellationToken cancellationToken = default);
    Task<FlightPermit> PayRefundToUserAsync(int permitId, string actorUsername, CancellationToken cancellationToken = default);
    Task<FlightPermit> ProcessPaymentAsync(int permitId, CancellationToken cancellationToken = default);
    Task<FlightPermit> ReportIncidentAsync(
        int permitId,
        string note,
        DateTime? refundPickupAt,
        string? refundPickupDesk,
        CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<PermitListItemDto>> GetAirForceOpsViewAsync(CancellationToken cancellationToken = default);
    string BuildEncryptedQrPayload(FlightPermit permit, string droneSerialNumber);
    QrVerificationResultDto VerifyEncryptedQrPayload(string encryptedPayload);
    Task<FlightReceiptDto> GetOfficialReceiptAsync(int permitId, ClaimsPrincipal principal, CancellationToken cancellationToken = default);
}
