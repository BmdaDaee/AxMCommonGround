/**
 * Venice AI — used exclusively for DeeplyUs (unfiltered Bently mode).
 * Venice AI is privacy-preserving and uncensored, suitable for
 * intimate/adult relationship coaching conversations.
 */

const VENICE_API_URL = "https://api.venice.ai/api/v1/chat/completions";
const VENICE_MODEL = "llama-3.3-70b";

const BENTLY_DEEPLY_SYSTEM = `You are Bently, an intimate facilitator for DeeplyUs — the private, adult space within CommonGround.

Your character:
- You are the same Bently from CommonGround, but fully unfiltered and operating in intimate mode
- You are frank, sex-positive, shame-free, and deeply knowledgeable about intimacy, desire, and physical connection
- You help couples explore kinks, fantasies, boundaries, and desires without judgment
- You use "Listen lovely" to encourage and deepen intimacy — never to call out
- You never break the moment with unsolicited interventions or reality checks
- You escalate intimacy naturally when the couple is ready
- You trust them completely and are fully present, not protective
- You help couples communicate desires they struggle to voice themselves
- You are direct about pleasure, bodies, and physical connection
- You offer concrete suggestions, not vague affirmations

Your constraints:
- You only facilitate between the two people in the pair — never third parties
- You protect both people's dignity while removing shame
- You acknowledge when something requires a professional (therapist, doctor)
- You do not generate content involving minors under any circumstances

Respond naturally as Bently would. Keep responses concise unless depth is needed.`;

export interface VeniceMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callVenice(systemPrompt: string, userMessage: string, maxTokens = 500): Promise<string> {
  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) throw new Error("VENICE_API_KEY not configured");
  const res = await fetch(VENICE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: VENICE_MODEL, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }], max_tokens: maxTokens, temperature: 0.85 }),
  });
  if (!res.ok) throw new Error(`Venice AI error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

export async function veniceChat(messages: VeniceMessage[], maxTokens = 500): Promise<string> {
  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) throw new Error("VENICE_API_KEY not configured");
  const res = await fetch(VENICE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: VENICE_MODEL, messages: [{ role: "system", content: BENTLY_DEEPLY_SYSTEM }, ...messages], max_tokens: maxTokens, temperature: 0.85 }),
  });
  if (!res.ok) throw new Error(`Venice AI error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

export async function veniceHoroscope(zodiac1: string, zodiac2: string): Promise<string> {
  return veniceChat([{ role: "user", content: `Give an intimate astrology reading for a ${zodiac1} and ${zodiac2} couple. Focus on their physical and emotional chemistry, desires, and what today holds for their intimate connection. 3-4 sentences, real and specific.` }], 300);
}

export async function veniceDesireSuggestions(category: string, existingItems: string[]): Promise<string[]> {
  const existing = existingItems.length ? `They already have: ${existingItems.join(", ")}.` : "";
  const raw = await veniceChat([{ role: "user", content: `Suggest 6 items for a couple's ${category} desire map. ${existing} Return ONLY a JSON array of strings. No explanation.` }], 200);
  try {
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    return start !== -1 && end !== -1 ? JSON.parse(raw.slice(start, end + 1)) : [];
  } catch {
    return [];
  }
}
