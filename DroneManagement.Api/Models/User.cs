namespace DroneManagement.Api.Models;
using System.Text.Json.Serialization;

/// <summary>
/// Represents a system user (request owner / drone owner).
/// Workflow mapping:
/// - User submits initial request to use drones.
/// - After army approval, credentials are issued to this user.
/// - Drones are linked to this user account.
/// </summary>
public class User
{
    /// <summary>
    /// Primary key.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Unique username provided by the user and used by army/admin to attach drones.
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// Password hash (never store plain text password in production).
    /// For MVP we still keep this field as a hash-ready string.
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// Optional full name for admin display and auditing.
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Phone used for contact/incident notifications.
    /// </summary>
    public string Phone { get; set; } = string.Empty;

    /// <summary>
    /// Email used for approval / rejection / incident notifications.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    public UserRole Role { get; set; } = UserRole.User;

    public string BaseLocation { get; set; } = string.Empty;

    /// <summary>
    /// True when army/admin has approved and activated this account.
    /// </summary>
    public bool IsApproved { get; set; }

    /// <summary>
    /// Account creation timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Navigation: drones registered under this user account.
    /// </summary>
    [JsonIgnore]
    public ICollection<Drone> Drones { get; set; } = new List<Drone>();

    /// <summary>
    /// Navigation: flight requests created by this user.
    /// </summary>
    [JsonIgnore]
    public ICollection<FlightRequest> FlightRequests { get; set; } = new List<FlightRequest>();
}
