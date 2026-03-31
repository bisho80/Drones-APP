using DroneManagement.Api.Data;
using DroneManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DroneManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class CategoryController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DroneCategory>>> Get()
    {
        var categories = await dbContext.Categories.OrderBy(c => c.Name).ToListAsync();
        return Ok(categories);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<DroneCategory>> Create(CreateCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("Name is required.");

        var category = new DroneCategory { Name = request.Name.Trim() };
        dbContext.Categories.Add(category);
        await dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = category.Id }, category);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<DroneCategory>> Update(int id, UpdateCategoryRequest request)
    {
        var category = await dbContext.Categories.FindAsync(id);
        if (category is null) return NotFound("Category not found.");
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("Name is required.");

        category.Name = request.Name.Trim();
        await dbContext.SaveChangesAsync();
        return Ok(category);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> Delete(int id)
    {
        var category = await dbContext.Categories.FindAsync(id);
        if (category is null) return NotFound("Category not found.");

        var inUse = await dbContext.Drones.AnyAsync(d => d.CategoryId == id);
        if (inUse) return BadRequest("Category is linked to drones and cannot be deleted.");

        dbContext.Categories.Remove(category);
        await dbContext.SaveChangesAsync();
        return NoContent();
    }
}

public record CreateCategoryRequest(string Name);
public record UpdateCategoryRequest(string Name);
