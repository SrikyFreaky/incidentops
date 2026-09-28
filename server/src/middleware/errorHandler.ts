import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../errors'

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}.` },
  })
}

// express.json() throws a SyntaxError (tagged with `type: 'entity.parse.failed'`)
// when the request body isn't valid JSON at all. That's a client mistake,
// not a server failure, so it belongs in the same 400 family as our own
// validation errors rather than falling through to a generic 500.
function isJsonParseError(err: unknown): err is SyntaxError & { type?: string } {
  return err instanceof SyntaxError && (err as { type?: string }).type === 'entity.parse.failed'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    })
    return
  }

  if (isJsonParseError(err)) {
    res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'Request body is not valid JSON.' },
    })
    return
  }

  console.error(err)
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' },
  })
}
