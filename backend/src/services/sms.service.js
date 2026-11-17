/*
  SMS илгээх үйлчилгээ. Одоогоор SMS үйлчилгээ үзүүлэгч холбогдоогүй.
  Үйлчилгээ үзүүлэгч (жишээ нь Unitel, Mobicom-ын SMS API) сонгосны дараа sendSms-ийг хэрэгжүүлнэ.
*/
import { env } from '../config/env.js'

async function sendSms(phone, text) {
  if (env.otp.devMode) {
    console.log(`[SMS → ${phone}] ${text}`)
    return
  }
  throw new Error('SMS үйлчилгээ тохируулаагүй байна (OTP_DEV_MODE=false)')
}

export const sendOtp = (phone, code) =>
  sendSms(phone, `СӨХ апп нэвтрэх код: ${code}. Хүчинтэй хугацаа ${env.otp.ttlSeconds / 60} минут.`)
