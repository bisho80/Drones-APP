using System.Collections.Concurrent;
using DroneManagement.Api.Application.Dtos;

namespace DroneManagement.Api.Application.Services;

public class InAppNotificationService : IInAppNotificationService
{
    private static readonly ConcurrentDictionary<Guid, InAppNotificationDto> Store = new();

    public IReadOnlyCollection<InAppNotificationDto> GetForUser(string username)
    {
        var normalized = (username ?? string.Empty).Trim();
        return Store.Values
            .Where(x => x.TargetUsername.Equals(normalized, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(x => x.CreatedAt)
            .ToList();
    }

    public InAppNotificationDto Send(string senderUsername, string targetUsername, string message, int? permitId)
    {
        var item = new InAppNotificationDto
        {
            SenderUsername = senderUsername.Trim(),
            TargetUsername = targetUsername.Trim(),
            Message = message.Trim(),
            PermitId = permitId
        };
        Store[item.Id] = item;
        return item;
    }

    public bool MarkRead(Guid id, string username)
    {
        if (!Store.TryGetValue(id, out var item)) return false;
        if (!item.TargetUsername.Equals((username ?? string.Empty).Trim(), StringComparison.OrdinalIgnoreCase))
            return false;

        item.IsRead = true;
        Store[id] = item;
        return true;
    }
}

