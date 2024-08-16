# Aisquare Assignment Decentralized Applications Portfolio

This repository contains three separate projects demonstrating various aspects of decentralized application (dApp) development, including NFT creation, DeFi platforms, and AI integration using blockchain technology.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Setup and Installation](#setup-and-installation)
3. [Assignment 1: NFT Integration](#assignment-1-nft-integration)
4. [Assignment 2: DeFi Platform](#assignment-2-defi-platform)
5. [Assignment 3: AI Integration](#assignment-3-ai-integration)
6. [Deployment Addresses](#deployment-addresses)

## Project Structure

The repository is organized into three main folders:

- `assignment01`: NFT contract implementation
- `assignment02_partA_DEFI`: DeFi platform contracts
- `assignment02_partB_AI`: AI integration using Chainlink Functions

## Setup and Installation

To set up and run the projects, follow these steps:

1. Clone the repository
2. Install dependencies:

3. Install dependencies: `yarn` or `npx install`

4. Run tests: `yarn test`

5. Deploy contracts: `yarn hardhat run scripts/deployfilename.js --network {NETWORK_NAME}`

6. Generate test coverage: `yarn hardhat coverage`

**Note:** For the AI integration project (`assignment02_partB_AI`), use the following command to simulate scripts: `yarn hardhat simulateScripts`

## Assignment 1: NFT Integration

### SPNFT Contract

The `SPNFT.sol` contract in the `assignment01/contracts` folder implements a customizable NFT (Non-Fungible Token) with the following features:

- ERC721 compliant with enumerable and burnable extensions
- Royalty support using ERC2981
- Access control for administrative functions
- Custom asset creation and destruction
- Delegated asset creation with royalty settings

Key functions:

- `createAsset`: Allows users to mint new NFTs
- `delegateAssetCreation`: Allows admins to create assets on behalf of users with royalty settings
- `destroyAsset`: Enables asset burning by owners or approved addresses

The contract uses OpenZeppelin libraries for security and standard compliance.

## Assignment 2: DeFi Platform

The DeFi platform consists of multiple contracts in the `assignment02_partA_DEFI/contracts` folder:

- `SimpleCoin.sol`: A basic ERC20 token implementation
- `SouSimpleStaking.sol`: A staking contract for earning rewards
- `SouSwap.sol`: A simple token swap implementation
- `SouSimpleLendingProtocol.sol`: A basic lending and borrowing protocol

This project implements a simple decentralized finance (DeFi) ecosystem consisting of four interconnected smart contracts. Each contract serves a specific purpose within the ecosystem, allowing users to engage in various financial activities such as token swapping, lending, borrowing, and staking.

### Contracts Overview

1. **SimpleCoin (ERC20 Token)**
   `SimpleCoin` is a basic ERC20 token implementation that serves as the native token for this DeFi ecosystem.

   Key features:

   - Standard ERC20 functionality (transfer, approve, etc.)
   - Minting capability with a designated `MINTER_ROLE`

   This token is used across the ecosystem, particularly as collateral in the lending protocol and as a stakeable asset in the staking contract.

2. **SouSwap (Decentralized Exchange)**
   `SouSwap` is a simple decentralized exchange (DEX) that allows users to swap between ETH and the SimpleCoin token.

   Key features:

   - Liquidity provision and withdrawal
   - Token-to-ETH and ETH-to-token swaps
   - Automated market maker (AMM) functionality

   This contract enables users to trade SimpleCoin for ETH and vice versa, providing liquidity to the ecosystem.

3. **SouSimpleLendingProtocol (Lending and Borrowing)**
   `SouSimpleLendingProtocol` is a basic lending and borrowing platform that uses USDC as the primary currency and SimpleCoin as collateral.

   Key features:

   - Deposit and withdraw USDC
   - Deposit SimpleCoin as collateral
   - Borrow USDC against SimpleCoin collateral
   - Repay borrowed USDC with interest
   - Liquidation mechanism for undercollateralized positions

   This contract allows users to lend USDC, earn interest, borrow USDC by providing SimpleCoin as collateral, and manages the associated risks through a liquidation mechanism.

4. **SimpleStaking (Staking Rewards)**
   `SimpleStaking` is a staking contract that enables users to stake their SimpleCoin tokens and earn interest over time.

   Key features:

   - Deposit SimpleCoin for staking
   - Withdraw staked SimpleCoin with accrued interest
   - Interest calculation based on time and amount staked

   This contract incentivizes users to hold and stake their SimpleCoin tokens, potentially reducing selling pressure and promoting long-term engagement with the ecosystem.

### Contract Interactions

The contracts in this ecosystem are interconnected in the following ways:

1. `SimpleCoin` is used across all other contracts:
   - As the tradable token in `SouSwap`
   - As collateral in `SouSimpleLendingProtocol`
   - As the stakeable asset in `SimpleStaking`
2. `SouSwap` provides liquidity and price discovery for SimpleCoin, which is crucial for:
   - Determining the collateral value in `SouSimpleLendingProtocol`
   - Potentially impacting the value of staked tokens in `SimpleStaking`
3. `SouSimpleLendingProtocol` uses `SouSwap` to determine the price of SimpleCoin in terms of USDC, which is essential for calculating collateral ratios and liquidation thresholds.
4. `SimpleStaking` may require the `MINTER_ROLE` of `SimpleCoin` to mint new tokens as interest rewards for stakers.

### Usage Flow

1. Users can obtain SimpleCoin by swapping ETH on `SouSwap`.
2. With SimpleCoin, users can:
   - Provide liquidity to `SouSwap` to earn trading fees
   - Deposit as collateral in `SouSimpleLendingProtocol` to borrow USDC
   - Stake in `SimpleStaking` to earn interest
3. Users can borrow USDC from `SouSimpleLendingProtocol` using their SimpleCoin as collateral.
4. Borrowed USDC can be used for various purposes or swapped back to ETH or SimpleCoin using `SouSwap`.
5. Users must manage their positions to avoid liquidation in the lending protocol and can withdraw their staked tokens with interest from the staking contract.

This ecosystem creates a simple yet interconnected DeFi environment, showcasing the basics of token swaps, lending, borrowing, and staking mechanisms.

## Assignment 3: AI Integration

### FunctionsConsumer Contract

The `FunctionsConsumer.sol` contract in the `assignment02_partB_AI/contracts` folder demonstrates the integration of Chainlink Functions to generate AI slogans and store them on the blockchain.

Key features:

- Utilizes Chainlink's decentralized oracle network to interact with off-chain AI services
- Generates slogans based on input parameters
- Stores the generated slogans on-chain for future reference

Note: The deployment of this contract encountered some issues, and further research into the Chainlink Functions documentation is required to resolve them.

## Deployment Addresses

(To be filled after successful deployment)

- SPNFT Contract: https://amoy.polygonscan.com/address/0x901EcD6FFcb03d1E8a6b993C27e39205fDC67526#code
- SimpleCoin Contract: [address]
- SouSimpleStaking Contract: [address]
- SouSwap Contract: [address]
- SouSimpleLendingProtocol Contract: [address]
