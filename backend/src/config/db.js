/*
  Data Access давхаргын суурь: MSSQL холболтын pool ба query туслахууд.
  Бүх SQL parameterized (@name) байх ёстой — string залгаж query бичихгүй.
*/
import { env } from './env.js'

const { driver, server, database, odbcDriver, user, password, port } = env.db

// msnodesqlv8 = Windows нэвтрэлт (ODBC), tedious = SQL нэвтрэлт (TCP)
const sql = (await import(driver === 'tedious' ? 'mssql' : 'mssql/msnodesqlv8.js')).default

const config =
  driver === 'tedious'
    ? {
        server: server.replace(/^\.\\/, 'localhost\\'),
        database,
        user,
        password,
        port,
        options: { encrypt: false, trustServerCertificate: true },
        pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
      }
    : {
        connectionString:
          `Driver={${odbcDriver}};Server=${server};Database=${database};` +
          'Trusted_Connection=yes;Connect Timeout=15;',
        pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
      }

let poolPromise

export function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect().catch((err) => {
      poolPromise = undefined
      throw err
    })
  }
  return poolPromise
}

function bind(request, params = {}) {
  for (const [name, value] of Object.entries(params)) {
    request.input(name, value === undefined ? null : value)
  }
  return request
}

/** Query ажиллуулж recordset буцаана. */
export async function query(text, params) {
  const pool = await getPool()
  const result = await bind(pool.request(), params).query(text)
  return result.recordset ?? []
}

/** Эхний мөрийг буцаана (байхгүй бол null). */
export async function queryOne(text, params) {
  const rows = await query(text, params)
  return rows[0] ?? null
}

/** Нөлөөлсөн мөрийн тоог буцаана (UPDATE/DELETE). */
export async function execute(text, params) {
  const pool = await getPool()
  const result = await bind(pool.request(), params).query(text)
  return result.rowsAffected.reduce((a, b) => a + b, 0)
}

/**
 * Транзакц. fn-д { query, queryOne, execute } ижил интерфэйстэй объект ирнэ.
 * Алдаа гарвал rollback хийнэ.
 */
export async function withTransaction(fn) {
  const pool = await getPool()
  const tx = new sql.Transaction(pool)
  await tx.begin()

  const run = async (text, params) => bind(new sql.Request(tx), params).query(text)
  const db = {
    query: async (text, params) => (await run(text, params)).recordset ?? [],
    queryOne: async (text, params) => ((await run(text, params)).recordset ?? [])[0] ?? null,
    execute: async (text, params) =>
      (await run(text, params)).rowsAffected.reduce((a, b) => a + b, 0),
  }

  try {
    const result = await fn(db)
    await tx.commit()
    return result
  } catch (err) {
    try { await tx.rollback() } catch { /* аль хэдийн rollback болсон */ }
    throw err
  }
}

/** Транзакцгүй үед repository-д дамжуулах анхдагч db. */
export const db = { query, queryOne, execute }

export async function closePool() {
  if (poolPromise) {
    const pool = await poolPromise
    await pool.close()
    poolPromise = undefined
  }
}
