using DroneManagement.Api.Data;
using DroneManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DroneManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class LicenseController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<License>>> Get()
    {
        var licenses = await dbContext.Licenses
            .Include(l => l.Drone)
            .OrderByDescending(l => l.IssuedAt)
            .ToListAsync();
        return Ok(licenses);
    }

    [HttpPost]
    public async Task<ActionResult<License>> Create(CreateLicenseRequest request)
    {
        var droneExists = await dbContext.Drones.AnyAsync(d => d.Id == request.DroneId);
        if (!droneExists) return BadRequest("Invalid droneId.");

        var license = new License
        {
            DroneId = request.DroneId,
            LicenseNumber = request.LicenseNumber.Trim(),
            ExpiresAt = request.ExpiresAt,
            Status = request.Status
        };

        dbContext.Licenses.Add(license);
        await dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = license.Id }, license);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<License>> Update(int id, UpdateLicenseRequest request)
    {
        var license = await dbContext.Licenses.FindAsync(id);
        if (license is null) return NotFound("License not found.");

        license.LicenseNumber = request.LicenseNumber.Trim();
        license.ExpiresAt = request.ExpiresAt;
        license.Status = request.Status;

        await dbContext.SaveChangesAsync();
        return Ok(license);
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var license = await dbContext.Licenses.FindAsync(id);
        if (license is null) return NotFound("License not found.");

        dbContext.Licenses.Remove(license);
        await dbContext.SaveChangesAsync();
        return NoContent();
    }
}

public record CreateLicenseRequest(int DroneId, string LicenseNumber, DateTime? ExpiresAt, LicenseStatus Status);
public record UpdateLicenseRequest(string LicenseNumber, DateTime? ExpiresAt, LicenseStatus Status);
