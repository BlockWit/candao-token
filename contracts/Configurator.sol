// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./RecoverableFunds.sol";
import "./CandaoToken.sol";
import "./CommonSale.sol";
import "./FreezeTokenWallet.sol";

contract Configurator is RecoverableFunds {
    using Address for address;

    struct StageParams {
        uint256 start;              // unix timestamp
        uint256 end;                // unix timestamp
        uint256 bonus;              // percent
        uint256 minInvestmentLimit; // wei
        uint256 hardcapInTokens;    // wei
    }
    
    struct WalletParams {
        address owner;
        uint256 startDate; // unix timestamp
        uint256 duration;  // days
        uint256 interval;  // days
    }

    address private constant OWNER_ADDRESS      = address(0x05156E01Da01229ebe38aEacfFECeDb146100bF1);
    address private constant DEPLOYER_ADDRESS   = address(0x299C851896d1740bA10f31c5aE15425bd24c12D5);
    address payable constant ETH_WALLET_ADDRESS = payable(0x299C851896d1740bA10f31c5aE15425bd24c12D5);

    uint256[] private supplies = [
        // casual eth wallets
        125000000 * 1 ether, // SEED 1
        250000000 * 1 ether, // DAO 2
        210000000 * 1 ether, // CONTENT MINING
        200000000 * 1 ether, // LIQUIDITY POOL
        50000000  * 1 ether, // FOUNDATION 1
        150000000 * 1 ether, // TEAM
        10000000  * 1 ether, // MARKETING 2
        40000000  * 1 ether, // ADVISORS
        // auto-generated addresses
        200000000 * 1 ether, // SALE
        125000000 * 1 ether, // SEED 2
        250000000 * 1 ether, // SEED 3
        150000000 * 1 ether, // DAO 1
        100000000 * 1 ether, // FOUNDATION 2
        100000000 * 1 ether  // MARKETING 1
    ];

    address[] private accounts = [
        0xe084a16766cd408cb41562b5A8a0cA5B6E88aB60, // SEED 1
        0xe084a16766cd408cb41562b5A8a0cA5B6E88aB60, // DAO 2
        0x5D6b8030a91a96B0c7D133fD5612022b39a67e2f, // CONTENT MINING
        0xCd2090Af0c24f8C6E5C8DE4D7B01C48675FAC315, // LIQUIDITY POOL
        0xc16eE06F206F207341B2A27D6A7368F6D5D21156, // FOUNDATION 1
        0x819561272D3474Fb6e3f316c2668ec5D2F63dDD5, // TEAM
        0x19F5D82cb05154881bb00d0C8d9Be309e552f489, // MARKETING 2
        0x27645c1A856780c98FEc2d973339a724962e9bD2  // ADVISORS
    ];

    address public tokenAddress;
    address payable public saleAddress;
    address[] public walletAddresses;
    address[] private whitelist;
    uint8 deploymentStep = 1;
    
    // create sale
    function step1() public onlyOwner {
        require(deploymentStep == 1, "wrong deployment order");
        uint256 PRICE = 16253;
        StageParams[6] memory stageParams = [
            StageParams(1629068400000,1629673200000,700,30000000000000000,18480000),
            StageParams(1629673200000,1630278000000,434,30000000000000000,27720000),
            StageParams(1630278000000,1630882800000,300,30000000000000000,37800000),
            StageParams(1630882800000,1631487600000,100,30000000000000000,18700000),
            StageParams(1631487600000,1632092400000,34, 30000000000000000,28050000),
            StageParams(1632092400000,1632697200000,700,30000000000000000,38250000)
        ];
        CommonSale sale = new CommonSale();
        sale.setWallet(ETH_WALLET_ADDRESS);
        sale.setPrice(PRICE);
        for (uint8 i = 0; i < stageParams.length; i++) {
            sale.addStage(stageParams[i].start, stageParams[i].end, stageParams[i].bonus, stageParams[i].minInvestmentLimit, 0, 0, stageParams[i].hardcapInTokens);
        }
        saleAddress = payable(sale);
        accounts.push(address(sale));
        whitelist.push(address(sale));
        deploymentStep++;
    }
    
    // create wallets
    function step2() public onlyOwner {
        require(deploymentStep == 2, "wrong deployment order");
        WalletParams[5] memory walletParams = [
            WalletParams(0xe084a16766cd408cb41562b5A8a0cA5B6E88aB60, 1629061200000, 132, 132), // SEED 2
            WalletParams(0xe084a16766cd408cb41562b5A8a0cA5B6E88aB60, 1629061200000, 222, 222), // SEED 3
            WalletParams(0xe084a16766cd408cb41562b5A8a0cA5B6E88aB60, 1629061200000, 365, 365), // DAO 1
            WalletParams(0x5D6b8030a91a96B0c7D133fD5612022b39a67e2f, 1629061200000, 1826, 90), // FOUNDATION 2
            WalletParams(0xc16eE06F206F207341B2A27D6A7368F6D5D21156, 1629061200000, 730, 90)   // MARKETING 1
        ];
        for (uint8 i = 0; i < walletParams.length; i++) {
            FreezeTokenWallet wallet = new FreezeTokenWallet();
            wallet.setStartDate(walletParams[i].startDate);
            wallet.setDuration(walletParams[i].duration);
            wallet.setInterval(walletParams[i].interval);
            walletAddresses.push(address(wallet));
            accounts.push(address(wallet));
        }
        deploymentStep++;
    }

    // create token
    function step3() public onlyOwner {
        require(deploymentStep == 3, "wrong deployment order");
        CandaoToken token = new CandaoToken("Candao", "CDO", accounts, supplies);
        token.pause();
        token.addToWhitelist(whitelist);
        token.transferOwnership(OWNER_ADDRESS);
        tokenAddress = address(token);
        // finish wallets configuration
        for (uint8 i = 0; i < walletAddresses.length; i++) {
            FreezeTokenWallet wallet = FreezeTokenWallet(walletAddresses[i]);
            wallet.setToken(address(token));
            wallet.transferOwnership(OWNER_ADDRESS);
        }
        // finish sale configuration
        CommonSale sale = CommonSale(saleAddress);
        sale.setToken(address(token));
        sale.transferOwnership(OWNER_ADDRESS);
        
        deploymentStep++;
    }

}

