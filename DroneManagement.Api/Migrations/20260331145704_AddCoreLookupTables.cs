using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DroneManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCoreLookupTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF OBJECT_ID(N'[Units]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [Units] (
                        [Id] int NOT NULL IDENTITY,
                        [Name] nvarchar(max) NOT NULL,
                        CONSTRAINT [PK_Units] PRIMARY KEY ([Id])
                    );
                END

                IF OBJECT_ID(N'[Categories]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [Categories] (
                        [Id] int NOT NULL IDENTITY,
                        [Name] nvarchar(max) NOT NULL,
                        CONSTRAINT [PK_Categories] PRIMARY KEY ([Id])
                    );
                END

                IF COL_LENGTH('Drones', 'UnitId') IS NULL
                    ALTER TABLE [Drones] ADD [UnitId] int NULL;

                IF COL_LENGTH('Drones', 'CategoryId') IS NULL
                    ALTER TABLE [Drones] ADD [CategoryId] int NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Drones_UnitId' AND object_id = OBJECT_ID('Drones'))
                    CREATE INDEX [IX_Drones_UnitId] ON [Drones] ([UnitId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Drones_CategoryId' AND object_id = OBJECT_ID('Drones'))
                    CREATE INDEX [IX_Drones_CategoryId] ON [Drones] ([CategoryId]);

                IF EXISTS (
                    SELECT 1
                    FROM sys.columns
                    WHERE object_id = OBJECT_ID('Drones')
                      AND name = 'SerialNumber'
                      AND max_length = -1
                )
                AND NOT EXISTS (SELECT 1 FROM [Drones] WHERE LEN([SerialNumber]) > 450)
                    ALTER TABLE [Drones] ALTER COLUMN [SerialNumber] nvarchar(450) NOT NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Drones_SerialNumber' AND object_id = OBJECT_ID('Drones'))
                AND NOT EXISTS (SELECT [SerialNumber] FROM [Drones] GROUP BY [SerialNumber] HAVING COUNT(*) > 1)
                AND EXISTS (
                    SELECT 1
                    FROM sys.columns
                    WHERE object_id = OBJECT_ID('Drones')
                      AND name = 'SerialNumber'
                      AND max_length <> -1
                )
                    CREATE UNIQUE INDEX [IX_Drones_SerialNumber] ON [Drones] ([SerialNumber]);

                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Drones_Units_UnitId')
                    ALTER TABLE [Drones] ADD CONSTRAINT [FK_Drones_Units_UnitId]
                    FOREIGN KEY ([UnitId]) REFERENCES [Units]([Id]);

                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Drones_Categories_CategoryId')
                    ALTER TABLE [Drones] ADD CONSTRAINT [FK_Drones_Categories_CategoryId]
                    FOREIGN KEY ([CategoryId]) REFERENCES [Categories]([Id]);

                IF OBJECT_ID(N'[Licenses]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [Licenses] (
                        [Id] int NOT NULL IDENTITY,
                        [DroneId] int NOT NULL,
                        [LicenseNumber] nvarchar(max) NOT NULL,
                        [IssuedAt] datetime2 NOT NULL,
                        [ExpiresAt] datetime2 NULL,
                        [Status] int NOT NULL,
                        CONSTRAINT [PK_Licenses] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_Licenses_Drones_DroneId] FOREIGN KEY ([DroneId]) REFERENCES [Drones]([Id]) ON DELETE CASCADE
                    );
                END

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Licenses_DroneId' AND object_id = OBJECT_ID('Licenses'))
                    CREATE INDEX [IX_Licenses_DroneId] ON [Licenses] ([DroneId]);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
