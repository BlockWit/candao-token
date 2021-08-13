// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IERC20Cutted.sol";
import "./RecoverableFunds.sol";
import "./StagedCrowdsale.sol";
import "./CandaoToken.sol";

contract CommonSale is StagedCrowdsale, Pausable, RecoverableFunds {
    
    using SafeMath for uint256;

    IERC20Cutted public token;
    uint256 public price; // amount of tokens per 1 ETH
    uint256 public invested;
    uint256 public percentRate = 100;
    address payable public wallet;

    mapping(uint256 => mapping(address => uint256)) public balances;

    mapping(uint256 => bool) public whitelistedStages;

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function setToken(address newTokenAddress) public onlyOwner() {
        token = IERC20Cutted(newTokenAddress);
    }

    function setPercentRate(uint256 newPercentRate) public onlyOwner() {
        percentRate = newPercentRate;
    }

    function setWallet(address payable newWallet) public onlyOwner() {
        wallet = newWallet;
    }

    function setPrice(uint256 newPrice) public onlyOwner() {
        price = newPrice;
    }

    function updateInvested(uint256 value) internal {
        invested = invested.add(value);
    }

    function internalFallback() internal whenNotPaused returns (uint) {
        uint256 stageIndex = getCurrentStageOrRevert();
        
        Stage storage stage = stages[stageIndex];
        
        // check min investment limit
        require(msg.value >= stage.minInvestmentLimit, "CommonSale: The amount of ETH you sent is too small.");

        // apply a bonus if any (CDO)
        uint256 tokensWithoutBonus = msg.value.mul(price).div(1 ether);
        uint256 tokensWithBonus = tokensWithoutBonus;
        if (stage.bonus > 0) {
            tokensWithBonus = tokensWithoutBonus.add(tokensWithoutBonus.mul(stage.bonus).div(percentRate));
        }

        // limit the number of tokens that user can buy according to the hardcap of the current stage (CDO)
        if (stage.tokensSold.add(tokensWithBonus) > stage.hardcapInTokens) {
            tokensWithBonus = stage.hardcapInTokens.sub(stage.tokensSold);
            if (stage.bonus > 0) {
                tokensWithoutBonus = tokensWithBonus.mul(percentRate).div(percentRate + stage.bonus);
            }
        }
        
        // calculate the resulting amount of ETH that user will spend and calculate the change if any
        uint256 tokenBasedLimitedInvestValue = tokensWithoutBonus.mul(1 ether).div(price);
        uint256 change = msg.value - tokenBasedLimitedInvestValue;

        // update stats
        invested = invested.add(tokenBasedLimitedInvestValue);
        stage.tokensSold = stage.tokensSold.add(tokensWithBonus);
        balances[stageIndex][_msgSender()] = balances[stageIndex][_msgSender()].add(tokenBasedLimitedInvestValue);
        
        wallet.transfer(tokenBasedLimitedInvestValue);
        token.transfer(_msgSender(), tokensWithBonus);
        
        if (change > 0) {
            payable(_msgSender()).transfer(change);
        }

        return tokensWithBonus;
    }

    receive() external payable {
        internalFallback();
    }

}

