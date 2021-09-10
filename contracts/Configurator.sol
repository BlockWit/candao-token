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
        address         OWNER_ADDRESS      = address(0x0b2cBc8a2D434dc16818B0664Dd81e89fAA9c3AC);
        address payable ETH_WALLET_ADDRESS = payable(0xf83c2172950d2Cc6490F164bb08F2381C2CdEc82);

        address[] memory accounts = new address[](14);
        uint256[] memory supplies = new uint256[](14);

        // casual eth accounts
        accounts[0]  = 0x43Fa4fb5Fd9365242c0215C73B863aEE98128A7e; // SEED
        accounts[1]  = 0xe74b3Ba0e474eA8EE89da99Ef38889ED229e8782; // PRIVATE SALE
        accounts[2]  = 0xe74b3Ba0e474eA8EE89da99Ef38889ED229e8782; // DAO 1
        accounts[3]  = 0xe74b3Ba0e474eA8EE89da99Ef38889ED229e8782; // DAO 2
        accounts[4]  = 0x539e3b4Cf63685cB2aE9adA4414335EB0B496Aec; // CONTENT MINING
        accounts[5]  = 0xe6Df6C96794063F2cC1Dc338908B2a04Ff29eBd4; // LIQUIDITY POOL
        accounts[6]  = 0x3aCe47351C48a4971b62176Ef3538C51397a0d5E; // FOUNDATION 1
        accounts[7]  = 0x3aCe47351C48a4971b62176Ef3538C51397a0d5E; // FOUNDATION 2
        accounts[8]  = 0x5219Cc08E635e9764c8014D984d60Fb7Ed200EEB; // TEAM
        accounts[9]  = 0x9Ce19eF683c3dA57C19a874d214073f0Cd3B7F71; // MARKETING 1
        accounts[10] = 0x9Ce19eF683c3dA57C19a874d214073f0Cd3B7F71; // MARKETING 2
        accounts[11] = 0x9Ce19eF683c3dA57C19a874d214073f0Cd3B7F71; // MARKETING 3
        accounts[12] = 0x05422B2b38ec652384F1b9dFA3487B2eeA58B544; // ADVISORS

        // supplies for casual eth accounts
        supplies[0]  = 81_000_000  ether; // SEED
        supplies[1]  = 84_000_000  ether; // PRIVATE SALE
        supplies[2]  = 150_000_000 ether; // DAO 1
        supplies[3]  = 250_000_000 ether; // DAO 2
        supplies[4]  = 210_000_000 ether; // CONTENT MINING
        supplies[5]  = 200_000_000 ether; // LIQUIDITY POOL
        supplies[6]  = 50_000_000  ether; // FOUNDATION 1
        supplies[7]  = 100_000_000 ether; // FOUNDATION 2
        supplies[8]  = 150_000_000 ether; // TEAM
        supplies[9]  = 10_000_000  ether; // MARKETING 1
        supplies[10] = 40_000_000  ether; // MARKETING 2
        supplies[11] = 50_000_000  ether; // MARKETING 3
        supplies[12] = 40_000_000  ether; // ADVISORS
        supplies[13] = 85_000_000  ether; // PUBLIC SALE

        // create sale
        sale = new CommonSale();
        sale.setWallet(ETH_WALLET_ADDRESS);
        sale.setPrice(21674 ether);
        sale.addStage(1630882800, 1631487600, 50,  30000000000000000, 0, 0, 28305000000000000000000000, 0, 0, 5, 10);
        sale.addStage(1631487600, 1632092400, 20,  30000000000000000, 0, 0, 28305000000000000000000000, 0, 0, 5, 10);
        sale.addStage(1632092400, 1632697200, 0,   30000000000000000, 0, 0, 28390000000000000000000000, 0, 0, 5, 10);
        accounts[13] = address(sale);

        // create token
        require(accounts.length == supplies.length, "Configurator: wrong account array length");
        token = new CandaoToken("Candao", "CDO", accounts, supplies);
        token.transferOwnership(OWNER_ADDRESS);

        // finish sale configuration
        sale.setToken(address(token));
        sale.transferOwnership(OWNER_ADDRESS);
    }

}

