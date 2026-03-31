using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DroneManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNoFlyZoneBaseLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BaseLocation",
                table: "NoFlyZones",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_NoFlyZones_BaseLocation",
                table: "NoFlyZones",
                column: "BaseLocation");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_NoFlyZones_BaseLocation",
                table: "NoFlyZones");

            migrationBuilder.DropColumn(
                name: "BaseLocation",
                table: "NoFlyZones");
        }
    }
}
