import type { NextFunction, Request, Response } from 'express'
import type { ZodType, z } from 'zod'
import { ApiError } from '../errors'

// Parsed request data lives on `req.validated` rather than overwriting
// `req.body`/`req.query`/`req.params` directly — Express 5 makes some of
// those read-only in places, and keeping validated data separate avoids
// relying on that behavior at all.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      validated?: {
        body?: unknown
        query?: unknown
        params?: unknown
      }
    }
  }
}

type Source = 'body' | 'query' | 'params'

export function validate<T extends ZodType>(source: Source, schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      next(ApiError.badRequest('Request failed validation.', result.error.flatten()))
      return
    }

    req.validated = { ...req.validated, [source]: result.data }
    next()
  }
}

export function getValidated<T>(req: Request, source: Source): T {
  return req.validated?.[source] as T
}

export type Infer<T extends ZodType> = z.infer<T>
