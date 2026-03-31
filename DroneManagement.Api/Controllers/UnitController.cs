using DroneManagement.Api.Data;
using DroneManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DroneManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class UnitController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Unit>>> Get()
    {
        var units = await dbContext.Units.OrderBy(u => u.Name).ToListAsync();
        return Ok(units);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<Unit>> Create(CreateUnitRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("Name is required.");

        var unit = new Unit { Name = request.Name.Trim() };
        dbContext.Units.Add(unit);
        await dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = unit.Id }, unit);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<Unit>> Update(int id, UpdateUnitRequest request)
    {
        var unit = await dbContext.Units.FindAsync(id);
        if (unit is null) return NotFound("Unit not found.");
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("Name is required.");

        unit.Name = request.Name.Trim();
        await dbContext.SaveChangesAsync();
        return Ok(unit);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> Delete(int id)
    {
        var unit = await dbContext.Units.FindAsync(id);
        if (unit is null) return NotFound("Unit not found.");

        var inUse = await dbContext.Drones.AnyAsync(d => d.UnitId == id);
        if (inUse) return BadRequest("Unit is linked to drones and cannot be deleted.");

        dbContext.Units.Remove(unit);
        await dbContext.SaveChangesAsync();
        return NoContent();
    }
}

public record CreateUnitRequest(string Name);
public record UpdateUnitRequest(string Name);
