import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function VaultPage() {
  const vaultQuery = useQuery({ queryKey: ['vault'], queryFn: () => api('/vault') });

  return (
    <section className="page-stack">
      <div className="page-header">
        <p className="eyebrow" data-testid="vault-page-eyebrow">DeeplyUs vault</p>
        <h2 data-testid="vault-page-title">Keep the parts of the relationship worth revisiting.</h2>
      </div>

      <div className="grid-two">
        {(vaultQuery.data?.items || []).map((item) => (
          <article key={item.id} className="vault-card" data-testid={`vault-entry-${item.id}`}>
            <div className="chip-row">
              <span className="chip" data-testid={`vault-entry-kind-${item.id}`}>{item.kind}</span>
              <span className="chip" data-testid={`vault-entry-date-${item.id}`}>{new Date(item.date).toLocaleDateString()}</span>
            </div>
            <h3 className="section-title" data-testid={`vault-entry-title-${item.id}`}>{item.title}</h3>
            <p className="page-subtitle" data-testid={`vault-entry-description-${item.id}`}>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}