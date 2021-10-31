// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/IERC20Cutted.sol";
import "./RecoverableFunds.sol";
import "./CandaoToken.sol";

contract VestingWallet is Pausable, RecoverableFunds {

    using SafeMath for uint256;

    struct VestingSchedule {
        uint256 delay;      // the amount of time before vesting starts
        uint256 duration;
        uint256 interval;
        uint256 unlocked;   // percentage of initially unlocked tokens
    }

    struct Balance {
        uint256 initial;
        uint256 withdrawn;
    }

    struct AccountInfo {
        uint256 initial;
        uint256 withdrawn;
        uint256 vested;
    }

    IERC20Cutted public token;
    uint256 public percentRate = 100;
    bool public isWithdrawalActive;
    uint256 public withdrawalStartDate;
    mapping(uint8 => VestingSchedule) public vestingSchedules;
    mapping(uint8 => mapping(address => Balance)) public balances;
    uint8[] public groups;

    event Withdrawal(address account, uint256 value);
    event WithdrawalIsActive();

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function activateWithdrawal() public onlyOwner {
        require(!isWithdrawalActive, "VestingWallet: withdrawal is already enabled");
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

    function setBalance(uint8 group, address account, uint256 initial, uint256 withdrawn) public onlyOwner {
        Balance storage balance = balances[group][account];
        balance.initial = initial;
        balance.withdrawn = withdrawn;
    }

    function addBalances(uint8 group, address[] calldata addresses, uint256[] calldata amounts) public onlyOwner {
        require(addresses.length == amounts.length, "VestingWallet: incorrect array length");
        for (uint256 i = 0; i < addresses.length; i++) {
            Balance storage balance = balances[group][addresses[i]];
            balance.initial = balance.initial.add(amounts[i]);
        }
    }

    function setVestingSchedule(uint8 index, uint256 delay, uint256 duration, uint256 interval, uint256 unlocked) public onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[index];
        schedule.delay = delay;
        schedule.duration = duration;
        schedule.interval = interval;
        schedule.unlocked = unlocked;
    }

    function groupsCount() public view returns (uint256) {
        return groups.length;
    }

    function addGroup(uint8 vestingSchedule) public onlyOwner {
        require(groups.length < type(uint256).max, "VestingWallet: the maximum number of groups has been reached");
        groups.push(vestingSchedule);
    }

    function updateGroup(uint256 index, uint8 vestingSchedule) public onlyOwner {
        require(index < groups.length, "VestingWallet: wrong group index");
        groups[index] = vestingSchedule;
    }

    function deleteGroup(uint256 index) public onlyOwner {
        require(index < groups.length, "VestingWallet: wrong group index");
        for (uint256 i = index; i < groups.length - 1; i++) {
            groups[i] = groups[i + 1];
        }
        groups.pop();
    }

    function calculateVestedAmount(Balance memory balance, VestingSchedule memory schedule) internal view returns (uint256) {
        if (block.timestamp < withdrawalStartDate.add(schedule.delay)) return 0;
        uint256 tokensAvailable;
        if (block.timestamp >= withdrawalStartDate.add(schedule.delay).add(schedule.duration)) {
            tokensAvailable = balance.initial;
        } else {
            uint256 parts = schedule.duration.div(schedule.interval);
            uint256 tokensByPart = balance.initial.div(parts);
            uint256 timeSinceStart = block.timestamp.sub(withdrawalStartDate).sub(schedule.delay);
            uint256 pastParts = timeSinceStart.div(schedule.interval);
            uint256 initiallyUnlocked = balance.initial.mul(schedule.unlocked).div(percentRate);
            tokensAvailable = tokensByPart.mul(pastParts).add(initiallyUnlocked);
        }
        return tokensAvailable.sub(balance.withdrawn);
    }

    function getAccountInfo(address account) public view returns (AccountInfo memory) {
        uint256 initial;
        uint256 withdrawn;
        uint256 vested;
        for (uint8 groupIndex = 0; groupIndex < groups.length; groupIndex++) {
            Balance memory balance = balances[groupIndex][account];
            VestingSchedule memory schedule = vestingSchedules[groups[groupIndex]];
            uint256 vestedAmount = calculateVestedAmount(balance, schedule);
            initial = initial.add(balance.initial);
            withdrawn = withdrawn.add(balance.withdrawn);
            vested = vested.add(vestedAmount);
        }
        return AccountInfo(initial, withdrawn, vested);
    }

    function withdraw() public whenNotPaused {
        require(isWithdrawalActive, "VestingWallet: withdrawal is not yet active");
        uint256 tokensToSend;
        for (uint8 groupIndex = 0; groupIndex < groups.length; groupIndex++) {
            Balance storage balance = balances[groupIndex][_msgSender()];
            if (balance.initial > 0) {
                VestingSchedule memory schedule = vestingSchedules[groups[groupIndex]];
                uint256 vestedAmount = calculateVestedAmount(balance, schedule);
                if (vestedAmount > 0) {
                    balance.withdrawn = balance.withdrawn.add(vestedAmount);
                    tokensToSend = tokensToSend.add(vestedAmount);
                }
            }
        }
        require(tokensToSend > 0, "VestingWallet: there are no assets that could be withdrawn from your account");
        token.transfer(_msgSender(), tokensToSend);
        emit Withdrawal(_msgSender(), tokensToSend);
    }

}

