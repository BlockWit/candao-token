// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IERC20Cutted.sol";
import "./RecoverableFunds.sol";
import "./StagedCrowdsale.sol";
import "./CandaoToken.sol";
import "./InputAddress.sol";

contract CommonSale is StagedCrowdsale, Pausable, RecoverableFunds, InputAddress {
    
    using SafeMath for uint256;

    IERC20Cutted public token;
    uint256 public price; // amount of tokens per 1 ETH
    uint256 public invested;
    uint256 public percentRate = 100;
    address payable public wallet;

    mapping(address => uint256) public balancesCDO;
    mapping(address => uint256) public balancesETH;

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
    
    function calculateAmounts(Stage memory stage) internal view returns (uint256, uint256) {
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
        // calculate the resulting amount of ETH that user will spend
        uint256 tokenBasedLimitedInvestValue = tokensWithoutBonus.mul(1 ether).div(price); 
        // return the number of purchasesd tokens and spent ETH
        return (tokensWithBonus, tokenBasedLimitedInvestValue);
    }
    
    function withdraw() public whenNotPaused {
        require(block.timestamp >= getLatestStageEnd(), "CommonSale: sale is not over yet");
        uint256 balanceCDO = balancesCDO[_msgSender()];
        uint256 balanceETH = balancesETH[_msgSender()];
        require(balanceCDO > 0 || balanceETH > 0, "CommonSale: there are no assets that could be withdrawn from your account");
        if (balanceCDO > 0) {
            balancesCDO[_msgSender()] = 0;
            token.transfer(_msgSender(), balanceCDO);
        }
        if (balanceETH > 0) {
            balancesETH[_msgSender()] = 0;
            payable(_msgSender()).transfer(balanceETH); 
        }
    }

    function buyWithCDOReferral() internal whenNotPaused returns (uint256) {
        uint256 stageIndex = getCurrentStageOrRevert();
        Stage storage stage = stages[stageIndex];
        
        // check min investment limit
        require(msg.value >= stage.minInvestmentLimit, "CommonSale: The amount of ETH you sent is too small.");

        (uint256 tokens, uint256 investment) = calculateAmounts(stage);
        uint256 change = msg.value.sub(investment);

        // update stats
        invested = invested.add(investment);
        stage.tokensSold = stage.tokensSold.add(tokens);
        balancesCDO[_msgSender()] = balancesCDO[_msgSender()].add(tokens);

        address referral = getInputAddress();
        if (referral != address(0)) {
            require(referral != address(token) && referral != msg.sender && referral != address(this), "CommonSale: Incorrect referral address.");
            uint256 referralTokens = tokens.mul(stage.refCDOPercent).div(percentRate);
            balancesCDO[referral] = balancesCDO[referral].add(referralTokens);
            stage.refCDOAccrued = stage.refCDOAccrued.add(referralTokens);
        }
        
        // transfer ETH
        wallet.transfer(investment);
        if (change > 0) {
            payable(_msgSender()).transfer(change);
        }

        return tokens;
    }

    function buyWithETHReferral(address referral) public payable whenNotPaused returns (uint256) {
        uint256 stageIndex = getCurrentStageOrRevert();
        Stage storage stage = stages[stageIndex];

        // check min investment limit
        require(msg.value >= stage.minInvestmentLimit, "CommonSale: The amount of ETH you sent is too small.");

        (uint256 tokens, uint256 investment) = calculateAmounts(stage);
        uint256 change = msg.value.sub(investment);

        // update stats
        invested = invested.add(investment);
        stage.tokensSold = stage.tokensSold.add(tokens);
        balancesCDO[_msgSender()] = balancesCDO[_msgSender()].add(tokens);

        if (referral != address(0)) {
            require(referral != address(token) && referral != msg.sender && referral != address(this), "CommonSale: Incorrect referral address.");
            uint256 referralETH = investment.mul(stage.refETHPercent).div(percentRate);
            balancesETH[referral] = balancesETH[referral].add(referralETH);
            stage.refETHAccrued = stage.refETHAccrued.add(referralETH);
            investment = investment.sub(referralETH);
        }

        // transfer ETH
        wallet.transfer(investment);
        if (change > 0) {
            payable(_msgSender()).transfer(change);
        }

        return tokens;
    }

    receive() external payable {
        buyWithCDOReferral();
    }

}

