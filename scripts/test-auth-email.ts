import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!url || !anon) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    process.exit(1);
  }

  const supabase = createClient(url, anon);

  const testEmail = `test+${Date.now()}@example.com`;
  const password = "P@ssw0rd123!";

  console.log("Attempting signUp for:", testEmail);
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password,
    options: { emailRedirectTo: `${site}/sign-in` },
  });

  console.log("Error:", error || null);
  console.log("User:", data?.user || null);
  console.log("Session:", data?.session ? "present" : "null");

  if (!error && data?.user && !data.session) {
    console.log("Signup succeeded and requires email confirmation. Check email provider logs.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


