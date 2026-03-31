namespace DroneManagement.Api.Application.Dtos;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string BaseLocation { get; set; } = string.Empty;
}
