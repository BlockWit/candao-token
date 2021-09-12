// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./RecoverableFunds.sol";
import "./CandaoToken.sol";
import "./CommonSale.sol";

contract Configurator is RecoverableFunds {
    using Address for address;

    CandaoToken public token;
    CommonSale public sale;

    constructor() {
        address         OWNER_ADDRESS      = address(0xAdF3bFAcf63b401163FFbf1040B97C6d024c3c9A);
        address payable ETH_WALLET_ADDRESS = payable(0xf83c2172950d2Cc6490F164bb08F2381C2CdEc82);

        address[] memory accounts = new address[](7);
        uint256[] memory supplies = new uint256[](7);

        // casual eth accounts
        accounts[0] = 0xe74b3Ba0e474eA8EE89da99Ef38889ED229e8782; // DAO 1
        accounts[1] = 0xe74b3Ba0e474eA8EE89da99Ef38889ED229e8782; // DAO 2
        accounts[2] = 0x539e3b4Cf63685cB2aE9adA4414335EB0B496Aec; // CONTENT MINING
        accounts[3] = 0xe6Df6C96794063F2cC1Dc338908B2a04Ff29eBd4; // LIQUIDITY POOL
        accounts[4] = 0x3aCe47351C48a4971b62176Ef3538C51397a0d5E; // FOUNDATION 1
        accounts[5] = 0x3aCe47351C48a4971b62176Ef3538C51397a0d5E; // FOUNDATION 2

        // supplies for casual eth accounts and sale contract
        supplies[0] = 150_000_000 ether; // DAO 1
        supplies[1] = 250_000_000 ether; // DAO 2
        supplies[2] = 210_000_000 ether; // CONTENT MINING
        supplies[3] = 191_500_000 ether; // LIQUIDITY POOL
        supplies[4] = 50_000_000  ether; // FOUNDATION 1
        supplies[5] = 100_000_000 ether; // FOUNDATION 2
        supplies[6] = 548_500_000 ether; // SALE (seed, private sale, public sale, marketing, team, advisors)

        // create sale
        sale = new CommonSale();
        sale.setWallet(ETH_WALLET_ADDRESS);
        sale.setPrice(21674 ether);
        // stages
        sale.addStage(1630882800, 1631487600, 50,  30000000000000000, 0, 0, 28305000000000000000000000, 0, 0, 5, 10);
        sale.addStage(1631487600, 1632092400, 20,  30000000000000000, 0, 0, 28305000000000000000000000, 0, 0, 5, 10);
        sale.addStage(1632092400, 1632697200, 0,   30000000000000000, 0, 0, 28390000000000000000000000, 0, 0, 5, 10);
        // withdrawal policies
        sale.setWithdrawalPolicy(1, 20 * 30, 30, 4); // 20% is available from the stat, 5% is released every month
        sale.setWithdrawalPolicy(2, 20 * 30, 30, 3); // 15% is available from the stat, 5% is released every month
        sale.setWithdrawalPolicy(3, 20 * 30, 30, 2); // 10% is available from the stat, 5% is released every month
        // accounts
        sale.setBalance(0x5219Cc08E635e9764c8014D984d60Fb7Ed200EEB, 150_000_000, 0, 0, 3); // TEAM account
        sale.setBalance(0x9Ce19eF683c3dA57C19a874d214073f0Cd3B7F71, 10_000_000, 0, 0, 3);  // MARKETING 1 account
        sale.setBalance(0x9Ce19eF683c3dA57C19a874d214073f0Cd3B7F71, 40_000_000, 0, 0, 3);  // MARKETING 2 account
        sale.setBalance(0x9Ce19eF683c3dA57C19a874d214073f0Cd3B7F71, 50_000_000, 0, 0, 3);  // MARKETING 3 account
        sale.setBalance(0x05422B2b38ec652384F1b9dFA3487B2eeA58B544, 40_000_000, 0, 0, 3);  // ADVISORS account
        accounts[6] = address(sale);

        // create token
        require(accounts.length == supplies.length, "Configurator: wrong account array length");
        token = new CandaoToken("Candao", "CDO", accounts, supplies);
        token.transferOwnership(OWNER_ADDRESS);

        // finish sale configuration
        sale.setToken(address(token));
        sale.transferOwnership(OWNER_ADDRESS);
    }

}

