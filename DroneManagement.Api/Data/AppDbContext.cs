using DroneManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DroneManagement.Api.Data;

/// <summary>
/// Main EF Core database context.
/// This context defines all tables and relationships for the Drone Management System.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    /// <summary>
    /// Users table.
    /// </summary>
    public DbSet<User> Users => Set<User>();

    /// <summary>
    /// Permits table for application-layer workflow.
    /// </summary>
    public DbSet<FlightPermit> FlightPermits => Set<FlightPermit>();

    /// <summary>
    /// No-fly zones table for spatial restriction checks.
    /// </summary>
    public DbSet<NoFlyZone> NoFlyZones => Set<NoFlyZone>();

    /// <summary>
    /// Drones table.
    /// </summary>
    public DbSet<Drone> Drones => Set<Drone>();

    /// <summary>
    /// Flight requests table.
    /// </summary>
    public DbSet<FlightRequest> FlightRequests => Set<FlightRequest>();

    /// <summary>
    /// Master-data table for units.
    /// </summary>
    public DbSet<Unit> Units => Set<Unit>();

    /// <summary>
    /// Master-data table for drone categories.
    /// </summary>
    public DbSet<DroneCategory> Categories => Set<DroneCategory>();

    /// <summary>
    /// Licenses table linked to drones.
    /// </summary>
    public DbSet<License> Licenses => Set<License>();

    /// <summary>
    /// Configures table constraints, indexes, value precision, and relationships.
    /// </summary>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Enforce unique username because workflow relies on username for drone assignment.
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<User>()
            .Property(u => u.BaseLocation)
            .HasMaxLength(200);

        // Serial numbers should be unique and indexable.
        modelBuilder.Entity<Drone>()
            .Property(d => d.SerialNumber)
            .HasMaxLength(450);

        modelBuilder.Entity<Drone>()
            .HasIndex(d => d.SerialNumber)
            .IsUnique();

        // One user owns many drones.
        modelBuilder.Entity<Drone>()
            .HasOne(d => d.User)
            .WithMany(u => u.Drones)
            .HasForeignKey(d => d.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // One user creates many flight requests.
        modelBuilder.Entity<FlightRequest>()
            .HasOne(fr => fr.User)
            .WithMany(u => u.FlightRequests)
            .HasForeignKey(fr => fr.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // URC/LLG coordinate precision to keep stable geospatial-like numeric values.
        modelBuilder.Entity<FlightRequest>()
            .Property(fr => fr.UrcLat)
            .HasPrecision(9, 6);
        modelBuilder.Entity<FlightRequest>()
            .Property(fr => fr.UrcLng)
            .HasPrecision(9, 6);
        modelBuilder.Entity<FlightRequest>()
            .Property(fr => fr.LlgLat)
            .HasPrecision(9, 6);
        modelBuilder.Entity<FlightRequest>()
            .Property(fr => fr.LlgLng)
            .HasPrecision(9, 6);

        // Useful status index for admin filtering and dashboard aggregation.
        modelBuilder.Entity<FlightRequest>()
            .HasIndex(fr => fr.Status);

        modelBuilder.Entity<NoFlyZone>()
            .Property(n => n.UrcLat).HasPrecision(9, 6);
        modelBuilder.Entity<NoFlyZone>()
            .Property(n => n.UrcLng).HasPrecision(9, 6);
        modelBuilder.Entity<NoFlyZone>()
            .Property(n => n.LlcLat).HasPrecision(9, 6);
        modelBuilder.Entity<NoFlyZone>()
            .Property(n => n.BaseLocation).HasMaxLength(200);
        modelBuilder.Entity<NoFlyZone>()
            .HasIndex(n => n.BaseLocation);
        modelBuilder.Entity<NoFlyZone>()
            .Property(n => n.LlcLng).HasPrecision(9, 6);

        modelBuilder.Entity<FlightPermit>()
            .Property(p => p.UrcLat).HasPrecision(9, 6);
        modelBuilder.Entity<FlightPermit>()
            .Property(p => p.UrcLng).HasPrecision(9, 6);
        modelBuilder.Entity<FlightPermit>()
            .Property(p => p.LlcLat).HasPrecision(9, 6);
        modelBuilder.Entity<FlightPermit>()
            .Property(p => p.LlcLng).HasPrecision(9, 6);

        modelBuilder.Entity<FlightPermit>()
            .HasIndex(p => p.PermitSerialNumber)
            .IsUnique()
            .HasFilter("[PermitSerialNumber] IS NOT NULL");

        modelBuilder.Entity<FlightPermit>()
            .Property(p => p.LocationLabel)
            .HasMaxLength(200);

        modelBuilder.Entity<FlightPermit>()
            .Property(p => p.Phone)
            .HasMaxLength(30);

        modelBuilder.Entity<FlightPermit>()
            .HasIndex(p => p.ScheduledStartTime);

        modelBuilder.Entity<FlightPermit>()
            .HasOne(p => p.Drone)
            .WithMany()
            .HasForeignKey(p => p.DroneId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
