// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./RecoverableFunds.sol";
import "./interfaces/ICallbackContract.sol";
import "./WithCallback.sol";

/**
 * @dev CandaoToken
 */
contract CandaoToken is ERC20, ERC20Burnable, RecoverableFunds, WithCallback {

    constructor(string memory name, string memory symbol, address[] memory initialAccounts, uint256[] memory initialBalances) payable ERC20(name, symbol) {
        for(uint8 i = 0; i < initialAccounts.length; i++) {
            _mint(initialAccounts[i], initialBalances[i]);
        }
    }

    function _burn(address account, uint256 amount) internal override {
        super._burn(account, amount);
        _burnCallback(account, amount);
    }

    function _transfer(address sender, address recipient, uint256 amount) internal override {
        super._transfer(sender, recipient, amount);
        _transferCallback(sender, recipient, amount);
    }

}
