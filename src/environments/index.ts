import { z } from "zod";

const envSchema = z.object({
  WM_API_V3: z.string(),
  WM_API_V2: z.string(),
});

export type Env = z.infer<typeof envSchema>;

export let env: Env = {};

if (typeof process === "undefined" && window) {
  env = envSchema.parse(window.env());
} else {
  env = envSchema.safeParse(process.env);
}
