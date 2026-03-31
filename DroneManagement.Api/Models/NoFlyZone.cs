namespace DroneManagement.Api.Models;

/// <summary>
/// Represents a restricted rectangular area.
/// Coordinates are stored as URC and LLC.
/// </summary>
public class NoFlyZone
{
    public int Id { get; set; }
    public string ZoneName { get; set; } = string.Empty;
    public string BaseLocation { get; set; } = string.Empty;
    public decimal UrcLat { get; set; }
    public decimal UrcLng { get; set; }
    public decimal LlcLat { get; set; }
    public decimal LlcLng { get; set; }
    public string RestrictionReason { get; set; } = string.Empty;
}
