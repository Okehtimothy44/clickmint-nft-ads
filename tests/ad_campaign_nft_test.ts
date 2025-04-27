import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

// Constant Error Codes from the Contract
const ERR_UNAUTHORIZED = 1000;
const ERR_CAMPAIGN_NOT_FOUND = 1001;
const ERR_INVALID_CAMPAIGN_DATA = 1002;
const ERR_CAMPAIGN_ALREADY_EXISTS = 1003;
const ERR_TRANSFER_FAILED = 1004;
const ERR_INVALID_METRICS = 1005;

Clarinet.test({
  name: "Mint Ad Campaign NFT: Successful Minting",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    const block = chain.mineBlock([
      Tx.contractCall('ad_campaign_nft', 'mint-ad-campaign', [
        types.ascii('TestCampaign'),     // name
        types.ascii('Tech Enthusiasts'),  // target-audience
        types.uint(1672531200),           // start-date (Jan 1, 2023)
        types.uint(1675209600)            // end-date (Feb 1, 2023)
      ], deployer.address)
    ]);

    block.receipts[0].result.expectOk().expectUint(1);
  }
});

Clarinet.test({
  name: "Mint Ad Campaign NFT: Prevent Invalid Date Range",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    const block = chain.mineBlock([
      Tx.contractCall('ad_campaign_nft', 'mint-ad-campaign', [
        types.ascii('InvalidCampaign'),
        types.ascii('Tech Enthusiasts'),
        types.uint(1675209600),  // end-date first
        types.uint(1672531200)   // start-date second (reversed)
      ], deployer.address)
    ]);

    block.receipts[0].result.expectErr().expectUint(ERR_INVALID_CAMPAIGN_DATA);
  }
});

Clarinet.test({
  name: "NFT Transfer: Successful Transfer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;

    // First mint an NFT
    const mintBlock = chain.mineBlock([
      Tx.contractCall('ad_campaign_nft', 'mint-ad-campaign', [
        types.ascii('TestCampaign'),
        types.ascii('Tech Enthusiasts'),
        types.uint(1672531200),
        types.uint(1675209600)
      ], deployer.address)
    ]);

    // Then transfer the NFT
    const transferBlock = chain.mineBlock([
      Tx.contractCall('ad_campaign_nft', 'transfer', [
        types.uint(1),           // token-id
        types.principal(deployer.address),  // sender
        types.principal(wallet1.address)    // recipient
      ], deployer.address)
    ]);

    transferBlock.receipts[0].result.expectOk().expectBool(true);

    // Verify new owner
    const ownerResult = chain.callReadOnlyFn(
      'ad_campaign_nft', 
      'get-owner', 
      [types.uint(1)], 
      deployer.address
    );
    ownerResult.result.expectSome().expectPrincipal(wallet1.address);
  }
});

Clarinet.test({
  name: "NFT Transfer: Prevent Unauthorized Transfer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;

    // First mint an NFT
    const mintBlock = chain.mineBlock([
      Tx.contractCall('ad_campaign_nft', 'mint-ad-campaign', [
        types.ascii('TestCampaign'),
        types.ascii('Tech Enthusiasts'),
        types.uint(1672531200),
        types.uint(1675209600)
      ], deployer.address)
    ]);

    // Try to transfer NFT from another account
    const transferBlock = chain.mineBlock([
      Tx.contractCall('ad_campaign_nft', 'transfer', [
        types.uint(1),           // token-id
        types.principal(deployer.address),  // sender
        types.principal(wallet1.address)    // recipient
      ], wallet2.address)  // Using unauthorized sender
    ]);

    transferBlock.receipts[0].result.expectErr().expectUint(ERR_UNAUTHORIZED);
  }
});

Clarinet.test({
  name: "Campaign Metadata: Retrieve Campaign Details",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;

    // Mint a campaign
    const mintBlock = chain.mineBlock([
      Tx.contractCall('ad_campaign_nft', 'mint-ad-campaign', [
        types.ascii('Marketing Campaign'),
        types.ascii('Tech Professionals'),
        types.uint(1672531200),
        types.uint(1675209600)
      ], deployer.address)
    ]);

    // Retrieve campaign details
    const campaignDetails = chain.callReadOnlyFn(
      'ad_campaign_nft', 
      'get-campaign-details', 
      [types.uint(1)], 
      deployer.address
    );

    campaignDetails.result.expectSome();
    const details = campaignDetails.result.expectTuple();
    
    assertEquals(details.name, 'Marketing Campaign');
    assertEquals(details['target-audience'], 'Tech Professionals');
  }
});

Clarinet.test({
  name: "Performance Metrics: Update Metrics by Creator",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;

    // Mint a campaign
    const mintBlock = chain.mineBlock([
      Tx.contractCall('ad_campaign_nft', 'mint-ad-campaign', [
        types.ascii('TestCampaign'),
        types.ascii('Tech Enthusiasts'),
        types.uint(1672531200),
        types.uint(1675209600)
      ], deployer.address)
    ]);

    // Update metrics
    const updateBlock = chain.mineBlock([
      Tx.contractCall('ad_campaign_nft', 'update-campaign-metrics', [
        types.uint(1),      // token-id
        types.uint(1000),   // impressions
        types.uint(50),     // clicks
        types.uint(10)      // conversions
      ], deployer.address)
    ]);

    updateBlock.receipts[0].result.expectOk().expectBool(true);

    // Verify metrics were updated
    const campaignDetails = chain.callReadOnlyFn(
      'ad_campaign_nft', 
      'get-campaign-details', 
      [types.uint(1)], 
      deployer.address
    );

    const details = campaignDetails.result.expectSome().expectTuple();
    const metrics = details['performance-metrics'].expectTuple();
    
    assertEquals(metrics.impressions, 1000);
    assertEquals(metrics.clicks, 50);
    assertEquals(metrics.conversions, 10);
  }
});

Clarinet.test({
  name: "Performance Metrics: Prevent Unauthorized Metric Updates",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    // Mint a campaign
    const mintBlock = chain.mineBlock([
      Tx.contractCall('ad_campaign_nft', 'mint-ad-campaign', [
        types.ascii('TestCampaign'),
        types.ascii('Tech Enthusiasts'),
        types.uint(1672531200),
        types.uint(1675209600)
      ], deployer.address)
    ]);

    // Try to update metrics from another account
    const updateBlock = chain.mineBlock([
      Tx.contractCall('ad_campaign_nft', 'update-campaign-metrics', [
        types.uint(1),      // token-id
        types.uint(1000),   // impressions
        types.uint(50),     // clicks
        types.uint(10)      // conversions
      ], wallet1.address)
    ]);

    updateBlock.receipts[0].result.expectErr().expectUint(ERR_UNAUTHORIZED);
  }
});

Clarinet.test({
  name: "Royalty Mechanism: Verify Creator Tracking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;

    // Mint a campaign
    const mintBlock = chain.mineBlock([
      Tx.contractCall('ad_campaign_nft', 'mint-ad-campaign', [
        types.ascii('TestCampaign'),
        types.ascii('Tech Enthusiasts'),
        types.uint(1672531200),
        types.uint(1675209600)
      ], deployer.address)
    ]);

    // Retrieve royalty recipient
    const royaltyRecipient = chain.callReadOnlyFn(
      'ad_campaign_nft', 
      'get-royalty-recipient', 
      [types.uint(1)], 
      deployer.address
    );

    royaltyRecipient.result.expectSome().expectPrincipal(deployer.address);
  }
});

Clarinet.test({
  name: "Contract Ownership: Transfer Ownership",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    // Transfer contract ownership
    const transferOwnershipBlock = chain.mineBlock([
      Tx.contractCall('ad_campaign_nft', 'transfer-contract-ownership', [
        types.principal(wallet1.address)
      ], deployer.address)
    ]);

    transferOwnershipBlock.receipts[0].result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "Contract Ownership: Prevent Unauthorized Ownership Transfer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;

    // Try to transfer ownership from unauthorized account
    const transferOwnershipBlock = chain.mineBlock([
      Tx.contractCall('ad_campaign_nft', 'transfer-contract-ownership', [
        types.principal(wallet2.address)
      ], wallet1.address)
    ]);

    transferOwnershipBlock.receipts[0].result.expectErr().expectUint(ERR_UNAUTHORIZED);
  }
});