namespace DroneManagement.Api.Application.Dtos;

public class RejectPermitDto
{
    public string Reason { get; set; } = string.Empty;
    public DateTime? RefundPickupAt { get; set; }
    public string RefundPickupDesk { get; set; } = string.Empty;
}
