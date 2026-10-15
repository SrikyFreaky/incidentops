import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useLogin } from '../hooks/useAuth'
import { loginSchema } from '../schemas/auth'
import type { LoginFormValues } from '../schemas/auth'

export function LoginForm() {
  const login = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <form onSubmit={handleSubmit((values) => login.mutate(values))} noValidate aria-label="Log in">
      <div>
        <label htmlFor="login-email">Email</label>
        <input id="login-email" type="email" {...register('email')} />
        {errors.email && <p role="alert">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="login-password">Password</label>
        <input id="login-password" type="password" {...register('password')} />
        {errors.password && <p role="alert">{errors.password.message}</p>}
      </div>

      {login.isError && <p role="alert">{login.error.message}</p>}

      <button type="submit" disabled={login.isPending}>
        Log in
      </button>
    </form>
  )
}
