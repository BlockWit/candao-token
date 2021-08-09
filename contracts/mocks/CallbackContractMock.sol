// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../interfaces/ICallbackContract.sol";

// mock class using ERC20
contract CallbackContractMock is ICallbackContract {
    address public burnCallbackAccount;
    uint256 public burnCallbackAmount;
    address public transferCallbackSender;
    address public transferCallbackRecipient;
    uint256 public transferCallbackAmount;
    
    function burnCallback(address account, uint256 amount) external override {
        burnCallbackAccount = account;
        burnCallbackAmount = amount;
    }
    
    function transferCallback(address sender, address recipient, uint256 amount) external override {
        transferCallbackSender = sender;
        transferCallbackRecipient = recipient;
        transferCallbackAmount = amount;
    }
}
