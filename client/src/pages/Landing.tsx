import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

export default function Landing() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: !!user });

  useEffect(() => {
    if (loading) return;
    if (!user) return; // stay on landing
    if (profile === undefined) return; // still loading
    if (!profile?.pairId) {
      navigate("/onboarding/create");
    } else {
      navigate("/app");
    }
  }, [user, loading, profile, navigate]);

  const loginUrl = getLoginUrl();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: "var(--background)" }}>
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
        style={{ background: "var(--emerald)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-10 blur-3xl"
        style={{ background: "var(--sapphire)" }} />

      {/* Logo */}
      <div className="flex flex-col items-center mb-12 z-10">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "linear-gradient(135deg, var(--emerald), var(--sapphire))" }}>
          <span className="text-4xl">💎</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: "Candara, sans-serif", color: "var(--foreground)" }}>
          CommonGround
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>
          Where love levels up
        </p>
      </div>

      {/* Tagline */}
      <div className="text-center mb-12 z-10 max-w-xs">
        <p className="text-lg leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.8 }}>
          Build deeper connection through daily rituals, shared missions, and playful sparks.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-4 w-full max-w-xs z-10">
        <a href={loginUrl}
          className="w-full py-4 rounded-full text-center font-bold text-white text-lg transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, var(--emerald), var(--sapphire))", fontFamily: "Candara, sans-serif" }}>
          Get Started
        </a>
        <a href={loginUrl}
          className="w-full py-4 rounded-full text-center font-semibold text-lg transition-all hover:opacity-80 active:scale-95"
          style={{ border: "1px solid var(--border)", color: "var(--foreground)", background: "transparent" }}>
          Sign In
        </a>
      </div>

      {/* Rank badges */}
      <div className="flex gap-2 mt-12 z-10">
        {["SPARK", "FLAME", "CALIBRATOR", "INFERNO", "SOVEREIGN"].map((rank, i) => (
          <div key={rank} className="px-2 py-1 rounded-full text-xs font-bold"
            style={{
              background: "var(--muted)",
              color: i === 0 ? "var(--neon-spark)" : i === 4 ? "var(--midas-gold)" : "var(--muted-foreground)",
              fontSize: "9px",
              opacity: 0.7,
            }}>
            {rank}
          </div>
        ))}
      </div>
    </div>
  );
}
