// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/IERC20Cutted.sol";
import "./RecoverableFunds.sol";

contract FreezeTokenWallet is Ownable, RecoverableFunds {

  using SafeMath for uint256;

  IERC20Cutted public token;
  bool public isStarted;
  uint256 public startDate;
  uint256 public startBalance;
  uint256 public duration;
  uint256 public interval;
  uint256 public retrievedTokens;

  modifier notStarted() {
    require(!isStarted);
    _;
  }

  function setStartDate(uint newStartDate) public onlyOwner notStarted {
    startDate = newStartDate;
  }

  function setDuration(uint newDuration) public onlyOwner notStarted {
    duration = newDuration * 1 days;
  }

  function setInterval(uint newInterval) public onlyOwner notStarted {
    interval = newInterval * 1 days;
  }

  function setToken(address newToken) public onlyOwner notStarted {
    token = IERC20Cutted(newToken);
  }

  function start() public onlyOwner notStarted {
    startBalance = token.balanceOf(address(this));
    isStarted = true;
  }

  function retrieveWalletTokens(address to) public onlyOwner {
    require(isStarted && block.timestamp >= startDate, "Freezing period has not started yet.");
    if (block.timestamp >= startDate + duration) {
      token.transfer(to, token.balanceOf(address(this)));
    } else {
      uint parts = duration.div(interval);
      uint tokensByPart = startBalance.div(parts);
      uint timeSinceStart = block.timestamp.sub(startDate);
      uint pastParts = timeSinceStart.div(interval);
      uint tokensToRetrieveSinceStart = pastParts.mul(tokensByPart);
      uint tokensToRetrieve = tokensToRetrieveSinceStart.sub(retrievedTokens);
      require(tokensToRetrieve > 0, "No tokens available for retrieving at this moment.");
      retrievedTokens = retrievedTokens.add(tokensToRetrieve);
      token.transfer(to, tokensToRetrieve);
    }
  }

  function retrieveTokens(address to, address anotherToken) override public onlyOwner {
    require(address(token) != anotherToken, "You should only use this method to withdraw extraneous tokens.");
    super.retrieveTokens(to, anotherToken);
  }

}
