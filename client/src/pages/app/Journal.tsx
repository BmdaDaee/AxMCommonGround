import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const MOODS = [
  { emoji: "😍", label: "Loved" },
  { emoji: "😊", label: "Happy" },
  { emoji: "😌", label: "Calm" },
  { emoji: "🤔", label: "Reflective" },
  { emoji: "😔", label: "Sad" },
  { emoji: "😤", label: "Frustrated" },
  { emoji: "🔥", label: "Passionate" },
  { emoji: "💫", label: "Inspired" },
];

export default function Journal() {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("Happy");
  const [showForm, setShowForm] = useState(false);

  const { data: entries, refetch } = trpc.journal.list.useQuery();
  const addEntry = trpc.journal.add.useMutation({
    onSuccess: () => {
      refetch();
      setContent("");
      setMood("Happy");
      setShowForm(false);
      toast.success("Journal entry saved! ✍️");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex flex-col min-h-screen pb-24" style={{ background: "var(--background)" }}>
      <div className="px-4 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Candara, sans-serif", color: "var(--peridot)" }}>
            📓 Journal
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Your private relationship reflections
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all hover:opacity-80"
          style={{ background: "linear-gradient(135deg, var(--peridot), var(--emerald))", color: "white" }}>
          {showForm ? "×" : "+"}
        </button>
      </div>

      {showForm && (
        <div className="mx-4 mb-4 rounded-2xl p-4"
          style={{ background: "var(--card)", border: "1px solid var(--peridot)44" }}>
          <p className="text-xs font-bold mb-2" style={{ color: "var(--muted-foreground)" }}>How are you feeling?</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {MOODS.map(({ emoji, label }) => (
              <button key={label} onClick={() => setMood(label)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  background: mood === label ? "var(--peridot)" : "var(--muted)22",
                  color: mood === label ? "var(--background)" : "var(--muted-foreground)",
                }}>
                {emoji} {label}
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your thoughts, feelings, reflections..."
            rows={4}
            className="w-full rounded-xl px-3 py-2 text-sm resize-none mb-3"
            style={{
              background: "var(--background)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              outline: "none",
            }}
          />
          <button
            onClick={() => addEntry.mutate({ content, mood })}
            disabled={addEntry.isPending || !content.trim()}
            className="w-full py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--peridot), var(--emerald))", color: "white" }}>
            {addEntry.isPending ? "Saving..." : "Save Entry ✍️"}
          </button>
        </div>
      )}

      <div className="px-4 flex flex-col gap-3">
        {entries && entries.length > 0 ? entries.map((entry: {
          id: string;
          content: string;
          mood?: string;
          ai_analysis?: string;
          created_at?: string;
        }) => {
          const moodObj = MOODS.find(m => m.label === entry.mood);
          return (
            <div key={entry.id} className="rounded-2xl p-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{moodObj?.emoji ?? "📝"}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "var(--peridot)22", color: "var(--peridot)" }}>
                  {entry.mood ?? "Reflective"}
                </span>
                <div className="flex-1" />
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : ""}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                {entry.content}
              </p>
              {entry.ai_analysis && (
                <div className="mt-3 p-3 rounded-xl"
                  style={{ background: "var(--emerald)11", border: "1px solid var(--emerald)33" }}>
                  <p className="text-xs font-bold mb-1" style={{ color: "var(--emerald)" }}>🤖 Bently's Insight</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{entry.ai_analysis}</p>
                </div>
              )}
            </div>
          );
        }) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📓</div>
            <p className="font-bold mb-2" style={{ fontFamily: "Candara, sans-serif" }}>No entries yet</p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Tap + to write your first reflection
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
