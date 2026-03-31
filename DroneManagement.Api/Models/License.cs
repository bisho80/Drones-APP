using System.Text.Json.Serialization;

namespace DroneManagement.Api.Models;

public class License
{
    public int Id { get; set; }
    public int DroneId { get; set; }
    [JsonIgnore]
    public Drone? Drone { get; set; }
    public string LicenseNumber { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public LicenseStatus Status { get; set; } = LicenseStatus.Active;
}
