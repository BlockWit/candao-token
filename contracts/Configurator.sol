// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "./RecoverableFunds.sol";
import "./CandaoToken.sol";
import "./VestingWallet.sol";

contract Configurator is RecoverableFunds {
    using Address for address;

    CandaoToken public token;
    VestingWallet public wallet;

    constructor(address owner) {
        // create wallet
        wallet = new VestingWallet();
        // set percent rate
        wallet.setPercentRate(1000);
        // groups
        wallet.addGroup(1);
        wallet.addGroup(2);
        wallet.addGroup(3);
        wallet.addGroup(4);
        wallet.addGroup(5);
        wallet.addGroup(6);
        wallet.addGroup(7);
        wallet.addGroup(8);
        wallet.addGroup(9);
        wallet.addGroup(10);
        wallet.addGroup(11);
        wallet.addGroup(12);
        // vesting schedules
        // investors
        wallet.setVestingSchedule(1,  24 weeks, 104 weeks, 1 weeks, 40);
        wallet.setVestingSchedule(2,  12 weeks, 104 weeks, 1 weeks, 60);
        wallet.setVestingSchedule(3,  12 weeks, 104 weeks, 1 weeks, 60);
        wallet.setVestingSchedule(4,  12 weeks, 104 weeks, 1 weeks, 60);
        wallet.setVestingSchedule(5,   4 weeks, 104 weeks, 1 weeks, 100);
        // ecosystem
        wallet.setVestingSchedule(6,   4 weeks, 208 weeks, 1 weeks, 15);
        wallet.setVestingSchedule(7,   4 weeks, 208 weeks, 1 weeks, 10);
        wallet.setVestingSchedule(8,   0,       208 weeks, 1 weeks, 20);
        // internal
        wallet.setVestingSchedule(9,  10 weeks, 208 weeks, 1 weeks, 30);
        wallet.setVestingSchedule(10,  0,       208 weeks, 1 weeks, 50);
        wallet.setVestingSchedule(11,  0,       103 weeks, 1 weeks, 50);
        wallet.setVestingSchedule(12, 24 weeks, 104 weeks, 1 weeks, 50);

        address[] memory addresses = new address[](1);
        uint256[] memory amounts = new uint256[](1);

        addresses[0] = address(wallet);
        amounts[0] = 1_500_000_000 ether;

        // create token
        token = new CandaoToken("Candao", "CDO", addresses, amounts);
        token.transferOwnership(owner);

        // finish wallet configuration
        wallet.setToken(address(token));
        wallet.transferOwnership(owner);
    }

}

