// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC20Cutted.sol";

/**
 * @dev Allows the owner to retrieve ETH or tokens sent to this contract by mistake.
 */
contract RecoverableFunds is Ownable {

    function retrieveTokens(address recipient, address anotherToken) public onlyOwner() {
        IERC20Cutted alienToken = IERC20Cutted(anotherToken);
        alienToken.transfer(recipient, alienToken.balanceOf(address(this)));
    }

    function retriveETH(address payable recipient) public onlyOwner() {
        recipient.transfer(address(this).balance);
    }

}

