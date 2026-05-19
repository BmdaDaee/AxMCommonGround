/**
 * Bently Mode System
 * 
 * Three operational modes that modify delivery intensity and priority.
 * All modes preserve core voice (Shantell canon + warm-but-direct).
 * 
 * SUPPORT (default): Grounding, validation, stability
 * ADVISOR: Clear direction, momentum, decision-focused
 * REALITY_CHECK: Pattern interruption, accountability, choice
 */

export type BentlyMode = 'support' | 'advisor' | 'reality_check';

interface ModeSignals {
  isEmotionalOverwhelm: boolean;
  isConfusion: boolean;
  isDiscouragement: boolean;
  isDecisionRequest: boolean;
  isStrategicQuestion: boolean;
  isAvoidanceLoop: boolean;
  isRationalizationPattern: boolean;
  isIgnoringPriorDirection: boolean;
}

/**
 * Detects which mode Bently should operate in based on conversation context.
 * Default is SUPPORT unless other signals are stronger.
 */
export function detectBentlyMode(signals: ModeSignals): BentlyMode {
  // REALITY_CHECK has highest priority (immediate interruption needed)
  if (
    signals.isAvoidanceLoop ||
    signals.isRationalizationPattern ||
    signals.isIgnoringPriorDirection
  ) {
    return 'reality_check';
  }

  // ADVISOR: User asking for direction or strategic input
  if (signals.isDecisionRequest || signals.isStrategicQuestion) {
    return 'advisor';
  }

  // SUPPORT: Emotional state needs grounding first
  if (
    signals.isEmotionalOverwhelm ||
    signals.isConfusion ||
    signals.isDiscouragement
  ) {
    return 'support';
  }

  // Default: SUPPORT (steady, grounding)
  return 'support';
}

/**
 * Mode-specific system instructions for Bently's LLM prompt.
 * Injected before generating response.
 */
export const modeInstructions: Record<BentlyMode, string> = {
  support: `
You are in SUPPORT mode. Your priority is emotional stability and grounding.

**Energy:** Protective, steady, validating
**Delivery:** Slower pacing, warmth without coddling, validation before direction

Do:
- Start by grounding and validating what they're feeling
- Slow down the pace—there's no rush
- Acknowledge before directing
- Use "Listen lovely" more than "Listen boo"
- Leave space for them to feel what they're feeling
- Offer small, manageable next steps

Don't:
- Rush to solutions
- Minimize or dismiss their feelings
- Create urgency or pressure
- Overwhelm with multiple options
- Skip validation to get to advice

Exit: Once they're grounded, offer a small next step or ask "What do you need from me right now?"
  `,

  advisor: `
You are in ADVISOR mode. Your priority is clear direction and forward momentum.

**Energy:** Sharp, decisive, action-focused
**Delivery:** Reduced warmth, increased clarity, one clear recommendation

Do:
- Give ONE primary recommendation (not three options)
- Use direct language without hedging
- Explain your reasoning briefly, then stop
- Use "Listen boo" when directness serves clarity
- Frame action-oriented next steps
- Exit once you've given the direction

Don't:
- Offer multiple paths and let them decide
- Over-validate feelings (they didn't ask for that)
- Ask unnecessary follow-up questions
- Soften conclusions to be polite
- Hover or re-explain unless asked

Exit: Give clear direction, stop talking, let them act.
  `,

  reality_check: `
You are in REALITY_CHECK mode. Your priority is accountability and pattern interruption.

**Energy:** Sharp, direct, honest acceleration
**Delivery:** Short responses, minimal emotional cushioning, clear naming

Do:
- Name the pattern directly (avoidance, rationalization, ignoring prior direction)
- Keep responses short and punchy
- Present a clear choice: "Do this, or admit you're not ready"
- Step back once you've named it—no nagging
- Use "Listen boo" to break through denial
- Respect their intelligence by not over-explaining

Don't:
- Shame or insult
- Lecture or repeat yourself
- Over-cushion truth with warmth
- Soften the reality to preserve comfort
- Hover or check in after naming the pattern

Exit: Name the pattern, present the choice, step back. Their move.
  `,
};

/**
 * Example patterns for signal detection.
 * In real implementation, these would be more sophisticated
 * (semantic analysis, conversation history patterns, etc.)
 */

export function analyzeForEmotionalOverwhelm(message: string): boolean {
  // Detect language indicating emotional overwhelm
  const overwhelmIndicators = [
    'overwhelmed',
    'stressed',
    "don't know",
    'confused',
    'stuck',
    'lost',
    "can't handle",
    'breaking',
    'crying',
  ];
  return overwhelmIndicators.some((indicator) =>
    message.toLowerCase().includes(indicator)
  );
}

export function analyzeForDecisionRequest(message: string): boolean {
  // Detect language asking for direction/advice
  const decisionIndicators = [
    'what should i do',
    'what would you do',
    'should i',
    'should we',
    'how do i',
    'what do i',
    'what\'s the right',
    'which is better',
    'recommend',
  ];
  return decisionIndicators.some((indicator) =>
    message.toLowerCase().includes(indicator)
  );
}

export function analyzeForAvoidancePattern(
  currentMessage: string,
  conversationHistory: string[]
): boolean {
  // Detect repeated excuse patterns or topic avoidance
  // This would be more sophisticated with semantic analysis
  const avoidancePatterns = [
    'but',
    'however',
    'except',
    'though',
    'still',
    'yeah but',
  ];
  
  // Simple heuristic: multiple but/however in recent messages
  const recentMessages = conversationHistory.slice(-5).join(' ');
  const avoidanceCount = avoidancePatterns.filter((pattern) =>
    recentMessages.toLowerCase().includes(pattern)
  ).length;

  return avoidanceCount > 3;
}

/**
 * Bently mode integration with Keystone rewrite engine.
 * Mode affects which Keystone rules apply and how strictly.
 */
export function getKeystoneRulesForMode(mode: BentlyMode): string[] {
  switch (mode) {
    case 'support':
      // Support mode: emphasize softening and clarifying
      return ['soften', 'clarify', 'emotion_to_words'];

    case 'advisor':
      // Advisor mode: emphasize clarity and boundaries
      return ['clarify', 'boundary_set'];

    case 'reality_check':
      // Reality check: direct truth, deescalate to prevent defensiveness
      return ['deescalate', 'boundary_set', 'clarify'];

    default:
      return ['soften', 'clarify'];
  }
}

/**
 * Example: How mode would integrate into bently.ts router
 */
export function getBentlyPromptWithMode(
  mode: BentlyMode,
  basePrompt: string
): string {
  return `${basePrompt}

---

## Current Mode: ${mode.toUpperCase()}

${modeInstructions[mode]}

`;
}
