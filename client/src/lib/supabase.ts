import { createClient } from "@supabase/supabase-js";

// Frontend Supabase client — uses the anon key (safe for browser)
// Used exclusively for Realtime subscriptions; all data mutations go through tRPC
const supabaseUrl = "https://dskmguzvjnmzvcjemkqz.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type RealtimeMessage = {
  id: string;
  pair_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_deeplyus: boolean;
  sender_display_name?: string;
};

export type RealtimeIntimateMessage = {
  id: string;
  pair_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  escalation_level: number;
};
