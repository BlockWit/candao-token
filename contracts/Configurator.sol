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
        address         OWNER_ADDRESS      = address(0xe084a16766cd408cb41562b5A8a0cA5B6E88aB60);
        address payable ETH_WALLET_ADDRESS = payable(0x299C851896d1740bA10f31c5aE15425bd24c12D5);
        
        address[] memory accounts = new address[](14);
        uint256[] memory supplies = new uint256[](14);
        address[] memory whitelist = new address[](1);
        
        // casual eth accounts
        accounts[0] = 0x5D6b8030a91a96B0c7D133fD5612022b39a67e2f; // SEED 1
        accounts[1] = 0xCd2090Af0c24f8C6E5C8DE4D7B01C48675FAC315; // DAO 2
        accounts[2] = 0xc16eE06F206F207341B2A27D6A7368F6D5D21156; // CONTENT MINING
        accounts[3] = 0x819561272D3474Fb6e3f316c2668ec5D2F63dDD5; // LIQUIDITY POOL
        accounts[4] = 0x19F5D82cb05154881bb00d0C8d9Be309e552f489; // FOUNDATION 1
        accounts[5] = 0x27645c1A856780c98FEc2d973339a724962e9bD2; // TEAM
        accounts[6] = 0xdBB6e419c1A377B63dDfe5BB7B0B7636A4B99591; // MARKETING 2
        accounts[7] = 0x05156E01Da01229ebe38aEacfFECeDb146100bF1; // ADVISORS
        
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
        sale.addStage(1629068400000, 1629673200000, 500, 30000000000000000, 0, 0, 18480000000000000000000000);
        sale.addStage(1629673200000, 1630278000000, 300, 30000000000000000, 0, 0, 27720000000000000000000000);
        sale.addStage(1630278000000, 1630882800000, 200, 30000000000000000, 0, 0, 37800000000000000000000000);
        sale.addStage(1630882800000, 1631487600000, 50,  30000000000000000, 0, 0, 18700000000000000000000000);
        sale.addStage(1631487600000, 1632092400000, 20,  30000000000000000, 0, 0, 28050000000000000000000000);
        sale.addStage(1632092400000, 1632697200000, 0,   30000000000000000, 0, 0, 38250000000000000000000000);
        accounts[8] = address(sale);
        whitelist[0] = address(sale);

        // SEED 2 freeze wallet
        FreezeTokenWallet seed2 = new FreezeTokenWallet();
        seed2.setStartDate(1629061200000);
        seed2.setDuration(132);
        seed2.setInterval(132);
        wallets.push(seed2);
        accounts[9] = address(seed2);
        
        // SEED 3 freeze wallet
        FreezeTokenWallet seed3 = new FreezeTokenWallet();
        seed3.setStartDate(1629061200000);
        seed3.setDuration(222);
        seed3.setInterval(222);
        wallets.push(seed3);
        accounts[10] = address(seed3);

        // DAO 1 freeze wallet
        FreezeTokenWallet dao1 = new FreezeTokenWallet();
        dao1.setStartDate(1629061200000);
        dao1.setDuration(365);
        dao1.setInterval(365);
        wallets.push(dao1);
        accounts[11] = address(dao1);

        // FOUNDATION 2 freeze wallet
        FreezeTokenWallet foundation2 = new FreezeTokenWallet();
        foundation2.setStartDate(1629061200000);
        foundation2.setDuration(1826);
        foundation2.setInterval(90);
        wallets.push(foundation2);
        accounts[12] = address(foundation2);

        // MARKETING 1 freeze wallet
        FreezeTokenWallet marketing1 = new FreezeTokenWallet();
        marketing1.setStartDate(1629061200000);
        marketing1.setDuration(730);
        marketing1.setInterval(90);
        wallets.push(marketing1);
        accounts[13] = address(marketing1);
        
        // create token
        require(accounts.length == supplies.length, "wrong account array length");
        token = new CandaoToken("Candao", "CDO", accounts, supplies);
        token.pause();
        token.addToWhitelist(whitelist);
        token.transferOwnership(OWNER_ADDRESS);
        
        // finish wallets configuration
        address[5] memory walletOwners = [
            0xdb413DA3Dd431D7e7fe639db2C23509ca01e2C1E, // SEED 2
            0x52748C07c89813ecFFd54A3398525e0172f5A68c, // SEED 3
            0x26c8a8DB6881E549e62312fC63938AE39FAE32E6, // DAO 1
            0x3eF3f8975805aF6671104D9BCBDD4865b11111D7, // FOUNDATION 2
            0x39DBA2f245EFC6843B791805A5702E3c1B3fCcEe  // MARKETING 1
        ];
        for (uint8 i = 0; i < wallets.length; i++) {
            require(wallets.length == walletOwners.length, "wrong wallet array length");
            wallets[i].setToken(address(token));
            wallets[i].start();
            wallets[i].transferOwnership(walletOwners[i]);
        }
        
        // finish sale configuration
        sale.setToken(address(token));
        sale.transferOwnership(OWNER_ADDRESS);
    }

}

