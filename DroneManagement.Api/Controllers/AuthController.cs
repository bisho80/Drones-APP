using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DroneManagement.Api.Application.Dtos;
using DroneManagement.Api.Application.Security;
using DroneManagement.Api.Data;
using DroneManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace DroneManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IConfiguration configuration, AppDbContext dbContext) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto request)
    {
        var username = request.Username.Trim();
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Username == username);
        if (user is null)
            return Unauthorized("Invalid username or password.");

        if (!PasswordHasher.Verify(request.Password, user.PasswordHash))
            return Unauthorized("Invalid username or password.");

        if (!user.IsApproved)
            return Unauthorized("Account is pending approval.");

        var jwtKey = configuration["Jwt:Key"] ?? "dev-super-secret-key-change-me-2026";
        var jwtIssuer = configuration["Jwt:Issuer"] ?? "DroneManagement.Api";
        var jwtAudience = configuration["Jwt:Audience"] ?? "DroneManagement.Frontend";

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("BaseLocation", user.BaseLocation ?? string.Empty),
            new("IsClassified", (user.Role == UserRole.SuperAdmin) ? "true" : "false")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddHours(12);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        return Ok(new AuthResponseDto
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            UserId = user.Id,
            Username = user.Username,
            Role = user.Role.ToString(),
            BaseLocation = user.BaseLocation
        });
    }
}
