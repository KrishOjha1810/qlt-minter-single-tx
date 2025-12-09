require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");

require("dotenv").config();
const PRIVATE_KEY = process.env.PRIVATE_KEY
const SNOWTRACE_API_KEY = process.env.SNOWTRACE_API_KEY;

module.exports = {
  solidity: "0.8.28",

  networks: {
    fuji: {
      url: `https://api.avax-test.network/ext/bc/C/rpc`, 
      accounts: [`${PRIVATE_KEY}`],
    }, 
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: SNOWTRACE_API_KEY
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: true
  }
};
