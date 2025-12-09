require("dotenv").config();
const { ethers } = require("hardhat");
const hre = require("hardhat");


async function main() {
    const minterAddress = "0x27ca088aE7F52889f97323fd8234D9aD67a5697f";
    const usdtqlAddress = "0x11Dc55cF35F472B363eEa3bdec5895c4edd270f1";
    const qltokenAddress = "0xc2351Bf4f0e5e8Eccc02e88D63969ad08eaD1132";

    const QLTTokenReceiver = await ethers.getContractFactory("QLTTokenReceiver");
    // const qltReceiver = await QLTTokenReceiver.deploy(minterAddress, usdtqlAddress, qltokenAddress);
    
    const qltReceiver = await ethers.getContractAt("QLTTokenReceiver", "0xf06051a358be1f2a6ffDf8F6B0F1092A96689656")//what will happen if you pass a wrong abi method 
    console.log(`QLTTokenReceiver deployed to , ${await qltReceiver.getAddress()}`);
    console.log("OLT TOKEN: ", await qltReceiver.qltoken());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
