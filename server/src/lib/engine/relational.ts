import { RelationalState, RelationalMetric } from '../../shared/types';

export interface RelationalDimensions {
  availability: RelationalMetric;
  alignment: RelationalMetric;
  activation: RelationalMetric;
  trust: RelationalMetric;
}

export function computeRelationalState(dimensions: RelationalDimensions): RelationalState {
  const highCount = Object.values(dimensions).filter(v => v === 'HIGH').length;
  const lowCount = Object.values(dimensions).filter(v => v === 'LOW').length;

  // 5-state machine logic
  if (highCount === 4) return 'ALIGNED';
  if (lowCount === 4) return 'DORMANT';
  if (highCount >= 2 && lowCount >= 1) return 'MISALIGNED';
  if (dimensions.availability === 'LOW' || dimensions.activation === 'LOW') return 'CAPACITY_BLOCKED';
  if (dimensions.trust === 'LOW') return 'TRUST_FRACTURED';

  return 'DORMANT';
}

export function getStateColor(state: RelationalState): string {
  const colors: Record<RelationalState, string> = {
    ALIGNED: '#22c55e', // green
    DORMANT: '#6b7280', // gray
    MISALIGNED: '#f59e0b', // amber
    CAPACITY_BLOCKED: '#ef4444', // red
    TRUST_FRACTURED: '#7c3aed', // purple
  };
  return colors[state];
}
