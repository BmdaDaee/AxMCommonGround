import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';

export default function MissionsPage() {
  const queryClient = useQueryClient();
  const missionsQuery = useQuery({ queryKey: ['missions'], queryFn: () => api('/missions') });
  const completeMission = useMutation({
    mutationFn: (id) => api(`/missions/${id}`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Mission completed.');
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <section className="page-stack">
      <div className="page-header">
        <p className="eyebrow" data-testid="missions-page-eyebrow">Shared rituals</p>
        <h2 data-testid="missions-page-title">Small structured moves that shift the tone of the week.</h2>
      </div>

      <div className="grid-two">
        {(missionsQuery.data?.items || []).map((mission) => (
          <article key={mission.id} className={`mission-card ${mission.completed ? 'complete' : ''}`} data-testid={`mission-card-${mission.id}`}>
            <div className="chip-row">
              <span className="chip" data-testid={`mission-category-${mission.id}`}>{mission.category}</span>
              <span className="chip" data-testid={`mission-xp-${mission.id}`}>{mission.xpReward} XP</span>
            </div>
            <h3 className="section-title" data-testid={`mission-title-${mission.id}`}>{mission.title}</h3>
            <p className="page-subtitle" data-testid={`mission-description-${mission.id}`}>{mission.description}</p>
            <p className="muted-copy" data-testid={`mission-due-${mission.id}`}>Due {new Date(mission.dueAt).toLocaleDateString()}</p>
            <button className="button button-primary" disabled={mission.completed || completeMission.isPending} onClick={() => completeMission.mutate(mission.id)} data-testid={`mission-complete-button-${mission.id}`}>
              {mission.completed ? 'Completed' : 'Mark complete'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}