namespace DroneManagement.Api.Services;

/// <summary>
/// Provides mock no-fly zone validation logic.
/// In production, this should call a real geospatial service.
/// </summary>
public static class NoFlyZoneService
{
    // Mock restricted location labels.
    private static readonly HashSet<string> RestrictedLocationNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "Airport",
        "Military Base"
    };

    // Mock rectangular zones: (minLat, minLng, maxLat, maxLng, reason).
    private static readonly (decimal MinLat, decimal MinLng, decimal MaxLat, decimal MaxLng, string Reason)[] Zones =
    [
        (33.820000m, 35.450000m, 33.900000m, 35.560000m, "Beirut Airport NO FLY zone"),
        (33.900000m, 35.470000m, 33.980000m, 35.620000m, "Military protected area")
    ];

    /// <summary>
    /// Returns whether the request area is restricted and why.
    /// </summary>
    public static (bool IsRestricted, string? Reason) Check(
        string location,
        decimal urcLat,
        decimal urcLng,
        decimal llgLat,
        decimal llgLng)
    {
        if (RestrictedLocationNames.Contains(location.Trim()))
            return (true, $"Location '{location}' is restricted.");

        var reqMinLat = Math.Min(urcLat, llgLat);
        var reqMaxLat = Math.Max(urcLat, llgLat);
        var reqMinLng = Math.Min(urcLng, llgLng);
        var reqMaxLng = Math.Max(urcLng, llgLng);

        foreach (var zone in Zones)
        {
            var intersects =
                reqMinLat <= zone.MaxLat &&
                reqMaxLat >= zone.MinLat &&
                reqMinLng <= zone.MaxLng &&
                reqMaxLng >= zone.MinLng;

            if (intersects)
                return (true, zone.Reason);
        }

        return (false, null);
    }
}
