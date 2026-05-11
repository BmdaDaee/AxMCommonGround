import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RelationalMetric = "HIGH" | "MEDIUM" | "LOW";

export type RelationalStateValue =
  | "ALIGNED"
  | "DORMANT"
  | "MISALIGNED"
  | "CAPACITY_BLOCKED"
  | "TRUST_FRACTURED";

export type RelationalMeasurement = {
  availability: RelationalMetric;
  alignment: RelationalMetric;
  activation: RelationalMetric;
  trust: RelationalMetric;
  notes?: string;
};

// ─── Scoring ──────────────────────────────────────────────────────────────────

const metricScore = (v: RelationalMetric): number =>
  v === "HIGH" ? 3 : v === "MEDIUM" ? 2 : 1;

/**
 * 5-state relational engine.
 *
 * Priority order:
 * 1. TRUST_FRACTURED — trust is LOW regardless of other dimensions
 * 2. CAPACITY_BLOCKED — availability is LOW, trust is not fractured
 * 3. MISALIGNED — alignment is LOW, others may be okay
 * 4. DORMANT — overall average is below 2.0
 * 5. ALIGNED — all dimensions meet threshold
 */
export function computeStateFromMeasurements(
  m: RelationalMeasurement
): RelationalStateValue {
  if (m.trust === "LOW") return "TRUST_FRACTURED";
  if (m.availability === "LOW") return "CAPACITY_BLOCKED";
  if (m.alignment === "LOW") return "MISALIGNED";

  const avg =
    (metricScore(m.availability) +
      metricScore(m.alignment) +
      metricScore(m.activation) +
      metricScore(m.trust)) /
    4;

  return avg >= 2.0 ? "ALIGNED" : "DORMANT";
}

// ─── Database operations ───────────────────────────────────────────────────────

export async function getRelationalState(pairId: string) {
  const { data } = await supabase
    .from("relational_state_history")
    .select("*")
    .eq("pair_id", pairId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function computeAndRecordState(
  pairId: string,
  measurement: RelationalMeasurement
): Promise<RelationalStateValue> {
  const state = computeStateFromMeasurements(measurement);

  await supabase.from("relational_state_history").insert({
    pair_id: pairId,
    state,
    availability: measurement.availability,
    alignment: measurement.alignment,
    activation: measurement.activation,
    trust: measurement.trust,
    asymmetries: {},
    notes: measurement.notes ?? null,
    recorded_at: new Date().toISOString(),
  });

  await supabase
    .from("pairs")
    .update({ relational_state: state, updated_at: new Date().toISOString() })
    .eq("id", pairId);

  return state;
}
