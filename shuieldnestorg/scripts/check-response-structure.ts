#!/usr/bin/env tsx

/**
 * Check the exact response structure from factory queries
 */

const COREUM_REST_API = "https://full-node.mainnet-1.coreum.dev:1317";

async function checkResponseStructure(factoryAddress: string, factoryName: string) {
  console.log(`\n🔍 Checking ${factoryName} response structure`);
  console.log('==============================================');
  
  try {
    const query = { pairs: { limit: 3 } };
    const queryBase64 = Buffer.from(JSON.stringify(query)).toString("base64");
    const url = `${COREUM_REST_API}/cosmwasm/wasm/v1/contract/${factoryAddress}/smart/${queryBase64}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.log(`❌ Response not OK: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    console.log(`📊 Full response structure:`);
    console.log(JSON.stringify(data, null, 2));
    
    console.log(`\n🔍 Data analysis:`);
    console.log(`- Top level keys: ${Object.keys(data)}`);
    
    if (data.data) {
      console.log(`- data keys: ${Object.keys(data.data)}`);
      
      if (data.data.pairs) {
        console.log(`- pairs type: ${typeof data.data.pairs}`);
        console.log(`- pairs length: ${Array.isArray(data.data.pairs) ? data.data.pairs.length : 'not array'}`);
        
        if (Array.isArray(data.data.pairs) && data.data.pairs.length > 0) {
          console.log(`- First pair structure:`);
          console.log(JSON.stringify(data.data.pairs[0], null, 2));
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ Error:`, error);
  }
}

async function main() {
  console.log('🚀 RESPONSE STRUCTURE CHECK');
  console.log('============================');
  
  await checkResponseStructure(
    "core1t0253v8aam0hdg72m09jpswzy3592e9h5u0kuhqvsm67fxrq74dsk4xpng",
    "Pulsara DEX"
  );
  
  await checkResponseStructure(
    "core1gjgyvxzqnjnx8rs2yrdry6slkn50xy2xpft8cgzgq5mvmcq797vsj0qsun",
    "Cruise Control DEX"
  );
}

main().catch(console.error);
