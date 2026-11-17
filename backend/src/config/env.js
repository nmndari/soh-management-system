const required = (name, fallback) => {
  const value = process.env[name] ?? fallback
  if (value === undefined || value === '') {
    throw new Error(`.env дотор ${name} утга алга`)
  }
  return value
}

export const env = {
  port: Number(process.env.PORT || 4000),
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),

  db: {
    driver: process.env.DB_DRIVER || 'msnodesqlv8',
    server: required('DB_SERVER', '.\\SQLEXPRESS'),
    database: required('DB_DATABASE', 'SohManagementDB'),
    odbcDriver: process.env.DB_ODBC_DRIVER || 'ODBC Driver 17 for SQL Server',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 1433),
  },

  // Нэвтрээгүй үед /app/config аль СӨХ-ийн тохиргоог өгөх вэ
  defaultSohId: Number(process.env.DEFAULT_SOH_ID || 1),

  otp: {
    // true бол SMS илгээхгүй, кодыг консол болон хариунд буцаана (зөвхөн хөгжүүлэлтэд)
    devMode: process.env.OTP_DEV_MODE === 'true',
    ttlSeconds: 120,
    maxAttempts: 5,
  },

  uploadDir: process.env.UPLOAD_DIR || 'uploads',

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshDays: Number(process.env.REFRESH_TOKEN_DAYS || 7),
    refreshRememberDays: Number(process.env.REFRESH_TOKEN_REMEMBER_DAYS || 30),
  },
}
