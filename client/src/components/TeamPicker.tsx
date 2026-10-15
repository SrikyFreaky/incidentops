import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useCreateTeam, useTeamsList } from '../hooks/useTeams'
import { createTeamSchema } from '../schemas/team'
import type { CreateTeamFormValues } from '../schemas/team'

interface TeamPickerProps {
  onSelect: (teamId: string) => void
}

export function TeamPicker({ onSelect }: TeamPickerProps) {
  const { data, status } = useTeamsList()
  const createTeam = useCreateTeam()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: '' },
  })

  function submit(values: CreateTeamFormValues) {
    createTeam.mutate(values.name, {
      onSuccess: (team) => {
        reset()
        onSelect(team.id)
      },
    })
  }

  return (
    <div>
      <h2>Choose a team</h2>

      {status === 'pending' && <p role="status">Loading teams…</p>}
      {status === 'error' && <p role="alert">Couldn't load teams.</p>}
      {status === 'success' && data.items.length > 0 && (
        <ul aria-label="Your teams">
          {data.items.map((team) => (
            <li key={team.id}>
              <button type="button" onClick={() => onSelect(team.id)}>
                {team.name} ({team.role.toLowerCase()})
              </button>
            </li>
          ))}
        </ul>
      )}
      {status === 'success' && data.items.length === 0 && <p>You're not on any teams yet.</p>}

      <form onSubmit={handleSubmit(submit)} noValidate aria-label="Create a team">
        <label htmlFor="team-name">New team name</label>
        <input id="team-name" {...register('name')} />
        {errors.name && <p role="alert">{errors.name.message}</p>}
        <button type="submit" disabled={createTeam.isPending}>
          Create team
        </button>
      </form>
    </div>
  )
}
