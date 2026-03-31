using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DroneManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAndWorkflowFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EmailSent",
                table: "FlightRequests",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasIncident",
                table: "FlightRequests",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "IncidentNote",
                table: "FlightRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsNoFlyZone",
                table: "FlightRequests",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPaid",
                table: "FlightRequests",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "LlgLat",
                table: "FlightRequests",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "LlgLng",
                table: "FlightRequests",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "NoFlyZoneReason",
                table: "FlightRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PhoneNotificationSent",
                table: "FlightRequests",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ReceiptNumber",
                table: "FlightRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "FlightRequests",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "UrcLat",
                table: "FlightRequests",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "UrcLng",
                table: "FlightRequests",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "FlightRequests",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Drones",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Username = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsApproved = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            // Ensure there is at least one valid user for legacy rows.
            migrationBuilder.Sql("""
                IF NOT EXISTS (SELECT 1 FROM [Users] WHERE [Id] = 1)
                BEGIN
                    SET IDENTITY_INSERT [Users] ON;
                    INSERT INTO [Users] ([Id], [Username], [PasswordHash], [FullName], [Phone], [Email], [IsApproved], [CreatedAt])
                    VALUES (1, 'legacy.user', 'legacy', 'Legacy User', '00000000', 'legacy@local', 1, GETUTCDATE());
                    SET IDENTITY_INSERT [Users] OFF;
                END

                UPDATE [Drones] SET [UserId] = 1 WHERE [UserId] = 0;
                UPDATE [FlightRequests] SET [UserId] = 1 WHERE [UserId] = 0;
                UPDATE [FlightRequests] SET [UpdatedAt] = [CreatedAt] WHERE [UpdatedAt] = '0001-01-01T00:00:00';
                """);

            migrationBuilder.CreateIndex(
                name: "IX_FlightRequests_Status",
                table: "FlightRequests",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_FlightRequests_UserId",
                table: "FlightRequests",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Drones_UserId",
                table: "Drones",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Drones_Users_UserId",
                table: "Drones",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_FlightRequests_Users_UserId",
                table: "FlightRequests",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Drones_Users_UserId",
                table: "Drones");

            migrationBuilder.DropForeignKey(
                name: "FK_FlightRequests_Users_UserId",
                table: "FlightRequests");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropIndex(
                name: "IX_FlightRequests_Status",
                table: "FlightRequests");

            migrationBuilder.DropIndex(
                name: "IX_FlightRequests_UserId",
                table: "FlightRequests");

            migrationBuilder.DropIndex(
                name: "IX_Drones_UserId",
                table: "Drones");

            migrationBuilder.DropColumn(
                name: "EmailSent",
                table: "FlightRequests");

            migrationBuilder.DropColumn(
                name: "HasIncident",
                table: "FlightRequests");

            migrationBuilder.DropColumn(
                name: "IncidentNote",
                table: "FlightRequests");

            migrationBuilder.DropColumn(
                name: "IsNoFlyZone",
                table: "FlightRequests");

            migrationBuilder.DropColumn(
                name: "IsPaid",
                table: "FlightRequests");

            migrationBuilder.DropColumn(
                name: "LlgLat",
                table: "FlightRequests");

            migrationBuilder.DropColumn(
                name: "LlgLng",
                table: "FlightRequests");

            migrationBuilder.DropColumn(
                name: "NoFlyZoneReason",
                table: "FlightRequests");

            migrationBuilder.DropColumn(
                name: "PhoneNotificationSent",
                table: "FlightRequests");

            migrationBuilder.DropColumn(
                name: "ReceiptNumber",
                table: "FlightRequests");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "FlightRequests");

            migrationBuilder.DropColumn(
                name: "UrcLat",
                table: "FlightRequests");

            migrationBuilder.DropColumn(
                name: "UrcLng",
                table: "FlightRequests");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "FlightRequests");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Drones");
        }
    }
}
