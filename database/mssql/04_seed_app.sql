/*
  СӨХ удирдлагын систем — апп туршихад зориулсан өгөгдөл (санал асуулга, санал гомдол)
  03_seed.sql-ийн дараа ажиллуулна. Дахин ажиллуулахад давхардуулахгүй.
  Ажиллуулах:  sqlcmd -S .\SQLEXPRESS -E -I -f 65001 -b -i database\mssql\04_seed_app.sql
*/
USE SohManagementDB;
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
GO

DECLARE @soh INT = (SELECT TOP 1 id FROM dbo.soh ORDER BY id);
DECLARE @admin INT = (SELECT TOP 1 id FROM dbo.admins WHERE soh_id = @soh ORDER BY id);

IF @soh IS NULL
BEGIN
    RAISERROR(N'Эхлээд 03_seed.sql-ийг ажиллуулна уу', 16, 1);
    RETURN;
END

BEGIN TRAN;

/* ---------- Санал асуулга (US_04, US_11) ---------- */
IF NOT EXISTS (SELECT 1 FROM dbo.polls WHERE soh_id = @soh)
BEGIN
    DECLARE @p1 INT, @p2 INT;

    -- Идэвхтэй: санал өгөх боломжтой (12-р сарын 1 хүртэл)
    INSERT INTO dbo.polls (soh_id, title, description, audience, starts_at, ends_at, status, notify, created_by)
    VALUES (@soh, N'Тоглоомын талбай шинэчлэх эсэх',
            N'Хашааны тоглоомын талбайг 2027 оны хавар шинэчлэх. Төсөв 4.5 сая ₮, СӨХ-ийн сангаас.',
            'all', '2026-11-15T00:00:00', '2026-12-01T15:00:00', 'active', 1, @admin);
    SET @p1 = SCOPE_IDENTITY();
    INSERT INTO dbo.poll_options (poll_id, position, [text]) VALUES
      (@p1, 1, N'Зөвшөөрч байна'), (@p1, 2, N'Татгалзаж байна'), (@p1, 3, N'Дараа жил хийх');

    -- Хаагдсан: үр дүн харагдана
    INSERT INTO dbo.polls (soh_id, title, description, audience, starts_at, ends_at, status, notify, created_by)
    VALUES (@soh, N'Орцны цэвэрлэгээний давтамж',
            N'Орцны цэвэрлэгээг долоо хоногт хэдэн удаа хийх вэ?',
            'all', '2026-10-20T00:00:00', '2026-11-05T15:00:00', 'closed', 0, @admin);
    SET @p2 = SCOPE_IDENTITY();
    INSERT INTO dbo.poll_options (poll_id, position, [text]) VALUES
      (@p2, 1, N'Долоо хоногт 1 удаа'), (@p2, 2, N'Долоо хоногт 2 удаа');

    -- Хаагдсан асуулгын санал (5 хүн)
    INSERT INTO dbo.poll_votes (poll_id, option_id, resident_id)
    SELECT @p2,
           (SELECT id FROM dbo.poll_options WHERE poll_id = @p2 AND position = CASE WHEN r.rn <= 2 THEN 1 ELSE 2 END),
           r.id
    FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM dbo.residents
          WHERE soh_id = @soh AND deleted_at IS NULL) r
    WHERE r.rn <= 5;
END

/* ---------- Санал гомдол, засварын хүсэлт (US_05) ---------- */
IF NOT EXISTS (SELECT 1 FROM dbo.complaints WHERE soh_id = @soh)
BEGIN
    DECLARE @r1 INT = (SELECT id FROM dbo.residents WHERE soh_id = @soh AND phone = '99112233');
    DECLARE @r2 INT = (SELECT id FROM dbo.residents WHERE soh_id = @soh AND phone = '88115566');
    DECLARE @c INT;

    IF @r1 IS NOT NULL
    BEGIN
        INSERT INTO dbo.complaints (soh_id, resident_id, category_id, type, title, content, status)
        VALUES (@soh, @r1, (SELECT id FROM dbo.categories WHERE soh_id = @soh AND type = 'complaint' AND name = N'Засвар'),
                'maintenance', N'3-р давхрын гэрэл асахгүй байна',
                N'1-р орцны 3-р давхрын шатны гэрэл 3 хоног асахгүй байна. Орой харанхуй байна.', 'in_progress');
        SET @c = SCOPE_IDENTITY();
        INSERT INTO dbo.complaint_replies (complaint_id, author_type, author_id, message)
        VALUES (@c, 'admin', @admin, N'Цахилгаанчинд мэдэгдлээ. Маргааш засна.');
    END

    IF @r2 IS NOT NULL
        INSERT INTO dbo.complaints (soh_id, resident_id, category_id, type, title, content, status)
        VALUES (@soh, @r2, (SELECT id FROM dbo.categories WHERE soh_id = @soh AND type = 'complaint' AND name = N'Цэвэрлэгээ'),
                'complaint', N'Хогийн сав дүүрсэн хэвээр',
                N'2-р орцны хажуугийн хогийн савыг 2 өдөр ачаагүй байна.', 'new');
END

COMMIT;
GO

SELECT 'polls' AS tbl, COUNT(*) AS cnt FROM dbo.polls
UNION ALL SELECT 'poll_options', COUNT(*) FROM dbo.poll_options
UNION ALL SELECT 'poll_votes', COUNT(*) FROM dbo.poll_votes
UNION ALL SELECT 'complaints', COUNT(*) FROM dbo.complaints
UNION ALL SELECT 'complaint_replies', COUNT(*) FROM dbo.complaint_replies;
GO
