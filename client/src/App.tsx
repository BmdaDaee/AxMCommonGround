import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import OnboardingCreatePair from "./pages/onboarding/CreatePair";
import OnboardingJoinPair from "./pages/onboarding/JoinPair";
import OnboardingAvatar from "./pages/onboarding/Avatar";
import OnboardingPersonality from "./pages/onboarding/Personality";
import AppShell from "./pages/app/AppShell";
import Home from "./pages/app/Home";
import Chat from "./pages/app/Chat";
import Missions from "./pages/app/Missions";
import Sparks from "./pages/app/Sparks";
import Vault from "./pages/app/Vault";
import Profile from "./pages/app/Profile";
import Settings from "./pages/app/Settings";
import DeeplyUs from "./pages/app/DeeplyUs";
import Astrology from "./pages/app/Astrology";
import Journal from "./pages/app/Journal";
import DailyQuestion from "./pages/app/DailyQuestion";
import Rankings from "./pages/app/Rankings";
import Lists from "./pages/app/Lists";
import RelationalEngine from "./pages/app/RelationalEngine";
import Quiz from "./pages/app/Quiz";
import Growth from "./pages/app/Growth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/onboarding/create" component={OnboardingCreatePair} />
      <Route path="/onboarding/join" component={OnboardingJoinPair} />
      <Route path="/onboarding/avatar" component={OnboardingAvatar} />
      <Route path="/onboarding/personality" component={OnboardingPersonality} />
      {/* Core tabs */}
      <Route path="/app" component={() => <AppShell tab="home"><Home /></AppShell>} />
      <Route path="/app/chat" component={() => <AppShell tab="chat"><Chat /></AppShell>} />
      <Route path="/app/missions" component={() => <AppShell tab="missions"><Missions /></AppShell>} />
      <Route path="/app/sparks" component={() => <AppShell tab="sparks"><Sparks /></AppShell>} />
      <Route path="/app/vault" component={() => <AppShell tab="vault"><Vault /></AppShell>} />
      <Route path="/app/profile" component={() => <AppShell tab="profile"><Profile /></AppShell>} />
      <Route path="/app/settings" component={() => <AppShell tab="settings"><Settings /></AppShell>} />
      <Route path="/app/deeplyus" component={() => <AppShell tab="deeplyus"><DeeplyUs /></AppShell>} />
      {/* Feature screens */}
      <Route path="/app/astrology" component={() => <AppShell tab="home"><Astrology /></AppShell>} />
      <Route path="/app/journal" component={() => <AppShell tab="home"><Journal /></AppShell>} />
      <Route path="/app/daily" component={() => <AppShell tab="home"><DailyQuestion /></AppShell>} />
      <Route path="/app/rankings" component={() => <AppShell tab="profile"><Rankings /></AppShell>} />
      <Route path="/app/lists" component={() => <AppShell tab="home"><Lists /></AppShell>} />
      <Route path="/app/relational" component={() => <AppShell tab="home"><RelationalEngine /></AppShell>} />
      <Route path="/app/quiz" component={() => <AppShell tab="profile"><Quiz /></AppShell>} />
      <Route path="/app/growth" component={() => <AppShell tab="missions"><Growth /></AppShell>} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
