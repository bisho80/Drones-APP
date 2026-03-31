using DroneManagement.Api.Application.Dtos;
using DroneManagement.Api.Application.Exceptions;
using DroneManagement.Api.Application.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DroneManagement.Api.Controllers;

/// <summary>
/// Thin API adapter for full permit workflow in application layer.
/// </summary>
[ApiController]
[Route("api/permit-workflow")]
[Authorize]
public class PermitWorkflowController(IPermitWorkflowService permitWorkflowService) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await permitWorkflowService.GetAllPermitsAsync(cancellationToken);
        result = ApplyAreaScope(result);
        return Ok(result);
    }

    [HttpGet("by-username/{username}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult> GetByUsername(string username, CancellationToken cancellationToken)
    {
        var result = await permitWorkflowService.GetPermitsByUsernameAsync(username, cancellationToken);
        result = ApplyAreaScope(result);
        return Ok(result);
    }

    [HttpGet("me")]
    public async Task<ActionResult> GetMine(CancellationToken cancellationToken)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrWhiteSpace(username))
            return Unauthorized();

        var result = await permitWorkflowService.GetPermitsByUsernameAsync(username, cancellationToken);
        return Ok(result);
    }

    [HttpPost("submit")]
    public async Task<ActionResult> Submit([FromBody] PermitDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await permitWorkflowService.SubmitPermitRequestAsync(dto, cancellationToken);
            return Ok(result);
        }
        catch (AreaRestrictedException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{permitId:int}/internal-approve")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult> InternalApprove(int permitId, CancellationToken cancellationToken)
    {
        var result = await permitWorkflowService.ApproveInternallyAsync(permitId, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{permitId:int}/reject")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult> Reject(int permitId, [FromBody] RejectPermitDto dto, CancellationToken cancellationToken)
    {
        var actor = User.FindFirstValue(ClaimTypes.Name) ?? "admin";
        var result = await permitWorkflowService.RejectPermitAsync(permitId, dto.Reason, dto.RefundPickupAt, dto.RefundPickupDesk, actor, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{permitId:int}/process-payment")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult> ProcessPayment(int permitId, CancellationToken cancellationToken)
    {
        var result = await permitWorkflowService.ProcessPaymentAsync(permitId, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{permitId:int}/submit-payment")]
    public async Task<ActionResult> SubmitPayment(int permitId, CancellationToken cancellationToken)
    {
        var username = User.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
        var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var isAdminLike = role is "SuperAdmin" or "Admin";
        var result = await permitWorkflowService.SubmitCashPaymentAsync(permitId, username, isAdminLike, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{permitId:int}/confirm-cash-payment")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult> ConfirmCashPayment(int permitId, CancellationToken cancellationToken)
    {
        var result = await permitWorkflowService.ConfirmCashPaymentAsync(permitId, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{permitId:int}/issue-license")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult> IssueLicense(int permitId, CancellationToken cancellationToken)
    {
        var result = await permitWorkflowService.IssueLicenseAsync(permitId, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{permitId:int}/refund/send-to-admin")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> SendRefundToAdmin(int permitId, CancellationToken cancellationToken)
    {
        var actor = User.FindFirstValue(ClaimTypes.Name) ?? "superadmin";
        var result = await permitWorkflowService.SendRefundToAdminAsync(permitId, actor, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{permitId:int}/refund/receive-by-admin")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> ReceiveRefundByAdmin(int permitId, CancellationToken cancellationToken)
    {
        var actor = User.FindFirstValue(ClaimTypes.Name) ?? "admin";
        var result = await permitWorkflowService.ReceiveRefundByAdminAsync(permitId, actor, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{permitId:int}/refund/pay-to-user")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> PayRefundToUser(int permitId, CancellationToken cancellationToken)
    {
        var actor = User.FindFirstValue(ClaimTypes.Name) ?? "admin";
        var result = await permitWorkflowService.PayRefundToUserAsync(permitId, actor, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{permitId:int}/incident")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult> ReportIncident(int permitId, [FromBody] IncidentReportDto dto, CancellationToken cancellationToken)
    {
        var result = await permitWorkflowService.ReportIncidentAsync(
            permitId,
            dto.Note,
            dto.RefundPickupAt,
            dto.RefundPickupDesk,
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("airforce-ops")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult> AirForceOps(CancellationToken cancellationToken)
    {
        var result = await permitWorkflowService.GetAirForceOpsViewAsync(cancellationToken);
        result = ApplyAreaScope(result);
        return Ok(result);
    }

    [HttpGet("{permitId:int}/receipt")]
    public async Task<ActionResult> Receipt(int permitId, CancellationToken cancellationToken)
    {
        try
        {
            var principal = BuildReceiptPrincipal();
            var result = await permitWorkflowService.GetOfficialReceiptAsync(permitId, principal, cancellationToken);
            var encoded = Uri.EscapeDataString(result.EncryptedQrPayload);
            result.QrScanUrl = $"{Request.Scheme}://{Request.Host}/api/permit-workflow/verify?payload={encoded}";
            return Ok(result);
        }
        catch (ClassifiedAccessDeniedException ex)
        {
            return Forbid(ex.Message);
        }
    }

    [HttpGet("verify")]
    [AllowAnonymous]
    public ActionResult Verify([FromQuery] string payload)
    {
        var result = permitWorkflowService.VerifyEncryptedQrPayload(payload);
        return Ok(result);
    }

    private ClaimsPrincipal BuildReceiptPrincipal()
    {
        if (Request.Headers.TryGetValue("X-Is-Classified", out var value) &&
            value.ToString().Equals("true", StringComparison.OrdinalIgnoreCase))
        {
            var identity = new ClaimsIdentity([new Claim("IsClassified", "true")], "HeaderDevAccess");
            return new ClaimsPrincipal(identity);
        }

        return User;
    }

    private IReadOnlyCollection<PermitListItemDto> ApplyAreaScope(IReadOnlyCollection<PermitListItemDto> permits)
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        if (!role.Equals("Admin", StringComparison.OrdinalIgnoreCase))
            return permits;

        var baseLocation = User.FindFirstValue("BaseLocation") ?? string.Empty;
        if (string.IsNullOrWhiteSpace(baseLocation))
            return [];

        return permits
            .Where(p => p.UserBaseLocation.Equals(baseLocation, StringComparison.OrdinalIgnoreCase))
            .ToList();
    }
}
