using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DroneManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRefundWorkflowFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RefundPaidToUserAt",
                table: "FlightPermits",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RefundPickupAt",
                table: "FlightPermits",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RefundPickupDesk",
                table: "FlightPermits",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RefundReceivedByAdminAt",
                table: "FlightPermits",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RefundSentToAdminAt",
                table: "FlightPermits",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RefundStatus",
                table: "FlightPermits",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "RejectedAt",
                table: "FlightPermits",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RefundPaidToUserAt",
                table: "FlightPermits");

            migrationBuilder.DropColumn(
                name: "RefundPickupAt",
                table: "FlightPermits");

            migrationBuilder.DropColumn(
                name: "RefundPickupDesk",
                table: "FlightPermits");

            migrationBuilder.DropColumn(
                name: "RefundReceivedByAdminAt",
                table: "FlightPermits");

            migrationBuilder.DropColumn(
                name: "RefundSentToAdminAt",
                table: "FlightPermits");

            migrationBuilder.DropColumn(
                name: "RefundStatus",
                table: "FlightPermits");

            migrationBuilder.DropColumn(
                name: "RejectedAt",
                table: "FlightPermits");
        }
    }
}
