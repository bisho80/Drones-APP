namespace DroneManagement.Api.Models;

/// <summary>
/// State machine for permit workflow.
/// </summary>
public enum PermitStatus
{
    AwaitingInternalApproval = 0,
    PendingPayment = 1,
    PaymentSubmitted = 2,
    AwaitingLicense = 3,
    Approved = 4,
    Rejected = 5
}
