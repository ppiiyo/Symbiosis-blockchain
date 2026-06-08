// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface INashConsensusRegistry {
    function boostReputationWithZk(address validator, uint256 boostAmount) external;
}
