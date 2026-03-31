using System.Text.Json.Serialization;

namespace DroneManagement.Api.Models;

public class DroneCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    [JsonIgnore]
    public ICollection<Drone> Drones { get; set; } = new List<Drone>();
}
