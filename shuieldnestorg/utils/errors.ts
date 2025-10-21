export type UiError = { code: string; message: string; hint?: string; causeId?: string };

export function uiError(code: string, message: string, hint?: string): UiError {
  return { code, message, hint, causeId: Math.random().toString(36).slice(2, 8) };
}

export function friendly(code: string) {
  switch (code) {
    case "WALLET_NOT_INSTALLED": return { message: "Wallet extension not found.", hint: "Install Keplr, Leap, or Cosmostation and refresh." };
    case "CHAIN_NOT_ENABLED":    return { message: "Coreum is not enabled in your wallet.", hint: "Open your wallet and approve Coreum." };
    case "SIG_FAILED":           return { message: "Signature failed.", hint: "Confirm the prompt in your wallet and try again." };
    default:                     return { message: "Something went wrong." };
  }
}

