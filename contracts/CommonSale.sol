// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "./RecoverableFunds.sol";
import "./IERC20Cutted.sol";
import "./StagedCrowdsale.sol";
import "./CandaoToken.sol";

contract CommonSale is StagedCrowdsale, Pausable, RecoverableFunds {
    
    using SafeMath for uint256;

    IERC20Cutted public token;
    uint256 public price; // amount of tokens per 1 ETH
    uint256 public invested;
    uint256 public percentRate = 100;
    address payable public wallet;
    mapping(address => bool) public whitelist;

    mapping(uint256 => mapping(address => uint256)) public balances;

    mapping(uint256 => bool) public whitelistedStages;

    function setStageWithWhitelist(uint256 index) public onlyOwner {
        whitelistedStages[index] = true;
    }

    function unsetStageWithWhitelist(uint256 index) public onlyOwner {
        whitelistedStages[index] = false;
    }

    function addToWhitelist(address[] memory accounts) public onlyOwner {
        for(uint8 i = 0; i < accounts.length; i++) {
            whitelist[accounts[i]] = true;
        }
    }

    function removeFromWhitelist(address[] memory accounts) public onlyOwner {
        for(uint8 i = 0; i < accounts.length; i++) {
            whitelist[accounts[i]] = false;
        }
    }

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
        uint256 limitedInvestValue = msg.value;

        // limit the minimum amount for one transaction (ETH) 
        require(limitedInvestValue >= stage.minInvestedLimit, "CommonSale: The amount is too small");

        // check if the stage requires user to be whitelisted
        if (whitelistedStages[stageIndex]) {
            require(whitelist[_msgSender()], "CommonSale: The address must be whitelisted");
        }

        // limit the maximum amount that one user can spend during the current stage (ETH)
        uint256 maxAllowableValue = stage.maxInvestedLimit - balances[stageIndex][_msgSender()];
        if (limitedInvestValue > maxAllowableValue) {
            limitedInvestValue = maxAllowableValue;
        }
        require(limitedInvestValue > 0, "CommonSale: Investment limit exceeded");

        // apply a bonus if any (CDO)
        uint256 tokensWithoutBonus = limitedInvestValue.mul(price).div(1 ether);
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
        
        if (change > 0) {
            payable(_msgSender()).transfer(change);
        }

        return tokensWithBonus;
    }

    receive() external payable {
        internalFallback();
    }

}

