import { db } from '../config/db.js'

/** Token өөр оршин суугчид бүртгэлтэй байсан бол шинэ эзэнд шилжүүлнэ */
export const upsert = (residentId, fcmToken, platform, conn = db) =>
  conn.execute(
    `MERGE device_tokens AS t
     USING (SELECT @fcmToken AS fcm_token) AS s ON t.fcm_token = s.fcm_token
     WHEN MATCHED THEN
       UPDATE SET resident_id = @residentId, platform = @platform, updated_at = SYSUTCDATETIME()
     WHEN NOT MATCHED THEN
       INSERT (resident_id, fcm_token, platform) VALUES (@residentId, @fcmToken, @platform);`,
    { residentId, fcmToken, platform },
  )

export const remove = (residentId, fcmToken, conn = db) =>
  conn.execute(
    `DELETE FROM device_tokens WHERE resident_id = @residentId AND fcm_token = @fcmToken`,
    { residentId, fcmToken },
  )

/** Зорилтот оршин суугчдын token-ууд (бүгд эсвэл нэг орц, эсвэл нэг хүн) */
export const tokensFor = (sohId, { entrance = null, residentId = null }, conn = db) =>
  conn.query(
    `SELECT d.fcm_token AS token FROM device_tokens d
     JOIN residents r ON r.id = d.resident_id
     WHERE r.soh_id = @sohId AND r.deleted_at IS NULL
       AND (@entrance IS NULL OR r.entrance = @entrance)
       AND (@residentId IS NULL OR r.id = @residentId)`,
    { sohId, entrance, residentId },
  )
