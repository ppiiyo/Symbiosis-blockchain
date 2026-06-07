// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/// @title Symbiosis Native Token Contract (SYM)
/// @notice Custom ERC20 with burnable functionality, gas-recycling, and multi-sig timelocked governance.
contract SymbiosisToken is ERC20, ERC20Burnable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;

    mapping(address => bool) public isValidatorNode;
    address public consensusRegistry;

    /// @dev Исправлено: constable-states — переменная теперь constant
    uint256 public constant gasBackPercentage = 25;

    address[] public governors;
    mapping(address => bool) public isGovernor;

    uint256 public constant TIMELOCK_DELAY = 24 hours;

    struct Proposal {
        string actionType;
        address targetAddress;
        uint256 eta;
        bool executed;
        uint256 yesVotes;
    }

    Proposal[] public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed proposalId, string actionType, address indexed target, uint256 eta);
    event ProposalVoted(uint256 indexed proposalId, address indexed governor, uint256 currentVotes);
    event ProposalExecuted(uint256 indexed proposalId, string actionType, address indexed target);
    event GasRecycled(address indexed validator, uint256 amount);
    event ConsensusRegistryUpdated(address indexed registry);

    modifier onlyGovernor() {
        require(isGovernor[msg.sender], "Caller is not an authorized governor");
        _;
    }

    constructor() ERC20("Symbiosis Token", "SYM") {
        address gov1 = msg.sender;
        address gov2 = 0x2c6F91Ce3a6ABd991FfCD4C6deE3b689cdE1528B;
        address gov3 = 0x98fc4e22c5ed7cE8f7da550baBdC6bbAef9A12B1;

        governors.push(gov1);
        governors.push(gov2);
        governors.push(gov3);
        isGovernor[gov1] = true;
        isGovernor[gov2] = true;
        isGovernor[gov3] = true;

        _mint(msg.sender, MAX_SUPPLY * 80 / 100);
        _mint(address(this), MAX_SUPPLY * 20 / 100);
    }

    /// @dev Исправлено: naming-convention — параметры в camelCase
    function proposeAction(
        string memory actionType,
        address target
    ) external onlyGovernor returns (uint256) {
        uint256 eta = block.timestamp + TIMELOCK_DELAY;
        proposals.push(
            Proposal({
                actionType: actionType,
                targetAddress: target,
                eta: eta,
                executed: false,
                yesVotes: 1
            })
        );
        uint256 proposalId = proposals.length - 1;
        hasVoted[proposalId][msg.sender] = true;

        emit ProposalCreated(proposalId, actionType, target, eta);
        return proposalId;
    }

    function voteProposal(uint256 proposalId) external onlyGovernor {
        Proposal storage prop = proposals[proposalId];
        require(!prop.executed, "Proposal already executed");
        require(!hasVoted[proposalId][msg.sender], "Already voted on this proposal");

        hasVoted[proposalId][msg.sender] = true;
        prop.yesVotes += 1;

        emit ProposalVoted(proposalId, msg.sender, prop.yesVotes);
    }

    function executeProposal(uint256 proposalId) external onlyGovernor {
        Proposal storage prop = proposals[proposalId];
        require(!prop.executed, "Proposal already executed");
        require(block.timestamp >= prop.eta, "Timelock delay is not over yet");
        require(prop.yesVotes >= 2, "Insufficient consensus signatures (min 2 required)");

        prop.executed = true;

        if (keccak256(bytes(prop.actionType)) == keccak256(bytes("setConsensusRegistry"))) {
            consensusRegistry = prop.targetAddress;
            emit ConsensusRegistryUpdated(prop.targetAddress);
        } else if (keccak256(bytes(prop.actionType)) == keccak256(bytes("registerValidator"))) {
            isValidatorNode[prop.targetAddress] = true;
        } else if (keccak256(bytes(prop.actionType)) == keccak256(bytes("updateGovernor"))) {
            isGovernor[prop.targetAddress] = !isGovernor[prop.targetAddress];
        } else {
            revert("Unknown action type");
        }

        emit ProposalExecuted(proposalId, prop.actionType, prop.targetAddress);
    }

    function recycleGas(address validator, uint256 gasUsed) external {
        require(msg.sender == consensusRegistry, "Only Consensus Registry can trigger recycling");
        uint256 refundAmount = (gasUsed * tx.gasprice * gasBackPercentage) / 100;
        uint256 maxRefund = 5000 * 10 ** 18;
        if (refundAmount > maxRefund) refundAmount = maxRefund;

        require(balanceOf(address(this)) >= refundAmount, "Insufficient treasury gas recycling balance");
        _transfer(address(this), validator, refundAmount);
        emit GasRecycled(validator, refundAmount);
    }
}
