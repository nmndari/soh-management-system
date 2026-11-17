/*
  СӨХ удирдлагын систем — өгөгдлийн сан үүсгэх
  Ажиллуулах:  sqlcmd -S .\SQLEXPRESS -E -f 65001 -i database\mssql\01_create_database.sql
*/
IF DB_ID(N'SohManagementDB') IS NULL
BEGIN
    CREATE DATABASE SohManagementDB COLLATE Cyrillic_General_CI_AS;
END
GO

ALTER DATABASE SohManagementDB SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;
GO
