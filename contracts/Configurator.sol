// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./RecoverableFunds.sol";
import "./CandaoToken.sol";
import "./CommonSale.sol";
import "./FreezeTokenWallet.sol";

contract Configurator is RecoverableFunds {
    using Address for address;

    CandaoToken public token;
    CommonSale public sale;
    FreezeTokenWallet[] public wallets;
    
    constructor() {
        address         OWNER_ADDRESS      = address(0x0b2cBc8a2D434dc16818B0664Dd81e89fAA9c3AC);
        address payable ETH_WALLET_ADDRESS = payable(0xf83c2172950d2Cc6490F164bb08F2381C2CdEc82);
        
        address[] memory accounts = new address[](14);
        address[] memory walletOwners = new address[](5);
        uint256[] memory supplies = new uint256[](14);
        address[] memory whitelist = new address[](1);
        
        // casual eth accounts
        accounts[0] = 0x43Fa4fb5Fd9365242c0215C73B863aEE98128A7e; // SEED 1
        accounts[1] = 0xe74b3Ba0e474eA8EE89da99Ef38889ED229e8782; // DAO 2
        accounts[2] = 0x539e3b4Cf63685cB2aE9adA4414335EB0B496Aec; // CONTENT MINING
        accounts[3] = 0xe6Df6C96794063F2cC1Dc338908B2a04Ff29eBd4; // LIQUIDITY POOL
        accounts[4] = 0x3aCe47351C48a4971b62176Ef3538C51397a0d5E; // FOUNDATION 1
        accounts[5] = 0x5219Cc08E635e9764c8014D984d60Fb7Ed200EEB; // TEAM
        accounts[6] = 0x9Ce19eF683c3dA57C19a874d214073f0Cd3B7F71; // MARKETING 2
        accounts[7] = 0x05422B2b38ec652384F1b9dFA3487B2eeA58B544; // ADVISORS

        // owners of freeze wallets
        walletOwners[0] = 0x6A7770781F385395FF61Ae270f14Bd86394Af758; // SEED 2
        walletOwners[1] = 0x07eaFAea0061aB387C745fCCF10829c6E6cA21BD; // SEED 3
        walletOwners[2] = 0x469E58184BE25216d67d3654E0391437a31507d8; // DAO 1
        walletOwners[3] = 0xb014C01d196B3e2f95bEe8Fc59189928F7B547FE; // FOUNDATION 2
        walletOwners[4] = 0x656f76dd339345d77932Df5b3db1E64A4D9AF971;  // MARKETING 1
        
        // supplies for casual eth accounts
        supplies[0]  = 20_250_000  ether; // SEED 1
        supplies[1]  = 250_000_000 ether; // DAO 2
        supplies[2]  = 210_000_000 ether; // CONTENT MINING
        supplies[3]  = 200_000_000 ether; // LIQUIDITY POOL
        supplies[4]  = 50_000_000  ether; // FOUNDATION 1
        supplies[5]  = 150_000_000 ether; // TEAM
        supplies[6]  = 10_000_000  ether; // MARKETING 2
        supplies[7]  = 40_000_000  ether; // ADVISORS
        
        // supplies for auto-generated accounts (sale contract and freeze wallets)
        supplies[8]  = 169_000_000 ether; // SALE
        supplies[9]  = 20_250_000  ether; // SEED 2
        supplies[10] = 40_500_000  ether; // SEED 3
        supplies[11] = 150_000_000 ether; // DAO 1
        supplies[12] = 100_000_000 ether; // FOUNDATION 2
        supplies[13] = 90_000_000  ether; // MARKETING 1
        
        // create sale
        sale = new CommonSale();
        sale.setWallet(ETH_WALLET_ADDRESS);
        sale.setPrice(21674 ether);
        sale.addStage(1629068400, 1629673200, 500, 30000000000000000, 0, 0, 27972000000000000000000000);
        sale.addStage(1629673200, 1630278000, 300, 30000000000000000, 0, 0, 27972000000000000000000000);
        sale.addStage(1630278000, 1630882800, 200, 30000000000000000, 0, 0, 28056000000000000000000000);
        sale.addStage(1630882800, 1631487600, 50,  30000000000000000, 0, 0, 28305000000000000000000000);
        sale.addStage(1631487600, 1632092400, 20,  30000000000000000, 0, 0, 28305000000000000000000000);
        sale.addStage(1632092400, 1632697200, 0,   30000000000000000, 0, 0, 28390000000000000000000000);
        accounts[8] = address(sale);
        whitelist[0] = address(sale);

        // SEED 2 freeze wallet
        FreezeTokenWallet seed2 = new FreezeTokenWallet();
        seed2.setStartDate(1629061200);
        seed2.setDuration(132);
        seed2.setInterval(132);
        wallets.push(seed2);
        accounts[9] = address(seed2);
        
        // SEED 3 freeze wallet
        FreezeTokenWallet seed3 = new FreezeTokenWallet();
        seed3.setStartDate(1629061200);
        seed3.setDuration(222);
        seed3.setInterval(222);
        wallets.push(seed3);
        accounts[10] = address(seed3);

        // DAO 1 freeze wallet
        FreezeTokenWallet dao1 = new FreezeTokenWallet();
        dao1.setStartDate(1629061200);
        dao1.setDuration(365);
        dao1.setInterval(365);
        wallets.push(dao1);
        accounts[11] = address(dao1);

        // FOUNDATION 2 freeze wallet
        FreezeTokenWallet foundation2 = new FreezeTokenWallet();
        foundation2.setStartDate(1629061200);
        foundation2.setDuration(1826);
        foundation2.setInterval(90);
        wallets.push(foundation2);
        accounts[12] = address(foundation2);

        // MARKETING 1 freeze wallet
        FreezeTokenWallet marketing1 = new FreezeTokenWallet();
        marketing1.setStartDate(1629061200);
        marketing1.setDuration(730);
        marketing1.setInterval(90);
        wallets.push(marketing1);
        accounts[13] = address(marketing1);
        
        // create token
        require(accounts.length == supplies.length, "Configurator: wrong account array length");
        token = new CandaoToken("Candao", "CDO", accounts, supplies);
        token.pause();
        token.addToWhitelist(whitelist);
        token.transferOwnership(OWNER_ADDRESS);
        
        // finish wallets configuration
        for (uint8 i = 0; i < wallets.length; i++) {
            require(wallets.length == walletOwners.length, "Configurator: wrong wallet array length");
            wallets[i].setToken(address(token));
            wallets[i].start();
            wallets[i].transferOwnership(walletOwners[i]);
        }
        
        // finish sale configuration
        sale.setToken(address(token));
        sale.transferOwnership(OWNER_ADDRESS);
    }

}

