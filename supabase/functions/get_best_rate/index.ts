// Edge Function: get_best_rate
// Returns cached rate if fresh; otherwise fetches from VPS quote API, caches, and returns

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type QuoteResponse = {
  rate: number;
  path?: string[];
  liquidity?: number;
};

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "POST required" }), { status: 405 });
    }
    const { from_denom, to_denom, ttl_seconds } = await req.json();
    if (!from_denom || !to_denom) {
      return new Response(JSON.stringify({ error: "from_denom and to_denom required" }), { status: 400 });
    }

    const adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("APP_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("APP_SUPABASE_URL");
    if (!adminKey || !supabaseUrl) {
      return new Response(JSON.stringify({ error: "Missing Supabase env (set SUPABASE_URL/APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/APP_SERVICE_ROLE_KEY)" }), { status: 500 });
    }
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.3");
    const supabase = createClient(supabaseUrl, adminKey, { auth: { persistSession: false } });

    // 1) Try cache
    const nowIso = new Date().toISOString();
    const { data: cachedRows, error: cacheErr } = await supabase
      .from("rates_cache")
      .select("rate, path, liquidity, expires_at")
      .eq("from_denom", from_denom)
      .eq("to_denom", to_denom)
      .limit(1);
    if (cacheErr) throw cacheErr;
    if (cachedRows && cachedRows.length > 0) {
      const c = cachedRows[0];
      if (new Date(c.expires_at).toISOString() > nowIso) {
        return new Response(JSON.stringify({ rate: c.rate, path: c.path, liquidity: c.liquidity, cached: true }), { headers: { "content-type": "application/json" } });
      }
    }

    // 2) Fetch fresh quote
    const vpsBase = Deno.env.get("COREDEX_VPS_BASE") ?? "https://coredexapi.shieldnest.org";
    const quoteUrl = `${vpsBase}/api/quote?from=${encodeURIComponent(from_denom)}&to=${encodeURIComponent(to_denom)}`;
    const res = await fetch(quoteUrl);
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Quote fetch failed: ${res.status}` }), { status: 502 });
    }
    const q: QuoteResponse = await res.json();
    if (typeof q.rate !== "number" || !isFinite(q.rate)) {
      return new Response(JSON.stringify({ error: "Invalid rate response" }), { status: 502 });
    }

    const ttl = Number(ttl_seconds ?? Deno.env.get("RATES_TTL_SECONDS") ?? 60);
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

    // 3) Upsert cache
    const { error: upErr } = await supabase
      .from("rates_cache")
      .upsert({
        from_denom,
        to_denom,
        rate: q.rate,
        source: "VPS",
        path: q.path ? JSON.stringify(q.path) : null,
        liquidity: q.liquidity ?? null,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: "from_denom,to_denom" });
    if (upErr) throw upErr;

    return new Response(JSON.stringify({ rate: q.rate, path: q.path, liquidity: q.liquidity, cached: false, ttl }), { headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});


