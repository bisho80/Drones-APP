using DroneManagement.Api.Data;
using DroneManagement.Api.Models;
using DroneManagement.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DroneManagement.Api.Controllers;

/// <summary>
/// Flight request workflow endpoints.
/// Business flow:
/// - Create request with reason + URC/LLG + max altitude + phone.
/// - Run mock NO FLY zone check.
/// - Restricted => Rejected with reason.
/// - Clear => PaymentPending.
/// - Mark payment, then admin final approve/reject.
/// - Incident endpoint can revoke and trigger notifications/refund flags.
/// </summary>
[ApiController]
[Route("api/flight-request")]
public class FlightRequestController(AppDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// Admin list of all requests.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FlightRequest>>> GetAll()
    {
        var requests = await dbContext.FlightRequests
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return Ok(requests);
    }

    /// <summary>
    /// User-scoped list of requests by username.
    /// </summary>
    [HttpGet("by-username/{username}")]
    public async Task<ActionResult<IEnumerable<FlightRequest>>> GetByUsername(string username)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null)
            return NotFound("User not found.");

        var requests = await dbContext.FlightRequests
            .Where(r => r.UserId == user.Id)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return Ok(requests);
    }

    /// <summary>
    /// Creates a flight request and evaluates mock NO FLY zones.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<FlightRequest>> Create(CreateFlightRequestDto request)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Username == request.Username.Trim());
        if (user is null)
            return BadRequest("Invalid username.");

        if (!user.IsApproved)
            return BadRequest("User is not approved yet.");

        var noFly = NoFlyZoneService.Check(
            request.Location.Trim(),
            request.UrcLat,
            request.UrcLng,
            request.LlgLat,
            request.LlgLng);

        var flightRequest = new FlightRequest
        {
            UserId = user.Id,
            Reason = request.Reason.Trim(),
            Location = request.Location.Trim(),
            UrcLat = request.UrcLat,
            UrcLng = request.UrcLng,
            LlgLat = request.LlgLat,
            LlgLng = request.LlgLng,
            MaxAltitude = request.MaxAltitude,
            Phone = request.Phone.Trim(),
            IsNoFlyZone = noFly.IsRestricted,
            NoFlyZoneReason = noFly.Reason,
            Status = noFly.IsRestricted ? FlightRequestStatus.Rejected : FlightRequestStatus.PaymentPending,
            RejectionReason = noFly.IsRestricted ? noFly.Reason : null
        };

        dbContext.FlightRequests.Add(flightRequest);
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = flightRequest.Id }, flightRequest);
    }

    /// <summary>
    /// Marks payment completed for a PaymentPending request.
    /// </summary>
    [HttpPut("{id:int}/mark-paid")]
    public async Task<ActionResult<FlightRequest>> MarkPaid(int id)
    {
        var request = await dbContext.FlightRequests.FindAsync(id);
        if (request is null)
            return NotFound("Request not found.");

        if (request.Status == FlightRequestStatus.Rejected)
            return BadRequest("Rejected request cannot be paid.");

        request.IsPaid = true;
        request.Status = FlightRequestStatus.Pending;
        request.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();
        return Ok(request);
    }

    /// <summary>
    /// Final admin approval after payment.
    /// </summary>
    [HttpPut("{id:int}/approve")]
    public async Task<ActionResult<FlightRequest>> Approve(int id)
    {
        var request = await dbContext.FlightRequests.FindAsync(id);
        if (request is null)
            return NotFound("Request not found.");

        if (request.Status == FlightRequestStatus.Rejected)
            return BadRequest("Rejected request cannot be approved.");

        if (!request.IsPaid)
            return BadRequest("Payment is required before final approval.");

        request.Status = FlightRequestStatus.Approved;
        request.RejectionReason = null;
        request.ReceiptNumber ??= $"RCPT-{DateTime.UtcNow:yyyyMMdd}-{request.Id:D5}";
        request.EmailSent = true;
        request.PhoneNotificationSent = true;
        request.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();
        return Ok(request);
    }

    /// <summary>
    /// Final admin rejection.
    /// </summary>
    [HttpPut("{id:int}/reject")]
    public async Task<ActionResult<FlightRequest>> Reject(int id, RejectFlightRequestDto? body)
    {
        var request = await dbContext.FlightRequests.FindAsync(id);
        if (request is null)
            return NotFound("Request not found.");

        request.Status = FlightRequestStatus.Rejected;
        request.RejectionReason = string.IsNullOrWhiteSpace(body?.Reason) ? "Rejected by admin." : body!.Reason.Trim();
        request.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();
        return Ok(request);
    }

    /// <summary>
    /// Incident workflow:
    /// - revoke approval/license
    /// - set refund/notification flags (mock)
    /// </summary>
    [HttpPut("{id:int}/incident")]
    public async Task<ActionResult<FlightRequest>> ReportIncident(int id, IncidentDto body)
    {
        var request = await dbContext.FlightRequests.FindAsync(id);
        if (request is null)
            return NotFound("Request not found.");

        request.HasIncident = true;
        request.IncidentNote = body.Note.Trim();
        request.Status = FlightRequestStatus.Rejected;
        request.RejectionReason = "License revoked due to incident. Refund initiated.";
        request.EmailSent = true;
        request.PhoneNotificationSent = true;
        request.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();
        return Ok(request);
    }
}

/// <summary>
/// Create-flight payload including URC/LLG coordinates.
/// </summary>
public record CreateFlightRequestDto(
    string Username,
    string Reason,
    string Location,
    decimal UrcLat,
    decimal UrcLng,
    decimal LlgLat,
    decimal LlgLng,
    int MaxAltitude,
    string Phone
);

/// <summary>
/// Rejection payload with optional explicit reason.
/// </summary>
public record RejectFlightRequestDto(string? Reason);

/// <summary>
/// Incident payload.
/// </summary>
public record IncidentDto(string Note);
