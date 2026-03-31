namespace DroneManagement.Api.Application.Services;

public interface INotificationService
{
    Task SendEmailAsync(IEnumerable<string> recipients, string subject, string body, CancellationToken cancellationToken = default);
    Task SendPhoneNotificationAsync(IEnumerable<string> numbers, string message, CancellationToken cancellationToken = default);
}
