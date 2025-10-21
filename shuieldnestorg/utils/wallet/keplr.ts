declare global { interface Window { keplr?: any; } }
const COREUM_CHAIN_ID = "coreum-mainnet-1"; // adjust if needed

export async function keplrEnable() {
  if (!window.keplr) throw new Error("WALLET_NOT_INSTALLED");
  await window.keplr.enable(COREUM_CHAIN_ID);
}

export async function keplrGetAddress(): Promise<string> {
  await keplrEnable();
  const key = await window.keplr.getKey(COREUM_CHAIN_ID);
  return key?.bech32Address as string;
}

export async function keplrSignArbitrary(address: string, message: string) {
  await keplrEnable();
  const res = await window.keplr.signArbitrary(COREUM_CHAIN_ID, address, message);
  return res; // {signature, pub_key}
}

