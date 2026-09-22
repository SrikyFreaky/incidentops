import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { newIncidentSchema } from '../schemas/incident'
import type { NewIncidentFormValues } from '../schemas/incident'
import type { Severity } from '../types'

const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical']

interface IncidentFormProps {
  onSubmit: (values: NewIncidentFormValues) => void
  isSubmitting: boolean
  submitError: string | null
}

export function IncidentForm({ onSubmit, isSubmitting, submitError }: IncidentFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewIncidentFormValues>({
    resolver: zodResolver(newIncidentSchema),
    defaultValues: { title: '', description: '', severity: 'medium' },
  })

  function submit(values: NewIncidentFormValues) {
    onSubmit(values)
    reset()
  }

  return (
    <form onSubmit={handleSubmit(submit)} aria-label="Report a new incident" noValidate>
      <div>
        <label htmlFor="incident-title">Title</label>
        <input
          id="incident-title"
          placeholder="Checkout API returning 500s"
          aria-invalid={errors.title ? 'true' : 'false'}
          {...register('title')}
        />
        {errors.title && <p role="alert">{errors.title.message}</p>}
      </div>

      <div>
        <label htmlFor="incident-description">Description</label>
        <textarea
          id="incident-description"
          placeholder="What's happening, what's the impact"
          {...register('description')}
        />
        {errors.description && <p role="alert">{errors.description.message}</p>}
      </div>

      <div>
        <label htmlFor="incident-severity">Severity</label>
        <select id="incident-severity" {...register('severity')}>
          {SEVERITIES.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      {submitError && <p role="alert">{submitError}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Reporting…' : 'Report incident'}
      </button>
    </form>
  )
}
