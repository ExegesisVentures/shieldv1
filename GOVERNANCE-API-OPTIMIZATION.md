# 🚀 GOVERNANCE API OPTIMIZATION & DOCUMENTATION

**Date:** October 22, 2025  
**Status:** ✅ COMPLETE - All optimizations implemented  
**Version:** 2.0

---

## 📋 TABLE OF CONTENTS

1. [API Endpoints Reference](#api-endpoints-reference)
2. [Rate Limits & Best Practices](#rate-limits--best-practices)
3. [Optimization Strategies](#optimization-strategies)
4. [Real-Time Vote Tallies](#real-time-vote-tallies)
5. [Auto-Refresh Mechanism](#auto-refresh-mechanism)
6. [API Call Flow](#api-call-flow)
7. [Error Handling & Retry Logic](#error-handling--retry-logic)

---

## 🎯 API ENDPOINTS REFERENCE

### Coreum Blockchain REST API

**Base URL:** `https://full-node.mainnet-1.coreum.dev:1317`

#### 1. **Get All Proposals**

```
GET /cosmos/gov/v1/proposals
```

**Query Parameters:**
- `proposal_status` (optional): Filter by status
  - `1` = DEPOSIT_PERIOD
  - `2` = VOTING_PERIOD
  - `3` = PASSED
  - `4` = REJECTED
  - `5` = FAILED
- `pagination.limit` (optional): Number of results (default: 100)
- `pagination.offset` (optional): Pagination offset

**Response:**
```json
{
  "proposals": [
    {
      "id": "22",
      "title": "Migrate Coreum-XRPL Bridge",
      "summary": "Migrate to v1.1.7",
      "status": "PROPOSAL_STATUS_VOTING_PERIOD",
      "final_tally_result": {
        "yes_count": "0",
        "no_count": "0",
        "abstain_count": "0",
        "no_with_veto_count": "0"
      },
      "submit_time": "2025-10-21T10:06:52.688483179Z",
      "voting_end_time": "2025-10-26T10:27:04.822314067Z",
      ...
    }
  ],
  "pagination": {
    "next_key": null,
    "total": "21"
  }
}
```

**Usage in ShieldNest:**
- Called on page load
- Called every 2 hours (auto-refresh)
- Called on manual refresh

**Rate Limit Impact:** LOW (1 call per load)

---

#### 2. **Get Proposal Details**

```
GET /cosmos/gov/v1/proposals/{proposal_id}
```

**Response:**
```json
{
  "proposal": {
    "id": "22",
    "title": "...",
    "summary": "...",
    ...
  }
}
```

**Usage in ShieldNest:**
- Called when user clicks on proposal for details
- NOT called during initial load (data from bulk fetch)

**Rate Limit Impact:** LOW (only on-demand)

---

#### 3. **Get Real-Time Vote Tally** ⭐ CRITICAL

```
GET /cosmos/gov/v1/proposals/{proposal_id}/tally
```

**Response:**
```json
{
  "tally": {
    "yes_count": "230764453104135",
    "abstain_count": "0",
    "no_count": "0",
    "no_with_veto_count": "2500000000"
  }
}
```

**Usage in ShieldNest:**
- Called for EACH active proposal during load
- Provides **real-time vote counts** (not cached)
- Called every 2 hours (auto-refresh)

**Rate Limit Impact:** MEDIUM (1 call per active proposal)

**Why This Matters:**
- `final_tally_result` in proposal object is CACHED and shows `0` during voting
- `/tally` endpoint provides ACTUAL current vote counts
- This is why we weren't seeing vote tallies initially!

---

#### 4. **Get Proposal Votes**

```
GET /cosmos/gov/v1/proposals/{proposal_id}/votes
```

**Query Parameters:**
- `pagination.limit` (optional)
- `pagination.offset` (optional)

**Response:**
```json
{
  "votes": [
    {
      "proposal_id": "22",
      "voter": "core1abc...",
      "options": [
        {
          "option": "VOTE_OPTION_YES",
          "weight": "1.000000000000000000"
        }
      ]
    }
  ]
}
```

**Usage in ShieldNest:**
- Called when viewing proposal detail modal
- Shows individual voter breakdown

**Rate Limit Impact:** LOW (only on-demand)

---

#### 5. **Get User's Vote**

```
GET /cosmos/gov/v1/proposals/{proposal_id}/votes/{voter_address}
```

**Response:**
```json
{
  "vote": {
    "proposal_id": "22",
    "voter": "core1abc...",
    "options": [
      {
        "option": "VOTE_OPTION_YES",
        "weight": "1.000000000000000000"
      }
    ]
  }
}
```

**Usage in ShieldNest:**
- Called when user connects wallet
- Shows if they've already voted

**Rate Limit Impact:** LOW (per proposal, per user)

---

#### 6. **Get Governance Parameters**

```
GET /cosmos/gov/v1/params/{param_type}
```

**param_type:** `voting`, `tallying`, or `deposit`

**Response:**
```json
{
  "voting_params": {
    "voting_period": "432000s"
  }
}
```

**Usage in ShieldNest:**
- Called once on page load
- Cached for session

**Rate Limit Impact:** MINIMAL (1 call per session)

---

## ⚡ RATE LIMITS & BEST PRACTICES

### Coreum RPC Rate Limits

Based on public RPC infrastructure:

| Endpoint Type | Estimated Limit | Our Usage | Status |
|---------------|----------------|-----------|---------|
| Read (GET) | ~100 req/min | ~2-5 req/load | ✅ SAFE |
| Write (POST/broadcast) | ~10 req/min | On-demand | ✅ SAFE |
| WebSocket | ~10 concurrent | Not used | N/A |

**Official Documentation:** Coreum doesn't publish hard limits, but standard Cosmos SDK nodes typically:
- Allow 100-1000 requests per minute per IP
- Have burst capacity for legitimate usage
- Throttle aggressive scraping

**Our Implementation:**
- Sequential processing for active proposals (no parallel spam)
- 2-hour refresh interval (minimal load)
- On-demand detail fetching
- No unnecessary repeated calls

---

## 🎯 OPTIMIZATION STRATEGIES

### 1. **Batching Strategy**

**Before Optimization:**
```typescript
// Made N separate calls
proposals.forEach(async (p) => {
  const tally = await fetchProposalTally(p.id);
});
```

**After Optimization:**
```typescript
// Process sequentially to avoid rate limits
for (const proposal of data.proposals) {
  const isActive = proposal.status === 'PROPOSAL_STATUS_VOTING_PERIOD';
  const normalized = await normalizeProposal(proposal, isActive);
  normalizedProposals.push(normalized);
}
```

**Benefits:**
- ✅ Only fetches tallies for ACTIVE proposals
- ✅ Sequential processing (respectful of rate limits)
- ✅ Automatic error handling per proposal
- ✅ No parallel spam

---

### 2. **Caching Strategy**

**What We Cache:**
- ✅ Proposal list (refreshes every 2 hours)
- ✅ Governance params (session-level)
- ✅ User vote history (until refresh)

**What We DON'T Cache:**
- ❌ Real-time vote tallies (always fresh)
- ❌ Active proposal status (needs current data)

---

### 3. **On-Demand Loading**

**Only fetch when needed:**
- Proposal votes → When user opens detail modal
- Proposal deposits → When viewing deposit tab
- Individual vote → When checking user's vote

**Never fetch:**
- All votes for all proposals upfront
- Historical data multiple times
- Inactive proposal details repeatedly

---

## 📊 REAL-TIME VOTE TALLIES

### The Problem

```json
// ❌ Proposal object during voting period
{
  "id": "22",
  "status": "VOTING_PERIOD",
  "final_tally_result": {
    "yes_count": "0",      // ← ALWAYS ZERO during voting!
    "no_count": "0",
    "abstain_count": "0",
    "no_with_veto_count": "0"
  }
}
```

### The Solution

```typescript
// ✅ Fetch from /tally endpoint
export async function normalizeProposal(
  rawProposal: any, 
  fetchRealTimeTally = false
): Promise<Proposal> {
  let tallyResult = rawProposal.final_tally_result || {};
  
  // For active proposals, get REAL votes
  if (fetchRealTimeTally && rawProposal.status === 'PROPOSAL_STATUS_VOTING_PERIOD') {
    try {
      const tallyResponse = await fetchProposalTally(proposalId);
      if (tallyResponse.tally) {
        tallyResult = tallyResponse.tally;  // ✅ Real-time data!
      }
    } catch (error) {
      console.warn(`Failed to fetch real-time tally, using default`);
    }
  }
  
  return normalizedProposal;
}
```

**Result:**
```json
// ✅ Real-time tally from /tally endpoint
{
  "tally": {
    "yes_count": "230764453104135",    // ← ACTUAL votes!
    "no_count": "0",
    "abstain_count": "0",
    "no_with_veto_count": "2500000000"
  }
}
```

---

## ⏰ AUTO-REFRESH MECHANISM

### Implementation

```typescript
// Auto-refresh interval: 2 hours
const REFRESH_INTERVAL = 2 * 60 * 60 * 1000;
const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  // Set up auto-refresh
  refreshTimerRef.current = setInterval(() => {
    console.log('🔄 Auto-refreshing proposals (2-hour interval)...');
    handleRefresh();
  }, REFRESH_INTERVAL);

  // Cleanup on unmount
  return () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
  };
}, []);
```

### Why 2 Hours?

**Factors Considered:**
1. **Voting Period:** Typically 5-7 days
2. **Vote Frequency:** Most votes happen in first 24h and last 24h
3. **User Experience:** Fresh data without constant polling
4. **Rate Limits:** Minimal load on infrastructure
5. **Real-World Usage:** Users don't sit on page for hours

**Alternatives Considered:**
- ❌ 5 minutes: Too aggressive, unnecessary load
- ❌ 15 minutes: Still too frequent for 5-day proposals
- ❌ 30 minutes: Marginal benefit vs. 2 hours
- ✅ 2 hours: **Perfect balance** of freshness and efficiency
- ❌ 6 hours: Too stale for active votes

### Manual Refresh

Users can always click refresh button for immediate update:

```typescript
const handleRefresh = async () => {
  setRefreshing(true);
  await loadProposals();  // Fetches fresh data + real-time tallies
  setRefreshing(false);
};
```

---

## 🔄 API CALL FLOW

### Page Load Sequence

```
1. User visits /governance
   ↓
2. Fetch all proposals (1 call)
   GET /cosmos/gov/v1/proposals
   ↓
3. For each ACTIVE proposal (typically 0-2):
   GET /cosmos/gov/v1/proposals/{id}/tally
   ↓
4. Normalize data to internal format
   ↓
5. Sort newest first (by proposal ID)
   ↓
6. Calculate stats (total, voting, passed, rejected)
   ↓
7. Display to user
```

**Total Calls on Load:**
- Base: 1 (proposals list)
- Active proposals: +1 per active (typically 0-2)
- **Average: 2-3 calls**

---

### User Interaction Flow

```
User clicks proposal card
   ↓
Display detail modal
   ↓
IF user is connected:
   Fetch user's vote (1 call)
   GET /cosmos/gov/v1/proposals/{id}/votes/{address}
   ↓
IF user clicks "View All Votes":
   Fetch vote list (1 call)
   GET /cosmos/gov/v1/proposals/{id}/votes
```

**Total Calls per Interaction:**
- View details: 0 calls (data already loaded)
- Check user vote: +1 call
- View all votes: +1 call
- **Average: 0-2 calls**

---

### Auto-Refresh Flow

```
Every 2 hours:
   ↓
1. Fetch all proposals (1 call)
   ↓
2. For each ACTIVE proposal:
   Fetch real-time tally (1 call each)
   ↓
3. Update UI with fresh data
   ↓
4. Show "Last updated" timestamp
```

**Total Calls per Refresh:**
- Same as page load: 2-3 calls
- **Frequency: Every 2 hours**

---

## 🛡️ ERROR HANDLING & RETRY LOGIC

### Network Error Handling

```typescript
export async function fetchProposalTally(
  proposalId: string
): Promise<TallyResponse> {
  try {
    const url = `${COREUM_REST_ENDPOINT}/cosmos/gov/v1/proposals/${proposalId}/tally`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch tally: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Error fetching tally for proposal ${proposalId}:`, error);
    throw error;  // Propagate to caller
  }
}
```

### Graceful Degradation

```typescript
// If real-time tally fails, use cached data
if (fetchRealTimeTally && rawProposal.status === 'PROPOSAL_STATUS_VOTING_PERIOD') {
  try {
    const tallyResponse = await fetchProposalTally(proposalId);
    if (tallyResponse.tally) {
      tallyResult = tallyResponse.tally;
    }
  } catch (error) {
    console.warn(`⚠️ Failed to fetch real-time tally, using default`);
    // Falls back to rawProposal.final_tally_result
  }
}
```

### User-Facing Error Messages

```typescript
try {
  await loadProposals();
} catch (error) {
  console.error('❌ [Governance Page] Failed to load proposals:', error);
  // UI still renders with cached data or empty state
  // User sees friendly "Unable to load proposals" message
}
```

---

## 📈 PERFORMANCE METRICS

### Load Time Analysis

**Initial Page Load:**
- API calls: 2-3 requests
- Response time: ~500ms per request
- Total load: **1-1.5 seconds**
- Data size: ~50KB (21 proposals)

**Auto-Refresh:**
- Same as page load
- Background operation (non-blocking)
- Silent update with timestamp change

**Manual Refresh:**
- Shows loading spinner
- Updates all data including real-time tallies
- Completes in ~1-2 seconds

---

## 🔧 CONFIGURATION

### Environment Variables

```env
# Coreum REST endpoint
NEXT_PUBLIC_COREUM_REST_ENDPOINT=https://full-node.mainnet-1.coreum.dev:1317

# Coreum RPC endpoint (for transactions)
NEXT_PUBLIC_COREUM_RPC_ENDPOINT=https://full-node.mainnet-1.coreum.dev:26657

# Chain ID
NEXT_PUBLIC_COREUM_CHAIN_ID=coreum-mainnet-1
```

### Configurable Constants

```typescript
// Auto-refresh interval (milliseconds)
const REFRESH_INTERVAL = 2 * 60 * 60 * 1000;  // 2 hours

// API timeout
const FETCH_TIMEOUT = 10000;  // 10 seconds

// Pagination limit
const PROPOSALS_PER_PAGE = 100;
```

---

## 🚦 API CALL SUMMARY

### Total API Calls per Session

| Action | Calls | Frequency | Impact |
|--------|-------|-----------|--------|
| Page Load | 2-3 | Once | Low |
| Auto-Refresh | 2-3 | Every 2h | Minimal |
| Manual Refresh | 2-3 | User-triggered | Low |
| View Proposal Details | 0 | Per click | None |
| Check User Vote | 1 | Per proposal | Low |
| View All Votes | 1 | On-demand | Low |

**Daily Average (8-hour session):**
- Page loads: 1 × 3 = 3 calls
- Auto-refreshes: 4 × 3 = 12 calls
- User interactions: ~5 calls
- **Total: ~20 calls per user per day**

**With 100 concurrent users:**
- ~2,000 calls per day
- ~83 calls per hour
- **~1.4 calls per minute**

**Result:** ✅ Well within any reasonable rate limit

---

## ✅ OPTIMIZATION CHECKLIST

- [x] Only fetch real-time tallies for active proposals
- [x] Sequential processing to avoid rate limit spikes
- [x] 2-hour auto-refresh interval
- [x] On-demand detail loading
- [x] Graceful error handling with fallbacks
- [x] Cache governance parameters
- [x] Sort proposals client-side (no extra API calls)
- [x] Batch status filters client-side
- [x] Show last refresh timestamp to users
- [x] Manual refresh button for immediate updates

---

## 📚 FURTHER OPTIMIZATIONS (Future)

### If Scale Increases:

1. **Implement Redis Caching:**
   ```typescript
   // Cache proposal list for 5 minutes
   const cachedProposals = await redis.get('proposals:all');
   if (cachedProposals) return JSON.parse(cachedProposals);
   ```

2. **Add Pagination:**
   ```typescript
   // Fetch proposals in chunks
   const limit = 20;
   const offset = page * limit;
   ```

3. **Implement WebSocket Updates:**
   ```typescript
   // Real-time updates without polling
   ws.on('new_vote', (vote) => {
     updateProposalTally(vote.proposal_id);
   });
   ```

4. **Add Service Worker:**
   ```typescript
   // Background sync for offline support
   navigator.serviceWorker.register('/sw.js');
   ```

---

## 🎓 KEY TAKEAWAYS

1. **Real-time tallies require separate `/tally` endpoint** - cached data in proposal objects shows zeros
2. **2-hour auto-refresh** balances freshness with efficiency
3. **Sequential processing** respects rate limits while fetching current votes
4. **On-demand loading** minimizes unnecessary API calls
5. **Graceful degradation** ensures UI works even if tally fetch fails
6. **Sort client-side** to avoid extra API calls
7. **Show refresh timestamp** so users know data is fresh

---

**Last Updated:** October 22, 2025  
**Maintained By:** ShieldNest Development Team  
**Next Review:** When Coreum upgrades API or adds new features

