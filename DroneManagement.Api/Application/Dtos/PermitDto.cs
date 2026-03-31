namespace DroneManagement.Api.Application.Dtos;

/// <summary>
/// Request DTO for submitting a permit.
/// </summary>
public class PermitDto
{
    public int DroneId { get; set; }
    public string FlightPurpose { get; set; } = string.Empty;
    public string LocationLabel { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public decimal UrcLat { get; set; }
    public decimal UrcLng { get; set; }
    public decimal LlcLat { get; set; }
    public decimal LlcLng { get; set; }
    public int MaxAltitude { get; set; }
    public DateTime ScheduledStartTime { get; set; }
    public DateTime ScheduledEndTime { get; set; }
}
