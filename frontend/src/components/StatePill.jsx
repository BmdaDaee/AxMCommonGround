const TONES = {
  ALIGNED: 'state-pill aligned',
  DORMANT: 'state-pill dormant',
  MISALIGNED: 'state-pill misaligned',
  CAPACITY_BLOCKED: 'state-pill blocked',
  TRUST_FRACTURED: 'state-pill fractured',
};

export default function StatePill({ state }) {
  return (
    <span className={TONES[state] || 'state-pill dormant'} data-testid="relationship-state-pill">
      {String(state || 'DORMANT').replaceAll('_', ' ')}
    </span>
  );
}