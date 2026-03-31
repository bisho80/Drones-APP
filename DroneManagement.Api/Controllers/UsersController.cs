using System.Security.Claims;
using DroneManagement.Api.Application.Security;
using DroneManagement.Api.Data;
using DroneManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DroneManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<IEnumerable<User>>> GetAll()
    {
        var actorRole = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var actorBase = User.FindFirstValue("BaseLocation") ?? string.Empty;

        var query = dbContext.Users.AsQueryable();
        if (actorRole == UserRole.Admin.ToString())
        {
            query = query.Where(u => u.BaseLocation == actorBase);
        }

        var users = await query.OrderByDescending(u => u.CreatedAt).ToListAsync();
        return Ok(users);
    }

    [HttpGet("me")]
    public async Task<ActionResult<User>> Me()
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrWhiteSpace(username))
            return Unauthorized();

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null)
            return NotFound("User not found.");

        return Ok(user);
    }

    [HttpGet("by-username/{username}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<User>> GetByUsername(string username)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null)
            return NotFound("User not found.");

        var actorRole = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var actorBase = User.FindFirstValue("BaseLocation") ?? string.Empty;
        if (actorRole == UserRole.Admin.ToString() && !user.BaseLocation.Equals(actorBase, StringComparison.OrdinalIgnoreCase))
            return Forbid("Admin can only view users from the same base.");

        return Ok(user);
    }

    [HttpPost("register")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<User>> Register(RegisterUserRequest request)
    {
        var actorRole = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        if (!TryParseRole(request.Role, out var targetRole))
            return BadRequest("Invalid role. Use User, Admin, or SuperAdmin.");

        if (!CanCreateRole(actorRole, targetRole))
            return Forbid("You are not allowed to create this role.");

        var actorBase = User.FindFirstValue("BaseLocation") ?? string.Empty;

        var username = request.Username.Trim();
        var exists = await dbContext.Users.AnyAsync(u => u.Username == username);
        if (exists)
            return BadRequest("Username already exists.");

        var requestedBase = request.BaseLocation.Trim();
        if (actorRole == UserRole.Admin.ToString())
        {
            requestedBase = actorBase;
        }

        var user = new User
        {
            Username = username,
            PasswordHash = PasswordHasher.Hash(request.Password.Trim()),
            FullName = request.FullName.Trim(),
            Phone = request.Phone.Trim(),
            Email = request.Email.Trim(),
            BaseLocation = requestedBase,
            Role = targetRole,
            IsApproved = targetRole == UserRole.User ? false : true
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetByUsername), new { username = user.Username }, user);
    }

    [HttpPut("{id:int}/approve")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<User>> Approve(int id)
    {
        var user = await dbContext.Users.FindAsync(id);
        if (user is null)
            return NotFound("User not found.");

        var actorRole = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var actorBase = User.FindFirstValue("BaseLocation") ?? string.Empty;
        if (actorRole == UserRole.Admin.ToString() && !user.BaseLocation.Equals(actorBase, StringComparison.OrdinalIgnoreCase))
            return Forbid("Admin can only approve users in the same base.");

        user.IsApproved = true;
        await dbContext.SaveChangesAsync();
        return Ok(user);
    }

    [HttpPut("{id:int}/disapprove")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<User>> Disapprove(int id)
    {
        var user = await dbContext.Users.FindAsync(id);
        if (user is null)
            return NotFound("User not found.");

        var actorRole = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var actorBase = User.FindFirstValue("BaseLocation") ?? string.Empty;
        if (actorRole == UserRole.Admin.ToString() && !user.BaseLocation.Equals(actorBase, StringComparison.OrdinalIgnoreCase))
            return Forbid("Admin can only disapprove users in the same base.");

        user.IsApproved = false;
        await dbContext.SaveChangesAsync();
        return Ok(user);
    }

    private static bool CanCreateRole(string actorRole, UserRole targetRole)
    {
        if (actorRole == UserRole.SuperAdmin.ToString())
            return targetRole is UserRole.SuperAdmin or UserRole.Admin or UserRole.User;

        if (actorRole == UserRole.Admin.ToString())
            return targetRole == UserRole.User;

        return false;
    }

    private static bool TryParseRole(string roleText, out UserRole role)
    {
        var normalized = (roleText ?? string.Empty).Trim().Replace(" ", "").Replace("-", "");
        if (normalized.Equals("superadmin", StringComparison.OrdinalIgnoreCase))
        {
            role = UserRole.SuperAdmin;
            return true;
        }

        if (normalized.Equals("admin", StringComparison.OrdinalIgnoreCase))
        {
            role = UserRole.Admin;
            return true;
        }

        if (normalized.Equals("user", StringComparison.OrdinalIgnoreCase))
        {
            role = UserRole.User;
            return true;
        }

        role = UserRole.User;
        return false;
    }
}

public record RegisterUserRequest(
    string Username,
    string Password,
    string FullName,
    string Phone,
    string Email,
    string BaseLocation,
    string Role
);
