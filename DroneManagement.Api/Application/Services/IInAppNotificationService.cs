using DroneManagement.Api.Application.Dtos;

namespace DroneManagement.Api.Application.Services;

public interface IInAppNotificationService
{
    IReadOnlyCollection<InAppNotificationDto> GetForUser(string username);
    InAppNotificationDto Send(string senderUsername, string targetUsername, string message, int? permitId);
    bool MarkRead(Guid id, string username);
}

