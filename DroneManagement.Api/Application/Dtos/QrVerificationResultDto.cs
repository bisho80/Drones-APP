namespace DroneManagement.Api.Application.Dtos;

public class QrVerificationResultDto
{
    public bool IsValid { get; set; }
    public string DroneSerial { get; set; } = string.Empty;
    public decimal UrcLat { get; set; }
    public decimal UrcLng { get; set; }
    public decimal LlcLat { get; set; }
    public decimal LlcLng { get; set; }
    public DateTime ExpiryTime { get; set; }
    public string Message { get; set; } = string.Empty;
}
