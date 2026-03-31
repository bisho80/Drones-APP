using DroneManagement.Api.Data;
using DroneManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DroneManagement.Api.Controllers;

/// <summary>
/// Drone management endpoints.
/// Supports:
/// - Admin list of all drones.
/// - User-specific drone list by username.
/// - Drone registration by username (army/admin assignment step).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DroneController(AppDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// Returns all drones (admin view).
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<IEnumerable<Drone>>> GetAll()
    {
        var query = dbContext.Drones
            .Include(d => d.User)
            .Include(d => d.Unit)
            .Include(d => d.Category)
            .AsQueryable();

        var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var baseLocation = User.FindFirstValue("BaseLocation") ?? string.Empty;
        if (role.Equals("Admin", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(d => d.User != null && d.User.BaseLocation == baseLocation);
        }

        var drones = await query.OrderByDescending(d => d.CreatedAt).ToListAsync();

        return Ok(drones);
    }

    /// <summary>
    /// Returns drones assigned to a specific username.
    /// </summary>
    [HttpGet("by-username/{username}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<IEnumerable<Drone>>> GetByUsername(string username)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null)
            return NotFound("User not found.");

        var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var baseLocation = User.FindFirstValue("BaseLocation") ?? string.Empty;
        if (role.Equals("Admin", StringComparison.OrdinalIgnoreCase) &&
            !user.BaseLocation.Equals(baseLocation, StringComparison.OrdinalIgnoreCase))
        {
            return Forbid("You can only view users from your base location.");
        }

        var drones = await dbContext.Drones
            .Include(d => d.Unit)
            .Include(d => d.Category)
            .Where(d => d.UserId == user.Id)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        return Ok(drones);
    }

    [HttpGet("me")]
    public async Task<ActionResult<IEnumerable<Drone>>> GetMine()
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrWhiteSpace(username))
            return Unauthorized();

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null)
            return NotFound("User not found.");

        var drones = await dbContext.Drones
            .Include(d => d.Unit)
            .Include(d => d.Category)
            .Where(d => d.UserId == user.Id)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        return Ok(drones);
    }

    /// <summary>
    /// Registers a drone to a user account by username.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<Drone>> Create(CreateDroneRequest request)
    {
        var username = request.Username.Trim();
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null)
            return BadRequest("Invalid username.");

        if (!user.IsApproved)
            return BadRequest("User is not approved yet.");

        var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var baseLocation = User.FindFirstValue("BaseLocation") ?? string.Empty;
        if (role.Equals("Admin", StringComparison.OrdinalIgnoreCase) &&
            !user.BaseLocation.Equals(baseLocation, StringComparison.OrdinalIgnoreCase))
        {
            return Forbid("Admin can only assign drones to users in the same base.");
        }

        var serial = request.SerialNumber.Trim();
        var exists = await dbContext.Drones.AnyAsync(d => d.SerialNumber == serial);
        if (exists)
            return BadRequest("Drone serial number already exists.");

        var drone = new Drone
        {
            Name = request.Name.Trim(),
            Model = request.Model.Trim(),
            SerialNumber = serial,
            UserId = user.Id,
            UnitId = request.UnitId,
            CategoryId = request.CategoryId
        };

        dbContext.Drones.Add(drone);
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = drone.Id }, drone);
    }
}

/// <summary>
/// Drone creation payload.
/// </summary>
public record CreateDroneRequest(
    string Username,
    string Name,
    string Model,
    string SerialNumber,
    int? UnitId,
    int? CategoryId
);
