import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'

export function AuthForm() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const isSignup = mode === 'signup'

  return (
    <div>
      <h1>IncidentOps</h1>
      {isSignup ? <SignupForm /> : <LoginForm />}
      <button type="button" onClick={() => setMode(isSignup ? 'login' : 'signup')}>
        {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
      </button>
    </div>
  )
}
