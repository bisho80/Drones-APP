namespace DroneManagement.Api.Application.Exceptions;

/// <summary>
/// Raised when requested flight area intersects a no-fly zone.
/// </summary>
public class AreaRestrictedException(string message) : Exception(message);
