import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type Tab = "home" | "chat" | "missions" | "sparks" | "vault" | "profile" | "settings" | "deeplyus";

const NAV_ITEMS: { tab: Tab; path: string; label: string; svgPath: string }[] = [
  {
    tab: "home", path: "/app", label: "Home",
    svgPath: "M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9",
  },
  {
    tab: "chat", path: "/app/chat", label: "Chat",
    svgPath: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  },
  {
    tab: "sparks", path: "/app/sparks", label: "Sparks",
    svgPath: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  },
  {
    tab: "deeplyus", path: "/app/deeplyus", label: "DeeplyUs",
    svgPath: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  },
  {
    tab: "profile", path: "/app/profile", label: "Me",
    svgPath: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  },
];

interface Props {
  children: ReactNode;
  tab: Tab;
}

export default function AppShell({ children, tab }: Props) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: !!user });

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && profile !== undefined && !profile?.pairId) {
      navigate("/onboarding/create");
    }
  }, [user, loading, profile, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(170deg, oklch(0.10 0.08 290) 0%, oklch(0.18 0.12 250) 55%, oklch(0.28 0.16 50) 100%)",
        }}>
        <div className="text-center">
          <div className="relative mx-auto mb-4" style={{ width: 56, height: 56 }}>
            <div className="absolute inset-0 rounded-2xl animate-pulse"
              style={{
                background: "linear-gradient(135deg, oklch(0.50 0.16 162), oklch(0.42 0.16 240))",
                boxShadow: "0 0 24px oklch(0.50 0.16 162 / 0.5)",
              }} />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">💎</div>
          </div>
          <p className="text-sm font-semibold" style={{ color: "oklch(0.82 0.20 72)" }}>
            Loading your world…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative"
      style={{
        background: "linear-gradient(170deg, oklch(0.10 0.08 290) 0%, oklch(0.14 0.10 270) 30%, oklch(0.18 0.12 250) 55%, oklch(0.22 0.14 60) 80%, oklch(0.28 0.16 50) 100%)",
        backgroundAttachment: "fixed",
      }}>
      <div className="flex-1 overflow-y-auto pb-20">
        {children}
      </div>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bottom-nav">
        <div className="flex items-center justify-around py-2 px-1">
          {NAV_ITEMS.map((item) => {
            const isActive = tab === item.tab;
            const isDeeplyUs = item.tab === "deeplyus";
            const isProfile = item.tab === "profile";

            return (
              <button
                key={item.tab}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all relative"
                style={{ minWidth: 52 }}>

                {isProfile && profile?.avatar_url ? (
                  <div className="relative" style={{ width: 26, height: 26 }}>
                    <img
                      src={profile.avatar_url}
                      alt="Me"
                      className="rounded-full object-cover"
                      style={{
                        width: 26, height: 26,
                        border: isActive
                          ? "2px solid oklch(0.85 0.28 142)"
                          : "2px solid oklch(0.78 0.16 75 / 0.4)",
                        boxShadow: isActive ? "0 0 8px oklch(0.85 0.28 142 / 0.6)" : "none",
                      }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                ) : (
                  <svg
                    width="22" height="22" viewBox="0 0 24 24"
                    fill={isDeeplyUs && isActive ? "oklch(0.70 0.16 350)" : "none"}
                    stroke={isActive ? "oklch(0.85 0.28 142)" : "oklch(0.60 0.06 75)"}
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{
                      filter: isActive
                        ? "drop-shadow(0 0 6px oklch(0.85 0.28 142 / 0.7))"
                        : "none",
                      transform: isActive ? "scale(1.1)" : "scale(1)",
                      transition: "all 0.2s ease",
                    }}>
                    {item.svgPath.split(" M").map((segment, i) => (
                      <path key={i} d={i === 0 ? segment : "M" + segment} />
                    ))}
                  </svg>
                )}

                <span className="font-semibold transition-all"
                  style={{
                    fontSize: 9,
                    color: isActive ? "oklch(0.85 0.28 142)" : "oklch(0.55 0.04 75)",
                    letterSpacing: "0.04em",
                  }}>
                  {item.label}
                </span>

                {isActive && (
                  <div style={{
                    width: 4, height: 4,
                    borderRadius: "50%",
                    background: "oklch(0.85 0.28 142)",
                    boxShadow: "0 0 8px oklch(0.85 0.28 142 / 0.8)",
                    position: "absolute",
                    bottom: 2,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
