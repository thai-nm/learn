import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "../config.js";

/**
 * One-off admin script to create the single fixed Supabase Auth account
 * (docs/PLAN.md Section 5). Run once per Supabase project (local dev and,
 * separately, prod) via `npm run auth:create-fixed-user -w backend`.
 * Requires SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY plus
 * SUPABASE_FIXED_USER_EMAIL/SUPABASE_FIXED_USER_PASSWORD in the environment.
 */
const email = process.env.SUPABASE_FIXED_USER_EMAIL;
const password = process.env.SUPABASE_FIXED_USER_PASSWORD;

if (!email || !password) {
  throw new Error(
    "Missing SUPABASE_FIXED_USER_EMAIL and/or SUPABASE_FIXED_USER_PASSWORD environment variables.",
  );
}

const { url, serviceRoleKey } = getSupabaseConfig();
const client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

const { data: existing } = await client.auth.admin.listUsers();
if (existing?.users.some((user) => user.email === email)) {
  console.log(`Fixed user ${email} already exists — skipping.`);
  process.exit(0);
}

const { error } = await client.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) throw error;
console.log(`Fixed user ${email} created.`);
