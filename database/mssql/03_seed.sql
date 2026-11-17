/*
  СӨХ удирдлагын систем — туршилтын өгөгдөл (вебийн mock өгөгдлөөс)
  Ажиллуулах:  sqlcmd -S .\SQLEXPRESS -E -f 65001 -b -i database\mssql\03_seed.sql

  Туршилтын админ:  admin@soh.mn / Admin123!   (bcrypt hash)
  Зөвхөн хөгжүүлэлтийн орчинд ашиглана.
*/
USE SohManagementDB;
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;   -- filtered index-тэй хүснэгтэд бичихэд шаардлагатай
GO

BEGIN TRAN;

DECLARE @soh INT, @admin INT;

INSERT INTO dbo.soh (name, address, phone, email, entrance_count, monthly_fee, bank_name, bank_account)
VALUES (N'Нарны хотхон СӨХ', N'Улаанбаатар, Сүхбаатар дүүрэг, 1-р хороо', '77001122', 'info@soh.mn', 3, 35000, N'Хаан банк', '5000123456');
SET @soh = SCOPE_IDENTITY();

INSERT INTO dbo.admins (soh_id, full_name, email, password_hash, role)
VALUES (@soh, N'Администратор', 'admin@soh.mn', '$2a$10$FH66PzcjDFVJJLPHumyM.eN7nFKTSrccAy6ICxR4quuyU.9tdLAHy', 'manager');
SET @admin = SCOPE_IDENTITY();

/* Ангилал */
INSERT INTO dbo.categories (soh_id, type, name, sort_order) VALUES
 (@soh,'expense',N'Засвар үйлчилгээ',1),(@soh,'expense',N'Цэвэрлэгээ',2),(@soh,'expense',N'Ашиглалтын зардал',3),
 (@soh,'expense',N'Үйлчилгээ',4),(@soh,'expense',N'Бусад',5),
 (@soh,'income',N'Сарын хураамж',1),(@soh,'income',N'Түрээс',2),(@soh,'income',N'Бусад орлого',3),
 (@soh,'announcement',N'Ерөнхий мэдээлэл',1),(@soh,'announcement',N'Засвар үйлчилгээ',2),(@soh,'announcement',N'Үйлчилгээ',3),
 (@soh,'announcement',N'Хурал',4),(@soh,'announcement',N'Анхааруулга',5),(@soh,'announcement',N'Бусад',6),
 (@soh,'complaint',N'Засвар',1),(@soh,'complaint',N'Цэвэрлэгээ',2),(@soh,'complaint',N'Хөрш',3),(@soh,'complaint',N'Бусад',4);

DECLARE @cat TABLE (type VARCHAR(20), name NVARCHAR(100), id INT);
INSERT INTO @cat SELECT type, name, id FROM dbo.categories WHERE soh_id = @soh;

/* Оршин суугчид (Residents.jsx) */
INSERT INTO dbo.residents (soh_id, last_name, first_name, phone, email, entrance, floor, apartment) VALUES
 (@soh,N'Бат',N'Болд','99112233','bold@gmail.com',1,3,'12'),
 (@soh,N'Дорж',N'Номин','88112233','nomin@gmail.com',1,5,'21'),
 (@soh,N'Ган',N'Анхбаяр','99114455','ankhbayar@gmail.com',2,4,'35'),
 (@soh,N'Цэрэн',N'Саруул','88115566','saruul@gmail.com',2,7,'48'),
 (@soh,N'Мөнх',N'Тэмүүлэн','99001122','temuulen@gmail.com',1,2,'8'),
 (@soh,N'Баяр',N'Энхжин','99117788','enkhjin@gmail.com',3,6,'65');

/* Сарын төлбөр (US_01): 10 сар бүгд төлсөн, 11 сард Цэрэн Саруул төлөөгүй (вебийн mock-той ижил) */
INSERT INTO dbo.fee_charges (soh_id, resident_id, period, amount, paid_amount, due_date)
SELECT @soh, r.id, p.period, 35000,
       CASE WHEN p.period = '2026-11' AND r.phone = '88115566' THEN 0 ELSE 35000 END,
       p.due
FROM dbo.residents r
CROSS JOIN (VALUES ('2026-10', CAST('2026-10-10' AS DATE)), ('2026-11', CAST('2026-11-10' AS DATE))) p(period, due)
WHERE r.soh_id = @soh;

INSERT INTO dbo.payments (soh_id, resident_id, charge_id, amount, paid_at, method, created_by)
SELECT c.soh_id, c.resident_id, c.id, c.paid_amount,
       DATEADD(DAY, 5, CAST(c.period + '-01' AS DATETIME2(0))), 'bank', @admin
FROM dbo.fee_charges c
WHERE c.soh_id = @soh AND c.paid_amount > 0;

/* Зардал (Expenses.jsx) */
INSERT INTO dbo.expenses (soh_id, title, category_id, description, amount, [date], created_by)
SELECT @soh, v.title, c.id, v.descr, v.amount, v.d, @admin
FROM (VALUES
 (N'Лифтний засвар үйлчилгээ',N'Засвар үйлчилгээ',N'Лифтний техникийн үзлэг, засвар',850000,'2026-11-15'),
 (N'Орцны цэвэрлэгээ',N'Цэвэрлэгээ',N'11-р сарын цэвэрлэгээний үйлчилгээ',450000,'2026-11-12'),
 (N'Нийтийн эзэмшлийн цахилгаан',N'Ашиглалтын зардал',N'Орц болон гадна талбайн цахилгаан',320000,'2026-11-10'),
 (N'Харуул хамгаалалтын үйлчилгээ',N'Үйлчилгээ',N'Харуул хамгаалалтын үйлчилгээний зардал',1200000,'2026-11-08'),
 (N'Гэрэлтүүлгийн чийдэн солих',N'Засвар үйлчилгээ',N'Орцны гэрэлтүүлэг шинэчилсэн',180000,'2026-11-05')
) v(title, cat, descr, amount, d)
JOIN @cat c ON c.type = 'expense' AND c.name = v.cat;

/* Орлого (Reports.jsx) */
INSERT INTO dbo.incomes (soh_id, title, category_id, amount, [date], created_by)
SELECT @soh, v.title, c.id, v.amount, v.d, @admin
FROM (VALUES
 (N'СӨХ-ийн сарын хураамж',N'Сарын хураамж',3500000,'2026-11-15'),
 (N'Зогсоолын түрээс',N'Түрээс',450000,'2026-11-12'),
 (N'Нэмэлт үйлчилгээний орлого',N'Бусад орлого',200000,'2026-11-08')
) v(title, cat, amount, d)
JOIN @cat c ON c.type = 'income' AND c.name = v.cat;

/* Зарлал (Announcements.jsx) */
INSERT INTO dbo.announcements (soh_id, title, category_id, content, [date], status, audience, notify, published_at, created_by)
SELECT @soh, v.title, c.id, v.content, v.d, v.status, v.aud, v.notify,
       CASE WHEN v.status = 'published' THEN CAST(v.d AS DATETIME2(0)) END, @admin
FROM (VALUES
 (N'Лифтний засвар үйлчилгээ хийгдэнэ',N'Засвар үйлчилгээ',N'11-р сарын 20-ны өдөр 10:00-16:00 цагийн хооронд лифтний төлөвлөгөөт засвар үйлчилгээ хийгдэнэ. Иймд оршин суугчид та бүхэн урьдчилан төлөвлөнө үү.','2026-11-17','published','all',1),
 (N'Орцны цэвэрлэгээний хуваарь',N'Үйлчилгээ',N'Орцны их цэвэрлэгээ энэ долоо хоногийн Бямба гарагт явагдана.','2026-11-15','published','all',0),
 (N'Оршин суугчдын хурлын тухай',N'Хурал',N'Оршин суугчдын ээлжит хурал 11-р сарын 25-ны өдөр зохион байгуулагдана.','2026-11-14','draft','all',0),
 (N'Усны шугамын засвар',N'Засвар үйлчилгээ',N'Усны шугамын засвар үйлчилгээтэй холбоотой мэдээлэл.','2026-11-12','published','entrance:1',1)
) v(title, cat, content, d, status, aud, notify)
JOIN @cat c ON c.type = 'announcement' AND c.name = v.cat;

/* Хурал (Meetings.jsx) */
DECLARE @m TABLE (title NVARCHAR(200), id INT);
INSERT INTO dbo.meetings (soh_id, title, type, [date], [time], location, format, meeting_link, audience, description, status, notify, created_by)
OUTPUT inserted.title, inserted.id INTO @m
VALUES
 (@soh,N'Ээлжит оршин суугчдын хурал','regular','2026-11-25','18:00',N'СӨХ-ийн байр','onsite',NULL,'all',N'Оршин суугчдын ээлжит хурал зохион байгуулах.','scheduled',1,@admin),
 (@soh,N'Санхүүгийн тайлан хэлэлцэх хурал','extraordinary','2026-11-10','17:00',N'СӨХ-ийн байр','onsite',NULL,'all',N'Санхүүгийн тайлангийн талаар хэлэлцэх.','completed',0,@admin),
 (@soh,N'Орцны тохижилтын асуудал','extraordinary','2026-12-05','16:00',N'1-р орц','onsite',NULL,'entrance:1',N'Орцны тохижилтын талаар санал солилцох.','draft',0,@admin),
 (@soh,N'Өвлийн бэлтгэл ажлын хурал','regular','2026-11-20','15:00',N'Онлайн','online','https://meet.google.com/abc-defg-hij','all',N'Өвлийн бэлтгэл ажлын явцын талаар мэдээлэл өгөх.','scheduled',1,@admin);

INSERT INTO dbo.meeting_agenda_items (meeting_id, position, [text])
SELECT m.id, v.pos, v.txt
FROM (VALUES
 (N'Ээлжит оршин суугчдын хурал',1,N'2026 оны санхүүгийн тайлан танилцуулах'),
 (N'Ээлжит оршин суугчдын хурал',2,N'Орцны засвар үйлчилгээний асуудал'),
 (N'Ээлжит оршин суугчдын хурал',3,N'Ирэх улирлын төлөвлөгөө'),
 (N'Санхүүгийн тайлан хэлэлцэх хурал',1,N'Орлого, зарлагын тайлан'),
 (N'Санхүүгийн тайлан хэлэлцэх хурал',2,N'Зардлын хуваарилалт'),
 (N'Орцны тохижилтын асуудал',1,N'Орцны тохижилтын санал'),
 (N'Орцны тохижилтын асуудал',2,N'Засварын төсөв'),
 (N'Өвлийн бэлтгэл ажлын хурал',1,N'Халаалтын систем'),
 (N'Өвлийн бэлтгэл ажлын хурал',2,N'Цэвэрлэгээ үйлчилгээ')
) v(title, pos, txt)
JOIN @m m ON m.title = v.title;

/* Админы мэдэгдэл (Header.jsx) */
INSERT INTO dbo.notifications (recipient_type, recipient_id, type, title, message, read_at) VALUES
 ('admin',@admin,'complaint_created',N'Шинэ санал гомдол',N'Оршин суугчаас шинэ санал гомдол ирлээ.',NULL),
 ('admin',@admin,'resident_created',N'Шинэ оршин суугч',N'Шинэ оршин суугч бүртгэгдлээ.',NULL),
 ('admin',@admin,'announcement_published',N'Шинэ зарлал',N'Системд шинэ зарлал нэмэгдлээ.',SYSUTCDATETIME());

COMMIT;
GO

SELECT 'soh' AS tbl, COUNT(*) AS cnt FROM dbo.soh
UNION ALL SELECT 'admins', COUNT(*) FROM dbo.admins
UNION ALL SELECT 'residents', COUNT(*) FROM dbo.residents
UNION ALL SELECT 'fee_charges', COUNT(*) FROM dbo.fee_charges
UNION ALL SELECT 'payments', COUNT(*) FROM dbo.payments
UNION ALL SELECT 'categories', COUNT(*) FROM dbo.categories
UNION ALL SELECT 'expenses', COUNT(*) FROM dbo.expenses
UNION ALL SELECT 'incomes', COUNT(*) FROM dbo.incomes
UNION ALL SELECT 'announcements', COUNT(*) FROM dbo.announcements
UNION ALL SELECT 'meetings', COUNT(*) FROM dbo.meetings
UNION ALL SELECT 'meeting_agenda_items', COUNT(*) FROM dbo.meeting_agenda_items
UNION ALL SELECT 'notifications', COUNT(*) FROM dbo.notifications;
GO
