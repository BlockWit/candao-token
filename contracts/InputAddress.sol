// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;


contract InputAddress {

    function bytesToAddress(bytes memory source) internal pure returns(address addr) {
        assembly {
            addr := mload(add(source, 20))
        }
    }

    function getInputAddress() internal pure returns(address) {
        if(msg.data.length == 20) {
            return bytesToAddress(bytes(msg.data));
        }
        return address(0);
    }

}
