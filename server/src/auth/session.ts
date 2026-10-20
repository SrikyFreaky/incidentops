import ConnectPgSimple from 'connect-pg-simple'
import session from 'express-session'
import { Pool } from 'pg'

// A separate, plain `pg` pool just for the session store — Prisma doesn't
// expose its own connection pool for arbitrary libraries to share, and
// connect-pg-simple needs a `pg.Pool` specifically.
const sessionPool = new Pool({ connectionString: process.env.DATABASE_URL })

const PgSession = ConnectPgSimple(session)

export function createSessionMiddleware() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET must be set.')

  return session({
    store: new PgSession({
      pool: sessionPool,
      // The `session` table is created by a hand-written Prisma migration
      // (prisma/migrations/.../add_session_table), not by this option.
      // `createTableIfMissing: true` creates it lazily on the server's
      // first request instead — which races: the very first request to a
      // fresh environment can 500 while that creation is still in flight.
      // Found this the hard way testing locally. The table always exists
      // before the app serves traffic now, so this stays off.
      createTableIfMissing: false,
    }),
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // In production the client and API live on different Render
      // domains — a genuinely cross-site request from the browser's
      // point of view. Browsers refuse to send a cookie cross-site
      // unless it's both `Secure` and `SameSite=None`; in local dev
      // (same-site, plain http) the defaults (`secure: false`,
      // `sameSite: 'lax'`) are what actually work instead.
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
}
