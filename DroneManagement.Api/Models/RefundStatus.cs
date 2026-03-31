namespace DroneManagement.Api.Models;

public enum RefundStatus
{
    None = 0,
    Requested = 1,
    SentToAdmin = 2,
    ReceivedByAdmin = 3,
    PaidToUser = 4
}

