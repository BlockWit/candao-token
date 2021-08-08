// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./RecoverableFunds.sol";
import "./CandaoToken.sol";
import "./CommonSale.sol";

contract Configurator is RecoverableFunds {
    using Address for address;

    uint256 private constant DAO_BALANCE                = 400000000 * 1 ether;
    uint256 private constant SALE_BALANCE               = 250000000 * 1 ether;
    uint256 private constant CONTENT_MINING_BALANCE     = 210000000 * 1 ether;
    uint256 private constant LIQUIDITY_POOL_BALANCE     = 200000000 * 1 ether;
    uint256 private constant FOUNDATION_BALANCE         = 150000000 * 1 ether;
    uint256 private constant TEAM_BALANCE               = 150000000 * 1 ether;
    uint256 private constant MARKETING_BALANCE          = 100000000 * 1 ether;
    uint256 private constant ADVISORS_BALANCE           = 40000000 * 1 ether;

    address private constant DAO_ADDRESS                = address(0x0);
    address private constant SALE_ADDRESS               = address(0x0);
    address private constant CONTENT_MINING_ADDRESS     = address(0x0);
    address private constant LIQUIDITY_POOL_ADDRESS     = address(0x0);
    address private constant FOUNDATION_ADDRESS         = address(0x0);
    address private constant TEAM_ADDRESS               = address(0x0);
    address private constant MARKETING_ADDRESS          = address(0x0);
    address private constant ADVISORS_ADDRESS           = address(0x0);
    address private constant OWNER_ADDRESS              = address(0x0);
    address private constant DEPLOYER_ADDRESS           = address(0x0);
    address payable private constant ETH_WALLET_ADDRESS = payable(0x0);

    uint256 private constant PRICE                      = 10000 * 1 ether;  // 1 ETH = 10000 CDO

    uint256 private constant STAGE1_START_DATE          = 0;
    uint256 private constant STAGE1_END_DATE            = 0;
    uint256 private constant STAGE1_BONUS               = 10;
    uint256 private constant STAGE1_TOKEN_HARDCAP       = 50000000 * 1 ether;

    uint256 private constant STAGE2_START_DATE          = 0;
    uint256 private constant STAGE2_END_DATE            = 0;
    uint256 private constant STAGE2_BONUS               = 5;
    uint256 private constant STAGE2_TOKEN_HARDCAP       = 100000000 * 1 ether;

    uint256 private constant STAGE3_START_DATE          = 0;
    uint256 private constant STAGE3_END_DATE            = 0;
    uint256 private constant STAGE3_BONUS               = 0;
    uint256 private constant STAGE3_TOKEN_HARDCAP       = 100000000 * 1 ether;

    address[] private addresses;
    uint256[] private amounts;

    CandaoToken public token;
    CommonSale public sale;

    constructor() {
        sale = new CommonSale();
        token = new CandaoToken("Candao", "CDO", addresses, amounts);

        sale.setToken(address(token));
        sale.setPrice(PRICE);
        sale.setWallet(ETH_WALLET_ADDRESS);
        sale.addStage(STAGE1_START_DATE, STAGE1_END_DATE, STAGE1_BONUS, 0, 0, STAGE1_TOKEN_HARDCAP);
        sale.addStage(STAGE2_START_DATE, STAGE2_END_DATE, STAGE2_BONUS, 0, 0, STAGE2_TOKEN_HARDCAP);
        sale.addStage(STAGE3_START_DATE, STAGE3_END_DATE, STAGE3_BONUS, 0, 0, STAGE3_TOKEN_HARDCAP);

        token.transferOwnership(OWNER_ADDRESS);
        sale.transferOwnership(DEPLOYER_ADDRESS);
    }

}

