import { router } from '../trpc.js';
import { authRouter } from './auth.js';
import { usersRouter } from './users.js';
import { pairsRouter } from './pairs.js';
import { messagesRouter } from './messages.js';
import { voiceRouter } from './voice.js';
import { bentlyRouter } from './bently.js';
import { xpRouter } from './xp.js';
import { ranksRouter } from './ranks.js';
import { missionsRouter } from './missions.js';
import { exercisesRouter } from './exercises.js';
import { journalRouter } from './journal.js';
import { growthRouter } from './growth.js';
import { deeplyUsRouter } from './deeplyUs.js';
import { desiresRouter } from './desires.js';
import { boundariesRouter } from './boundaries.js';
import { calendarRouter } from './calendar.js';
import { milestonesRouter } from './milestones.js';
import { settingsRouter } from './settings.js';
import { notificationsRouter } from './notifications.js';
import { analyticsRouter } from './analytics.js';
import { mediaRouter } from './media.js';
import { aiRouter } from './ai.js';
import { healthRouter } from './health.js';

export const appRouter = router({
  auth: authRouter,
  users: usersRouter,
  pairs: pairsRouter,
  messages: messagesRouter,
  voice: voiceRouter,
  bently: bentlyRouter,
  xp: xpRouter,
  ranks: ranksRouter,
  missions: missionsRouter,
  exercises: exercisesRouter,
  journal: journalRouter,
  growth: growthRouter,
  deeplyUs: deeplyUsRouter,
  desires: desiresRouter,
  boundaries: boundariesRouter,
  calendar: calendarRouter,
  milestones: milestonesRouter,
  settings: settingsRouter,
  notifications: notificationsRouter,
  analytics: analyticsRouter,
  media: mediaRouter,
  ai: aiRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
