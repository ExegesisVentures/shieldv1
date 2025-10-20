// Edge Function: refresh_rates_cache
// Warm the rates_cache for a configured list of pairs

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (_req) => {
  try {
    const adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("APP_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("APP_SUPABASE_URL");
    if (!adminKey || !supabaseUrl) {
      return new Response(JSON.stringify({ error: "Missing Supabase env (set SUPABASE_URL/APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/APP_SERVICE_ROLE_KEY)" }), { status: 500 });
    }
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.3");
    const supabase = createClient(supabaseUrl, adminKey, { auth: { persistSession: false } });

    // Use curated pairs from DB to warm cache
    const { data: pairs, error: pErr } = await supabase
      .from("coreum_pairs")
      .select("base_denom, quote_denom")
      .eq("is_active", true)
      .limit(200);
    if (pErr) throw pErr;

    const vpsBase = Deno.env.get("COREDEX_VPS_BASE") ?? "https://coredexapi.shieldnest.org";
    const ttl = Number(Deno.env.get("RATES_TTL_SECONDS") ?? 60);

    let warmed = 0;
    for (const p of pairs ?? []) {
      const quoteUrl = `${vpsBase}/api/quote?from=${encodeURIComponent(p.base_denom)}&to=${encodeURIComponent(p.quote_denom)}`;
      const res = await fetch(quoteUrl);
      if (!res.ok) continue;
      const q = await res.json();
      if (typeof q.rate !== "number" || !isFinite(q.rate)) continue;
      const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
      const { error: upErr } = await supabase.from("rates_cache").upsert({
        from_denom: p.base_denom,
        to_denom: p.quote_denom,
        rate: q.rate,
        source: "VPS",
        path: q.path ? JSON.stringify(q.path) : null,
        liquidity: q.liquidity ?? null,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: "from_denom,to_denom" });
      if (!upErr) warmed++;
    }

    return new Response(JSON.stringify({ success: true, warmed }), { headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});


