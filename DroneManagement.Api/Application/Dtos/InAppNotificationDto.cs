namespace DroneManagement.Api.Application.Dtos;

public class InAppNotificationDto
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string SenderUsername { get; set; } = string.Empty;
    public string TargetUsername { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int? PermitId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

