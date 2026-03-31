using DroneManagement.Api.Application.Dtos;
using FluentValidation;

namespace DroneManagement.Api.Application.Validation;

/// <summary>
/// Validates coordinates and permit request payload shape.
/// </summary>
public class PermitDtoValidator : AbstractValidator<PermitDto>
{
    public PermitDtoValidator()
    {
        RuleFor(x => x.DroneId).GreaterThan(0);
        RuleFor(x => x.FlightPurpose).NotEmpty().MaximumLength(300);
        RuleFor(x => x.LocationLabel).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(30);
        RuleFor(x => x.MaxAltitude).GreaterThan(0).LessThanOrEqualTo(1000);
        RuleFor(x => x.ScheduledStartTime)
            .GreaterThan(DateTime.UtcNow.AddMinutes(1))
            .WithMessage("Scheduled start time must be in the near future.");
        RuleFor(x => x.ScheduledEndTime)
            .GreaterThan(x => x.ScheduledStartTime)
            .WithMessage("Scheduled end time must be after start time.")
            .LessThanOrEqualTo(x => x.ScheduledStartTime.AddHours(24))
            .WithMessage("Flight duration cannot exceed 24 hours.");

        RuleFor(x => x.UrcLat).InclusiveBetween(-90, 90);
        RuleFor(x => x.LlcLat).InclusiveBetween(-90, 90);
        RuleFor(x => x.UrcLng).InclusiveBetween(-180, 180);
        RuleFor(x => x.LlcLng).InclusiveBetween(-180, 180);

        RuleFor(x => x)
            .Must(x => x.UrcLat >= x.LlcLat && x.UrcLng >= x.LlcLng)
            .WithMessage("URC must be the upper-right corner and LLC must be the lower-left corner.");
    }
}
