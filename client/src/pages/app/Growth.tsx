import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const CATEGORY_COLORS: Record<string, string> = {
  communication: "var(--sapphire)",
  intimacy: "var(--amethyst)",
  trust: "var(--emerald)",
  conflict: "var(--neon-spark)",
  fun: "var(--midas-gold)",
  growth: "var(--peridot)",
};

export default function Growth() {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [exerciseNotes, setExerciseNotes] = useState("");

  const { data: modules } = trpc.growth.modules.useQuery();
  const { data: exercises } = trpc.growth.exercises.useQuery(
    { category: activeModule ?? undefined },
    { enabled: !!activeModule }
  );
  const complete = trpc.growth.completeExercise.useMutation({
    onSuccess: () => {
      setActiveExercise(null);
      setExerciseNotes("");
      toast.success("Exercise completed! 🌱 XP awarded");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  type GrowthModule = { id: string; title: string; description: string; days: number; xp: number };
  type Exercise = { id: string; title: string; description: string; category: string; xp: number; mode: string };
  const currentModule = (modules as GrowthModule[] | undefined)?.find(m => m.id === activeModule);
  const currentExercise = (exercises as Exercise[] | undefined)?.find(e => e.id === activeExercise);

  if (currentExercise) {
    return (
      <div className="flex flex-col min-h-screen pb-24" style={{ background: "var(--background)" }}>
        <div className="px-4 pt-8 pb-4">
          <button onClick={() => setActiveExercise(null)}
            className="flex items-center gap-2 mb-4 text-sm font-bold"
            style={{ color: "var(--peridot)" }}>
            ← Back to Exercises
          </button>
          <h1 className="text-xl font-bold" style={{ fontFamily: "Candara, sans-serif", color: "var(--peridot)" }}>
            {currentExercise.title}
          </h1>
        </div>
        <div className="mx-4 mb-4 rounded-2xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--peridot)44" }}>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--foreground)" }}>
            {currentExercise.description}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full"
              style={{ background: "var(--midas-gold)22", color: "var(--midas-gold)" }}>
              +{currentExercise.xp ?? 25} XP
            </span>
          </div>
        </div>
        <div className="mx-4 mb-4">
          <p className="text-xs font-bold mb-2" style={{ color: "var(--muted-foreground)" }}>REFLECTION NOTES (OPTIONAL)</p>
          <textarea
            value={exerciseNotes}
            onChange={(e) => setExerciseNotes(e.target.value)}
            placeholder="How did this exercise go? What did you discover?"
            rows={4}
            className="w-full rounded-2xl px-4 py-3 text-sm resize-none"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }}
          />
        </div>
        <div className="px-4">
          <button
            onClick={() => complete.mutate({ exerciseId: currentExercise.id, reflection: exerciseNotes })}
            disabled={complete.isPending}
            className="w-full py-3 rounded-2xl font-bold text-sm disabled:opacity-50 transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--peridot), var(--emerald))", color: "white" }}>
            {complete.isPending ? "Completing..." : "Mark Complete 🌱"}
          </button>
        </div>
      </div>
    );
  }

  if (activeModule && currentModule) {
    return (
      <div className="flex flex-col min-h-screen pb-24" style={{ background: "var(--background)" }}>
        <div className="px-4 pt-8 pb-4">
          <button onClick={() => setActiveModule(null)}
            className="flex items-center gap-2 mb-4 text-sm font-bold"
            style={{ color: "var(--peridot)" }}>
            ← Back to Modules
          </button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌱</span>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: "Candara, sans-serif", color: "var(--peridot)" }}>
                {currentModule.title}
              </h1>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{currentModule.description}</p>
            </div>
          </div>
        </div>
        <div className="px-4 flex flex-col gap-3">
          {exercises && (exercises as Exercise[]).length > 0
            ? (exercises as Exercise[]).map((ex) => (
              <button key={ex.id} onClick={() => setActiveExercise(ex.id)}
                className="rounded-2xl p-4 text-left transition-all hover:opacity-80"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-sm">{ex.title}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--midas-gold)22", color: "var(--midas-gold)" }}>
                    +{ex.xp ?? 25} XP
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{ex.description}</p>
              </button>
            ))
            : (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No exercises available yet</p>
              </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-24" style={{ background: "var(--background)" }}>
      <div className="px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Candara, sans-serif", color: "var(--peridot)" }}>
          🌱 Growth Modules
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Guided exercises to strengthen your relationship
        </p>
      </div>
      <div className="px-4 flex flex-col gap-3">
        {modules && (modules as GrowthModule[]).length > 0
          ? (modules as GrowthModule[]).map((mod) => {
            const color = "var(--peridot)";
            return (
              <button key={mod.id} onClick={() => setActiveModule(mod.id)}
                className="rounded-2xl p-4 text-left transition-all hover:opacity-80"
                style={{ background: "var(--card)", borderLeft: `4px solid ${color}` }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌱</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ fontFamily: "Candara, sans-serif" }}>{mod.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{mod.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${color}22`, color }}>
                      {mod.days}d
                    </span>
                  </div>
                </div>
              </button>
            );
          })
          : (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🌱</div>
              <p className="font-bold mb-2" style={{ fontFamily: "Candara, sans-serif" }}>No modules yet</p>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Growth modules are coming soon!</p>
            </div>
          )}
      </div>
    </div>
  );
}
