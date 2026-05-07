import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_AVATAR_BUCKET: z.string().min(1).default("avatars"),
  PORT: z.coerce.number().default(3000),
  CLIENT_URL: z.string().url().default("http://localhost:5173")
});

export const env = envSchema.parse(process.env);
