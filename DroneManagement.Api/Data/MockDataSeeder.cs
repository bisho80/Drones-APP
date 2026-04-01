using DroneManagement.Api.Models;
using DroneManagement.Api.Application.Security;
using Microsoft.EntityFrameworkCore;

namespace DroneManagement.Api.Data;

/// <summary>
/// Seeds mock data for local MVP testing.
/// Data is inserted only once when tables are empty.
/// </summary>
public static class MockDataSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        var hasExistingUsers = await db.Users.AnyAsync();
        var hasRealUsers = await db.Users.AnyAsync(u => u.Username != "legacy.user");
        var hasDrones = await db.Drones.AnyAsync();
        var hasFlightRequests = await db.FlightRequests.AnyAsync();

        if (!await db.NoFlyZones.AnyAsync())
        {
            db.NoFlyZones.AddRange(
                new NoFlyZone
                {
                    ZoneName = "Airport Zone",
                    BaseLocation = "Air Base Beirut",
                    UrcLat = 33.930000m,
                    UrcLng = 35.540000m,
                    LlcLat = 33.780000m,
                    LlcLng = 35.450000m,
                    RestrictionReason = "Restricted military-airport corridor."
                },
                new NoFlyZone
                {
                    ZoneName = "Military Base Zone",
                    BaseLocation = "Air Base Akkar",
                    UrcLat = 33.910000m,
                    UrcLng = 35.680000m,
                    LlcLat = 33.830000m,
                    LlcLng = 35.560000m,
                    RestrictionReason = "Classified military base perimeter."
                });
            await db.SaveChangesAsync();
        }
        else
        {
            var zones = await db.NoFlyZones.ToListAsync();
            var changed = false;
            foreach (var zone in zones)
            {
                if (string.IsNullOrWhiteSpace(zone.BaseLocation))
                {
                    zone.BaseLocation = zone.ZoneName.Contains("Airport", StringComparison.OrdinalIgnoreCase)
                        ? "Air Base Beirut"
                        : "Air Base Akkar";
                    changed = true;
                }
            }

            if (changed)
            {
                await db.SaveChangesAsync();
            }
        }

        if (hasExistingUsers && !hasRealUsers && !hasDrones && !hasFlightRequests)
        {
            var legacyPlaceholder = await db.Users.FirstOrDefaultAsync(u => u.Username == "legacy.user");
            if (legacyPlaceholder is not null)
            {
                db.Users.Remove(legacyPlaceholder);
                await db.SaveChangesAsync();
            }

            hasExistingUsers = false;
        }

        if (hasExistingUsers || hasDrones || hasFlightRequests)
        {
            var allUsers = await db.Users.ToListAsync();
            foreach (var user in allUsers)
            {
                if (user.Role == default)
                {
                    user.Role = user.Username switch
                    {
                        "beirut.super" => UserRole.SuperAdmin,
                        "ali.ops" => UserRole.Admin,
                        _ => UserRole.User
                    };
                }

                if (string.IsNullOrWhiteSpace(user.BaseLocation))
                {
                    user.BaseLocation = "Air Base Beirut";
                }

                if (user.PasswordHash.Length < 64)
                {
                    user.PasswordHash = PasswordHasher.Hash(user.PasswordHash);
                }
            }
            await db.SaveChangesAsync();

            var badRoleUsers = allUsers.Where(u => (int)u.Role > (int)UserRole.SuperAdmin).ToList();
            foreach (var bad in badRoleUsers)
            {
                bad.Role = UserRole.SuperAdmin;
                bad.IsApproved = true;
            }
            if (badRoleUsers.Count > 0)
            {
                await db.SaveChangesAsync();
            }

            var guaranteedSuper = await db.Users.FirstOrDefaultAsync(x => x.Username == "super.admin");
            if (guaranteedSuper is null)
            {
                db.Users.Add(new User
                {
                    Username = "super.admin",
                    PasswordHash = PasswordHasher.Hash("Super@123"),
                    FullName = "Main Super Admin",
                    Phone = "03000000",
                    Email = "super.admin@mil.local",
                    Role = UserRole.SuperAdmin,
                    BaseLocation = "Air Base Beirut",
                    IsApproved = true
                });
                await db.SaveChangesAsync();
            }
            else
            {
                guaranteedSuper.Role = UserRole.SuperAdmin;
                guaranteedSuper.IsApproved = true;
                guaranteedSuper.BaseLocation = string.IsNullOrWhiteSpace(guaranteedSuper.BaseLocation)
                    ? "Air Base Beirut"
                    : guaranteedSuper.BaseLocation;
                guaranteedSuper.PasswordHash = PasswordHasher.Hash("Super@123");
                await db.SaveChangesAsync();
            }

            if (!await db.FlightPermits.AnyAsync())
            {
                var existingDrones = await db.Drones.OrderBy(d => d.Id).Take(2).ToListAsync();
                if (existingDrones.Count > 0)
                {
                    db.FlightPermits.Add(new FlightPermit
                    {
                    DroneId = existingDrones[0].Id,
                    FlightPurpose = "Harbor monitoring",
                    LocationLabel = "Beirut Coast",
                    Phone = "03111111",
                    UrcLat = 33.970000m,
                    UrcLng = 35.720000m,
                    LlcLat = 33.950000m,
                    LlcLng = 35.700000m,
                    MaxAltitude = 120,
                    ScheduledStartTime = DateTime.UtcNow.AddHours(1),
                    ScheduledEndTime = DateTime.UtcNow.AddHours(2),
                    Status = PermitStatus.AwaitingInternalApproval
                });
                }

                if (existingDrones.Count > 1)
                {
                    db.FlightPermits.Add(new FlightPermit
                    {
                        DroneId = existingDrones[1].Id,
                        FlightPurpose = "Forest inspection",
                        LocationLabel = "North Hills",
                        Phone = "03222222",
                        UrcLat = 33.760000m,
                        UrcLng = 35.920000m,
                        LlcLat = 33.740000m,
                        LlcLng = 35.900000m,
                        MaxAltitude = 150,
                        ScheduledStartTime = DateTime.UtcNow.AddMinutes(25),
                        ScheduledEndTime = DateTime.UtcNow.AddHours(1),
                        Status = PermitStatus.PendingPayment
                    });
                }

                await db.SaveChangesAsync();
            }
            else
            {
                var permits = await db.FlightPermits.ToListAsync();
                var changed = false;
                foreach (var permit in permits)
                {
                    if (permit.ScheduledEndTime is null)
                    {
                        permit.ScheduledEndTime = permit.ScheduledStartTime.AddHours(2);
                        changed = true;
                    }
                }

                if (changed)
                {
                    await db.SaveChangesAsync();
                }
            }

            return;
        }

        var users = new[]
        {
            new User { Username = "beirut.super", PasswordHash = PasswordHasher.Hash("Super@123"), FullName = "Beirut Super Admin", Phone = "03101010", Email = "super.beirut@mil.local", Role = UserRole.SuperAdmin, BaseLocation = "Air Base Beirut", IsApproved = true },
            new User { Username = "ali.ops", PasswordHash = PasswordHasher.Hash("pass123"), FullName = "Ali Ops", Phone = "03111111", Email = "ali@demo.local", Role = UserRole.Admin, BaseLocation = "Air Base Akkar", IsApproved = true },
            new User { Username = "maya.recon", PasswordHash = PasswordHasher.Hash("pass123"), FullName = "Maya Recon", Phone = "03222222", Email = "maya@demo.local", Role = UserRole.User, BaseLocation = "Air Base Beirut", IsApproved = true },
            new User { Username = "pending.user", PasswordHash = PasswordHasher.Hash("pass123"), FullName = "Pending User", Phone = "03333333", Email = "pending@demo.local", Role = UserRole.User, BaseLocation = "Air Base South", IsApproved = false }
        };
        db.Users.AddRange(users);

        var units = new[]
        {
            new Unit { Name = "Beirut Air Ops" },
            new Unit { Name = "North Recon Unit" },
            new Unit { Name = "South Response Unit" }
        };
        db.Units.AddRange(units);

        var categories = new[]
        {
            new DroneCategory { Name = "Recon" },
            new DroneCategory { Name = "Inspection" },
            new DroneCategory { Name = "Media" }
        };
        db.Categories.AddRange(categories);
        await db.SaveChangesAsync();

        var drones = new[]
        {
            new Drone { Name = "Falcon-1", Model = "DJI Mavic 3", SerialNumber = "SN-M3-1001", UserId = users[0].Id, UnitId = units[0].Id, CategoryId = categories[0].Id },
            new Drone { Name = "Eagle-2", Model = "Autel Evo II", SerialNumber = "SN-E2-1002", UserId = users[0].Id, UnitId = units[1].Id, CategoryId = categories[1].Id },
            new Drone { Name = "Hawk-3", Model = "Parrot Anafi", SerialNumber = "SN-PA-1003", UserId = users[1].Id, UnitId = units[2].Id, CategoryId = categories[2].Id }
        };
        db.Drones.AddRange(drones);
        await db.SaveChangesAsync();

        var requests = new[]
        {
            new FlightRequest
            {
                UserId = users[0].Id,
                Reason = "Bridge inspection",
                Location = "Downtown",
                UrcLat = 33.900001m, UrcLng = 35.600001m,
                LlgLat = 33.880001m, LlgLng = 35.560001m,
                MaxAltitude = 120,
                Phone = "03111111",
                Status = FlightRequestStatus.Approved,
                IsPaid = true,
                ReceiptNumber = "RCPT-20260331-00001",
                EmailSent = true,
                PhoneNotificationSent = true
            },
            new FlightRequest
            {
                UserId = users[0].Id,
                Reason = "Media coverage",
                Location = "Airport",
                UrcLat = 33.860000m, UrcLng = 35.540000m,
                LlgLat = 33.840000m, LlgLng = 35.500000m,
                MaxAltitude = 80,
                Phone = "03111111",
                Status = FlightRequestStatus.Rejected,
                IsNoFlyZone = true,
                NoFlyZoneReason = "Location 'Airport' is restricted.",
                RejectionReason = "Location 'Airport' is restricted."
            },
            new FlightRequest
            {
                UserId = users[1].Id,
                Reason = "Land survey",
                Location = "Bekaa",
                UrcLat = 33.780000m, UrcLng = 35.980000m,
                LlgLat = 33.750000m, LlgLng = 35.940000m,
                MaxAltitude = 150,
                Phone = "03222222",
                Status = FlightRequestStatus.PaymentPending
            }
        };
        db.FlightRequests.AddRange(requests);

        if (!await db.FlightPermits.AnyAsync())
        {
            db.FlightPermits.AddRange(
                new FlightPermit
                {
                    DroneId = drones[0].Id,
                    FlightPurpose = "Harbor monitoring",
                    LocationLabel = "Beirut Coast",
                    Phone = "03111111",
                    UrcLat = 33.970000m,
                    UrcLng = 35.720000m,
                    LlcLat = 33.950000m,
                    LlcLng = 35.700000m,
                    MaxAltitude = 120,
                    ScheduledStartTime = DateTime.UtcNow.AddHours(1),
                    ScheduledEndTime = DateTime.UtcNow.AddHours(2),
                    Status = PermitStatus.AwaitingInternalApproval
                },
                new FlightPermit
                {
                    DroneId = drones[1].Id,
                    FlightPurpose = "Forest inspection",
                    LocationLabel = "North Hills",
                    Phone = "03222222",
                    UrcLat = 33.760000m,
                    UrcLng = 35.920000m,
                    LlcLat = 33.740000m,
                    LlcLng = 35.900000m,
                    MaxAltitude = 150,
                    ScheduledStartTime = DateTime.UtcNow.AddMinutes(25),
                    ScheduledEndTime = DateTime.UtcNow.AddHours(1),
                    Status = PermitStatus.PendingPayment
                });
        }

        var licenses = new[]
        {
            new License { DroneId = drones[0].Id, LicenseNumber = "LIC-2026-0001", IssuedAt = DateTime.UtcNow.AddDays(-20), ExpiresAt = DateTime.UtcNow.AddMonths(6), Status = LicenseStatus.Active },
            new License { DroneId = drones[1].Id, LicenseNumber = "LIC-2026-0002", IssuedAt = DateTime.UtcNow.AddDays(-45), ExpiresAt = DateTime.UtcNow.AddMonths(3), Status = LicenseStatus.Active },
            new License { DroneId = drones[2].Id, LicenseNumber = "LIC-2026-0003", IssuedAt = DateTime.UtcNow.AddDays(-10), ExpiresAt = DateTime.UtcNow.AddMonths(12), Status = LicenseStatus.Suspended }
        };
        db.Licenses.AddRange(licenses);

        await db.SaveChangesAsync();
    }
}
