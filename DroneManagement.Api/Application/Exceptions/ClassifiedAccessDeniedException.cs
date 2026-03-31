namespace DroneManagement.Api.Application.Exceptions;

/// <summary>
/// Raised when caller lacks classified claims to view permit receipt details.
/// </summary>
public class ClassifiedAccessDeniedException(string message) : Exception(message);
