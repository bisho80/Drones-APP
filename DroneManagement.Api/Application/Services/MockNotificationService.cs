namespace DroneManagement.Api.Application.Services;

public class MockNotificationService(ILogger<MockNotificationService> logger) : INotificationService
{
    public Task SendEmailAsync(IEnumerable<string> recipients, string subject, string body, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Mock Email | To: {Recipients} | Subject: {Subject} | Body: {Body}",
            string.Join(", ", recipients), subject, body);
        return Task.CompletedTask;
    }

    public Task SendPhoneNotificationAsync(IEnumerable<string> numbers, string message, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Mock Phone Notification | To: {Numbers} | Message: {Message}",
            string.Join(", ", numbers), message);
        return Task.CompletedTask;
    }
}
