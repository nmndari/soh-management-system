/*
  СӨХ удирдлагын систем — хүснэгтүүд
  Ажиллуулах:  sqlcmd -S .\SQLEXPRESS -E -f 65001 -b -i database\mssql\02_schema.sql

  Дүрэм:
  - Монгол текст бүгд NVARCHAR.
  - Мөнгөн дүн BIGINT (₮, бүхэл тоо).
  - Цаг хугацаа DATETIME2(0), UTC (SYSUTCDATETIME()).
  - Төлөвийг англи кодоор хадгалж CHECK-ээр хязгаарлана.
  - updated_at-ийг сервер UPDATE хийх бүрт SYSUTCDATETIME() болгож шинэчилнэ.
  - Скриптийг дахин ажиллуулахад бүх хүснэгтийг устгаад шинээр үүсгэнэ (өгөгдөл устна).
*/
USE SohManagementDB;
GO
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;   -- filtered index-д шаардлагатай (sqlcmd анхдагчаар OFF)
SET ANSI_NULLS ON;
GO

/* ---------- Хуучин хүснэгтүүдийг устгах (хамаарлын урвуу дарааллаар) ---------- */
DROP VIEW  IF EXISTS dbo.v_resident_payment_status;
DROP TABLE IF EXISTS dbo.payments;
DROP TABLE IF EXISTS dbo.fee_charges;
DROP TABLE IF EXISTS dbo.device_tokens;
DROP TABLE IF EXISTS dbo.notifications;
DROP TABLE IF EXISTS dbo.complaint_replies;
DROP TABLE IF EXISTS dbo.complaints;
DROP TABLE IF EXISTS dbo.poll_votes;
DROP TABLE IF EXISTS dbo.poll_options;
DROP TABLE IF EXISTS dbo.polls;
DROP TABLE IF EXISTS dbo.meeting_agenda_items;
DROP TABLE IF EXISTS dbo.meetings;
DROP TABLE IF EXISTS dbo.announcements;
DROP TABLE IF EXISTS dbo.incomes;
DROP TABLE IF EXISTS dbo.expenses;
DROP TABLE IF EXISTS dbo.categories;
DROP TABLE IF EXISTS dbo.refresh_tokens;
DROP TABLE IF EXISTS dbo.password_reset_tokens;
DROP TABLE IF EXISTS dbo.otp_codes;
DROP TABLE IF EXISTS dbo.residents;
DROP TABLE IF EXISTS dbo.admins;
DROP TABLE IF EXISTS dbo.soh;
GO

/* ---------- СӨХ (тохиргоо) ---------- */
CREATE TABLE dbo.soh (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    name            NVARCHAR(150) NOT NULL,
    address         NVARCHAR(300) NULL,
    phone           VARCHAR(20)   NULL,
    email           VARCHAR(150)  NULL,
    entrance_count  TINYINT       NOT NULL DEFAULT 1 CHECK (entrance_count BETWEEN 1 AND 50),
    monthly_fee     BIGINT        NOT NULL DEFAULT 0 CHECK (monthly_fee >= 0),
    fee_due_day     TINYINT       NOT NULL DEFAULT 10 CHECK (fee_due_day BETWEEN 1 AND 28),  -- US_06: төлбөр төлөх өдөр
    bank_name       NVARCHAR(100) NULL,
    bank_account    VARCHAR(50)   NULL,
    logo_url        VARCHAR(500)  NULL,
    min_app_version VARCHAR(20)   NOT NULL DEFAULT '1.0.0',
    feature_polls      BIT NOT NULL DEFAULT 1,
    feature_complaints BIT NOT NULL DEFAULT 1,
    created_at      DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME()
);

/* ---------- Админ ---------- */
CREATE TABLE dbo.admins (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    soh_id        INT           NOT NULL REFERENCES dbo.soh(id),
    full_name     NVARCHAR(150) NOT NULL,
    email         VARCHAR(150)  NOT NULL,
    password_hash VARCHAR(100)  NOT NULL,
    role          VARCHAR(20)   NOT NULL DEFAULT 'manager'
                  CHECK (role IN ('manager','accountant')),
    is_active     BIT           NOT NULL DEFAULT 1,
    last_login_at DATETIME2(0)  NULL,
    created_at    DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at    DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_admins_email UNIQUE (email)
);

/* ---------- Оршин суугч ---------- */
CREATE TABLE dbo.residents (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    soh_id         INT           NOT NULL REFERENCES dbo.soh(id),
    last_name      NVARCHAR(100) NOT NULL,
    first_name     NVARCHAR(100) NOT NULL,
    phone          VARCHAR(20)   NOT NULL,
    email          VARCHAR(150)  NULL,
    entrance       TINYINT       NOT NULL,
    floor          SMALLINT      NULL,
    apartment      VARCHAR(10)   NOT NULL,
    -- Төлбөрийн төлөв энд хадгалахгүй, fee_charges-аас тооцно (v_resident_payment_status)
    is_active      BIT           NOT NULL DEFAULT 1,
    deleted_at     DATETIME2(0)  NULL,
    created_at     DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at     DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME()
);
-- Устгаагүй оршин суугчдын дунд утас давхардахгүй
CREATE UNIQUE INDEX UX_residents_phone_active ON dbo.residents(phone) WHERE deleted_at IS NULL;
CREATE INDEX IX_residents_soh_entrance ON dbo.residents(soh_id, entrance) WHERE deleted_at IS NULL;
/* ---------- Нэвтрэлт ---------- */
CREATE TABLE dbo.otp_codes (
    id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    phone       VARCHAR(20)  NOT NULL,
    code_hash   VARCHAR(100) NOT NULL,
    expires_at  DATETIME2(0) NOT NULL,
    attempts    TINYINT      NOT NULL DEFAULT 0,
    used_at     DATETIME2(0) NULL,
    created_at  DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_otp_phone ON dbo.otp_codes(phone, created_at DESC);

CREATE TABLE dbo.refresh_tokens (
    id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_type   VARCHAR(10)  NOT NULL CHECK (user_type IN ('admin','resident')),
    user_id     INT          NOT NULL,
    token_hash  VARCHAR(100) NOT NULL,
    expires_at  DATETIME2(0) NOT NULL,
    revoked_at  DATETIME2(0) NULL,
    created_at  DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_refresh_token UNIQUE (token_hash)
);
CREATE INDEX IX_refresh_user ON dbo.refresh_tokens(user_type, user_id);

CREATE TABLE dbo.password_reset_tokens (
    id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    admin_id    INT          NOT NULL REFERENCES dbo.admins(id) ON DELETE CASCADE,
    token_hash  VARCHAR(100) NOT NULL,
    expires_at  DATETIME2(0) NOT NULL,
    used_at     DATETIME2(0) NULL,
    created_at  DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
);

/* ---------- Ангилал ---------- */
CREATE TABLE dbo.categories (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    soh_id      INT           NOT NULL REFERENCES dbo.soh(id),
    type        VARCHAR(20)   NOT NULL
                CHECK (type IN ('expense','income','announcement','complaint')),
    name        NVARCHAR(100) NOT NULL,
    sort_order  SMALLINT      NOT NULL DEFAULT 0,
    created_at  DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at  DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_categories UNIQUE (soh_id, type, name)
);

/* ---------- Санхүү ---------- */
CREATE TABLE dbo.expenses (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    soh_id       INT            NOT NULL REFERENCES dbo.soh(id),
    title        NVARCHAR(200)  NOT NULL,
    category_id  INT            NOT NULL REFERENCES dbo.categories(id),
    description  NVARCHAR(1000) NULL,
    amount       BIGINT         NOT NULL CHECK (amount > 0),
    [date]       DATE           NOT NULL,
    created_by   INT            NULL REFERENCES dbo.admins(id),
    created_at   DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at   DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_expenses_soh_date ON dbo.expenses(soh_id, [date] DESC) INCLUDE (amount, category_id);

CREATE TABLE dbo.incomes (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    soh_id       INT            NOT NULL REFERENCES dbo.soh(id),
    title        NVARCHAR(200)  NOT NULL,
    category_id  INT            NOT NULL REFERENCES dbo.categories(id),
    description  NVARCHAR(1000) NULL,
    amount       BIGINT         NOT NULL CHECK (amount > 0),
    [date]       DATE           NOT NULL,
    resident_id  INT            NULL REFERENCES dbo.residents(id),
    created_by   INT            NULL REFERENCES dbo.admins(id),
    created_at   DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at   DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_incomes_soh_date ON dbo.incomes(soh_id, [date] DESC) INCLUDE (amount, category_id);

/* ---------- Сарын төлбөр (US_01) ---------- */
-- Сар бүр оршин суугч бүрт нэг нэхэмжлэл үүснэ (feeService.generateMonthlyCharges)
CREATE TABLE dbo.fee_charges (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    soh_id       INT          NOT NULL REFERENCES dbo.soh(id),
    resident_id  INT          NOT NULL REFERENCES dbo.residents(id),
    period       CHAR(7)      NOT NULL CHECK (period LIKE '[2][0-9][0-9][0-9]-[01][0-9]'),  -- '2026-11'
    amount       BIGINT       NOT NULL CHECK (amount > 0),
    paid_amount  BIGINT       NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    due_date     DATE         NOT NULL,
    status       AS (CASE WHEN paid_amount >= amount THEN 'paid'
                          WHEN paid_amount > 0 THEN 'partial'
                          ELSE 'unpaid' END) PERSISTED,
    created_at   DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at   DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_fee_charge UNIQUE (resident_id, period)
);
CREATE INDEX IX_fee_charges_soh_period ON dbo.fee_charges(soh_id, period) INCLUDE (status, amount, paid_amount);

-- Төлөлт бүр. Бүртгэхдээ incomes-д мөр нэмж income_id-г холбоно (тайланд давхар тоологдохгүй)
CREATE TABLE dbo.payments (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    soh_id       INT            NOT NULL REFERENCES dbo.soh(id),
    resident_id  INT            NOT NULL REFERENCES dbo.residents(id),
    charge_id    INT            NULL REFERENCES dbo.fee_charges(id),
    amount       BIGINT         NOT NULL CHECK (amount > 0),
    paid_at      DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME(),
    method       VARCHAR(10)    NOT NULL DEFAULT 'bank' CHECK (method IN ('cash','bank','qpay')),
    note         NVARCHAR(300)  NULL,
    income_id    INT            NULL REFERENCES dbo.incomes(id),
    created_by   INT            NULL REFERENCES dbo.admins(id),
    created_at   DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_payments_resident ON dbo.payments(resident_id, paid_at DESC);

/* ---------- Зарлал ---------- */
CREATE TABLE dbo.announcements (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    soh_id        INT            NOT NULL REFERENCES dbo.soh(id),
    title         NVARCHAR(200)  NOT NULL,
    category_id   INT            NOT NULL REFERENCES dbo.categories(id),
    content       NVARCHAR(MAX)  NOT NULL,
    [date]        DATE           NOT NULL,
    status        VARCHAR(10)    NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','published')),
    audience      VARCHAR(20)    NOT NULL DEFAULT 'all',   -- 'all' | 'entrance:1' ...
    notify        BIT            NOT NULL DEFAULT 0,
    published_at  DATETIME2(0)   NULL,
    created_by    INT            NULL REFERENCES dbo.admins(id),
    created_at    DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at    DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_announcements_audience CHECK (audience = 'all' OR audience LIKE 'entrance:[0-9]%')
);
CREATE INDEX IX_announcements_soh_status ON dbo.announcements(soh_id, status, [date] DESC);

/* ---------- Хурал ---------- */
CREATE TABLE dbo.meetings (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    soh_id           INT            NOT NULL REFERENCES dbo.soh(id),
    title            NVARCHAR(200)  NOT NULL,
    type             VARCHAR(15)    NOT NULL DEFAULT 'regular'
                     CHECK (type IN ('regular','extraordinary')),
    [date]           DATE           NOT NULL,
    [time]           TIME(0)        NOT NULL,
    location         NVARCHAR(200)  NULL,
    format           VARCHAR(10)    NOT NULL DEFAULT 'onsite'
                     CHECK (format IN ('onsite','online')),
    meeting_link     VARCHAR(500)   NULL,
    meeting_code     VARCHAR(50)    NULL,
    meeting_password VARCHAR(50)    NULL,
    audience         VARCHAR(20)    NOT NULL DEFAULT 'all',
    description      NVARCHAR(2000) NULL,
    status           VARCHAR(10)    NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','scheduled','completed')),
    notify           BIT            NOT NULL DEFAULT 0,
    created_by       INT            NULL REFERENCES dbo.admins(id),
    created_at       DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at       DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_meetings_audience CHECK (audience = 'all' OR audience LIKE 'entrance:[0-9]%'),
    CONSTRAINT CK_meetings_online_link CHECK (format = 'onsite' OR status = 'draft' OR meeting_link IS NOT NULL)
);
CREATE INDEX IX_meetings_soh_status ON dbo.meetings(soh_id, status, [date]);

CREATE TABLE dbo.meeting_agenda_items (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    meeting_id  INT           NOT NULL REFERENCES dbo.meetings(id) ON DELETE CASCADE,
    position    SMALLINT      NOT NULL,
    [text]      NVARCHAR(500) NOT NULL,
    CONSTRAINT UQ_agenda_position UNIQUE (meeting_id, position)
);

/* ---------- Санал асуулга ---------- */
CREATE TABLE dbo.polls (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    soh_id       INT            NOT NULL REFERENCES dbo.soh(id),
    title        NVARCHAR(200)  NOT NULL,
    description  NVARCHAR(2000) NULL,
    audience     VARCHAR(20)    NOT NULL DEFAULT 'all',
    starts_at    DATETIME2(0)   NULL,
    ends_at      DATETIME2(0)   NULL,
    status       VARCHAR(10)    NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','active','closed')),
    notify       BIT            NOT NULL DEFAULT 0,
    created_by   INT            NULL REFERENCES dbo.admins(id),
    created_at   DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at   DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_polls_audience CHECK (audience = 'all' OR audience LIKE 'entrance:[0-9]%'),
    CONSTRAINT CK_polls_dates CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE dbo.poll_options (
    id        INT IDENTITY(1,1) PRIMARY KEY,
    poll_id   INT           NOT NULL REFERENCES dbo.polls(id) ON DELETE CASCADE,
    position  SMALLINT      NOT NULL,
    [text]    NVARCHAR(300) NOT NULL,
    CONSTRAINT UQ_poll_option_position UNIQUE (poll_id, position)
);

CREATE TABLE dbo.poll_votes (
    id           BIGINT IDENTITY(1,1) PRIMARY KEY,
    poll_id      INT          NOT NULL REFERENCES dbo.polls(id),            -- cascade нь option-оор дамжина
    option_id    INT          NOT NULL REFERENCES dbo.poll_options(id) ON DELETE CASCADE,
    resident_id  INT          NOT NULL REFERENCES dbo.residents(id),
    created_at   DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_poll_vote UNIQUE (poll_id, resident_id)                   -- нэг хүн нэг санал
);

/* ---------- Санал гомдол ---------- */
CREATE TABLE dbo.complaints (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    soh_id       INT            NOT NULL REFERENCES dbo.soh(id),
    resident_id  INT            NOT NULL REFERENCES dbo.residents(id),
    category_id  INT            NULL REFERENCES dbo.categories(id),
    type         VARCHAR(15)    NOT NULL DEFAULT 'complaint'
                 CHECK (type IN ('complaint','maintenance')),   -- US_05: гомдол / засварын хүсэлт
    title        NVARCHAR(200)  NOT NULL,
    content      NVARCHAR(MAX)  NOT NULL,
    image_urls   NVARCHAR(MAX)  NULL CHECK (image_urls IS NULL OR ISJSON(image_urls) = 1),  -- JSON массив
    status       VARCHAR(15)    NOT NULL DEFAULT 'new'
                 CHECK (status IN ('new','in_progress','resolved','rejected')),
    resolved_at  DATETIME2(0)   NULL,
    created_at   DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at   DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_complaints_soh_status ON dbo.complaints(soh_id, status, created_at DESC);
CREATE INDEX IX_complaints_resident ON dbo.complaints(resident_id, created_at DESC);

CREATE TABLE dbo.complaint_replies (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    complaint_id  INT            NOT NULL REFERENCES dbo.complaints(id) ON DELETE CASCADE,
    author_type   VARCHAR(10)    NOT NULL CHECK (author_type IN ('admin','resident')),
    author_id     INT            NOT NULL,
    message       NVARCHAR(2000) NOT NULL,
    created_at    DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME()
);

/* ---------- Мэдэгдэл ---------- */
CREATE TABLE dbo.notifications (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    recipient_type  VARCHAR(10)   NOT NULL CHECK (recipient_type IN ('admin','resident')),
    recipient_id    INT           NOT NULL,
    type            VARCHAR(40)   NOT NULL,   -- complaint_created, resident_created, announcement_published ...
    title           NVARCHAR(200) NOT NULL,
    message         NVARCHAR(500) NULL,
    ref_type        VARCHAR(20)   NULL,       -- announcement, meeting, poll, complaint, resident
    ref_id          INT           NULL,
    read_at         DATETIME2(0)  NULL,
    created_at      DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_notifications_recipient ON dbo.notifications(recipient_type, recipient_id, created_at DESC) INCLUDE (read_at);

CREATE TABLE dbo.device_tokens (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    resident_id  INT          NOT NULL REFERENCES dbo.residents(id) ON DELETE CASCADE,
    fcm_token    VARCHAR(500) NOT NULL,
    platform     VARCHAR(10)  NOT NULL CHECK (platform IN ('android','ios')),
    created_at   DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at   DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_device_token UNIQUE (fcm_token)
);
GO

/* ---------- Оршин суугчийн энэ сарын төлбөрийн төлөв (вебийн Төлсөн / Төлөөгүй) ---------- */
CREATE VIEW dbo.v_resident_payment_status AS
SELECT r.id AS resident_id,
       r.soh_id,
       FORMAT(SYSDATETIME(), 'yyyy-MM') AS period,
       CASE WHEN c.id IS NULL THEN 'no_charge'
            WHEN c.paid_amount >= c.amount THEN 'paid'
            ELSE 'unpaid' END AS payment_status,
       c.amount, c.paid_amount, c.due_date
FROM dbo.residents r
LEFT JOIN dbo.fee_charges c
       ON c.resident_id = r.id AND c.period = FORMAT(SYSDATETIME(), 'yyyy-MM')
WHERE r.deleted_at IS NULL;
GO

PRINT N'Хүснэгтүүд амжилттай үүслээ.';
GO
