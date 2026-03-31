using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DroneManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPermitWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FlightPermits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DroneId = table.Column<int>(type: "int", nullable: false),
                    FlightPurpose = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UrcLat = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: false),
                    UrcLng = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: false),
                    LlcLat = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: false),
                    LlcLng = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: false),
                    MaxAltitude = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    RejectionReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsPaymentProcessed = table.Column<bool>(type: "bit", nullable: false),
                    PermitSerialNumber = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FlightPermits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FlightPermits_Drones_DroneId",
                        column: x => x.DroneId,
                        principalTable: "Drones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "NoFlyZones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ZoneName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UrcLat = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: false),
                    UrcLng = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: false),
                    LlcLat = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: false),
                    LlcLng = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: false),
                    RestrictionReason = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NoFlyZones", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FlightPermits_DroneId",
                table: "FlightPermits",
                column: "DroneId");

            migrationBuilder.CreateIndex(
                name: "IX_FlightPermits_PermitSerialNumber",
                table: "FlightPermits",
                column: "PermitSerialNumber",
                unique: true,
                filter: "[PermitSerialNumber] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FlightPermits");

            migrationBuilder.DropTable(
                name: "NoFlyZones");
        }
    }
}
