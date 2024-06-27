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
  env = envSchema.parse(process.env);
}


if (!env.WM_API_V2) {
  env.WM_API_V2 = "https://api2.whatsmenu.com.br";
}

if (!env.WM_API_V3) {
  env.WM_API_V3 = "https://api3.whatsmenu.com.br/api/v3/desktop";
}
console.log(!env.WM_API_V3, env.WM_API_V3);
