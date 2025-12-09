# QLTTokenReceiver – Single-Transaction QLToken Farming (Fuji / AVAX Testnet)

This assignment implements a small helper contract and script to interact with an existing **Minter** contract on **Avalanche Fuji testnet**.

## 🎯 Assignment Summary

Given:

- **USDTqL**: `0x11Dc55cF35F472B363eEa3bdec5895c4edd270f1`
- **QLToken**: `0xc2351Bf4f0e5e8Eccc02e88D63969ad08eaD1132`
- **Minter**: `0x27ca088aE7F52889f97323fd8234D9aD67a5697f`

Behavior:

- For every **1 wei of AVAX** you send to `getUSD()` (payable) on `Minter`, you receive **100 USDTqL** tokens.
- For every **1 USDTqL** deposited via `getQLToken(uint amount)`, you receive **1 QLToken`.

👉 **Goal**:  
Create a contract that, in **a single transaction**, results in you receiving **1,000,000 QLTokens**.

---

## 🧩 How `QLTTokenReceiver` Works

### Contract: `Fuji-Awax.sol`

```solidity
contract QLTTokenReceiver {
    IMinter public minter;
    IERC20 public usdtql;
    IERC20 public qltoken;

    constructor(address _minterAddress, address _usdtqlAddress, address _qltokenAddress) {
        minter = IMinter(_minterAddress);
        usdtql = IERC20(_usdtqlAddress);
        qltoken = IERC20(_qltokenAddress);
    }

    function convert() external payable {
        require(msg.value == 10000, "Send exactly 10,000 wei AVAX");

        // 1) Call Minter to get USDTqL
        minter.getUSD{value: msg.value}(); // 10,000 wei → 10,000 * 100 = 1,000,000 USDTqL

        // 2) Approve Minter to pull USDTqL from this contract
        usdtql.approve(address(minter), 1_000_000);

        // 3) Convert USDTqL to QLToken in a single call
        minter.getQLToken(1_000_000);

        // 4) Send resulting QLToken to the user
        qltoken.transfer(msg.sender, 1_000_000);
    }
}
```

Flow in one transaction (user calls ```convert```):

1. User sends 10,000 wei AVAX to ```convert()```.

2. ```convert()``` calls ```minter.getUSD{value: msg.value}()```:
   - Minter mints ```msg.value * 100``` = ```10,000 * 100 = 1,000,000``` USDTqL to this contract.

3. Contract approves Minter to spend ```1,000,000``` USDTqL.
4. Contract calls ```minter.getQLToken(1_000,000)```:
   - Minter mints ```1,000,000``` QLToken to this contract.

5. Contract transfers ```1,000,000``` QLToken to the original caller.

Result: Caller receives <b>1,000,000 QLToken</b> in <b>one atomic transaction</b>.

## 🛠 Hardhat Setup
### Install dependencies
If not already done:

```
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-verify dotenv
npx hardhat       
```
Ensure:

- ```contracts/Fuji-Awax.sol```

- ```scripts/deploy.js```

- ```hardhat.config.js```

### Environment variables

Create ```.env```:

```bash
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
SNOWTRACE_API_KEY=YOUR_SNOWTRACE_API_KEY_HERE
```
---

## 🚀 Deployment & Interaction (Fuji)
### Compile
```bash
npx hardhat compile
```
### Deploy to Fuji

Example script snippet (in ```scripts/deploy.js```):
```js
const { ethers } = require("hardhat");

async function main() {
  const minterAddress = "0x27ca088aE7F52889f97323fd8234D9aD67a5697f";
  const usdtqlAddress = "0x11Dc55cF35F472B363eEa3bdec5895c4edd270f1";
  const qltokenAddress = "0xc2351Bf4f0e5e8Eccc02e88D63969ad08eaD1132";

  const QLTTokenReceiver = await ethers.getContractFactory("QLTTokenReceiver");
  const qltReceiver = await QLTTokenReceiver.deploy(minterAddress, usdtqlAddress, qltokenAddress);

  await qltReceiver.waitForDeployment();
  console.log("QLTTokenReceiver deployed to:", await qltReceiver.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Run:
```bash
npx hardhat run scripts/deploy.js --network fuji
```

Copy the deployed address from the log.

---

## Converting to QLToken (Single Transaction)

Once deployed, you can:

- Call ```convert()``` from your wallet or using a script, sending exactly <b>10,000 wei</b> of AVAX:

Or directly via a frontend/wallet (using the ABI).

---

## Verification

With Snowtrace (Fuji):

Add ```SNOWTRACE_API_KEY``` to ```.env```, then you can use:
```bash
npx hardhat verify --network fuji <QLTTokenReceiver_address> \
  0x27ca088aE7F52889f97323fd8234D9aD67a5697f \
  0x11Dc55cF35F472B363eEa3bdec5895c4edd270f1 \
  0xc2351Bf4f0e5e8Eccc02e88D63969ad08eaD1132
```