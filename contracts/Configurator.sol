// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./RecoverableFunds.sol";
import "./CandaoToken.sol";
import "./CommonSale.sol";

contract Configurator is RecoverableFunds {
    using Address for address;

    address private constant OWNER_ADDRESS      = address(0x05156E01Da01229ebe38aEacfFECeDb146100bF1);
    address private constant DEPLOYER_ADDRESS   = address(0x299C851896d1740bA10f31c5aE15425bd24c12D5);
    address payable constant ETH_WALLET_ADDRESS = payable(0x299C851896d1740bA10f31c5aE15425bd24c12D5);

    uint256[] private supplies = [
        400000000 * 1 ether, // DAO
        210000000 * 1 ether, // CONTENT MINING
        200000000 * 1 ether, // LIQUIDITY POOL
        150000000 * 1 ether, // FOUNDATION
        150000000 * 1 ether, // TEAM
        100000000 * 1 ether, // MARKETING
        40000000  * 1 ether, // ADVISORS
        250000000 * 1 ether // SALE
    ];

    address[] private accounts = [
        0xe084a16766cd408cb41562b5A8a0cA5B6E88aB60, // DAO
        0x5D6b8030a91a96B0c7D133fD5612022b39a67e2f, // CONTENT MINING
        0xCd2090Af0c24f8C6E5C8DE4D7B01C48675FAC315, // LIQUIDITY_POOL
        0xc16eE06F206F207341B2A27D6A7368F6D5D21156, // FOUNDATION
        0x819561272D3474Fb6e3f316c2668ec5D2F63dDD5, // TEAM
        0x19F5D82cb05154881bb00d0C8d9Be309e552f489, // MARKETING
        0x27645c1A856780c98FEc2d973339a724962e9bD2  // ADVISORS
    ];

    address[] private whitelist;
    
    uint256 private constant PRICE                      = 31250 * 1 ether;  // 1 CDO = 0.000032 ETH

    uint256 private constant STAGE1_START_DATE          = 1628521200000; // 'Mon Aug 09 2021 18:00:00 GMT+0300'
    uint256 private constant STAGE1_END_DATE            = 1628607600000; // 'Mon Aug 10 2021 18:00:00 GMT+0300'
    uint256 private constant STAGE1_BONUS               = 540;
    uint256 private constant STAGE1_TOKEN_HARDCAP       = 50000000 * 1 ether;

    uint256 private constant STAGE2_START_DATE          = 1628611200000; // 'Mon Aug 10 2021 19:00:00 GMT+0300'
    uint256 private constant STAGE2_END_DATE            = 1628697600000; // 'Mon Aug 11 2021 19:00:00 GMT+0300'
    uint256 private constant STAGE2_BONUS               = 300;
    uint256 private constant STAGE2_TOKEN_HARDCAP       = 100000000 * 1 ether;

    uint256 private constant STAGE3_START_DATE          = 1628701200000; // 'Mon Aug 11 2021 20:00:00 GMT+0300'
    uint256 private constant STAGE3_END_DATE            = 1628787600000; // 'Mon Aug 12 2021 20:00:00 GMT+0300'
    uint256 private constant STAGE3_BONUS               = 0;
    uint256 private constant STAGE3_TOKEN_HARDCAP       = 100000000 * 1 ether;

    CandaoToken public token;
    CommonSale public sale;

    constructor() {
        sale = new CommonSale();
        
        accounts.push(address(sale));
        whitelist.push(address(sale));
        
        token = new CandaoToken("Candao", "CDO", accounts, supplies);
        token.pause();
        token.addToWhitelist(whitelist);

        sale.setToken(address(token));
        sale.setPrice(PRICE);
        sale.setWallet(ETH_WALLET_ADDRESS);
        sale.addStage(STAGE1_START_DATE, STAGE1_END_DATE, STAGE1_BONUS, 0, 0, 0, STAGE1_TOKEN_HARDCAP);
        sale.addStage(STAGE2_START_DATE, STAGE2_END_DATE, STAGE2_BONUS, 0, 0, 0, STAGE2_TOKEN_HARDCAP);
        sale.addStage(STAGE3_START_DATE, STAGE3_END_DATE, STAGE3_BONUS, 0, 0, 0, STAGE3_TOKEN_HARDCAP);

        token.transferOwnership(OWNER_ADDRESS);
        sale.transferOwnership(DEPLOYER_ADDRESS);
    }

}

