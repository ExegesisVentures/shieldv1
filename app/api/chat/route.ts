import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory session storage for chat context
const sessions = new Map<string, Array<{ role: string; content: string }>>();

// Knowledge base for Shield Nest / DeFi queries
const knowledgeBase = {
  swap: {
    short: "## Token Swapping\n\nTo swap tokens on Shield Nest:\n\n• **Connect your wallet**\n• Navigate to the **Swap page**\n• Select tokens to swap\n• Review rates & gas fees\n• **Confirm the transaction**",
    expanded: "## Token Swapping on Shield Nest\n\nToken swapping uses **automated market makers (AMMs)** on Coreum.\n\n### Process\n\n• Connect your wallet (**Keplr** or **Leap**)\n• Select source and destination tokens\n• Check the exchange rate and estimated gas fees\n• Confirm the transaction\n• Wait for blockchain confirmation (usually 3-5 seconds)\n\n### Fees\n\nGas fees are typically **under $0.01** on Coreum.\n\n### Tips\n\nSlippage tolerance can be adjusted in settings."
  },
  shield2: {
    short: "## Shield2 Token (SHLD)\n\n**Shield2** is the governance and utility token of Shield Nest.\n\n### Benefits\n\n• Access to **premium features**\n• **Governance voting** rights\n• **Staking rewards**\n\n**Current value:** $5,000-$6,000",
    expanded: "## Shield2 Token (SHLD)\n\n**Shield2** is a multi-utility token on the Coreum blockchain.\n\n### Features\n\n• **Governance** - vote on platform decisions\n• **Staking** - earn rewards by locking tokens\n• **Premium Access** - unlock advanced analytics and features\n• **Liquidity Incentives** - earn extra rewards for providing liquidity\n\n### Tokenomics\n\nThe token uses a **deflationary model** with periodic burns.\n\n**Shield NFT holders** get additional benefits."
  },
  wallet: {
    short: "## Wallet Connection\n\nShield Nest supports **Keplr** and **Leap** wallets.\n\n### Steps\n\n• Click **'Connect Wallet'** in the header\n• Choose your wallet\n• Approve the connection\n• Make sure you have the **Coreum chain** added",
    expanded: "## Wallet Connection Guide\n\n### Setup Process\n\n• Install **Keplr** or **Leap** browser extension\n• Add Coreum network if not already added\n• Click **'Connect Wallet'** on Shield Nest\n• Select your preferred wallet\n• Approve the connection request\n• Sign a message to verify ownership (**no gas fees**)\n\n### Mobile\n\nFor mobile, use **WalletConnect**.\n\n### Troubleshooting\n\n• Ensure wallet is unlocked\n• Check if Coreum chain is added\n• Try refreshing the page\n• Clear browser cache"
  },
  gas: {
    short: "## Gas Fees\n\nGas fees are transaction costs paid to validators for processing blockchain operations.\n\nOn Coreum, fees are **extremely low** - typically **$0.001 to $0.01** per transaction.",
    expanded: "## Gas Fees on Coreum\n\nGas fees are calculated based on computational complexity and network congestion.\n\n### Typical Costs\n\n• **Token swap:** ~0.001-0.01 COREUM\n• **Liquidity provision:** ~0.005-0.02 COREUM\n• **NFT minting:** ~0.01-0.05 COREUM\n\n### Tips to Save on Fees\n\n• Use native **COREUM** for fees (cheaper)\n• Avoid peak hours for lowest fees\n• Batch multiple operations when possible\n• Monitor gas prices in your wallet before confirming"
  },
  liquidity: {
    short: "## Provide Liquidity\n\nProvide liquidity by depositing equal value of two tokens into a pool.\n\n### Steps\n\n• Navigate to **Liquidity**\n• Click **Add Liquidity**\n• Select token pair\n• Enter amounts\n• **Confirm**\n\nYou'll earn **trading fees** and potential **rewards**.",
    expanded: "## Liquidity Provision\n\n### Benefits\n\n• Earn **trading fees** (typically 0.2-0.3% per swap)\n• Potential **liquidity mining rewards**\n• **Governance rights**\n\n### Risks\n\n• **Impermanent loss** when token prices diverge\n• Smart contract risk (audited but not zero risk)\n• Lock-up periods on some pools\n\n### Strategy\n\n• Start with **stablecoin pairs** for lower IL risk\n• Diversify across multiple pools\n• Monitor **APY vs IL ratio**\n• Compound rewards regularly"
  },
  membership: {
    short: "## Membership Tiers\n\nShield Nest has **3 tiers:**\n\n• **Visitor** - free, limited features\n• **Public** - email signup, full access\n• **Private** - Shield NFT + signed PMA, premium features\n\nUpgrade in **Settings → Membership**.",
    expanded: "## Membership Tiers\n\n### Visitor\n\n• Connect/paste wallets only\n• Data **not saved**\n• Exit-intent nudges shown\n\n### Public\n\n• Email/password or wallet-linked account\n• Data saved to Supabase\n• Access to **portfolio, swap, liquidity** features\n\n### Private\n\n**Requires:** Shield NFT ownership + signed PMA agreement\n\n**Unlock:**\n\n• **Advanced analytics**\n• Priority support\n• **Governance voting**\n• Exclusive pools\n• Early feature access\n\n**Shield NFT value:** $5,000-$6,000"
  },
  pma: {
    short: "## Private Member Agreement (PMA)\n\nA legal document you sign to access **premium features**.\n\n• Verified via **PDF signature** and **on-chain hash**\n• Only required for **Private tier** membership",
    expanded: "## PMA Process\n\n### Steps\n\n• Navigate to **Membership → Upgrade to Private**\n• Review the PMA document (covers terms, risks, responsibilities)\n• **Download and sign** the PDF\n• Upload signed PDF - system verifies signature\n• Hash stored **on-chain** for immutability\n• Must also own a **Shield NFT**\n\n### What PMA Covers\n\n• Member responsibilities\n• Risk disclosures\n• Governance participation rules\n• Dispute resolution\n• Privacy terms\n\nThe PMA is **legally binding**."
  },
  nft: {
    short: "## Shield NFT\n\nGrants access to **Private membership** tier.\n\n• Currently a **placeholder NFT**\n• Estimated value: **$5,000-$6,000**\n• Check your ownership in the **Membership** section",
    expanded: "## Shield NFT Details\n\n### Current Version (v1)\n\nPlaceholder with fixed image and value estimate.\n\n### Coming in v2\n\n• **Dynamic metadata**\n• Rarity tiers\n• On-chain verification\n• **Marketplace integration**\n• Staking for boosted rewards\n• Fractionalization options\n\n### Verify Ownership\n\n• Connect wallet\n• Navigate to **Membership**\n• System auto-checks your wallet for Shield NFT\n\n### Important\n\nSelling or transferring the NFT will **revoke Private membership** access."
  },
  coreum: {
    short: "## Coreum Blockchain\n\nA high-performance blockchain focused on **institutional DeFi**.\n\n### Features\n\n• **7,000+ TPS**\n• ~3 second finality\n• **Ultra-low fees**\n• Native ISO 20022 support\n• WASM smart contracts",
    expanded: "## Coreum Blockchain\n\n### Performance\n\n• **7,000 TPS** with sub-second finality\n• Fees **1000x cheaper** than Ethereum\n\n### Security\n\n• **Byzantine Fault Tolerant** consensus\n• Battle-tested infrastructure\n\n### Developer Tools\n\n• **WASM smart contracts**\n• Rust/Go support\n• Extensive documentation\n\n### Ecosystem\n\n• **ISO 20022 compliance** for traditional finance integration\n• Native DEX\n• NFT standards\n• Cross-chain bridges\n\n### Why Shield Nest Chose Coreum\n\n• **Low user costs**\n• Fast UX\n• Institutional-grade security\n• Growing ecosystem"
  },
  portfolio: {
    short: "## Portfolio\n\nYour portfolio shows all tokens across connected wallets.\n\n### Features\n\n• **Total value** display\n• Individual holdings\n• **Price changes**\n• Historical performance\n• Auto-refreshes every **30 seconds**",
    expanded: "## Portfolio Features\n\n### Real-time Data\n\n• Pricing from multiple oracles (**CoinGecko**, **DexScreener**, Coreum native)\n• Historical charts (24h, 7d, 30d, 1y, all time)\n\n### Multi-wallet Support\n\n• **Multi-wallet aggregation**\n• Asset allocation breakdown\n• **Profit/loss tracking**\n• Export to CSV\n• Rewards history (staking, liquidity, airdrops)\n\n### Tips\n\n• Connect **multiple wallets** for complete view\n• Check 'Refresh' if prices seem stale\n• Use **filters** to view specific asset types\n• Set up price alerts in Settings"
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
      response: "# 👋 Hello!\n\nI'm your **Shield Nest assistant**. I can help you with:\n\n• **Token swaps & trading**\n• **Wallet connections**\n• **Liquidity pools**\n• **Membership tiers**\n• **Shield2 token & NFT**\n• **Coreum blockchain**\n• **Portfolio management**\n\nWhat would you like to know?",
      canExpand: false,
      suggestions: ['How do I swap tokens?', 'What is Shield2?', 'Connect wallet help']
    };
  }

  // Help queries
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you') || lowerMessage.includes('how can you')) {
    return {
      response: "# 🛡️ Shield Nest Assistant\n\n## Trading & DeFi\n\n• Token swaps and pricing\n• Liquidity provision\n• Gas fees and costs\n\n## Account & Access\n\n• Wallet connection\n• Membership tiers\n• PMA signing\n\n## Tokens & NFTs\n\n• **Shield2 (SHLD)** token\n• **Shield NFT** benefits\n• Portfolio tracking\n\n## Platform\n\n• Coreum blockchain\n• Features & roadmap\n• Troubleshooting\n\nJust ask a question!",
      canExpand: false,
      suggestions: ['How do I swap tokens?', 'What are gas fees?', 'Membership tiers']
    };
  }

  // Default/fallback response
  return {
    response: "## I'm here to help!\n\nI can answer questions about:\n\n• **Token swaps and trading**\n• **Wallet connections** (Keplr, Leap)\n• **Liquidity pools and farming**\n• **Shield2 token and Shield NFT**\n• **Membership tiers** (Visitor, Public, Private)\n• **Coreum blockchain features**\n• **Portfolio management**\n• **Gas fees and costs**\n\nCould you rephrase your question or try one of the suggested topics?",
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

