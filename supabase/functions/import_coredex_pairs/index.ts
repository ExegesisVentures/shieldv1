// Edge Function: import_coredex_pairs
// Fetch curated pairs from VPS and upsert into coreum_tokens and coreum_pairs

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

interface PairItem {
  pair_id: string;
  source: string;
  symbol: string;
  base_asset: string;
  quote_asset: string;
  base_denom: string;
  quote_denom: string;
  base_decimals: number;
  quote_decimals: number;
  pool_contract: string | null;
  liquidity_token: string | null;
}

interface TokenItem {
  denom: string;
  symbol: string;
  name: string;
  type: "native" | "cw20" | "ibc" | "xrpl";
  contractAddress: string | null;
  decimals: number;
  is_active: boolean;
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const network = url.searchParams.get("network") ?? "mainnet";
    const vpsBase = Deno.env.get("COREDEX_VPS_BASE") ?? "https://coredexapi.shieldnest.org";

    const curatedUrl = `${vpsBase}/api/tradepairs/curated?network=${encodeURIComponent(network)}`;
    const res = await fetch(curatedUrl, { headers: { "Network": network.toUpperCase() } });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Curated fetch failed: ${res.status}` }), { status: 502 });
    }
    const data = await res.json();

    const pairs: PairItem[] = data.pairs ?? [];
    const tokens: TokenItem[] = data.tokens ?? [];

    // Support both original and APP_ prefixed secret names
    const adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("APP_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("APP_SUPABASE_URL");
    if (!adminKey || !supabaseUrl) {
      return new Response(JSON.stringify({ error: "Missing Supabase env (set SUPABASE_URL/APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/APP_SERVICE_ROLE_KEY)" }), { status: 500 });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.3");
    const supabase = createClient(supabaseUrl, adminKey, { auth: { persistSession: false } });

    // Upsert tokens first
    if (tokens.length > 0) {
      const { error: tErr } = await supabase.from("coreum_tokens").upsert(
        tokens.map(t => ({
          denom: t.denom,
          symbol: t.symbol,
          name: t.name,
          type: t.type,
          contract_address: t.contractAddress,
          decimals: t.decimals,
          is_active: t.is_active ?? true,
        })),
        { onConflict: "denom" }
      );
      if (tErr) throw tErr;
    }

    // Upsert pairs
    if (pairs.length > 0) {
      const { error: pErr } = await supabase.from("coreum_pairs").upsert(
        pairs.map(p => ({
          pair_id: p.pair_id,
          source: p.source,
          symbol: p.symbol,
          base_asset: p.base_asset,
          quote_asset: p.quote_asset,
          base_denom: p.base_denom,
          quote_denom: p.quote_denom,
          pool_contract: p.pool_contract,
          liquidity_token: p.liquidity_token,
          base_decimals: p.base_decimals,
          quote_decimals: p.quote_decimals,
          is_active: true,
        })),
        { onConflict: "pair_id" }
      );
      if (pErr) throw pErr;
    }

    return new Response(JSON.stringify({ success: true, pairs: pairs.length, tokens: tokens.length }), { headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});


