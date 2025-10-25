declare global { interface Window { cosmostation?: any; } }
const COREUM_CHAIN_ID = "coreum-mainnet-1"; // adjust if needed

export async function cosmostationEnable() {
  if (!window.cosmostation) throw new Error("WALLET_NOT_INSTALLED");
  await window.cosmostation.enable(COREUM_CHAIN_ID);
}

export async function cosmostationGetAddress(): Promise<string> {
  await cosmostationEnable();
  const key = await window.cosmostation.getKey(COREUM_CHAIN_ID);
  return key?.bech32Address as string;
}

export async function cosmostationSignArbitrary(address: string, message: string) {
  try {
    await cosmostationEnable();
    const signer = window.cosmostation.getOfflineSignerOnlyAmino(COREUM_CHAIN_ID);
    const res = await window.cosmostation.signArbitrary(COREUM_CHAIN_ID, address, message);
    return res; // {signature, pub_key}
  } catch (error: any) {
    // Normalize Cosmostation rejection errors
    if (error?.message?.includes("rejected") || error?.message?.includes("Request rejected") || error?.message?.includes("User denied")) {
      const rejectionError = new Error("User rejected the signature request");
      rejectionError.name = "USER_REJECTED";
      throw rejectionError;
    }
    throw error;
  }
}

