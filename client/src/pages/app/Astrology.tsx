import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const ZODIAC_EMOJIS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓"
};

export default function Astrology() {
  const [sign1, setSign1] = useState("Aries");
  const [sign2, setSign2] = useState("Libra");
  const [mode, setMode] = useState<"common" | "deeply">("common");

  const { data: latest, refetch } = trpc.astrology.reading.useQuery({ mode });
  const generate = trpc.astrology.generate.useMutation({
    onSuccess: () => { refetch(); toast.success("✨ Horoscope generated!"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex flex-col min-h-screen pb-24" style={{ background: "var(--background)" }}>
      <div className="px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Candara, sans-serif", color: "var(--midas-gold)" }}>
          ✨ Astrology
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          AI-powered cosmic readings for your pair
        </p>
      </div>

      <div className="px-4 mb-4">
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {(["common", "deeply"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className="flex-1 py-2 text-sm font-bold transition-all"
              style={{
                background: mode === m ? "linear-gradient(135deg, var(--midas-gold), var(--amethyst))" : "transparent",
                color: mode === m ? "white" : "var(--muted-foreground)",
              }}>
              {m === "common" ? "🌟 Couple Reading" : "🌹 Intimate Reading"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mb-4 grid grid-cols-2 gap-3">
        {[{ label: "Your Sign", value: sign1, set: setSign1 }, { label: "Partner's Sign", value: sign2, set: setSign2 }].map(({ label, value, set }) => (
          <div key={label}>
            <p className="text-xs mb-1 font-bold" style={{ color: "var(--muted-foreground)" }}>{label}</p>
            <select value={value} onChange={(e) => set(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm font-bold"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
              {ZODIAC_SIGNS.map(s => (
                <option key={s} value={s}>{ZODIAC_EMOJIS[s]} {s}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="px-4 mb-6">
        <button
          onClick={() => generate.mutate({ sign1, sign2, mode })}
          disabled={generate.isPending}
          className="w-full py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, var(--midas-gold), var(--amethyst))", color: "white" }}>
          {generate.isPending ? "✨ Reading the stars..." : "✨ Generate Reading"}
        </button>
      </div>

      {latest ? (
        <div className="mx-4 rounded-2xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--midas-gold)44" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{ZODIAC_EMOJIS[(latest as {zodiac_sign_1?: string}).zodiac_sign_1 ?? sign1]}</span>
            <span className="text-lg font-bold" style={{ color: "var(--midas-gold)" }}>+</span>
            <span className="text-2xl">{ZODIAC_EMOJIS[(latest as {zodiac_sign_2?: string}).zodiac_sign_2 ?? sign2]}</span>
            <div className="flex-1" />
            <span className="text-xs px-2 py-1 rounded-full"
              style={{ background: "var(--midas-gold)22", color: "var(--midas-gold)" }}>
              {(latest as {generated_at?: string}).generated_at ? new Date((latest as {generated_at?: string}).generated_at!).toLocaleDateString() : "Today"}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)", lineHeight: "1.7" }}>
            {latest.reading_text}
          </p>
        </div>
      ) : (
        <div className="mx-4 rounded-2xl p-8 text-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="text-4xl mb-3">🌌</div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Select your signs and generate your first cosmic reading
          </p>
        </div>
      )}
    </div>
  );
}
