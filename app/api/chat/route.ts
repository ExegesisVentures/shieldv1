import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory session storage for chat context
const sessions = new Map<string, Array<{ role: string; content: string }>>();

// Knowledge base for Shield Nest / DeFi queries
const knowledgeBase = {
  swap: {
    short: "To swap tokens on Shield Nest: 1) Connect your wallet, 2) Navigate to the Swap page, 3) Select tokens to swap, 4) Review rates & gas fees, 5) Confirm the transaction.",
    expanded: "Token swapping on Shield Nest uses automated market makers (AMMs) on Coreum. The process involves: connecting your wallet (Keplr/Leap), selecting source and destination tokens, checking the exchange rate and estimated gas fees (typically under $0.01 on Coreum), confirming the transaction, and waiting for blockchain confirmation (usually 3-5 seconds on Coreum). Slippage tolerance can be adjusted in settings."
  },
  shield2: {
    short: "Shield2 (SHLD) is the governance and utility token of Shield Nest. It provides access to premium features, governance voting, and staking rewards. Current value: $5,000-$6,000.",
    expanded: "Shield2 (SHLD) is a multi-utility token on the Coreum blockchain. Features include: Governance - vote on platform decisions; Staking - earn rewards by locking tokens; Premium Access - unlock advanced analytics and features; Liquidity Incentives - earn extra rewards for providing liquidity. The token uses a deflationary model with periodic burns. Shield NFT holders get additional benefits."
  },
  wallet: {
    short: "Shield Nest supports Keplr and Leap wallets. Click 'Connect Wallet' in the header, choose your wallet, and approve the connection. Make sure you have the Coreum chain added to your wallet.",
    expanded: "Wallet connection process: 1) Install Keplr or Leap browser extension, 2) Add Coreum network if not already added, 3) Click 'Connect Wallet' on Shield Nest, 4) Select your preferred wallet, 5) Approve the connection request, 6) Sign a message to verify ownership (no gas fees). For mobile, use WalletConnect. If you encounter issues: ensure wallet is unlocked, check if Coreum chain is added, try refreshing the page, or clear browser cache."
  },
  gas: {
    short: "Gas fees are transaction costs paid to validators for processing blockchain operations. On Coreum, fees are extremely low - typically $0.001 to $0.01 per transaction.",
    expanded: "Gas fees on Coreum are calculated based on computational complexity and network congestion. Typical costs: Token swap: ~0.001-0.01 COREUM, Liquidity provision: ~0.005-0.02 COREUM, NFT minting: ~0.01-0.05 COREUM. Tips: Use native COREUM for fees (cheaper), avoid peak hours for lowest fees, batch multiple operations when possible, monitor gas prices in your wallet before confirming."
  },
  liquidity: {
    short: "Provide liquidity by depositing equal value of two tokens into a pool. You'll earn trading fees and potential rewards. Navigate to Liquidity → Add Liquidity → Select token pair → Enter amounts → Confirm.",
    expanded: "Liquidity provision on Shield Nest: Benefits - earn trading fees (typically 0.2-0.3% per swap), potential liquidity mining rewards, governance rights. Risks - impermanent loss when token prices diverge, smart contract risk (audited but not zero risk), lock-up periods on some pools. Strategy: start with stablecoin pairs for lower IL risk, diversify across multiple pools, monitor APY vs IL ratio, compound rewards regularly."
  },
  membership: {
    short: "Shield Nest has 3 tiers: Visitor (free, limited features), Public (email signup, full access), Private (Shield NFT + signed PMA, premium features). Upgrade in Settings → Membership.",
    expanded: "Membership tiers: VISITOR - connect/paste wallets only, data not saved, exit-intent nudges shown. PUBLIC - email/password or wallet-linked account, data saved to Supabase, access to portfolio, swap, liquidity features. PRIVATE - requires Shield NFT ownership + signed PMA agreement, unlock: advanced analytics, priority support, governance voting, exclusive pools, early feature access. Shield NFT value: $5,000-$6,000."
  },
  pma: {
    short: "PMA (Private Member Agreement) is a legal document you sign to access premium features. It's verified via PDF signature and on-chain hash. Only required for Private tier membership.",
    expanded: "PMA process: 1) Navigate to Membership → Upgrade to Private, 2) Review the PMA document (covers terms, risks, responsibilities), 3) Download and sign the PDF, 4) Upload signed PDF - system verifies signature, 5) Hash stored on-chain for immutability, 6) Must also own a Shield NFT. The PMA is legally binding and outlines: member responsibilities, risk disclosures, governance participation rules, dispute resolution, privacy terms."
  },
  nft: {
    short: "Shield NFT grants access to Private membership tier. It's currently a placeholder NFT with estimated value $5,000-$6,000. Check your ownership in the Membership section.",
    expanded: "Shield NFT details: Current version is a placeholder (v1 release) with fixed image and value estimate. Full NFT features coming in v2: dynamic metadata, rarity tiers, on-chain verification, marketplace integration, staking for boosted rewards, fractionalization options. To verify ownership: connect wallet → Navigate to Membership → System auto-checks your wallet for Shield NFT. Note: selling or transferring the NFT will revoke Private membership access."
  },
  coreum: {
    short: "Coreum is a high-performance blockchain focused on institutional DeFi. Features: 7,000+ TPS, ~3 second finality, ultra-low fees, native ISO 20022 support, WASM smart contracts.",
    expanded: "Coreum blockchain advantages: Performance - 7,000 TPS with sub-second finality; Cost - fees 1000x cheaper than Ethereum; Security - Byzantine Fault Tolerant consensus, battle-tested; Developer tools - WASM smart contracts, Rust/Go support, extensive docs; Ecosystem - ISO 20022 compliance for traditional finance integration, native DEX, NFT standards, cross-chain bridges. Shield Nest chose Coreum for: low user costs, fast UX, institutional-grade security, growing ecosystem."
  },
  portfolio: {
    short: "Your portfolio shows all tokens across connected wallets. View total value, individual holdings, price changes, and historical performance. Auto-refreshes every 30 seconds.",
    expanded: "Portfolio features: Real-time pricing from multiple oracles (CoinGecko, DexScreener, Coreum native), Historical charts (24h, 7d, 30d, 1y, all time), Multi-wallet aggregation, Asset allocation breakdown, Profit/loss tracking, Export to CSV, Rewards history (staking, liquidity, airdrops). Tips: connect multiple wallets for complete view, check 'Refresh' if prices seem stale, use filters to view specific asset types, set up price alerts in Settings."
  }
};

// Helper to get relevant response
function getResponse(message: string, expand: boolean = false): {
  response: string;
  canExpand: boolean;
  suggestions?: string[];
} {
  const lowerMessage = message.toLowerCase();

  // Token swap queries
  if (lowerMessage.includes('swap') || lowerMessage.includes('trade') || lowerMessage.includes('exchange token')) {
    return {
      response: expand ? knowledgeBase.swap.expanded : knowledgeBase.swap.short,
      canExpand: !expand,
      suggestions: expand ? undefined : ['What are gas fees?', 'Show me liquidity pools', 'What is slippage?']
    };
  }

  // Shield2 token queries
  if (lowerMessage.includes('shield') && (lowerMessage.includes('token') || lowerMessage.includes('shld') || lowerMessage.includes('shield2'))) {
    return {
      response: expand ? knowledgeBase.shield2.expanded : knowledgeBase.shield2.short,
      canExpand: !expand,
      suggestions: expand ? undefined : ['How to stake Shield2?', 'What is the NFT?', 'Membership tiers']
    };
  }

  // Wallet connection queries
  if (lowerMessage.includes('wallet') && (lowerMessage.includes('connect') || lowerMessage.includes('link') || lowerMessage.includes('help'))) {
    return {
      response: expand ? knowledgeBase.wallet.expanded : knowledgeBase.wallet.short,
      canExpand: !expand,
      suggestions: expand ? undefined : ['Supported wallets', 'Mobile wallet setup', 'Troubleshoot connection']
    };
  }

  // Gas fee queries
  if (lowerMessage.includes('gas') || lowerMessage.includes('fee') || lowerMessage.includes('cost')) {
    return {
      response: expand ? knowledgeBase.gas.expanded : knowledgeBase.gas.short,
      canExpand: !expand,
      suggestions: expand ? undefined : ['How to reduce fees?', 'What is Coreum?', 'Transaction speed']
    };
  }

  // Liquidity queries
  if (lowerMessage.includes('liquid') || lowerMessage.includes('pool') || lowerMessage.includes('provide') || lowerMessage.includes('add liquid')) {
    return {
      response: expand ? knowledgeBase.liquidity.expanded : knowledgeBase.liquidity.short,
      canExpand: !expand,
      suggestions: expand ? undefined : ['What is impermanent loss?', 'Best pools to join', 'Withdraw liquidity']
    };
  }

  // Membership queries
  if (lowerMessage.includes('member') || lowerMessage.includes('tier') || lowerMessage.includes('upgrade') || lowerMessage.includes('subscription')) {
    return {
      response: expand ? knowledgeBase.membership.expanded : knowledgeBase.membership.short,
      canExpand: !expand,
      suggestions: expand ? undefined : ['What is PMA?', 'How to get Shield NFT?', 'Private member benefits']
    };
  }

  // PMA queries
  if (lowerMessage.includes('pma') || lowerMessage.includes('private member') || lowerMessage.includes('agreement')) {
    return {
      response: expand ? knowledgeBase.pma.expanded : knowledgeBase.pma.short,
      canExpand: !expand,
      suggestions: expand ? undefined : ['What is Shield NFT?', 'Sign PMA', 'Legal terms']
    };
  }

  // NFT queries
  if (lowerMessage.includes('nft') || lowerMessage.includes('shield nft')) {
    return {
      response: expand ? knowledgeBase.nft.expanded : knowledgeBase.nft.short,
      canExpand: !expand,
      suggestions: expand ? undefined : ['How to buy NFT?', 'NFT benefits', 'Check NFT ownership']
    };
  }

  // Coreum blockchain queries
  if (lowerMessage.includes('coreum') || lowerMessage.includes('blockchain') || lowerMessage.includes('chain')) {
    return {
      response: expand ? knowledgeBase.coreum.expanded : knowledgeBase.coreum.short,
      canExpand: !expand,
      suggestions: expand ? undefined : ['Why Coreum?', 'Coreum vs Ethereum', 'Add Coreum to wallet']
    };
  }

  // Portfolio queries
  if (lowerMessage.includes('portfolio') || lowerMessage.includes('balance') || lowerMessage.includes('holdings') || lowerMessage.includes('assets')) {
    return {
      response: expand ? knowledgeBase.portfolio.expanded : knowledgeBase.portfolio.short,
      canExpand: !expand,
      suggestions: expand ? undefined : ['View my tokens', 'Price alerts', 'Export data']
    };
  }

  // Greeting queries
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage === 'hi') {
    return {
      response: "👋 Hello! I'm your Shield Nest assistant. I can help you with:\n\n• Token swaps & trading\n• Wallet connections\n• Liquidity pools\n• Membership tiers\n• Shield2 token & NFT\n• Coreum blockchain\n• Portfolio management\n\nWhat would you like to know?",
      canExpand: false,
      suggestions: ['How do I swap tokens?', 'What is Shield2?', 'Connect wallet help']
    };
  }

  // Help queries
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you') || lowerMessage.includes('how can you')) {
    return {
      response: "🛡️ I can assist with:\n\n**Trading & DeFi**\n• Token swaps and pricing\n• Liquidity provision\n• Gas fees and costs\n\n**Account & Access**\n• Wallet connection\n• Membership tiers\n• PMA signing\n\n**Tokens & NFTs**\n• Shield2 (SHLD) token\n• Shield NFT benefits\n• Portfolio tracking\n\n**Platform**\n• Coreum blockchain\n• Features & roadmap\n• Troubleshooting\n\nJust ask a question!",
      canExpand: false,
      suggestions: ['How do I swap tokens?', 'What are gas fees?', 'Membership tiers']
    };
  }

  // Default/fallback response
  return {
    response: "I'm here to help with Shield Nest! I can answer questions about:\n\n• Token swaps and trading\n• Wallet connections (Keplr, Leap)\n• Liquidity pools and farming\n• Shield2 token and Shield NFT\n• Membership tiers (Visitor, Public, Private)\n• Coreum blockchain features\n• Portfolio management\n• Gas fees and costs\n\nCould you rephrase your question or try one of the suggested topics?",
    canExpand: false,
    suggestions: ['How do I swap tokens?', 'What is Shield2?', 'Connect wallet help', 'What are gas fees?']
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, project, expand = false } = body;

    console.log('💬 Chat API received:', { message, sessionId, project, expand });

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get or create session
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, []);
    }

    const sessionMessages = sessions.get(sessionId)!;
    
    // Add user message to session
    sessionMessages.push({ role: 'user', content: message });

    // Generate response based on message content
    const result = getResponse(message, expand);

    // Add assistant message to session
    sessionMessages.push({ role: 'assistant', content: result.response });

    // Limit session size (keep last 20 messages)
    if (sessionMessages.length > 20) {
      sessions.set(sessionId, sessionMessages.slice(-20));
    }

    console.log('✅ Chat API response:', result);

    return NextResponse.json({
      response: result.response,
      canExpand: result.canExpand,
      suggestions: result.suggestions,
      sessionId
    });
  } catch (error) {
    console.error('❌ Chat API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Optional: Add OPTIONS for CORS support if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    },
  });
}

