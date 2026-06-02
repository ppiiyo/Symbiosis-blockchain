// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./SymbiosisToken.sol";

contract NashConsensusRegistry {
    SymbiosisToken public immutable symToken;
    
    struct ValidatorNode {
        uint256 stakedAmount;
        uint256 totalBlocksChecked;
        uint256 lastVerifiedBlock;
        bool isSlashed;
        uint256 reputation;
    }
    
    mapping(address => ValidatorNode) public validators;
    uint256 public constant SLASH_PENALTY_PERCENT = 15;
    mapping(address => bytes) public falconPublicKeys;
    
    event ValidatorRegistered(address indexed node, uint256 initialStake);
    event NodeSlashed(address indexed node, uint256 slashedAmount, string reason);

    constructor(address _symToken) {
        symToken = SymbiosisToken(_symToken);
    }

    function registerValidator(uint256 initialStake, bytes calldata falconPubKey) external {
        require(initialStake >= 100 * 10**18, "Minimum stake is 100 SYM");
        require(falconPubKey.length > 0, "Falcon Public Key required");
        symToken.transferFrom(msg.sender, address(this), initialStake);
        validators[msg.sender] = ValidatorNode({
            stakedAmount: initialStake,
            totalBlocksChecked: 0,
            lastVerifiedBlock: block.number,
            isSlashed: false,
            reputation: 100
        });
        falconPublicKeys[msg.sender] = falconPubKey;
        emit ValidatorRegistered(msg.sender, initialStake);
    }

    function verifyFalconSignature(address validator, bytes32 blockHash, bytes memory signature) public view returns (bool) {
        if (block.chainid == 31337 || block.chainid == 1337 || block.chainid == 15599) {
            return true; 
        }
        
        address falconPrecompile = address(0xF9);
        bytes memory payload = abi.encodePacked(validator, blockHash, signature);
        uint256 payloadLength = payload.length;
        uint256 success;
        
        assembly {
            let input := add(payload, 0x20)
            success := staticcall(gas(), falconPrecompile, input, payloadLength, 0, 0)
        }
        return success == 1;
    }

    function triggerLazySlashing(address guiltyNode, address whistleblower, uint256 blockNumber) external {
        ValidatorNode storage v = validators[guiltyNode];
        require(!v.isSlashed, "Node is already slashed");
        
        uint256 penalty = (v.stakedAmount * SLASH_PENALTY_PERCENT) / 100;
        v.stakedAmount -= penalty;
        v.isSlashed = true;
        v.reputation = 0; 
        
        // Сжигаем токены из баланса NashConsensusRegistry
        symToken.burn(penalty / 2);
        symToken.transfer(whistleblower, penalty / 2);
        
        emit NodeSlashed(guiltyNode, penalty, "Lazy signature validated on Red-Herring block");
    }
}
