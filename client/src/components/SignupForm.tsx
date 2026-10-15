import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useSignup } from '../hooks/useAuth'
import { signupSchema } from '../schemas/auth'
import type { SignupFormValues } from '../schemas/auth'

export function SignupForm() {
  const signup = useSignup()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', displayName: '' },
  })

  return (
    <form onSubmit={handleSubmit((values) => signup.mutate(values))} noValidate aria-label="Sign up">
      <div>
        <label htmlFor="signup-display-name">Display name</label>
        <input id="signup-display-name" {...register('displayName')} />
        {errors.displayName && <p role="alert">{errors.displayName.message}</p>}
      </div>

      <div>
        <label htmlFor="signup-email">Email</label>
        <input id="signup-email" type="email" {...register('email')} />
        {errors.email && <p role="alert">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="signup-password">Password</label>
        <input id="signup-password" type="password" {...register('password')} />
        {errors.password && <p role="alert">{errors.password.message}</p>}
      </div>

      {signup.isError && <p role="alert">{signup.error.message}</p>}

      <button type="submit" disabled={signup.isPending}>
        Sign up
      </button>
    </form>
  )
}
