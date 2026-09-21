import { useState } from 'react'
import type { FormEvent } from 'react'
import type { NewIncidentInput, Severity } from '../types'

const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical']

interface IncidentFormProps {
  onSubmit: (input: NewIncidentInput) => void
}

export function IncidentForm({ onSubmit }: IncidentFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<Severity>('medium')

  const canSubmit = title.trim().length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    onSubmit({ title: title.trim(), description: description.trim(), severity })
    setTitle('')
    setDescription('')
    setSeverity('medium')
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Report a new incident">
      <div>
        <label htmlFor="incident-title">Title</label>
        <input
          id="incident-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Checkout API returning 500s"
          required
        />
      </div>

      <div>
        <label htmlFor="incident-description">Description</label>
        <textarea
          id="incident-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What's happening, what's the impact"
        />
      </div>

      <div>
        <label htmlFor="incident-severity">Severity</label>
        <select
          id="incident-severity"
          value={severity}
          onChange={(event) => setSeverity(event.target.value as Severity)}
        >
          {SEVERITIES.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={!canSubmit}>
        Report incident
      </button>
    </form>
  )
}
