using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DroneManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPermitScheduledEndTime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledEndTime",
                table: "FlightPermits",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ScheduledEndTime",
                table: "FlightPermits");
        }
    }
}
