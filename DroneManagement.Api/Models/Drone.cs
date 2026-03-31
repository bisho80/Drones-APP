using System.Text.Json.Serialization;

namespace DroneManagement.Api.Models;

/// <summary>
/// Represents a drone registered in the system.
/// Workflow mapping:
/// - Army/admin adds drone to a specific user account using username.
/// - User can view only drones assigned to their account.
/// </summary>
public class Drone
{
    /// <summary>
    /// Primary key.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Drone display name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Drone model name/number.
    /// </summary>
    public string Model { get; set; } = string.Empty;

    /// <summary>
    /// Unique serial number.
    /// </summary>
    public string SerialNumber { get; set; } = string.Empty;

    /// <summary>
    /// Owner user id. This enforces account-level drone visibility.
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Navigation to owner account.
    /// </summary>
    public User? User { get; set; }

    /// <summary>
    /// Optional organizational unit id for master-data grouping.
    /// </summary>
    public int? UnitId { get; set; }

    /// <summary>
    /// Navigation to organizational unit.
    /// </summary>
    public Unit? Unit { get; set; }

    /// <summary>
    /// Optional category id for master-data grouping.
    /// </summary>
    public int? CategoryId { get; set; }

    /// <summary>
    /// Navigation to category.
    /// </summary>
    public DroneCategory? Category { get; set; }

    /// <summary>
    /// Navigation to drone licenses.
    /// Not returned directly in drone list to avoid cyclic JSON graphs.
    /// </summary>
    [JsonIgnore]
    public ICollection<License> Licenses { get; set; } = new List<License>();

    /// <summary>
    /// Record creation timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
