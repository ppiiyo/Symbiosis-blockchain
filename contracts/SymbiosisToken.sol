// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title Symbiosis Native Token Contract (SYM)
/// @notice Custom ERC20 with burnable functionality, gas-recycling, and multi-sig timelocked governance.
contract SymbiosisToken is ERC20, ERC20Burnable, Pausable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;

    mapping(address => bool) public isValidatorNode;
    address public consensusRegistry;

    /// @dev Settable by governance (A-05)
    uint256 public gasBackPercentage = 25;
    uint256 public timelockDelay = 24 hours;

    address[] public governors;
    mapping(address => bool) public isGovernor;
    mapping(address => bool) public whitelistedContracts;

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
    event RewardsClaimed(address indexed validator, uint256 amount);

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

    /// @notice pause transfers and other controls during emergency (A-06)
    function pause() external onlyGovernor {
        _pause();
    }

    function unpause() external onlyGovernor {
        _unpause();
    }

    function setWhitelistedContract(address contractAddr, bool status) external onlyGovernor {
        whitelistedContracts[contractAddr] = status;
    }

    function proposeAction(
        string memory actionType,
        address target
    ) external onlyGovernor whenNotPaused returns (uint256) {
        bytes32 actionHash = keccak256(bytes(actionType));
        if (actionHash == keccak256(bytes("setGasBackPercentage"))) {
            uint256 newVal = uint256(uint160(target));
            require(newVal <= 100, "Gas back percentage too high");
        } else if (actionHash == keccak256(bytes("setTimelockDelay"))) {
            uint256 newVal = uint256(uint160(target));
            require(newVal >= 1 hours && newVal <= 30 days, "Invalid timelock delay range");
        }

        uint256 eta = block.timestamp + timelockDelay;
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

    function voteProposal(uint256 proposalId) external onlyGovernor whenNotPaused {
        require(proposalId < proposals.length, "Invalid proposal ID");
        Proposal storage prop = proposals[proposalId];
        require(!prop.executed, "Proposal already executed");
        require(block.timestamp < prop.eta, "Voting period has ended"); // Fixed V-05
        require(!hasVoted[proposalId][msg.sender], "Already voted on this proposal");

        hasVoted[proposalId][msg.sender] = true;
        prop.yesVotes += 1;

        emit ProposalVoted(proposalId, msg.sender, prop.yesVotes);
    }

    function executeProposal(uint256 proposalId) external onlyGovernor whenNotPaused {
        require(proposalId < proposals.length, "Invalid proposal ID");
        Proposal storage prop = proposals[proposalId];
        require(!prop.executed, "Proposal already executed");
        require(block.timestamp >= prop.eta, "Timelock delay is not over yet");
        require(prop.yesVotes >= 2, "Insufficient consensus signatures (min 2 required)");

        prop.executed = true;

        // Optimized gas hash computation once (A-09)
        bytes32 actionHash = keccak256(bytes(prop.actionType));

        if (actionHash == keccak256(bytes("setConsensusRegistry"))) {
            consensusRegistry = prop.targetAddress;
            emit ConsensusRegistryUpdated(prop.targetAddress);
        } else if (actionHash == keccak256(bytes("registerValidator"))) {
            isValidatorNode[prop.targetAddress] = true;
        } else if (actionHash == keccak256(bytes("updateGovernor"))) {
            isGovernor[prop.targetAddress] = !isGovernor[prop.targetAddress];
        } else if (actionHash == keccak256(bytes("setGasBackPercentage"))) {
            uint256 newVal = uint256(uint160(prop.targetAddress));
            require(newVal <= 100, "Gas back percentage too high");
            gasBackPercentage = newVal;
        } else if (actionHash == keccak256(bytes("setTimelockDelay"))) {
            uint256 newVal = uint256(uint160(prop.targetAddress));
            require(newVal >= 1 hours && newVal <= 30 days, "Invalid timelock delay range");
            timelockDelay = newVal;
        } else {
            revert("Unknown action type");
        }

        emit ProposalExecuted(proposalId, prop.actionType, prop.targetAddress);
    }

    function recycleGas(address validator, uint256 gasUsed) external whenNotPaused {
        require(msg.sender == consensusRegistry, "Only Consensus Registry can trigger recycling");
        
        // Use block.basefee or fallback to tx.gasprice if block.basefee is 0 (Fixed V-08)
        uint256 baseFee = block.basefee > 0 ? block.basefee : tx.gasprice;
        uint256 refundAmount = (gasUsed * baseFee * gasBackPercentage) / 100;
        uint256 maxRefund = 5000 * 10 ** 18;
        if (refundAmount > maxRefund) refundAmount = maxRefund;

        require(balanceOf(address(this)) >= refundAmount, "Insufficient treasury gas recycling balance");
        _transfer(address(this), validator, refundAmount);
        emit GasRecycled(validator, refundAmount);
    }

    /// @notice Claim validator rewards (A-02)
    function claimValidatorRewards(address validator, uint256 rewardAmount) external whenNotPaused {
        require(msg.sender == consensusRegistry, "Only Consensus Registry can claim rewards");
        require(balanceOf(address(this)) >= rewardAmount, "Reward pool is empty");
        _transfer(address(this), validator, rewardAmount);
        emit RewardsClaimed(validator, rewardAmount);
    }

    /// @notice Non-restrictive transfer with whitelist override during pause (NEW-MEDIUM-02)
    function transfer(address to, uint256 value) public override returns (bool) {
        if (paused()) {
            require(whitelistedContracts[msg.sender] || whitelistedContracts[to], "Token transfer is paused");
        }
        return super.transfer(to, value);
    }

    function transferFrom(address from, address to, uint256 value) public override returns (bool) {
        if (paused()) {
            require(whitelistedContracts[msg.sender] || whitelistedContracts[to] || whitelistedContracts[from], "Token transfer is paused");
        }
        return super.transferFrom(from, to, value);
    }
}
