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
        address         OWNER_ADDRESS      = address(0x4Cc2093B1170ECD7715319C2112bAcBb74F35d4C);
        address payable ETH_WALLET_ADDRESS = payable(0xA7b373baefD2af7091B0fD61183d0d15d5cf7683);
        
        address[] memory accounts = new address[](14);
        address[] memory walletOwners = new address[](5);
        uint256[] memory supplies = new uint256[](14);
        address[] memory whitelist = new address[](1);
        
        // casual eth accounts
        accounts[0] = 0x346060608839A703AB478e0433807EC8e8D0D990; // SEED 1
        accounts[1] = 0x9037Cb32705CeB0E66a8C0f27Fee3E16bddBa490; // DAO 2
        accounts[2] = 0x54EFd45a0d309561DaAeCB44Bc03b37488a795d3; // CONTENT MINING
        accounts[3] = 0x6e6A3F074A79216E92A8Bb8575b8dd4d0d2153Dd; // LIQUIDITY POOL
        accounts[4] = 0x92671CdA65721229C7b7C8682761e4e63cd2E653; // FOUNDATION 1
        accounts[5] = 0xA13b3C5d83d964afbA6Ad54b5D4C1Dc5Fedc7aEe; // TEAM
        accounts[6] = 0xe81d33ed9aB8dC64E58b89A182F45db67790920F; // MARKETING 2
        accounts[7] = 0x2128e74CE1b188031B260321ddACFa2Febc75916; // ADVISORS

        // owners of freeze wallets
        walletOwners[0] = 0xFb760925724A37C5afd524Deee873592A9EFcFB9; // SEED 2
        walletOwners[1] = 0xd168154FFbFbed411423b03bd406383dcF358fc9; // SEED 3
        walletOwners[2] = 0x5C338b684e78998Db78c1F8C98F50BDF271931e9; // DAO 1
        walletOwners[3] = 0x76DB0aDaADb296aB2Ceb2f566E78CD102F78B07e; // FOUNDATION 2
        walletOwners[4] = 0x2a68cD52038e3E6cEb2efE6e05644228CB77D9aE;  // MARKETING 1
        
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
        sale.addStage(1629068400, 1629673200, 500, 30000000000000000, 0, 0, 18480000000000000000000000);
        sale.addStage(1629673200, 1630278000, 300, 30000000000000000, 0, 0, 27720000000000000000000000);
        sale.addStage(1630278000, 1630882800, 200, 30000000000000000, 0, 0, 37800000000000000000000000);
        sale.addStage(1630882800, 1631487600, 50,  30000000000000000, 0, 0, 18700000000000000000000000);
        sale.addStage(1631487600, 1632092400, 20,  30000000000000000, 0, 0, 28050000000000000000000000);
        sale.addStage(1632092400, 1632697200, 0,   30000000000000000, 0, 0, 38250000000000000000000000);
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

