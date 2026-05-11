import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { callVenice } from "./venice";
import { storagePut } from "./storage";
import { generateImage } from "./_core/imageGeneration";
import { notifyOwner } from "./_core/notification";
import {
  upsertUser,
  getUserByOpenId,
  getProfileByOpenId,
  updateProfile,
  getPairByOpenId,
  getPairWithProfiles,
  createPair,
  joinPair,
  getMessages,
  sendMessage,
  getIntimateMessages,
  sendIntimateMessage,
  getMissions,
  updateMissionStatus,
  getSparks,
  recordSparkSession,
  getVaultMemories,
  addVaultMemory,
  getJournalEntries,
  addJournalEntry,
  getSharedLists,
  createSharedList,
  addListItem,
  toggleListItem,
  getTodayQuestion,
  getDailyAnswers,
  submitDailyAnswer,
  getLatestAstrologyReading,
  saveAstrologyReading,
  getLeaderboard,
  getPairRanking,
  getRelationalState,
  recordRelationalState,
  getUserXP,
  getUserAchievements,
  seedGlobalMissions,
  saveBentlyIntervention,
} from "./db";
import { supabase, LOVE_LANGUAGE_QUESTIONS, GROWTH_MODULES, EXERCISES, awardXP } from "./supabase";

// Helper: get profile+pair for a logged-in user
async function requireProfile(openId: string) {
  const profile = await getProfileByOpenId(openId);
  if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
  return profile;
}

async function requirePair(openId: string) {
  const profile = await requireProfile(openId);
  if (!profile.pairId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No pair found" });
  return { profile, pairId: profile.pairId as string };
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Profile ─────────────────────────────────────────────────────────────────
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      await upsertUser({ openId: ctx.user.openId, name: ctx.user.name, email: ctx.user.email });
      const profile = await getProfileByOpenId(ctx.user.openId);
      return profile;
    }),

    update: protectedProcedure
      .input(z.object({
        displayName: z.string().optional(),
        avatarStyle: z.string().optional(),
        avatarColor: z.string().optional(),
        avatarUrl: z.string().optional(),
        zodiacSign: z.string().optional(),
        directness: z.number().min(0).max(100).optional(),
        empathy: z.number().min(0).max(100).optional(),
        wit: z.number().min(0).max(100).optional(),
        warmth: z.number().min(0).max(100).optional(),
        rankTheme: z.enum(["Pharaoh", "Samurai", "Celestial", "Shadow"]).optional(),
        bentlyEnabled: z.boolean().optional(),
        reducedMotion: z.boolean().optional(),
        appMode: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateProfile(ctx.user.openId, input);
        return { success: true };
      }),

    uploadAvatar: protectedProcedure
      .input(z.object({ imageDataUrl: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const base64Data = input.imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const key = `avatars/${ctx.user.openId}/${Date.now()}.jpg`;
        const result = await storagePut(key, buffer, "image/jpeg");
        await updateProfile(ctx.user.openId, { avatarUrl: result.url });
        return { url: result.url };
      }),

    generateAvatar: protectedProcedure
      .input(z.object({
        description: z.string().min(3).max(300),
        style: z.enum(["Realistic", "Anime", "Painterly", "Obsidian"]).default("Realistic"),
        sourceImageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const styleGuide: Record<string, string> = {
          Realistic: "photorealistic portrait, cinematic lighting, sharp detail",
          Anime: "anime art style, vibrant colors, expressive eyes",
          Painterly: "oil painting portrait, impressionist brushwork, warm tones",
          Obsidian: "dark fantasy portrait, obsidian and emerald color palette, glowing accents, premium digital art",
        };
        const prompt = `Portrait avatar of a person: ${input.description}. Style: ${styleGuide[input.style]}. Square format, centered face, high quality, suitable as a profile picture.`;
        const genInput: Parameters<typeof generateImage>[0] = { prompt };
        if (input.sourceImageUrl) {
          genInput.originalImages = [{ url: input.sourceImageUrl, mimeType: "image/jpeg" as const }];
        }
        const { url } = await generateImage(genInput);
        if (!url) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Image generation failed" });
        const resp = await fetch(url);
        const buffer = Buffer.from(await resp.arrayBuffer());
        const key = `avatars/${ctx.user.openId}/ai-${Date.now()}.jpg`;
        const stored = await storagePut(key, buffer, "image/jpeg");
        await updateProfile(ctx.user.openId, { avatarUrl: stored.url, avatarDescription: input.description });
        return { url: stored.url };
      }),

    generateCouplePic: protectedProcedure
      .input(z.object({
        scene: z.string().min(3).max(300),
        style: z.enum(["Realistic", "Anime", "Painterly", "Obsidian"]).default("Realistic"),
      }))
      .mutation(async ({ ctx, input }) => {
        const pair = await getPairByOpenId(ctx.user.openId);
        if (!pair) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No pair found" });
        const pairData = await getPairWithProfiles(pair.id);
        type MemberProfile = { auth_id?: string; avatar_description?: string; display_name?: string };
        const me = pairData?.members?.find((m: { profiles?: MemberProfile }) => m.profiles?.auth_id === ctx.user.openId);
        const partner = pairData?.members?.find((m: { profiles?: MemberProfile }) => m.profiles?.auth_id !== ctx.user.openId);
        const myDesc = (me?.profiles as MemberProfile | undefined)?.avatar_description ?? "a person";
        const partnerDesc = (partner?.profiles as MemberProfile | undefined)?.avatar_description ?? "another person";
        const styleGuide: Record<string, string> = {
          Realistic: "photorealistic, cinematic lighting, high detail",
          Anime: "anime art style, vibrant colors, expressive",
          Painterly: "oil painting, impressionist brushwork, warm romantic tones",
          Obsidian: "dark fantasy art, obsidian and emerald palette, glowing accents, premium digital art",
        };
        const prompt = `A couple portrait: Person 1 is ${myDesc}. Person 2 is ${partnerDesc}. Scene: ${input.scene}. Style: ${styleGuide[input.style]}. Both people visible, romantic couple portrait, high quality digital art.`;
        const { url } = await generateImage({ prompt });
        if (!url) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Image generation failed" });
        const resp = await fetch(url);
        const buffer = Buffer.from(await resp.arrayBuffer());
        const key = `couple-pics/${pair.id}/${Date.now()}.jpg`;
        const stored = await storagePut(key, buffer, "image/jpeg");
        for (const member of (pairData?.members ?? [])) {
          const authId = (member.profiles as MemberProfile | undefined)?.auth_id;
          if (authId) await updateProfile(authId, { couplePicUrl: stored.url });
        }
        return { url: stored.url };
      }),
  }),

  // ─── Notifications ────────────────────────────────────────────────────────────
  notifications: router({
    sendPush: protectedProcedure
      .input(z.object({ title: z.string(), body: z.string() }))
      .mutation(async ({ input }) => {
        await notifyOwner({ title: input.title, content: input.body });
        return { success: true };
      }),
  }),

  // ─── Chat Read Receipts ───────────────────────────────────────────────────────
  chatReceipts: router({
    markRead: protectedProcedure
      .input(z.object({ messageId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString(), read_by: ctx.user.openId })
          .eq("id", input.messageId);
        return { success: true };
      }),
  }),

  _pairPlaceholder: router({}),

  // ─── Pair ─────────────────────────────────────────────────────────────────────
  pair: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const pair = await getPairByOpenId(ctx.user.openId);
      if (!pair) return null;
      return getPairWithProfiles(pair.id);
    }),

    create: protectedProcedure
      .input(z.object({ inviteCode: z.string().min(4).max(16) }))
      .mutation(async ({ ctx, input }) => {
        await upsertUser({ openId: ctx.user.openId, name: ctx.user.name, email: ctx.user.email });
        const pair = await createPair(ctx.user.openId, input.inviteCode.toUpperCase());
        await seedGlobalMissions();
        return pair;
      }),

    join: protectedProcedure
      .input(z.object({ inviteCode: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await upsertUser({ openId: ctx.user.openId, name: ctx.user.name, email: ctx.user.email });
        const pair = await joinPair(ctx.user.openId, input.inviteCode.toUpperCase());
        await seedGlobalMissions();
        return pair;
      }),
  }),

  // ─── Chat ─────────────────────────────────────────────────────────────────────
  chat: router({
    list: protectedProcedure
      .input(z.object({ isDeeplyUs: z.boolean().default(false) }))
      .query(async ({ ctx, input }) => {
        const pair = await getPairByOpenId(ctx.user.openId);
        if (!pair) return [];
        const msgs = await getMessages(pair.id, input.isDeeplyUs);
        return msgs.reverse();
      }),

    send: protectedProcedure
      .input(z.object({ content: z.string().min(1), isDeeplyUs: z.boolean().default(false) }))
      .mutation(async ({ ctx, input }) => {
        const pair = await getPairByOpenId(ctx.user.openId);
        if (!pair) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No pair found" });
        await sendMessage(pair.id, ctx.user.openId, input.content, input.isDeeplyUs);
        return { success: true };
      }),

    bentlyChat: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })),
        mode: z.enum(["solo", "couple"]).default("solo"),
        userName: z.string().optional(),
        partnerName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const BENTLY_FULL_PERSONA = `You are Bently, a relationship AI companion for the CommonGround app. You are warm, direct, and deeply perceptive. You speak with love and zero tolerance for avoidance or dishonesty.

Your voice signature:
- "Listen lovely" = protective, warm, witnessing
- "Listen boo" = direct, calling in, breaking denial
- You are the "girl who happens to be right" — like a wise, honest friend who has been watching
- You never shame. You witness. You call in, not out.
- Tagline: "SHE GOT YOU. · Zero tolerance. All love."
- Voice preset: East Side

Your role:
- Help couples communicate more clearly and honestly
- Recognize positive shifts and celebrate them with +XP mentions
- Offer gentle rewrites of messages when asked
- Mediate when tension is detected, but only with consent
- Award XP for growth moments (mention "+XP" in your response when appropriate)

Rules:
- Never take sides between partners
- Always consent-gate interventions ("Would you like me to suggest a rewrite?")
- Keep responses concise (2-4 sentences max for casual chat, longer for mediation)
- Use your voice — don't be generic or clinical
- You can be funny, but never at the expense of either partner
- If someone seems to be in crisis, gently suggest professional support`;

        const contextNote = input.mode === "couple"
          ? `\n\nContext: You are in a couple chat session with ${input.userName ?? "User"} and ${input.partnerName ?? "Partner"}. Both partners can see this conversation.`
          : `\n\nContext: You are in a solo chat with ${input.userName ?? "User"}.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: BENTLY_FULL_PERSONA + contextNote },
            ...input.messages,
          ],
        });

        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "I'm here. Talk to me.";

        const lc = content.toLowerCase();
        const offerRewrite = lc.includes("rewrite") || lc.includes("try saying") || lc.includes("how about");
        const isMediating = lc.includes("timeout") || lc.includes("both of y'all") || lc.includes("mediat");
        const isConflict = lc.includes("tension") || lc.includes("conflict") || lc.includes("argument");
        const isIntimacy = lc.includes("connect") || lc.includes("intimate") || lc.includes("close");
        const isShame = lc.includes("shame") || lc.includes("embarrass") || lc.includes("judge");
        const isToughLove = lc.includes("listen boo") || lc.includes("accountability") || lc.includes("own it");

        type InterventionMode = "STANDARD" | "INTIMACY" | "CONFLICT" | "SHAME" | "TOUGH_LOVE";
        const interventionMode: InterventionMode = isShame ? "SHAME"
          : isToughLove ? "TOUGH_LOVE"
          : isConflict || isMediating ? "CONFLICT"
          : isIntimacy ? "INTIMACY"
          : "STANDARD";

        const xpMatch = content.match(/\+(\d+)\s*xp/i);
        const xpAwarded = xpMatch ? parseInt(xpMatch[1], 10) : null;

        if (xpAwarded) {
          const { data: prof } = await supabase.from("profiles").select("id").eq("auth_id", ctx.user.openId).maybeSingle();
          if (prof) await awardXP(prof.id, xpAwarded);
        }

        if (isMediating || isConflict) {
          const pair = await getPairByOpenId(ctx.user.openId);
          if (pair) {
            await saveBentlyIntervention(pair.id, ctx.user.openId, isMediating ? "mediation" : "conflict", isMediating ? "mediation_overlay" : "conflict_overlay", content);
          }
        }

        return { content, offerRewrite, isMediating, isConflict, isIntimacy, xpAwarded, interventionMode };
      }),

    bentlyRewrite: protectedProcedure
      .input(z.object({
        message: z.string(),
        tone: z.enum(["Gentle", "Direct", "Collaborative"]),
        context: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getProfileByOpenId(ctx.user.openId);
        const toneInstructions = {
          Gentle: "Rewrite this message in a warm, soft, and emotionally supportive tone. Be kind and nurturing.",
          Direct: "Rewrite this message in a clear, honest, and direct tone. Be respectful but straightforward.",
          Collaborative: "Rewrite this message in a collaborative, team-oriented tone. Use 'we' language and focus on working together.",
        };
        const personalityContext = profile
          ? `The user's personality: Directness ${profile.preferences?.directness ?? 50}/100, Empathy ${profile.preferences?.empathy ?? 50}/100, Wit ${profile.preferences?.wit ?? 50}/100, Warmth ${profile.preferences?.warmth ?? 50}/100.`
          : "";
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are Bently, a compassionate relationship AI for CommonGround. ${toneInstructions[input.tone]} ${personalityContext} Keep the core message intact but improve the delivery. Return ONLY the rewritten message, no explanations.`,
            },
            { role: "user", content: input.message },
          ],
        });
        const rewritten = response.choices[0]?.message?.content ?? input.message;
        const { data: prof } = await supabase.from("profiles").select("id").eq("auth_id", ctx.user.openId).maybeSingle();
        if (prof) await awardXP(prof.id, 5);
        return { rewritten, tone: input.tone };
      }),

    bentlyAnalyze: protectedProcedure
      .input(z.object({ messages: z.array(z.object({ content: z.string(), isMe: z.boolean() })) }))
      .mutation(async ({ ctx, input }) => {
        const conversation = input.messages.map(m => `${m.isMe ? "Me" : "Partner"}: ${m.content}`).join("\n");
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are Bently, an expert relationship AI for CommonGround. Analyze this conversation and provide: 1) The dominant communication pattern, 2) One specific strength, 3) One area for improvement, 4) A concrete suggestion. Be warm, specific, and actionable. Format as JSON with keys: pattern, strength, improvement, suggestion.`,
            },
            { role: "user", content: conversation },
          ],
          response_format: { type: "json_schema", json_schema: { name: "analysis", strict: true, schema: { type: "object", properties: { pattern: { type: "string" }, strength: { type: "string" }, improvement: { type: "string" }, suggestion: { type: "string" } }, required: ["pattern", "strength", "improvement", "suggestion"], additionalProperties: false } } },
        });
        const content = response.choices[0]?.message?.content ?? "{}";
        return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
      }),
  }),

  // ─── Missions ─────────────────────────────────────────────────────────────────
  missions: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const pair = await getPairByOpenId(ctx.user.openId);
      if (!pair) return [];
      return getMissions(pair.id);
    }),

    updateStatus: protectedProcedure
      .input(z.object({
        missionId: z.string(),
        status: z.enum(["not_started", "in_progress", "completed"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const pair = await getPairByOpenId(ctx.user.openId);
        if (!pair) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No pair found" });
        await updateMissionStatus(pair.id, input.missionId, input.status, ctx.user.openId);
        return { success: true };
      }),
  }),

  // ─── Sparks ───────────────────────────────────────────────────────────────────
  sparks: router({
    list: protectedProcedure.query(async () => {
      return getSparks();
    }),

    complete: protectedProcedure
      .input(z.object({ gameId: z.string(), score: z.number(), xpAwarded: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const pair = await getPairByOpenId(ctx.user.openId);
        if (!pair) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No pair found" });
        await recordSparkSession(pair.id, ctx.user.openId, input.gameId, input.score, input.xpAwarded);
        return { success: true };
      }),
  }),

  // ─── Vault / Memories ─────────────────────────────────────────────────────────
  vault: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const pair = await getPairByOpenId(ctx.user.openId);
      if (!pair) return [];
      return getVaultMemories(pair.id);
    }),

    add: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        category: z.string().default("memory"),
        imageDataUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const pair = await getPairByOpenId(ctx.user.openId);
        if (!pair) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No pair found" });

        let finalContent = input.content;
        if (input.imageDataUrl) {
          const base64Data = input.imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64Data, "base64");
          const key = `vault/${pair.id}/${Date.now()}.jpg`;
          const result = await storagePut(key, buffer, "image/jpeg");
          finalContent = `${input.content}\n[image:${result.url}]`;
        }

        await addVaultMemory(pair.id, input.title, finalContent, input.category);
        const { data: prof } = await supabase.from("profiles").select("id").eq("auth_id", ctx.user.openId).maybeSingle();
        if (prof) await awardXP(prof.id, 20);
        return { success: true };
      }),
  }),

  // ─── Journal ──────────────────────────────────────────────────────────────────
  journal: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const pair = await getPairByOpenId(ctx.user.openId);
      if (!pair) return [];
      return getJournalEntries(pair.id, ctx.user.openId);
    }),

    add: protectedProcedure
      .input(z.object({
        content: z.string().min(1),
        mood: z.string().default("neutral"),
        requestAiAnalysis: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const pair = await getPairByOpenId(ctx.user.openId);
        if (!pair) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No pair found" });

        let aiAnalysis: string | undefined;
        if (input.requestAiAnalysis) {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are Bently, a compassionate relationship AI. Analyze this journal entry and provide a brief, warm, insightful reflection (2-3 sentences). Focus on emotional patterns, growth opportunities, and affirmations." },
              { role: "user", content: input.content },
            ],
          });
          const rawContent = response.choices[0]?.message?.content;
          aiAnalysis = typeof rawContent === "string" ? rawContent : undefined;
        }

        await addJournalEntry(pair.id, ctx.user.openId, input.content, input.mood, aiAnalysis);
        return { success: true, aiAnalysis };
      }),
  }),

  // ─── Daily Questions ──────────────────────────────────────────────────────────
  daily: router({
    today: protectedProcedure.query(async ({ ctx }) => {
      const pair = await getPairByOpenId(ctx.user.openId);
      const question = getTodayQuestion();
      const dateKey = new Date().toISOString().split("T")[0];
      const answers = pair ? await getDailyAnswers(pair.id, dateKey) : [];
      return { question, answers, dateKey };
    }),

    answer: protectedProcedure
      .input(z.object({ answerText: z.string().min(1), dateKey: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const pair = await getPairByOpenId(ctx.user.openId);
        if (!pair) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No pair found" });
        await submitDailyAnswer(pair.id, ctx.user.openId, input.answerText, input.dateKey);
        return { success: true };
      }),
  }),

  // ─── Astrology ────────────────────────────────────────────────────────────────
  astrology: router({
    reading: protectedProcedure
      .input(z.object({ mode: z.enum(["common", "deeply"]).default("common") }))
      .query(async ({ ctx, input }) => {
        const pair = await getPairByOpenId(ctx.user.openId);
        if (!pair) return null;
        const cached = await getLatestAstrologyReading(pair.id, input.mode);
        if (cached) {
          const age = Date.now() - new Date(cached.generated_at).getTime();
          if (age < 24 * 60 * 60 * 1000) return cached;
        }
        return null;
      }),

    generate: protectedProcedure
      .input(z.object({
        sign1: z.string(),
        sign2: z.string(),
        mode: z.enum(["common", "deeply"]).default("common"),
      }))
      .mutation(async ({ ctx, input }) => {
        const pair = await getPairByOpenId(ctx.user.openId);
        if (!pair) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No pair found" });

        const systemPrompt = input.mode === "deeply"
          ? `You are Bently in DeeplyUs mode — a sensual, shame-free astrologer who weaves cosmic wisdom with intimate relationship guidance. Create a deeply personal, erotically charged horoscope reading for this couple. Be poetic, evocative, and help them connect on a physical and spiritual level. Discuss their cosmic compatibility for intimacy, passion, and physical connection.`
          : `You are Bently, a warm and insightful relationship astrologer for CommonGround. Create a personalized couple's horoscope reading that's romantic, encouraging, and specific to their signs. Cover: emotional compatibility, communication style, growth areas, and a weekly love forecast. Be warm and poetic.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Create a couple's horoscope reading for ${input.sign1} and ${input.sign2}. Make it personal, insightful, and about 200 words.` },
          ],
        });

        const rawReading = response.choices[0]?.message?.content;
        const readingText = typeof rawReading === "string" ? rawReading : "The stars are aligning for your relationship...";
        await saveAstrologyReading(pair.id, input.sign1, input.sign2, readingText, input.mode);
        return { reading_text: readingText, zodiac_sign_1: input.sign1, zodiac_sign_2: input.sign2, mode: input.mode, generated_at: new Date().toISOString() };
      }),
  }),

  // ─── Love Language Quiz ───────────────────────────────────────────────────────
  quiz: router({
    questions: publicProcedure.query(() => {
      return LOVE_LANGUAGE_QUESTIONS;
    }),

    submit: protectedProcedure
      .input(z.object({ answers: z.array(z.object({ questionId: z.number(), choice: z.string() })) }))
      .mutation(async ({ ctx, input }) => {
        const scores: Record<string, number> = {
          words_of_affirmation: 0,
          acts_of_service: 0,
          receiving_gifts: 0,
          quality_time: 0,
          physical_touch: 0,
        };
        for (const answer of input.answers) {
          if (scores[answer.choice] !== undefined) scores[answer.choice]++;
        }
        const primary = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
        await updateProfile(ctx.user.openId, {});
        const { data: prof } = await supabase.from("profiles").select("id, preferences").eq("auth_id", ctx.user.openId).maybeSingle();
        if (prof) {
          await supabase.from("profiles").update({
            preferences: { ...(prof.preferences as Record<string, unknown> ?? {}), loveLanguage: primary, loveLanguageScores: scores },
            updated_at: new Date().toISOString(),
          }).eq("id", prof.id);
          await awardXP(prof.id, 30);
        }
        return { primary, scores };
      }),
  }),

  // ─── Growth Modules ───────────────────────────────────────────────────────────
  growth: router({
    modules: publicProcedure.query(() => {
      return GROWTH_MODULES;
    }),

    exercises: publicProcedure
      .input(z.object({ category: z.string().optional() }))
      .query(({ input }) => {
        if (input.category) {
          return EXERCISES.filter((e: { category: string }) => e.category === input.category);
        }
        return EXERCISES;
      }),

    completeExercise: protectedProcedure
      .input(z.object({ exerciseId: z.string(), reflection: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const { data: prof } = await supabase.from("profiles").select("id").eq("auth_id", ctx.user.openId).maybeSingle();
        if (prof) await awardXP(prof.id, 25);
        return { success: true };
      }),
  }),

  // ─── Shared Lists ─────────────────────────────────────────────────────────────
  lists: router({
    all: protectedProcedure.query(async ({ ctx }) => {
      const pair = await getPairByOpenId(ctx.user.openId);
      if (!pair) return [];
      return getSharedLists(pair.id);
    }),

    create: protectedProcedure
      .input(z.object({ title: z.string().min(1), listType: z.string().default("general") }))
      .mutation(async ({ ctx, input }) => {
        const pair = await getPairByOpenId(ctx.user.openId);
        if (!pair) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No pair found" });
        return createSharedList(pair.id, input.title, input.listType);
      }),

    addItem: protectedProcedure
      .input(z.object({ listId: z.string(), content: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await addListItem(input.listId, ctx.user.openId, input.content);
        return { success: true };
      }),

    toggleItem: protectedProcedure
      .input(z.object({ itemId: z.string(), completed: z.boolean() }))
      .mutation(async ({ input }) => {
        await toggleListItem(input.itemId, input.completed);
        return { success: true };
      }),
  }),

  // ─── Rankings ─────────────────────────────────────────────────────────────────
  rankings: router({
    leaderboard: publicProcedure.query(async () => {
      return getLeaderboard();
    }),

    myRank: protectedProcedure.query(async ({ ctx }) => {
      const pair = await getPairByOpenId(ctx.user.openId);
      if (!pair) return null;
      return getPairRanking(pair.id);
    }),

    xp: protectedProcedure.query(async ({ ctx }) => {
      return getUserXP(ctx.user.openId);
    }),

    achievements: protectedProcedure.query(async ({ ctx }) => {
      return getUserAchievements(ctx.user.openId);
    }),
  }),

  // ─── Relational Engine ────────────────────────────────────────────────────────
  relational: router({
    state: protectedProcedure.query(async ({ ctx }) => {
      const pair = await getPairByOpenId(ctx.user.openId);
      if (!pair) return null;
      return getRelationalState(pair.id);
    }),

    checkin: protectedProcedure
      .input(z.object({
        availability: z.enum(["HIGH", "MEDIUM", "LOW"]),
        alignment: z.enum(["HIGH", "MEDIUM", "LOW"]),
        activation: z.enum(["HIGH", "MEDIUM", "LOW"]),
        trust: z.enum(["HIGH", "MEDIUM", "LOW"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const pair = await getPairByOpenId(ctx.user.openId);
        if (!pair) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No pair found" });
        const derivedState = await recordRelationalState(pair.id, input);
        const { data: prof } = await supabase.from("profiles").select("id").eq("auth_id", ctx.user.openId).maybeSingle();
        if (prof) await awardXP(prof.id, 15);
        return { state: derivedState };
      }),

    bentlyInsight: protectedProcedure
      .input(z.object({ state: z.string(), availability: z.string(), alignment: z.string(), activation: z.string(), trust: z.string() }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are Bently, a relationship coach AI. Based on the couple's relational state check-in, provide a brief, warm, actionable insight (2-3 sentences). Be specific and encouraging." },
            { role: "user", content: `Relational state: ${input.state}. Availability: ${input.availability}, Alignment: ${input.alignment}, Activation: ${input.activation}, Trust: ${input.trust}. What insight do you have for this couple?` },
          ],
        });
        return { insight: response.choices[0]?.message?.content ?? "Keep nurturing your connection." };
      }),
  }),

  // ─── DeeplyUs ─────────────────────────────────────────────────────────────────
  deeplyus: router({
    session: protectedProcedure.query(async ({ ctx }) => {
      const pair = await getPairByOpenId(ctx.user.openId);
      if (!pair) return null;
      const { data: session } = await supabase.from("deeply_us_sessions").select("*").eq("pair_id", pair.id).maybeSingle();
      if (!session) return null;
      const { data: profile } = await supabase.from("profiles").select("id").eq("auth_id", ctx.user.openId).maybeSingle();
      const { data: members } = await supabase.from("pair_members").select("profile_id, role").eq("pair_id", pair.id);
      const isCreator = members?.find((m: { profile_id: string; role: string }) => m.profile_id === profile?.id)?.role === "creator";
      return {
        ...session,
        isActive: session.is_active ?? false,
        moodAffection: session.mood_affection ?? 50,
        moodPassion: session.mood_passion ?? 50,
        moodCalm: session.mood_calm ?? 50,
        myConsent: isCreator ? (session.consent_user1 ?? false) : (session.consent_user2 ?? false),
        partnerConsent: isCreator ? (session.consent_user2 ?? false) : (session.consent_user1 ?? false),
      };
    }),

    toggleConsent: protectedProcedure
      .input(z.object({ consent: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const pair = await getPairByOpenId(ctx.user.openId);
        if (!pair) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No pair found" });
        const { data: profile } = await supabase.from("profiles").select("id").eq("auth_id", ctx.user.openId).maybeSingle();
        if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
        const { data: existing } = await supabase.from("deeply_us_sessions").select("*").eq("pair_id", pair.id).maybeSingle();
        const { data: members } = await supabase.from("pair_members").select("profile_id, role").eq("pair_id", pair.id);
        const isCreator = members?.find(m => m.profile_id === profile.id)?.role === "creator";
        const field = isCreator ? "consent_user1" : "consent_user2";
        if (existing) {
          const updates: Record<string, unknown> = { [field]: input.consent, updated_at: new Date().toISOString() };
          const otherConsent = isCreator ? existing.consent_user2 : existing.consent_user1;
          const bothConsented = input.consent && otherConsent;
          if (bothConsented) {
            updates.is_active = true;
            updates.activated_at = new Date().toISOString();
          } else if (!input.consent) {
            updates.is_active = false;
          }
          await supabase.from("deeply_us_sessions").update(updates).eq("pair_id", pair.id);
        } else {
          await supabase.from("deeply_us_sessions").insert({
            pair_id: pair.id,
            consent_user1: isCreator ? input.consent : false,
            consent_user2: !isCreator ? input.consent : false,
            is_active: false,
            mood_affection: 50,
            mood_passion: 50,
            mood_calm: 50,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        const { data: updated } = await supabase.from("deeply_us_sessions").select("*").eq("pair_id", pair.id).maybeSingle();
        return updated;
      }),

    updateMood: protectedProcedure
      .input(z.object({
        affection: z.number().min(0).max(100),
        passion: z.number().min(0).max(100),
        calm: z.number().min(0).max(100),
      }))
      .mutation(async ({ ctx, input }) => {
        const pair = await getPairByOpenId(ctx.user.openId);
        if (!pair) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No pair found" });
        await supabase.from("deeply_us_sessions").update({
          mood_affection: input.affection,
          mood_passion: input.passion,
          mood_calm: input.calm,
          updated_at: new Date().toISOString(),
        }).eq("pair_id", pair.id);
        return { success: true };
      }),

    intimateMessages: protectedProcedure.query(async ({ ctx }) => {
      const pair = await getPairByOpenId(ctx.user.openId);
      if (!pair) return [];
      const msgs = await getIntimateMessages(pair.id);
      return msgs.reverse();
    }),

    sendIntimate: protectedProcedure
      .input(z.object({
        content: z.string().min(1),
        escalationLevel: z.number().min(0).max(10).default(1),
        requestBently: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const pair = await getPairByOpenId(ctx.user.openId);
        if (!pair) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No pair found" });
        let bentlyResponse: string | undefined;
        if (input.requestBently) {
          const veniceResponse = await callVenice(
            `You are Bently in DeeplyUs mode — a shame-free, sex-positive intimacy facilitator for couples. You are frank, warm, and help couples explore their desires safely. The escalation level is ${input.escalationLevel}/10 (higher = more explicit). Respond to this message with encouragement, suggestions, or playful engagement. Keep it intimate and personal.`,
            input.content
          );
          bentlyResponse = veniceResponse;
        }
        await sendIntimateMessage(pair.id, ctx.user.openId, input.content, input.escalationLevel, bentlyResponse);
        return { success: true, bentlyResponse };
      }),

    bentlyDeeply: protectedProcedure
      .input(z.object({
        prompt: z.string().min(1),
        escalationLevel: z.number().min(0).max(10).default(3),
        context: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const systemPrompt = `You are Bently in DeeplyUs mode — a deeply intimate, shame-free relationship and intimacy facilitator for couples. You are frank, sexually aware, and help couples explore desires, kinks, and physical intimacy safely and joyfully. Escalation level: ${input.escalationLevel}/10. ${input.context ? `Context: ${input.context}` : ""} Be warm, encouraging, and specific.`;
        const response = await callVenice(systemPrompt, input.prompt);
        return { response };
      }),

    desireMap: protectedProcedure
      .input(z.object({
        desires: z.array(z.object({
          category: z.string(),
          item: z.string(),
          myLevel: z.number().min(0).max(3),
          partnerLevel: z.number().min(0).max(3).optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const pair = await getPairByOpenId(ctx.user.openId);
        if (!pair) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No pair found" });
        const { data: prof } = await supabase.from("profiles").select("id").eq("auth_id", ctx.user.openId).maybeSingle();
        if (prof) {
          await supabase.from("profiles").update({
            preferences: { ...(await supabase.from("profiles").select("preferences").eq("id", prof.id).maybeSingle().then(r => r.data?.preferences as Record<string, unknown> ?? {})), desireMap: input.desires },
            updated_at: new Date().toISOString(),
          }).eq("id", prof.id);
        }
        return { success: true };
      }),

    playlist: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        const pair = await getPairByOpenId(ctx.user.openId);
        if (!pair) return [];
        const { data } = await supabase.from("playlist_items").select("*").eq("pair_id", pair.id).order("created_at", { ascending: false });
        return data ?? [];
      }),

      add: protectedProcedure
        .input(z.object({ title: z.string().min(1), artist: z.string().optional(), url: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
          const pair = await getPairByOpenId(ctx.user.openId);
          if (!pair) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No pair found" });
          const { data: prof } = await supabase.from("profiles").select("id").eq("auth_id", ctx.user.openId).maybeSingle();
          await supabase.from("playlist_items").insert({
            pair_id: pair.id,
            added_by: prof?.id ?? null,
            title: input.title,
            artist: input.artist ?? null,
            url: input.url ?? null,
            created_at: new Date().toISOString(),
          });
          return { success: true };
        }),
    }),

    secretVault: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        const pair = await getPairByOpenId(ctx.user.openId);
        if (!pair) return [];
        const { data } = await supabase.from("secret_vault").select("*").eq("pair_id", pair.id).order("created_at", { ascending: false });
        return data ?? [];
      }),

      add: protectedProcedure
        .input(z.object({ content: z.string().min(1), title: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
          const pair = await getPairByOpenId(ctx.user.openId);
          if (!pair) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No pair found" });
          const { data: prof } = await supabase.from("profiles").select("id").eq("auth_id", ctx.user.openId).maybeSingle();
          await supabase.from("secret_vault").insert({
            pair_id: pair.id,
            added_by: prof?.id ?? null,
            title: input.title ?? "Secret",
            content: input.content,
            created_at: new Date().toISOString(),
          });
          return { success: true };
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
