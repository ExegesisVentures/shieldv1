declare global { interface Window { leap?: any; } }
const COREUM_CHAIN_ID = "coreum-mainnet-1"; // adjust if needed

export async function leapEnable() {
  if (!window.leap) throw new Error("WALLET_NOT_INSTALLED");
  await window.leap.enable(COREUM_CHAIN_ID);
}

export async function leapGetAddress(): Promise<string> {
  await leapEnable();
  const key = await window.leap.getKey(COREUM_CHAIN_ID);
  return key?.bech32Address as string;
}

export async function leapSignArbitrary(address: string, message: string) {
  await leapEnable();
  const signer = window.leap.getOfflineSignerOnlyAmino(COREUM_CHAIN_ID);
  const res = await window.leap.signArbitrary(COREUM_CHAIN_ID, address, message);
  return res; // {signature, pub_key}
}

