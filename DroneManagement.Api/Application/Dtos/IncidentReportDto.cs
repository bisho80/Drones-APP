namespace DroneManagement.Api.Application.Dtos;

public class IncidentReportDto
{
    public string Note { get; set; } = string.Empty;
    public DateTime? RefundPickupAt { get; set; }
    public string RefundPickupDesk { get; set; } = string.Empty;
}
