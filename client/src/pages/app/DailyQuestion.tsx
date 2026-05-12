import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function DailyQuestion() {
  const { user } = useAuth();
  const [answer, setAnswer] = useState("");

  const { data: todayData, refetch } = trpc.daily.today.useQuery();
  const submit = trpc.daily.answer.useMutation({
    onSuccess: () => {
      refetch();
      setAnswer("");
      toast.success("Answer submitted! +10 XP 💬");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const questionData = todayData;
  const answers = todayData?.answers ?? [];
  const myAnswer = answers.find((a: { auth_id?: string }) => a.auth_id === user?.openId);
  const partnerAnswer = answers.find((a: { auth_id?: string }) => a.auth_id !== user?.openId);

  return (
    <div className="flex flex-col min-h-screen pb-24" style={{ background: "var(--background)" }}>
      <div className="px-4 pt-8 pb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Candara, sans-serif", color: "var(--neon-spark)" }}>
          💬 Daily Question
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          A new question every day • +10 XP each
        </p>
      </div>

      {questionData && (
        <div className="mx-4 mb-6 rounded-2xl p-6"
          style={{
            background: "linear-gradient(135deg, var(--emerald)22, var(--sapphire)22)",
            border: "1px solid var(--neon-spark)44",
          }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ background: "var(--neon-spark)22", color: "var(--neon-spark)" }}>
              Reflection
            </span>
            <span className="text-xs px-2 py-1 rounded-full"
              style={{ background: "var(--midas-gold)22", color: "var(--midas-gold)" }}>
              +10 XP
            </span>
          </div>
          <p className="text-lg font-bold leading-snug" style={{ fontFamily: "Candara, sans-serif" }}>
            {questionData.question}
          </p>
        </div>
      )}

      {!myAnswer && (
        <div className="mx-4 mb-6">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Share your honest answer..."
            rows={4}
            className="w-full rounded-2xl px-4 py-3 text-sm resize-none mb-3"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              outline: "none",
            }}
          />
          <button
            onClick={() => submit.mutate({ answerText: answer, dateKey: todayData?.dateKey ?? new Date().toISOString().split('T')[0]! })}
            disabled={submit.isPending || !answer.trim()}
            className="w-full py-3 rounded-2xl font-bold text-sm disabled:opacity-50 transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--neon-spark), var(--emerald))", color: "var(--background)" }}>
            {submit.isPending ? "Submitting..." : "Submit Answer +10 XP"}
          </button>
        </div>
      )}

      <div className="px-4 flex flex-col gap-3">
        {myAnswer && (
          <div className="rounded-2xl p-4"
            style={{ background: "var(--card)", borderLeft: "4px solid var(--emerald)" }}>
            <p className="text-xs font-bold mb-2" style={{ color: "var(--emerald)" }}>✓ Your Answer</p>
            <p className="text-sm">{(myAnswer as { answer_text?: string }).answer_text}</p>
          </div>
        )}
        {partnerAnswer && myAnswer && (
          <div className="rounded-2xl p-4"
            style={{ background: "var(--card)", borderLeft: "4px solid var(--sapphire)" }}>
            <p className="text-xs font-bold mb-2" style={{ color: "var(--sapphire)" }}>💙 Partner's Answer</p>
            <p className="text-sm">{(partnerAnswer as { answer_text?: string }).answer_text}</p>
          </div>
        )}
        {partnerAnswer && !myAnswer && (
          <div className="rounded-2xl p-4 text-center"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              💙 Your partner has answered. Answer first to see their response!
            </p>
          </div>
        )}
        {!myAnswer && !partnerAnswer && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Be the first to answer today's question!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
