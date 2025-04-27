# clickmint-nft-ads

NFT platform for transparent and trackable online ad campaigns using Stacks blockchain

## Project Overview

The `clickmint-nft-ads` project is a decentralized platform that leverages Stacks blockchain technology to provide a transparent and trackable system for online advertising campaigns using NFTs. This project aims to address the lack of transparency and accountability in the current online advertising industry by using the immutable and auditable nature of blockchain to record ad campaign metrics and ensure fair compensation for content creators and publishers.

Key features of the project include:

- Minting of NFTs to represent individual ad campaigns
- Tracking of ad impressions, clicks, and other metrics on-chain
- Automated royalty payments to content creators and publishers
- Transparent reporting and analytics for advertisers and publishers
- Support for various ad formats and integration with existing ad networks

## Contract Architecture

The core of the `clickmint-nft-ads` project is the `ad_campaign_nft` contract, which is responsible for managing the lifecycle of ad campaign NFTs. The contract's main functionalities include:

**Data Structures**:
- `ad_campaigns`: A map that stores information about each ad campaign NFT, including the campaign metadata, metrics, and royalty settings.
- `ad_campaign_owners`: A map that tracks the current owner of each ad campaign NFT.

**Public Functions**:
- `mint-ad-campaign`: Allows advertisers to mint a new ad campaign NFT with the specified metadata and settings.
- `update-campaign-metrics`: Enables publishers and ad platforms to update the ad impression and click metrics for a campaign NFT.
- `transfer-campaign`: Facilitates the transfer of ownership for an ad campaign NFT.
- `withdraw-royalties`: Allows content creators and publishers to withdraw their earned royalties.

The contract also includes various security checks and asserts to ensure the integrity of the data and prevent unauthorized actions.

## Installation & Setup

To set up the `clickmint-nft-ads` project, you'll need the following prerequisites:

- Clarinet: A development environment for Clarity smart contracts
- Stacks CLI: A command-line tool for interacting with the Stacks blockchain

1. Install Clarinet and the Stacks CLI following the official documentation.
2. Clone the `clickmint-nft-ads` repository to your local machine.
3. Navigate to the project directory and run `clarinet checkout` to install the project dependencies.
4. Use `clarinet watch` to start the development server and begin testing the contracts.

## Usage Guide

### Minting a New Ad Campaign NFT

To mint a new ad campaign NFT, follow these steps:

1. Prepare the campaign metadata, including the ad format, target audience, and other relevant details.
2. Call the `mint-ad-campaign` function, passing in the campaign metadata as arguments.
3. The contract will mint a new NFT representing the ad campaign and assign the initial ownership to the calling principal.

### Updating Campaign Metrics

As the ad campaign runs, publishers and ad platforms can update the metrics (impressions, clicks, etc.) by calling the `update-campaign-metrics` function, passing in the campaign NFT ID and the new metric values.

### Transferring Ownership

To transfer ownership of an ad campaign NFT, the current owner can call the `transfer-campaign` function, passing in the campaign NFT ID and the new owner's address.

### Withdrawing Royalties

Content creators and publishers can withdraw their earned royalties by calling the `withdraw-royalties` function, passing in their principal address.

## Testing

The `clickmint-nft-ads` project includes a comprehensive test suite located in the `/workspace/tests/ad_campaign_nft_test.ts` file. The tests cover the following scenarios:

- Minting of new ad campaign NFTs
- Updating campaign metrics
- Transferring ownership of ad campaign NFTs
- Withdrawing royalties
- Edge cases and error handling

To run the tests, use the `clarinet test` command from the project directory.

## Security Considerations

The `ad_campaign_nft` contract includes several security measures to ensure the integrity and safety of the platform:

- **Principal Authorization**: All sensitive functions, such as minting, transferring ownership, and withdrawing royalties, require the caller to be the authorized principal (the owner or a designated operator).
- **Data Validation**: The contract performs extensive input validation to ensure that all data, including campaign metadata and metric updates, is in the expected format and within reasonable bounds.
- **Reentrancy Guard**: The contract includes a reentrancy guard to prevent reentrancy attacks during critical operations.
- **Pausability**: The contract owner can pause the contract in case of an emergency or to perform maintenance.

Additionally, the project team recommends regular security audits and bug bounty programs to identify and address any potential vulnerabilities.
