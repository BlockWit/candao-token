// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../InputAddress.sol";

contract InputAddressContractMock is InputAddress {
    address public data;

    fallback() external payable {
        data = getInputAddress();
    }

}
