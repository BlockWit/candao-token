// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StagedCrowdsale is Ownable {
    using SafeMath for uint256;
    using Address for address;

    struct Stage {
        uint256 start;
        uint256 end;
        uint256 bonus;
        uint256 minInvestedLimit;
        uint256 maxInvestedLimit;
        uint256 invested;
        uint256 tokensSold;
        uint256 hardcapInTokens;
    }

    Stage[] public stages;

    function stagesCount() public view returns (uint) {
        return stages.length;
    }

    function addStage(uint256 start, uint256 end, uint256 bonus, uint256 minInvestedLimit, uint256 maxInvestedLimit, uint256 invested, uint256 tokensSold, uint256 hardcapInTokens) public onlyOwner {
        stages.push(Stage(start, end, bonus, minInvestedLimit, maxInvestedLimit, invested, tokensSold, hardcapInTokens));
    }

    function removeStage(uint8 index) public onlyOwner {
        require(index < stages.length, "StagedCrowdsale: Wrong stage index");
        for (uint8 i = index; i < stages.length - 1; i++) {
            stages[i] = stages[i + 1];
        }
    }

    function changeStage(uint8 index, uint256 start, uint256 end, uint256 bonus, uint256 minInvestedLimit, uint256 maxInvestedLimit, uint256 invested, uint256 tokensSold, uint256 hardcapInTokens) public onlyOwner {
        require(index < stages.length, "StagedCrowdsale: Wrong stage index");
        Stage storage stage = stages[index];
        stage.start = start;
        stage.end = end;
        stage.bonus = bonus;
        stage.minInvestedLimit = minInvestedLimit;
        stage.maxInvestedLimit = maxInvestedLimit;
        stage.invested = invested;
        stage.tokensSold = tokensSold;
        stage.hardcapInTokens = hardcapInTokens;
    }

    function insertStage(uint8 index, uint256 start, uint256 end, uint256 bonus, uint256 minInvestedLimit, uint256 maxInvestedLimit, uint256 invested, uint256 tokensSold, uint256 hardcapInTokens) public onlyOwner {
        require(index < stages.length, "StagedCrowdsale: Wrong stage index");
        for (uint256 i = stages.length; i > index; i--) {
            stages[i] = stages[i - 1];
        }
        stages[index] = Stage(start, end, bonus, minInvestedLimit, maxInvestedLimit, invested, tokensSold, hardcapInTokens);
    }

    function deleteStages() public onlyOwner {
        require(stages.length > 0, "StagedCrowdsale: Stages already empty");
        for (uint256 i = 0; i < stages.length; i++) {
            delete stages[i];
        }
    }

    function getCurrentStageOrRevert() public view returns (uint256) {
        for (uint256 i = 0; i < stages.length; i++) {
            if (block.timestamp >= stages[i].start && block.timestamp < stages[i].end && stages[i].tokensSold <= stages[i].hardcapInTokens) {
                return i;
            }
        }
        revert("StagedCrowdsale: No suitable stage found");
    }

}
