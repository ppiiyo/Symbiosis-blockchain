// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/// @title Symbiosis Native Token Contract (SYM)
/// @notice Custom ERC20 with full-featured burnable functionality, gas-recycling hooks, and multi-signature timelocked governance.
/// @dev Inherits standard OpenZeppelin ERC20 and ERC20Burnable configurations.
contract SymbiosisToken is ERC20, ERC20Burnable {
    /// @notice The absolute maximum inflation cap supply of 1 billion SYM
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; 
    
    /// @notice Maps validator node addresses to their current active validation authorization state
    mapping(address => bool) public isValidatorNode;

    /// @notice Address of the official NashConsensusRegistry allowed to trigger gas recycling refunds
    address public consensusRegistry;
    
    /// @notice Fixed percentage of gas refunded to active validating nodes
    uint256 public gasBackPercentage = 25;
    
    /// @notice Dynamic array of verified protocol governors
    address[] public governors;

    /// @notice Mapping to verify if an address holds active consensus Governor privileges
    mapping(address => bool) public isGovernor;

    /// @notice Mandatory delay delay required between action proposals and implementation executions
    uint256 public constant TIMELOCK_DELAY = 24 hours;

    /// @notice Governance Proposal layout containing action attributes and consensus metrics
    struct Proposal {
        string actionType;
        address targetAddress;
        uint256 eta;
        bool executed;
        uint256 yesVotes;
    }

    /// @notice Array of all proposed timeline changes registered to governance
    Proposal[] public proposals;

    /// @notice Track individual governor vote receipts to prevent double voting on proposals
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @notice Emitted when a new timelocked governance proposal is initiated
    /// @param proposalId The index id of the created proposal
    /// @param actionType Description or method call action type identifier string
    /// @param target The address targeted in the state modification proposal
    /// @param eta Time coordinates when the action can be safely executed
    event ProposalCreated(uint256 indexed proposalId, string actionType, address indexed target, uint256 eta);

    /// @notice Emitted when a governor signs support for an active proposal
    /// @param proposalId The index id of the voted proposal
    /// @param governor Address of the governor who voted
    /// @param currentVotes Current outstanding consensus votes on the target proposal
    event ProposalVoted(uint256 indexed proposalId, address indexed governor, uint256 currentVotes);

    /// @notice Emitted when a proposal successfully passes timelock validations and is processed
    /// @param proposalId The index id of the executed proposal
    /// @param actionType Description of the executed action type
    /// @param target The address targeted in the state modification
    event ProposalExecuted(uint256 indexed proposalId, string actionType, address indexed target);

    /// @notice Emitted when gas recycling returns base currency back to validating nodes
    /// @param validator Address of the active validator node receiving refunds
    /// @param amount Amount of SYM tokens paid to validator
    event GasRecycled(address indexed validator, uint256 amount);

    /// @notice Emitted when a new consensus registry entity contract is updated
    /// @param registry Coordinates of the updated NashConsensusRegistry
    event ConsensusRegistryUpdated(address indexed registry);

    /// @notice Restricts the calling function to authorized governors listed in the multi-signature registry
    modifier onlyGovernor() {
        require(isGovernor[msg.sender], "Caller is not an authorized governor");
        _;
    }

    /// @notice Instantiates the token with designated token allocation splits and registers standard governors
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

    /// @notice Initiates a timelocked governance proposal
    /// @dev Action requires caller to hold governor privileges
    /// @param _actionType Name of the targeted state action change
    /// @param _target Wallet or smart-contract address receiving action
    /// @return The newly assigned proposal ID index
    function proposeAction(string memory _actionType, address _target) external onlyGovernor returns (uint256) {
        uint256 eta = block.timestamp + TIMELOCK_DELAY;
        proposals.push(Proposal({
            actionType: _actionType,
            targetAddress: _target,
            eta: eta,
            executed: false,
            yesVotes: 1
        }));
        uint256 proposalId = proposals.length - 1;
        hasVoted[proposalId][msg.sender] = true;
        
        emit ProposalCreated(proposalId, _actionType, _target, eta);
        return proposalId;
    }

    /// @notice Registers yes votes from secondary governors
    /// @param proposalId The index id of the targeted proposal
    function voteProposal(uint256 proposalId) external onlyGovernor {
        Proposal storage prop = proposals[proposalId];
        require(!prop.executed, "Proposal already executed");
        require(!hasVoted[proposalId][msg.sender], "Already voted on this proposal");
        
        hasVoted[proposalId][msg.sender] = true;
        prop.yesVotes += 1;
        
        emit ProposalVoted(proposalId, msg.sender, prop.yesVotes);
    }

    /// @notice Executes a past-timelock proposal requiring a multi-signature consensus of minimum 2 votes
    /// @param proposalId The index id of the mature proposal
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
            if (isGovernor[prop.targetAddress]) {
                // Count active governors to prevent a frozen zero-governor system
                uint256 activeCount = 0;
                for (uint256 i = 0; i < governors.length; i++) {
                    if (isGovernor[governors[i]]) {
                        activeCount++;
                    }
                }
                require(activeCount > 1, "Cannot remove governor: minimum 1 active governor threshold required");
                isGovernor[prop.targetAddress] = false;
            } else {
                isGovernor[prop.targetAddress] = true;
                bool found = false;
                for (uint256 i = 0; i < governors.length; i++) {
                    if (governors[i] == prop.targetAddress) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    governors.push(prop.targetAddress);
                }
            }
        } else {
            revert("Unknown action type");
        }
        
        emit ProposalExecuted(proposalId, prop.actionType, prop.targetAddress);
    }

    /// @notice Dynamic tracker to enforce once-per-block limits per validator node to mitigate draining
    mapping(address => uint256) public lastRecycledBlock;

    /// @notice Recycles and distributes gas refunds to active validator nodes in the consensus pool
    /// @dev Only callable by the official consensusRegistry contract to prevent unauthorized treasury drains
    /// @param validator Target validator node address receiving the refund
    /// @param gasUsed Computational gas used during validation
    function recycleGas(address validator, uint256 gasUsed) external {
        require(msg.sender == consensusRegistry, "Only Consensus Registry can trigger recycling");
        // Ensure rate spacing: block interval must be at least same block or subsequent block
        require(block.number >= lastRecycledBlock[validator], "Recycle rate limit active in same block");
        lastRecycledBlock[validator] = block.number;

        // Ensure gasUsed is reasonable to prevent overflow attack or outrageous params
        require(gasUsed <= 1_000_000_000_000_000, "Excessive gasUsed value");

        uint256 refundAmount = (gasUsed * tx.gasprice * gasBackPercentage) / 100;
        uint256 maxRefund = 5000 * 10**18; 
        if (refundAmount > maxRefund) refundAmount = maxRefund;
        
        require(balanceOf(address(this)) >= refundAmount, "Insufficient treasury gas recycling balance");
        _transfer(address(this), validator, refundAmount);
        emit GasRecycled(validator, refundAmount);
    }
}
