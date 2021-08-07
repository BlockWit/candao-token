// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./RecoverableFunds.sol";
import "./ICallbackContract.sol";

/**
 * @dev CandaoToken
 */
contract CandaoToken is ERC20, ERC20Burnable, Pausable, RecoverableFunds {

    address public registeredCallback = address(0x0);
    mapping(address => bool) public whitelist;

    modifier notPaused(address account) {
        require(!paused() || whitelist[account], "Pausable: paused");
        _;
    }
    
    constructor(string memory name, string memory symbol, address[] memory initialAccounts, uint256[] memory initialBalances) payable ERC20(name, symbol) {
        for(uint8 i = 0; i < initialAccounts.length - 1; i++) {
            _mint(initialAccounts[i], initialBalances[i]);
        }
    }

    function registerCallback(address callback) public onlyOwner {
        registeredCallback = callback;
    }

    function deregisterCallback() public onlyOwner {
        registeredCallback = address(0x0);
    }

    function addToWhitelist(address[] memory accounts) public onlyOwner {
        for(uint8 i = 0; i < accounts.length - 1; i++) {
            whitelist[accounts[i]] = true;
        }
    }

    function removeFromWhitelist(address[] memory accounts) public onlyOwner {
        for(uint8 i = 0; i < accounts.length - 1; i++) {
            whitelist[accounts[i]] = false;
        }
    }
    
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _burn(address account, uint256 amount) internal override {
        super._burn(account, amount);
        if (registeredCallback != address(0x0)) {
            ICallbackContract targetCallback = ICallbackContract(registeredCallback);
            targetCallback.burnCallback(account, amount);
        }
    }

    function _transfer(address sender, address recipient, uint256 amount) internal override {
        super._transfer(sender, recipient, amount);
        if (registeredCallback != address(0x0)) {
            ICallbackContract targetCallback = ICallbackContract(registeredCallback);
            targetCallback.transferCallback(sender, recipient, amount);
        }
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override notPaused(from) {
        super._beforeTokenTransfer(from, to, amount);
    }

}
