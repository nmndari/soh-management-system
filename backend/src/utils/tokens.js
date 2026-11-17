import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function signAccessToken({ id, role, sohId }) {
  return jwt.sign({ sub: id, role, sohId }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpires,
  })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret)
}

/** Refresh token нь санамсаргүй мөр. DB-д зөвхөн sha256 hash-ийг хадгална. */
export function generateRefreshToken() {
  return crypto.randomBytes(48).toString('base64url')
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}
