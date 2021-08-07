// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./RecoverableFunds.sol";
import "./ICallbackContract.sol";

/**
 * @dev CandaoToken
 */
contract CandaoToken is ERC20, ERC20Burnable, RecoverableFunds {

    bool isTransferLocked = true;
    address public registeredCallback = address(0x0);
    mapping(address => bool) public transferWhitelist;

    event TransferUnlocked();

    modifier notLocked(address account) {
        require(!isTransferLocked || transferWhitelist[account], "Transfer is locked");
        _;
    }
    
    constructor(string memory name, string memory symbol, address initialAccount, uint256 initialBalance) payable ERC20(name, symbol) {
        _mint(initialAccount, initialBalance);
    }

    function registerCallback(address callback) public onlyOwner {
        registeredCallback = callback;
    }

    function deregisterCallback() public onlyOwner {
        registeredCallback = address(0x0);
    }

    function addToWhitelist(address[] memory accounts) public onlyOwner {
        for(uint8 i = 0; i < accounts.length - 1; i++) {
            transferWhitelist[accounts[i]] = true;
        }
    }

    function removeFromWhitelist(address[] memory accounts) public onlyOwner {
        for(uint8 i = 0; i < accounts.length - 1; i++) {
            transferWhitelist[accounts[i]] = false;
        }
    }

    function unlockTransfer() public onlyOwner {
        isTransferLocked = false;
        emit TransferUnlocked();
    }

    function _burn(address account, uint256 amount) internal override notLocked(account) {
        super._burn(account, amount);
        if (registeredCallback != address(0x0)) {
            ICallbackContract targetCallback = ICallbackContract(registeredCallback);
            targetCallback.burnCallback(account, amount);
        }
    }

    function _transfer(address sender, address recipient, uint256 amount) internal override notLocked(sender) {
        super._transfer(sender, recipient, amount);
        if (registeredCallback != address(0x0)) {
            ICallbackContract targetCallback = ICallbackContract(registeredCallback);
            targetCallback.transferCallback(sender, recipient, amount);
        }
    }

}
