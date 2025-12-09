// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IMinter {
    function getUSD() external payable;//msg.value*100 and then mint this amount of token to msg.sender 

    function getQLToken(uint amount) external;//equalent token will be minted for the contrcat in place of 1USDTql token
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
}

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

        minter.getUSD{value: msg.value}(); //10000 * 100

        usdtql.approve(address(minter), 1000000);

        minter.getQLToken(1000000); //mints the equivalent amaount of QLTokens

        qltoken.transfer(msg.sender, 1000000); //sending 1000000 tokens to our account from this account
    }
}