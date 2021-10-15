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

    struct VestingSchedule {
        uint256 delay;      // the amount of time before vesting starts
        uint256 duration;
        uint256 interval;
        uint256 unlocked;   // percentage of initially unlocked tokens
    }

    struct Balance {
        uint256 initialCDO;
        uint256 withdrawnCDO;
        uint256 balanceETH;
    }

    struct AccountInfo {
        uint256 initialCDO;
        uint256 withdrawnCDO;
        uint256 vestedCDO;
        uint256 balanceETH;
    }

    IERC20Cutted public token;
    uint256 public price; // amount of tokens per 1 ETH
    uint256 public percentRate = 100;
    address payable public wallet;
    bool public isWithdrawalActive;
    uint256 public withdrawalStartDate;
    mapping(uint8 => VestingSchedule) public vestingSchedules;
    mapping(uint256 => mapping(address => Balance)) public balances;

    event Deposit(address account, uint256 value);
    event CDOWithdrawal(address account, uint256 value);
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

    function setBalance(uint256 stage, address account, uint256 initialCDO, uint256 withdrawnCDO, uint256 balanceETH) public onlyOwner {
        Balance storage balance = balances[stage][account];
        balance.initialCDO = initialCDO;
        balance.withdrawnCDO = withdrawnCDO;
        balance.balanceETH = balanceETH;
    }

    function addBalances(uint256 stage, address[] calldata addresses, uint256[] calldata balancesCDO) public onlyOwner {
        require(addresses.length == balancesCDO.length, "CommonSale: Incorrect array length.");
        for (uint256 i = 0; i < addresses.length; i++) {
            Balance storage balance = balances[stage][addresses[i]];
            balance.initialCDO = balance.initialCDO.add(balancesCDO[i]);
            emit Deposit(addresses[i], balancesCDO[i]);
        }
    }

    function setVestingSchedule(uint8 index, uint256 delay, uint256 duration, uint256 interval, uint256 unlocked) public onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[index];
        schedule.delay = delay;
        schedule.duration = duration;
        schedule.interval = interval;
        schedule.unlocked = unlocked;
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

    function calculateVestedAmount(Balance memory balance, VestingSchedule memory schedule) internal view returns (uint256) {
        uint256 tokensAvailable;
        if (block.timestamp >= withdrawalStartDate.add(schedule.delay).add(schedule.duration)) {
            tokensAvailable = balance.initialCDO;
        } else {
            uint256 parts = schedule.duration.div(schedule.interval);
            uint256 tokensByPart = balance.initialCDO.div(parts);
            uint256 timeSinceStart = block.timestamp.sub(withdrawalStartDate).sub(schedule.delay);
            uint256 pastParts = timeSinceStart.div(schedule.interval);
            uint256 initiallyUnlocked = balance.initialCDO.mul(schedule.unlocked).div(percentRate);
            tokensAvailable = tokensByPart.mul(pastParts).add(initiallyUnlocked);
        }
        return tokensAvailable.sub(balance.withdrawnCDO);
    }

    function getAccountInfo(address account) public view returns (AccountInfo memory) {
        uint256 initialCDO;
        uint256 withdrawnCDO;
        uint256 vestedCDO;
        uint256 balanceETH;
        for (uint256 stageIndex = 0; stageIndex < stages.length; stageIndex++) {
            Balance memory balance = balances[stageIndex][account];
            uint8 scheduleIndex = stages[stageIndex].vestingSchedule;
            VestingSchedule memory schedule = vestingSchedules[scheduleIndex];
            uint256 vestedAmount = calculateVestedAmount(balance, schedule);
            initialCDO = initialCDO.add(balance.initialCDO);
            withdrawnCDO = withdrawnCDO.add(balance.withdrawnCDO);
            vestedCDO = vestedCDO.add(vestedAmount);
            balanceETH = balanceETH.add(balance.balanceETH);
        }
        return AccountInfo(initialCDO, withdrawnCDO, vestedCDO, balanceETH);
    }

    function withdraw() public whenNotPaused {
        require(isWithdrawalActive, "CommonSale: withdrawal is not yet active");
        uint256 cdoToSend;
        uint256 ethToSend;
        for (uint256 stageIndex = 0; stageIndex < stages.length; stageIndex++) {
            Balance storage balance = balances[stageIndex][_msgSender()];
            if (balance.initialCDO > 0) {
                uint8 scheduleIndex = stages[stageIndex].vestingSchedule;
                VestingSchedule memory schedule = vestingSchedules[scheduleIndex];
                uint256 vestedAmount = calculateVestedAmount(balance, schedule);
                if (vestedAmount > 0) {
                    balance.withdrawnCDO = balance.withdrawnCDO.add(vestedAmount);
                    cdoToSend = cdoToSend.add(vestedAmount);
                }
            }
            if (balance.balanceETH > 0) {
                ethToSend = ethToSend.add(balance.balanceETH);
                balance.balanceETH = 0;
            }
        }
        require(cdoToSend > 0 || ethToSend > 0, "CommonSale: there are no assets that could be withdrawn from your account");
        if (cdoToSend > 0) {
            token.transfer(_msgSender(), cdoToSend);
            emit CDOWithdrawal(_msgSender(), cdoToSend);
        }
        if (ethToSend > 0) {
            payable(_msgSender()).transfer(ethToSend);
            emit ETHWithdrawal(_msgSender(), ethToSend);
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
        stage.invested = stage.invested.add(investment);
        stage.tokensSold = stage.tokensSold.add(tokens);
        balances[stageIndex][_msgSender()].initialCDO = balances[stageIndex][_msgSender()].initialCDO.add(tokens);
        emit Deposit(_msgSender(), tokens);

        address referral = getInputAddress();
        if (referral != address(0)) {
            require(referral != address(token) && referral != _msgSender() && referral != address(this), "CommonSale: Incorrect referral address.");
            uint256 referralTokens = tokens.mul(stage.refCDOPercent).div(percentRate);
            balances[stageIndex][referral].initialCDO = balances[stageIndex][referral].initialCDO.add(referralTokens);
            emit CDOReferralReward(referral, referralTokens);
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

        require(tokens > 0, "CommonSale: No tokens available for purchase.");

        uint256 change = msg.value.sub(investment);

        // update stats
        stage.invested = stage.invested.add(investment);
        stage.tokensSold = stage.tokensSold.add(tokens);
        balances[stageIndex][_msgSender()].initialCDO = balances[stageIndex][_msgSender()].initialCDO.add(tokens);
        emit Deposit(_msgSender(), tokens);

        if (referral != address(0)) {
            require(referral != address(token) && referral != _msgSender() && referral != address(this), "CommonSale: Incorrect referral address.");
            uint256 referralETH = investment.mul(stage.refETHPercent).div(percentRate);
            balances[stageIndex][referral].balanceETH = balances[stageIndex][referral].balanceETH.add(referralETH);
            emit ETHReferralReward(referral, referralETH);
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

    fallback() external payable {
        buyWithCDOReferral();
    }

}

