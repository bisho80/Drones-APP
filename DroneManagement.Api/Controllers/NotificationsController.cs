using System.Security.Claims;
using DroneManagement.Api.Application.Services;
using DroneManagement.Api.Data;
using DroneManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DroneManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController(
    IInAppNotificationService notifications,
    AppDbContext dbContext) : ControllerBase
{
    [HttpGet("me")]
    public ActionResult GetMine()
    {
        var username = User.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
        if (string.IsNullOrWhiteSpace(username)) return Unauthorized();
        return Ok(notifications.GetForUser(username));
    }

    [HttpPut("{id:guid}/read")]
    public ActionResult MarkRead(Guid id)
    {
        var username = User.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
        if (!notifications.MarkRead(id, username)) return NotFound();
        return NoContent();
    }

    [HttpPost("send-admin-alert")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> SendAdminAlert([FromBody] SendAdminAlertRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.TargetAdminUsername) || string.IsNullOrWhiteSpace(request.Message))
            return BadRequest("Target admin and message are required.");

        var target = await dbContext.Users.FirstOrDefaultAsync(x => x.Username == request.TargetAdminUsername.Trim(), cancellationToken);
        if (target is null) return NotFound("Target admin not found.");
        if (target.Role is not (UserRole.Admin or UserRole.SuperAdmin))
            return BadRequest("Target user must be Admin or SuperAdmin.");

        var sender = User.FindFirstValue(ClaimTypes.Name) ?? "system";
        var notification = notifications.Send(sender, target.Username, request.Message, request.PermitId);
        return Ok(notification);
    }
}

public record SendAdminAlertRequest(string TargetAdminUsername, string Message, int? PermitId);
