# QLTTokenReceiver

A single transaction that turns 10,000 wei of AVAX into 1,000,000 QLTokens on the Avalanche Fuji testnet.

![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636?logo=solidity&logoColor=white)
![Hardhat](https://img.shields.io/badge/Hardhat-2.22-FFF100?logo=hardhat&logoColor=black)
![Network](https://img.shields.io/badge/Network-Avalanche%20Fuji-E84142?logo=avalanche&logoColor=white)

## Overview

This project solves a small but realistic on-chain composition problem: chain three dependent token operations together so they either all succeed or all revert, inside one atomic transaction.

There is an existing `Minter` contract deployed on Fuji that exposes two steps:

1. `getUSD()` (payable): for every 1 wei of AVAX sent, it mints 100 USDTqL to the caller.
2. `getQLToken(uint amount)`: it burns/pulls USDTqL from the caller and mints an equal amount of QLToken in return.

Doing this by hand means sending AVAX, waiting for confirmation, approving USDTqL, then calling the converter, which is three separate transactions with three chances to fail or be front-run partway through.

`QLTTokenReceiver` collapses all of that into a single `convert()` call. The caller sends exactly 10,000 wei of AVAX once, and the contract performs the mint, the approval, the conversion, and the final payout in one transaction. Because everything happens in one call, the operation is atomic: if any step reverts, the whole thing reverts and no partial state is left behind.

The math:

- 10,000 wei AVAX, multiplied by 100, gives 1,000,000 USDTqL.
- 1,000,000 USDTqL, converted 1 to 1, gives 1,000,000 QLToken.

## Contract

Source: [`Contracts/Fuji_AVAX.sol`](Contracts/Fuji_AVAX.sol)

`QLTTokenReceiver` is constructed with three addresses (the `Minter`, the USDTqL token, and the QLToken) and stores each as a typed interface. Its single entry point is `convert()`:

```solidity
function convert() external payable {
    require(msg.value == 10000, "Send exactly 10,000 wei AVAX");

    minter.getUSD{value: msg.value}();      // mints 10,000 * 100 = 1,000,000 USDTqL to this contract
    usdtql.approve(address(minter), 1000000); // lets Minter pull the USDTqL back
    minter.getQLToken(1000000);             // mints 1,000,000 QLToken to this contract
    qltoken.transfer(msg.sender, 1000000);  // forwards the QLToken to the caller
}
```

Step by step, within one transaction:

1. The caller sends exactly 10,000 wei of AVAX to `convert()`. Any other amount reverts.
2. The contract forwards that AVAX to `minter.getUSD()`, receiving 1,000,000 USDTqL.
3. The contract approves the `Minter` to spend its USDTqL.
4. The contract calls `minter.getQLToken(1000000)`, receiving 1,000,000 QLToken.
5. The contract transfers the 1,000,000 QLToken to the original caller.

The USDTqL and QLToken interactions use a minimal local `IERC20` interface (`approve`, `balanceOf`, `transfer`), and the `Minter` is accessed through a minimal `IMinter` interface (`getUSD`, `getQLToken`).

### Reference addresses (Avalanche Fuji testnet)

| Contract | Address |
| --- | --- |
| Minter   | `0x27ca088aE7F52889f97323fd8234D9aD67a5697f` |
| USDTqL   | `0x11Dc55cF35F472B363eEa3bdec5895c4edd270f1` |
| QLToken  | `0xc2351Bf4f0e5e8Eccc02e88D63969ad08eaD1132` |

## Tech stack

- Solidity 0.8.28
- Hardhat 2.22
- @nomicfoundation/hardhat-toolbox (ethers, testing, and tooling)
- @nomicfoundation/hardhat-verify (Snowtrace and Sourcify verification)
- dotenv (environment configuration)
- Avalanche Fuji C-Chain testnet

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the project root (see [Environment variables](#environment-variables) below).

### 3. Compile

```bash
npx hardhat compile
```

### 4. Run the script

The script in [`script/deploy.js`](script/deploy.js) targets the Fuji network. By default it attaches to an already deployed `QLTTokenReceiver` instance and logs its address and configured QLToken address. To deploy a fresh instance instead, uncomment the `deploy(...)` line in the script (passing the Minter, USDTqL, and QLToken addresses to the constructor) and use that returned contract.

```bash
npx hardhat run script/deploy.js --network fuji
```

After deployment, the converter is exercised by calling `convert()` on the deployed contract with exactly 10,000 wei of AVAX attached, from a wallet, a script, or any frontend using the contract ABI.

> Note: this repository does not include a test suite. `npx hardhat test` will run with no tests until one is added.

### Verifying on Snowtrace (optional)

With `SNOWTRACE_API_KEY` set, the deployed contract can be verified by passing the three constructor arguments:

```bash
npx hardhat verify --network fuji <deployed_address> \
  0x27ca088aE7F52889f97323fd8234D9aD67a5697f \
  0x11Dc55cF35F472B363eEa3bdec5895c4edd270f1 \
  0xc2351Bf4f0e5e8Eccc02e88D63969ad08eaD1132
```

## Environment variables

Configuration is loaded from a `.env` file via `dotenv` and read in [`hardhat.config.js`](hardhat.config.js). The `.env` file is git-ignored and must never be committed.

| Variable | Required | Purpose |
| --- | --- | --- |
| `PRIVATE_KEY` | Yes | Private key of the deploying/interacting account, used as the signer for the Fuji network. Fund it with Fuji testnet AVAX. |
| `SNOWTRACE_API_KEY` | For verification | API key used by `hardhat-verify` to verify the contract source on Snowtrace. |

The Fuji RPC endpoint (`https://api.avax-test.network/ext/bc/C/rpc`) is hardcoded in `hardhat.config.js` and does not require an environment variable.

Example `.env`:

```bash
PRIVATE_KEY=your_private_key_here
SNOWTRACE_API_KEY=your_snowtrace_api_key_here
```

## Author

Krish Ojha
