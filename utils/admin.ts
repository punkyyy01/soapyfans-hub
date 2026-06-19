const adminEmail = process.env.ADMIN_EMAIL
if (!adminEmail) throw new Error('Missing env: ADMIN_EMAIL must be set')
export const ADMIN_EMAIL = adminEmail
