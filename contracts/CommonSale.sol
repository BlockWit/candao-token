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

    struct WithdrawalPolicy {
        uint256 duration;
        uint256 interval;
        uint8 bonus; // amount of intervals that can be withdrawed immediately after start
    }

    struct Balance {
        uint256 initialCDO;
        uint256 withdrawedCDO;
        uint256 balanceETH;
        uint8 withdrawalPolicy;
    }

    IERC20Cutted public token;
    uint256 public price; // amount of tokens per 1 ETH
    uint256 public invested;
    uint256 public percentRate = 100;
    address payable public wallet;
    bool public isWithdrawalActive;
    uint256 public withdrawalStartDate;
    mapping(uint8 => WithdrawalPolicy) public withdrawalPolicies;
    mapping(address => Balance) public balances;

    event Deposit(address account, uint256 value);
    event CDOWithdrawal(address account, uint256 value, uint256 left);
    event ETHWithdrawal(address account, uint256 value);
    event CDOReferralReward(address account, uint256 value);
    event ETHReferralReward(address account, uint256 value);
    event WithdrawalIsActive();
    event NewPrice(uint256 value);

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function activateWithdrawal() public onlyOwner {
        require(!isWithdrawalActive, "CommonSale: Withdrawal is already enabled.");
        isWithdrawalActive = true;
        withdrawalStartDate = block.timestamp;
        emit WithdrawalIsActive();
    }

    function setToken(address newTokenAddress) public onlyOwner {
        token = IERC20Cutted(newTokenAddress);
    }

    function setPercentRate(uint256 newPercentRate) public onlyOwner {
        percentRate = newPercentRate;
    }

    function setWallet(address payable newWallet) public onlyOwner {
        wallet = newWallet;
    }

    function setPrice(uint256 newPrice) public onlyOwner {
        price = newPrice;
        emit NewPrice(newPrice);
    }

    function setBalance(address account, uint256 initialCDO, uint256 withdrawedCDO, uint256 balanceETH, uint8 withdrawalPolicy) public onlyOwner {
        balances[account].initialCDO = initialCDO;
        balances[account].withdrawedCDO = withdrawedCDO;
        balances[account].balanceETH = balanceETH;
        balances[account].withdrawalPolicy = withdrawalPolicy;
    }

    function addBalances(address[] calldata addresses, uint256[] calldata balancesCDO, uint8 withdrawalPolicy) public onlyOwner {
        require(addresses.length == balancesCDO.length, "CommonSale: Incorrect array length.");
        for (uint256 i = 0; i < addresses.length; i++) {
            balances[addresses[i]].initialCDO = balances[addresses[i]].initialCDO.add(balancesCDO[i]);
            setAccountWithdrawalPolicyIfNotSet(addresses[i], withdrawalPolicy);
            emit Deposit(addresses[i], balancesCDO[i]);
        }
    }

    function setWithdrawalPolicy(uint8 index, uint256 duration, uint256 interval, uint8 bonus) public onlyOwner {
        withdrawalPolicies[index].duration = duration * 1 days;
        withdrawalPolicies[index].interval = interval * 1 days;
        withdrawalPolicies[index].bonus = bonus;
    }

    function setAccountWithdrawalPolicyIfNotSet(address account, uint8 withdrawalPolicyId) internal {
        if (balances[account].withdrawalPolicy == 0) {
            balances[account].withdrawalPolicy = withdrawalPolicyId;
        }
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

    function calculateWithdrawalAmount(address account) public view returns (uint256) {
        Balance storage balance = balances[account];
        WithdrawalPolicy storage policy = withdrawalPolicies[balance.withdrawalPolicy];
        uint256 tokensAwailable;
        if (block.timestamp >= withdrawalStartDate.add(policy.duration).sub(policy.interval.mul(policy.bonus))) {
            tokensAwailable = balance.initialCDO;
        } else {
            uint256 parts = policy.duration.div(policy.interval);
            uint256 tokensByPart = balance.initialCDO.div(parts);
            uint256 timeSinceStart = block.timestamp.sub(withdrawalStartDate);
            uint256 pastParts = timeSinceStart.div(policy.interval);
            tokensAwailable = (pastParts.add(policy.bonus)).mul(tokensByPart);
        }
        return tokensAwailable.sub(balance.withdrawedCDO);
    }

    function withdraw() public whenNotPaused {
        require(isWithdrawalActive, "CommonSale: withdrawal is not yet active");
        Balance storage balance = balances[_msgSender()];
        uint256 cdoToSend = calculateWithdrawalAmount(_msgSender());
        require(cdoToSend > 0 || balance.balanceETH > 0, "CommonSale: there are no assets that could be withdrawn from your account");
        if (balance.balanceETH > 0) {
            uint256 ethToSend = balance.balanceETH;
            balance.balanceETH = 0;
            payable(_msgSender()).transfer(ethToSend);
            emit ETHWithdrawal(_msgSender(), ethToSend);
        }
        if (cdoToSend > 0) {
            balance.withdrawedCDO = balance.withdrawedCDO.add(cdoToSend);
            token.transfer(_msgSender(), cdoToSend);
            emit CDOWithdrawal(_msgSender(), cdoToSend, balance.initialCDO.sub(balance.withdrawedCDO));
        }
    }

    function buyWithCDOReferral() internal whenNotPaused returns (uint256) {
        uint256 stageIndex = getCurrentStageOrRevert();
        Stage storage stage = stages[stageIndex];

        // check min investment limit
        require(msg.value >= stage.minInvestmentLimit, "CommonSale: The amount of ETH you sent is too small.");

        (uint256 tokens, uint256 investment) = calculateAmounts(stage);

        require(tokens > 0, "CommonSale: No tokens available for purchase.");

        uint256 change = msg.value.sub(investment);

        // update stats
        invested = invested.add(investment);
        stage.tokensSold = stage.tokensSold.add(tokens);
        balances[_msgSender()].initialCDO = balances[_msgSender()].initialCDO.add(tokens);
        emit Deposit(_msgSender(), tokens);
        setAccountWithdrawalPolicyIfNotSet(_msgSender(), 1);

        address referral = getInputAddress();
        if (referral != address(0)) {
            require(referral != address(token) && referral != _msgSender() && referral != address(this), "CommonSale: Incorrect referral address.");
            uint256 referralTokens = tokens.mul(stage.refCDOPercent).div(percentRate);
            balances[referral].initialCDO = balances[referral].initialCDO.add(referralTokens);
            emit CDOReferralReward(referral, referralTokens);
            stage.refCDOAccrued = stage.refCDOAccrued.add(referralTokens);
            setAccountWithdrawalPolicyIfNotSet(referral, 1);
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

        require(tokens > 0, "CommonSale: No tokens available for purchase.");

        uint256 change = msg.value.sub(investment);

        // update stats
        invested = invested.add(investment);
        stage.tokensSold = stage.tokensSold.add(tokens);
        balances[_msgSender()].initialCDO = balances[_msgSender()].initialCDO.add(tokens);
        emit Deposit(_msgSender(), tokens);
        setAccountWithdrawalPolicyIfNotSet(_msgSender(), 1);

        if (referral != address(0)) {
            require(referral != address(token) && referral != _msgSender() && referral != address(this), "CommonSale: Incorrect referral address.");
            uint256 referralETH = investment.mul(stage.refETHPercent).div(percentRate);
            balances[referral].balanceETH = balances[referral].balanceETH.add(referralETH);
            emit ETHReferralReward(referral, referralETH);
            stage.refETHAccrued = stage.refETHAccrued.add(referralETH);
            setAccountWithdrawalPolicyIfNotSet(referral, 1);
            investment = investment.sub(referralETH);
        }

        // transfer ETH
        wallet.transfer(investment);
        if (change > 0) {
            payable(_msgSender()).transfer(change);
        }

        return tokens;
    }

    fallback() external payable {
        buyWithCDOReferral();
    }

}

