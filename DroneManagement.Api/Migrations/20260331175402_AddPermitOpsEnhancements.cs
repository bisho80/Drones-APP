using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DroneManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPermitOpsEnhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AirForceAlertSent",
                table: "FlightPermits",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AuthorityEmailSent",
                table: "FlightPermits",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "IncidentAt",
                table: "FlightPermits",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IncidentReported",
                table: "FlightPermits",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsLicenseRevoked",
                table: "FlightPermits",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsRefundIssued",
                table: "FlightPermits",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "LocationLabel",
                table: "FlightPermits",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "OwnerEmailSent",
                table: "FlightPermits",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "FlightPermits",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledStartTime",
                table: "FlightPermits",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_FlightPermits_ScheduledStartTime",
                table: "FlightPermits",
                column: "ScheduledStartTime");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_FlightPermits_ScheduledStartTime",
                table: "FlightPermits");

            migrationBuilder.DropColumn(
                name: "AirForceAlertSent",
                table: "FlightPermits");

            migrationBuilder.DropColumn(
                name: "AuthorityEmailSent",
                table: "FlightPermits");

            migrationBuilder.DropColumn(
                name: "IncidentAt",
                table: "FlightPermits");

            migrationBuilder.DropColumn(
                name: "IncidentReported",
                table: "FlightPermits");

            migrationBuilder.DropColumn(
                name: "IsLicenseRevoked",
                table: "FlightPermits");

            migrationBuilder.DropColumn(
                name: "IsRefundIssued",
                table: "FlightPermits");

            migrationBuilder.DropColumn(
                name: "LocationLabel",
                table: "FlightPermits");

            migrationBuilder.DropColumn(
                name: "OwnerEmailSent",
                table: "FlightPermits");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "FlightPermits");

            migrationBuilder.DropColumn(
                name: "ScheduledStartTime",
                table: "FlightPermits");
        }
    }
}
