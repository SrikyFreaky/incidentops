import { Router } from 'express'
import * as authController from '../controllers/authController'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { loginSchema, signupSchema } from '../schemas/auth'

export const authRouter = Router()

authRouter.post('/signup', validate('body', signupSchema), authController.signup)
authRouter.post('/login', validate('body', loginSchema), authController.login)
authRouter.post('/logout', authController.logout)
authRouter.get('/me', requireAuth, authController.me)
