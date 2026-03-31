using System.Security.Claims;
using DroneManagement.Api.Data;
using DroneManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DroneManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NoFlyZoneController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<IEnumerable<NoFlyZone>>> GetAll(CancellationToken cancellationToken)
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var baseLocation = User.FindFirstValue("BaseLocation") ?? string.Empty;

        var query = dbContext.NoFlyZones.AsQueryable();
        if (role == UserRole.Admin.ToString())
        {
            query = query.Where(x => x.BaseLocation == baseLocation);
        }

        var items = await query.OrderBy(x => x.ZoneName).ToListAsync(cancellationToken);
        return Ok(items);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<NoFlyZone>> Create([FromBody] UpsertNoFlyZoneRequest request, CancellationToken cancellationToken)
    {
        var item = new NoFlyZone
        {
            ZoneName = request.ZoneName.Trim(),
            BaseLocation = request.BaseLocation.Trim(),
            UrcLat = request.UrcLat,
            UrcLng = request.UrcLng,
            LlcLat = request.LlcLat,
            LlcLng = request.LlcLng,
            RestrictionReason = request.RestrictionReason.Trim()
        };

        dbContext.NoFlyZones.Add(item);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(item);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<NoFlyZone>> Update(int id, [FromBody] UpsertNoFlyZoneRequest request, CancellationToken cancellationToken)
    {
        var item = await dbContext.NoFlyZones.FindAsync([id], cancellationToken);
        if (item is null) return NotFound("No-fly zone not found.");

        item.ZoneName = request.ZoneName.Trim();
        item.BaseLocation = request.BaseLocation.Trim();
        item.UrcLat = request.UrcLat;
        item.UrcLng = request.UrcLng;
        item.LlcLat = request.LlcLat;
        item.LlcLng = request.LlcLng;
        item.RestrictionReason = request.RestrictionReason.Trim();

        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(item);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var item = await dbContext.NoFlyZones.FindAsync([id], cancellationToken);
        if (item is null) return NotFound("No-fly zone not found.");

        dbContext.NoFlyZones.Remove(item);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}

public record UpsertNoFlyZoneRequest(
    string ZoneName,
    string BaseLocation,
    decimal UrcLat,
    decimal UrcLng,
    decimal LlcLat,
    decimal LlcLng,
    string RestrictionReason
);

