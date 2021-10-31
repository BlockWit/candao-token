// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "./RecoverableFunds.sol";
import "./CandaoToken.sol";
import "./VestingWallet.sol";

contract Configurator is RecoverableFunds {
    using Address for address;

    CandaoToken public token;
    VestingWallet public sale;

    constructor() {
        address OWNER_ADDRESS      = address(0x0b2cBc8a2D434dc16818B0664Dd81e89fAA9c3AC);

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
        supplies[4] =  50_000_000 ether; // FOUNDATION 1
        supplies[5] = 100_000_000 ether; // FOUNDATION 2
        supplies[6] = 548_500_000 ether; // SALE (seed, private sale, public sale, marketing, team, advisors)

        // create sale
        sale = new VestingWallet();
        // stages

        // withdrawal policies
        // investors
        sale.setVestingSchedule(1,  24 weeks, 104 weeks, 1 weeks, 40);
        sale.setVestingSchedule(2,  12 weeks, 104 weeks, 1 weeks, 60);
        sale.setVestingSchedule(3,  12 weeks, 104 weeks, 1 weeks, 60);
        sale.setVestingSchedule(4,  12 weeks, 104 weeks, 1 weeks, 60);
        sale.setVestingSchedule(5,   4 weeks, 104 weeks, 1 weeks, 100);
        // ecosystem
        sale.setVestingSchedule(6,   4 weeks, 208 weeks, 1 weeks, 15);
        sale.setVestingSchedule(7,   4 weeks, 208 weeks, 1 weeks, 10);
        sale.setVestingSchedule(8,   0,       208 weeks, 1 weeks, 20);
        // internal
        sale.setVestingSchedule(9,  10 weeks, 208 weeks, 1 weeks, 30);
        sale.setVestingSchedule(10,  0,       208 weeks, 1 weeks, 50);
        sale.setVestingSchedule(11,  0,       103 weeks, 1 weeks, 50);
        sale.setVestingSchedule(12, 24 weeks, 104 weeks, 1 weeks, 50);

        // accounts
        sale.setBalance(0, 0x5219Cc08E635e9764c8014D984d60Fb7Ed200EEB, 150_000_000 ether, 0); // TEAM account
        sale.setBalance(0, 0x9Ce19eF683c3dA57C19a874d214073f0Cd3B7F71,  10_000_000 ether, 0); // MARKETING 1 account
        sale.setBalance(0, 0x9Ce19eF683c3dA57C19a874d214073f0Cd3B7F71,  40_000_000 ether, 0); // MARKETING 2 account
        sale.setBalance(0, 0x9Ce19eF683c3dA57C19a874d214073f0Cd3B7F71,  50_000_000 ether, 0); // MARKETING 3 account
        sale.setBalance(0, 0x05422B2b38ec652384F1b9dFA3487B2eeA58B544,  40_000_000 ether, 0); // ADVISORS account
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

