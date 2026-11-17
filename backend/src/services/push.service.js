/*
  Push мэдэгдэл (FCM). Firebase төсөл үүсгэсний дараа firebase-admin суулгаж sendPush-ийг хэрэгжүүлнэ:
    admin.messaging().sendEachForMulticast({ tokens, notification: { title, body }, data })
  Одоогоор мэдэгдэл notifications хүснэгтэд бичигдэж, апп /app/notifications-оор уншина.
*/
import * as deviceRepo from '../repositories/device.repository.js'

export async function sendPush(tokens, { title, message, data }) {
  if (!tokens.length) return
  console.log(`[push] ${tokens.length} төхөөрөмж: ${title}${message ? ` — ${message}` : ''}`, data ?? '')
}

/** Мэдэгдлийн гол урсгалыг зогсоохгүйн тулд алдааг зөвхөн бүртгэнэ */
export function pushToResidents(sohId, target, notification) {
  deviceRepo
    .tokensFor(sohId, target)
    .then((rows) =>
      sendPush(
        rows.map((r) => r.token),
        {
          title: notification.title,
          message: notification.message,
          data: { type: notification.type, refType: notification.refType, refId: notification.refId },
        },
      ),
    )
    .catch((err) => console.error('[push] алдаа:', err.message))
}
