# 🏛️ Coreum Governance System Documentation

**Complete implementation of on-chain governance for ShieldV2**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [API Endpoints](#api-endpoints)
5. [Frontend Integration](#frontend-integration)
6. [Voting Process](#voting-process)
7. [Examples](#examples)
8. [Testing](#testing)
9. [Security Considerations](#security-considerations)

---

## Overview

This governance system allows ShieldV2 users to:

- ✅ **View Active Proposals** - See all proposals currently in voting period
- ✅ **View Proposal History** - Browse past proposals and their outcomes
- ✅ **Vote on Proposals** - Submit votes using connected wallets (Keplr, Leap, etc.)
- ✅ **Track Voting History** - See past votes and voting patterns
- ✅ **Monitor Results** - Real-time vote tallies and percentages
- ✅ **Check Voting Power** - View delegated stake and voting weight

### Why This Matters

Coreum's governance is **on-chain**, meaning:
- All proposals are recorded on the blockchain
- Votes are weighted by staked CORE tokens
- Results are transparent and immutable
- Community-driven decision making

This makes ShieldV2 one of the few wallets (alongside Cosmostation) that provides a **complete governance dashboard**.

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (ShieldV2)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Proposals   │  │   Voting     │  │   Results    │  │
│  │  Dashboard   │  │  Interface   │  │   Tracking   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│              API Routes (/app/api/governance/)           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  /proposals  │  │    /vote     │  │    /tally    │  │
│  │ /votes/[add] │  │  /deposits   │  │   /params    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│          Governance Utilities (/utils/coreum/)           │
│              governance.ts (Fetch & Vote Logic)          │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Coreum Blockchain (REST/RPC)                │
│  - Governance Module (cosmos.gov.v1beta1)                │
│  - Staking Module (cosmos.staking.v1beta1)               │
│  - Distribution Module (cosmos.distribution.v1beta1)     │
└─────────────────────────────────────────────────────────┘
```

### Components

#### 1. **Types** (`/types/governance.ts`)
Complete TypeScript type definitions for:
- Proposals
- Votes
- Tally results
- Governance parameters
- API responses

#### 2. **Utilities** (`/utils/coreum/governance.ts`)
Core functions for blockchain interaction:
- `fetchProposals()` - Get all proposals
- `fetchProposal(id)` - Get single proposal
- `fetchActiveProposals()` - Get proposals in voting period
- `voteOnProposal()` - Submit a vote (requires wallet)
- `fetchUserVote()` - Check if user voted
- `fetchProposalTally()` - Get current vote count
- `fetchUserVotingPower()` - Get user's staked CORE

#### 3. **API Routes** (`/app/api/governance/`)
RESTful endpoints for frontend consumption:
- GET `/api/governance/proposals` - List proposals
- GET `/api/governance/proposals/[id]` - Get proposal details
- GET `/api/governance/proposals/[id]/tally` - Get vote tally
- GET `/api/governance/proposals/[id]/votes` - Get all votes
- POST `/api/governance/vote` - Submit vote (client-side signing)
- GET `/api/governance/votes/[address]` - User voting history
- GET `/api/governance/deposits/[id]` - Proposal deposits
- GET `/api/governance/params` - Governance parameters

---

## File Structure

```
shieldv2/
├── types/
│   └── governance.ts                    # TypeScript type definitions
├── utils/
│   └── coreum/
│       └── governance.ts                # Blockchain interaction utilities
├── app/
│   └── api/
│       └── governance/
│           ├── proposals/
│           │   ├── route.ts             # GET all proposals
│           │   └── [id]/
│           │       ├── route.ts         # GET single proposal
│           │       ├── tally/
│           │       │   └── route.ts     # GET proposal tally
│           │       └── votes/
│           │           └── route.ts     # GET proposal votes
│           ├── vote/
│           │   └── route.ts             # POST vote on proposal
│           ├── votes/
│           │   └── [address]/
│           │       └── route.ts         # GET user voting history
│           ├── deposits/
│           │   └── [id]/
│           │       └── route.ts         # GET proposal deposits
│           └── params/
│               └── route.ts             # GET governance params
└── docs/
    └── GOVERNANCE-SYSTEM.md             # This documentation
```

---

## API Endpoints

### 1. List All Proposals

```typescript
GET /api/governance/proposals

// Query parameters:
// - status: "voting" | "passed" | "rejected" | "failed" | "deposit"
// - enriched: true/false (add computed fields)
// - active: true (only voting period)
// - stats: true (return statistics instead)
// - limit: number (pagination)
// - offset: number (pagination)

// Example: Get active proposals with enriched data
fetch('/api/governance/proposals?active=true&enriched=true')

// Response:
{
  "success": true,
  "data": [
    {
      "proposal_id": "1",
      "content": {
        "@type": "/cosmos.gov.v1beta1.TextProposal",
        "title": "Upgrade Network",
        "description": "Proposal to upgrade..."
      },
      "status": "PROPOSAL_STATUS_VOTING_PERIOD",
      "final_tally_result": {
        "yes": "1000000000",
        "no": "500000000",
        "abstain": "100000000",
        "no_with_veto": "50000000"
      },
      "voting_start_time": "2025-01-01T00:00:00Z",
      "voting_end_time": "2025-01-15T00:00:00Z",
      
      // Enriched fields (if enriched=true):
      "type": "TextProposal",
      "statusLabel": "Voting Period",
      "timeRemaining": "5d 3h",
      "yesPercentage": 60.6,
      "noPercentage": 30.3,
      "abstainPercentage": 6.1,
      "vetoPercentage": 3.0,
      "isActive": true,
      "canVote": true
    }
  ],
  "count": 1
}
```

### 2. Get Single Proposal

```typescript
GET /api/governance/proposals/[id]

// Query parameters:
// - enriched: true/false
// - voter: "core1abc...xyz" (check if user voted)

// Example: Get proposal with user vote status
fetch('/api/governance/proposals/1?enriched=true&voter=core1abc...xyz')

// Response:
{
  "success": true,
  "data": {
    "proposal_id": "1",
    // ... proposal data ...
    "userVote": "VOTE_OPTION_YES",
    "userHasVoted": true
  }
}
```

### 3. Get Proposal Tally

```typescript
GET /api/governance/proposals/[id]/tally

// Query parameters:
// - percentages: true/false (default: true)

// Example: Get current vote tally
fetch('/api/governance/proposals/1/tally')

// Response:
{
  "success": true,
  "data": {
    "yes": "1000000000",
    "no": "500000000",
    "abstain": "100000000",
    "no_with_veto": "50000000",
    "percentages": {
      "yesPercentage": 60.6,
      "noPercentage": 30.3,
      "abstainPercentage": 6.1,
      "vetoPercentage": 3.0,
      "turnoutPercentage": 100.0
    }
  }
}
```

### 4. Get User Voting History

```typescript
GET /api/governance/votes/[address]

// Query parameters:
// - proposalId: "1" (get vote for specific proposal)
// - votingPower: true (include current voting power)

// Example: Get all votes by user
fetch('/api/governance/votes/core1abc...xyz?votingPower=true')

// Response:
{
  "success": true,
  "data": {
    "votes": [
      {
        "proposal_id": "1",
        "voter": "core1abc...xyz",
        "option": "VOTE_OPTION_YES"
      },
      {
        "proposal_id": "5",
        "voter": "core1abc...xyz",
        "option": "VOTE_OPTION_NO"
      }
    ],
    "votingPower": "1000000000", // in ucore
    "totalVotes": 2
  }
}
```

### 5. Submit Vote

**IMPORTANT:** Voting requires wallet signature and is best done client-side.

```typescript
// Frontend voting example
import { voteOnProposal } from '@/utils/coreum/governance';
import { VoteOption } from '@/types/governance';

// Get wallet signer (Keplr example)
const chainId = 'coreum-mainnet-1';
const signer = await window.keplr.getOfflineSigner(chainId);
const [account] = await signer.getAccounts();

// Submit vote
const result = await voteOnProposal({
  proposalId: '1',
  voter: account.address,
  option: VoteOption.YES, // or NO, ABSTAIN, NO_WITH_VETO
}, signer);

if (result.success) {
  console.log('Vote submitted!', result.transactionHash);
}
```

### 6. Get Governance Parameters

```typescript
GET /api/governance/params

// Example: Get governance settings
fetch('/api/governance/params')

// Response:
{
  "success": true,
  "data": {
    "voting_params": {
      "voting_period": "1209600s" // 14 days
    },
    "deposit_params": {
      "min_deposit": [
        {
          "denom": "ucore",
          "amount": "10000000" // 10 CORE
        }
      ],
      "max_deposit_period": "1209600s"
    },
    "tally_params": {
      "quorum": "0.334000000000000000", // 33.4%
      "threshold": "0.500000000000000000", // 50%
      "veto_threshold": "0.334000000000000000" // 33.4%
    }
  }
}
```

---

## Frontend Integration

### Example: Proposals Dashboard Component

```typescript
'use client';

import { useState, useEffect } from 'react';
import { EnrichedProposal, VoteOption } from '@/types/governance';
import { voteOnProposal, fetchUserVotingPower } from '@/utils/coreum/governance';

export function ProposalsDashboard() {
  const [proposals, setProposals] = useState<EnrichedProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState<string>('');
  const [votingPower, setVotingPower] = useState<string>('0');

  // Fetch active proposals
  useEffect(() => {
    async function loadProposals() {
      try {
        const response = await fetch('/api/governance/proposals?active=true&enriched=true');
        const data = await response.json();
        
        if (data.success) {
          setProposals(data.data);
        }
      } catch (error) {
        console.error('Failed to load proposals:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProposals();
  }, []);

  // Fetch user's voting power
  useEffect(() => {
    async function loadVotingPower() {
      if (!userAddress) return;
      
      const power = await fetchUserVotingPower(userAddress);
      setVotingPower(power);
    }

    loadVotingPower();
  }, [userAddress]);

  // Handle vote submission
  async function handleVote(proposalId: string, option: VoteOption) {
    try {
      // Get wallet signer (example: Keplr)
      const chainId = 'coreum-mainnet-1';
      const signer = await (window as any).keplr.getOfflineSigner(chainId);
      const [account] = await signer.getAccounts();

      // Submit vote
      const result = await voteOnProposal({
        proposalId,
        voter: account.address,
        option,
      }, signer);

      if (result.success) {
        alert(`Vote submitted! TX: ${result.transactionHash}`);
        // Reload proposals to update vote status
        window.location.reload();
      } else {
        alert(`Vote failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to submit vote');
    }
  }

  if (loading) return <div>Loading proposals...</div>;

  return (
    <div className="proposals-dashboard">
      <h1>Active Governance Proposals</h1>
      
      {votingPower !== '0' && (
        <div className="voting-power">
          Your Voting Power: {(parseInt(votingPower) / 1_000_000).toFixed(2)} CORE
        </div>
      )}

      {proposals.length === 0 ? (
        <p>No active proposals at this time.</p>
      ) : (
        proposals.map((proposal) => (
          <div key={proposal.proposal_id} className="proposal-card">
            <h2>{proposal.content.title}</h2>
            <p>{proposal.content.description}</p>
            
            <div className="proposal-meta">
              <span>Status: {proposal.statusLabel}</span>
              <span>Time Remaining: {proposal.timeRemaining}</span>
            </div>

            <div className="vote-results">
              <div className="vote-bar">
                <div className="yes" style={{ width: `${proposal.yesPercentage}%` }}>
                  Yes: {proposal.yesPercentage?.toFixed(1)}%
                </div>
                <div className="no" style={{ width: `${proposal.noPercentage}%` }}>
                  No: {proposal.noPercentage?.toFixed(1)}%
                </div>
                <div className="abstain" style={{ width: `${proposal.abstainPercentage}%` }}>
                  Abstain: {proposal.abstainPercentage?.toFixed(1)}%
                </div>
                <div className="veto" style={{ width: `${proposal.vetoPercentage}%` }}>
                  Veto: {proposal.vetoPercentage?.toFixed(1)}%
                </div>
              </div>
            </div>

            {proposal.canVote && !proposal.userHasVoted && (
              <div className="vote-buttons">
                <button onClick={() => handleVote(proposal.proposal_id, VoteOption.YES)}>
                  Vote Yes
                </button>
                <button onClick={() => handleVote(proposal.proposal_id, VoteOption.NO)}>
                  Vote No
                </button>
                <button onClick={() => handleVote(proposal.proposal_id, VoteOption.ABSTAIN)}>
                  Abstain
                </button>
                <button onClick={() => handleVote(proposal.proposal_id, VoteOption.NO_WITH_VETO)}>
                  No with Veto
                </button>
              </div>
            )}

            {proposal.userHasVoted && (
              <div className="voted-status">
                ✅ You voted: {proposal.userVote}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
```

---

## Voting Process

### Understanding Coreum Governance

1. **Proposal Submission**
   - Anyone can submit a proposal with minimum deposit (typically 10 CORE)
   - Proposal enters "Deposit Period" (typically 14 days)

2. **Deposit Period**
   - Community can add to the deposit
   - If minimum deposit reached → moves to "Voting Period"
   - If not reached in time → proposal rejected

3. **Voting Period**
   - Typically lasts 14 days
   - Anyone with staked CORE can vote
   - Voting power = amount of staked CORE

4. **Vote Options**
   - **Yes** - Support the proposal
   - **No** - Oppose the proposal
   - **Abstain** - Participate but remain neutral
   - **No with Veto** - Strong opposition (burns deposit if >33.4%)

5. **Tally & Results**
   - **Quorum:** 33.4% of total staked tokens must vote
   - **Threshold:** 50% of non-abstain votes must be "Yes"
   - **Veto:** If >33.4% vote "No with Veto" → rejected

### Vote Weight Calculation

```typescript
// Example: User has 1000 CORE staked
// Proposal has 10,000 CORE total votes

User's vote weight = (1000 / 10,000) * 100 = 10%

// If user votes "Yes", the Yes percentage increases by 10%
```

---

## Examples

### Example 1: Display Active Proposals

```typescript
// Fetch and display active proposals
const response = await fetch('/api/governance/proposals?active=true&enriched=true');
const { data: proposals } = await response.json();

proposals.forEach(proposal => {
  console.log(`Proposal #${proposal.proposal_id}: ${proposal.content.title}`);
  console.log(`  Status: ${proposal.statusLabel}`);
  console.log(`  Time Left: ${proposal.timeRemaining}`);
  console.log(`  Yes: ${proposal.yesPercentage}%`);
  console.log(`  No: ${proposal.noPercentage}%`);
});
```

### Example 2: Check if User Voted

```typescript
// Check if user voted on a specific proposal
const userAddress = 'core1abc...xyz';
const proposalId = '1';

const response = await fetch(
  `/api/governance/votes/${userAddress}?proposalId=${proposalId}`
);
const { data } = await response.json();

if (data.hasVoted) {
  console.log(`User voted: ${data.vote.option}`);
} else {
  console.log('User has not voted yet');
}
```

### Example 3: Submit a Vote

```typescript
import { voteOnProposal } from '@/utils/coreum/governance';
import { VoteOption } from '@/types/governance';

async function submitVote() {
  // Get wallet signer
  const signer = await window.keplr.getOfflineSigner('coreum-mainnet-1');
  const [account] = await signer.getAccounts();

  // Vote
  const result = await voteOnProposal({
    proposalId: '1',
    voter: account.address,
    option: VoteOption.YES,
  }, signer);

  if (result.success) {
    console.log('✅ Vote submitted:', result.transactionHash);
  } else {
    console.error('❌ Vote failed:', result.error);
  }
}
```

### Example 4: Get Voting Statistics

```typescript
// Get overall governance statistics
const response = await fetch('/api/governance/proposals?stats=true');
const { data: stats } = await response.json();

console.log('Governance Statistics:');
console.log(`  Total Proposals: ${stats.total}`);
console.log(`  Active: ${stats.active}`);
console.log(`  Passed: ${stats.passed}`);
console.log(`  Rejected: ${stats.rejected}`);
console.log(`  Failed: ${stats.failed}`);
```

---

## Testing

### Manual Testing Checklist

#### 1. **Test Proposal Fetching**
```bash
# Get all proposals
curl http://localhost:3000/api/governance/proposals

# Get active proposals
curl http://localhost:3000/api/governance/proposals?active=true

# Get single proposal
curl http://localhost:3000/api/governance/proposals/1

# Get proposal with enriched data
curl http://localhost:3000/api/governance/proposals/1?enriched=true
```

#### 2. **Test Vote Tallies**
```bash
# Get current tally
curl http://localhost:3000/api/governance/proposals/1/tally

# Get all votes
curl http://localhost:3000/api/governance/proposals/1/votes
```

#### 3. **Test User Voting History**
```bash
# Get user's votes
curl http://localhost:3000/api/governance/votes/core1abc...xyz

# Check specific proposal
curl "http://localhost:3000/api/governance/votes/core1abc...xyz?proposalId=1"

# Include voting power
curl "http://localhost:3000/api/governance/votes/core1abc...xyz?votingPower=true"
```

#### 4. **Test Governance Parameters**
```bash
# Get governance settings
curl http://localhost:3000/api/governance/params
```

### Integration Testing

```typescript
// Test complete voting flow
describe('Governance System', () => {
  it('should fetch active proposals', async () => {
    const response = await fetch('/api/governance/proposals?active=true');
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should fetch proposal details', async () => {
    const response = await fetch('/api/governance/proposals/1');
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data.proposal_id).toBe('1');
  });

  it('should check user vote status', async () => {
    const address = 'core1abc...xyz';
    const response = await fetch(`/api/governance/votes/${address}?proposalId=1`);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(typeof data.data.hasVoted).toBe('boolean');
  });
});
```

---

## Security Considerations

### 1. **Client-Side Signing Only**

❌ **NEVER** send private keys to the server

✅ **ALWAYS** sign transactions client-side using wallet

```typescript
// ✅ CORRECT: Client-side signing
const signer = await window.keplr.getOfflineSigner(chainId);
const result = await voteOnProposal({ ... }, signer);

// ❌ WRONG: Never do this
// const result = await fetch('/api/vote', { privateKey: '...' });
```

### 2. **Verify Vote Weight**

Always display voting power to users:

```typescript
const votingPower = await fetchUserVotingPower(address);
console.log(`You can vote with ${votingPower} ucore`);
```

### 3. **Validate Proposal Status**

Check if proposal is active before voting:

```typescript
if (proposal.status !== ProposalStatus.VOTING_PERIOD) {
  alert('This proposal is not accepting votes');
  return;
}
```

### 4. **Handle Errors Gracefully**

```typescript
try {
  const result = await voteOnProposal({ ... }, signer);
  if (!result.success) {
    // Show user-friendly error
    alert(`Vote failed: ${result.error}`);
  }
} catch (error) {
  // Handle network errors
  console.error('Network error:', error);
  alert('Failed to connect to blockchain');
}
```

### 5. **Rate Limiting**

Consider adding rate limiting to API endpoints:

```typescript
// Example: Limit proposal fetching to 100 requests per minute
```

---

## Troubleshooting

### Common Issues

#### "Failed to fetch proposals"

**Cause:** Coreum RPC/REST endpoint is down or slow

**Solution:**
```typescript
// Check endpoint status
const COREUM_REST = process.env.NEXT_PUBLIC_COREUM_REST;
console.log('Using endpoint:', COREUM_REST);

// Try alternative endpoint
// Edit .env.local:
NEXT_PUBLIC_COREUM_REST=https://full-node.mainnet-1.coreum.dev:1317
```

#### "Transaction failed: insufficient fees"

**Cause:** Gas price too low

**Solution:**
```typescript
// Increase gas price in governance.ts
const COREUM_GAS_PRICE = GasPrice.fromString("0.0625ucore");
// Try: "0.1ucore" or higher
```

#### "User has not voted on proposal"

**Cause:** Vote not yet confirmed on chain

**Solution:**
```typescript
// Wait for transaction confirmation
await new Promise(resolve => setTimeout(resolve, 5000));
// Then check vote status again
```

---

## Future Enhancements

### Potential Additions

1. **Real-time Updates**
   - WebSocket for live vote updates
   - Push notifications for new proposals

2. **Advanced Analytics**
   - Voting trends over time
   - Validator voting patterns
   - Proposal success rate analysis

3. **Proposal Creation**
   - UI for submitting new proposals
   - Deposit management
   - Draft proposal templates

4. **Social Features**
   - Proposal discussion threads
   - Voting recommendations
   - Community sentiment analysis

5. **Multi-Chain Support**
   - Support other Cosmos chains
   - Cross-chain governance aggregation

---

## Support

For questions or issues:

1. Check the [Coreum Documentation](https://docs.coreum.dev/)
2. Review [Cosmos SDK Governance](https://docs.cosmos.network/main/modules/gov)
3. Test on [Coreum Testnet](https://explorer.testnet-1.coreum.dev/) first

---

## License

This governance system is part of ShieldV2 and follows the same license.

---

**Last Updated:** October 22, 2025  
**Version:** 1.0.0  
**Author:** ShieldV2 Development Team


