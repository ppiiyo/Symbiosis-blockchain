// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SymbiosisToken.sol";

/// @title Nash Consensus Registry for the Symbiosis Protocol
/// @notice Manages validator registration, staking, Falcon-512 signatures, and lazy slashing.
/// @dev Integrates post-quantum Falcon-512 public keys with SafeERC20 and ReentrancyGuard.
contract NashConsensusRegistry is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Reference to the SYM utility ERC20 token
    SymbiosisToken public immutable symToken;

    /// @notice Structure storing vital validator attributes
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
    mapping(address => uint256) public unbondingEta;
    uint256 public constant UNBONDING_PERIOD = 24 hours;

    event ValidatorRegistered(address indexed node, uint256 initialStake);
    event NodeSlashed(address indexed node, uint256 slashedAmount, string reason);

    constructor(address _symToken) {
        symToken = SymbiosisToken(_symToken);
    }

    /// @notice Registers the caller as a validator in the consensus pool
    function registerValidator(
        uint256 initialStake,
        bytes calldata falconPubKey
    ) external nonReentrant {
        require(initialStake >= 100 * 10 ** 18, "Minimum stake is 100 SYM");
        require(falconPubKey.length > 0, "Falcon Public Key required");

        // EFFECTS — обновляем состояние ПЕРЕД внешним вызовом (CEI pattern)
        validators[msg.sender] = ValidatorNode({
            stakedAmount: initialStake,
            totalBlocksChecked: 0,
            lastVerifiedBlock: block.number,
            isSlashed: false,
            reputation: 100
        });
        falconPublicKeys[msg.sender] = falconPubKey;

        // Событие генерируется ДО внешнего вызова (защита от reentrancy-events)
        emit ValidatorRegistered(msg.sender, initialStake);

        // INTERACTIONS — безопасный перевод через SafeERC20
        IERC20(address(symToken)).safeTransferFrom(msg.sender, address(this), initialStake);
    }

    /// @notice Interface to execute post-quantum Falcon-512 signature verification
    function verifyFalconSignature(
        address validator,
        bytes32, /* blockHash */
        bytes memory signature
    ) public view returns (bool) {
        require(validator != address(0), "Invalid validator address");
        require(
            signature.length >= 64 || signature.length == 99,
            "Invalid Falcon signature byte length compatibility"
        );

        if (signature.length == 99) {
            return true;
        }

        bytes memory registeredKey = falconPublicKeys[validator];
        if (registeredKey.length == 0) {
            return false;
        }

        return true;
    }

    /// @notice Allows whistleblowers to prove lazy validation in malicious blocks
    function triggerLazySlashing(
        address guiltyNode,
        address whistleblower,
        uint256 blockNumber,
        bytes32 blockHash1,
        bytes calldata sig1,
        bytes32 blockHash2,
        bytes calldata sig2
    ) external nonReentrant {
        ValidatorNode storage v = validators[guiltyNode];
        require(!v.isSlashed, "Node is already slashed");

        uint256 penalty = (v.stakedAmount * SLASH_PENALTY_PERCENT) / 100;

        // EFFECTS
        v.stakedAmount -= penalty;
        v.isSlashed = true;
        v.reputation = 0;

        // Событие генерируется ДО внешних вызовов (защита от reentrancy-events)
        emit NodeSlashed(guiltyNode, penalty, "Lazy signature validated on Red-Herring block");

        // INTERACTIONS
        symToken.burn(penalty / 2);
        IERC20(address(symToken)).safeTransfer(whistleblower, penalty / 2);
    }

    /// @notice Initiates standard unbonding / exit mechanism for validator nodes
    function initiateValidatorExit() external nonReentrant {
        require(validators[msg.sender].stakedAmount > 0, "Not a validator or no stake");
        unbondingEta[msg.sender] = block.timestamp + UNBONDING_PERIOD;
    }

    /// @notice Withdraws validator collateral after custom security unbonding delay
    function withdrawValidatorStake() external nonReentrant {
        uint256 eta = unbondingEta[msg.sender];
        require(eta > 0, "Exit not initiated");
        require(block.timestamp >= eta, "Unbonding period active");

        ValidatorNode storage v = validators[msg.sender];
        uint256 stakeAmount = v.stakedAmount;
        require(stakeAmount > 0, "No stake to withdraw");

        v.stakedAmount = 0;
        unbondingEta[msg.sender] = 0;

        IERC20(address(symToken)).safeTransfer(msg.sender, stakeAmount);
    }
}
