// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./SymbiosisToken.sol";

/// @title Liquid Staking for Symbiosis Protocol (sSYM)
/// @notice This contract enables users to stake SYM tokens to receive liquid sSYM tokens.
/// @dev Implements SafeERC20, ReentrancyGuard, and Pausable for robust protection.
contract LiquidStakingSsym is ERC20, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /// @notice The underlying Symbiosis utility token
    SymbiosisToken public immutable symToken;

    /// @notice Registry address for the ZK Prover security network
    address public zkProverRegistry;

    /// @notice Emitted when a user stakes SYM to mint sSYM
    event Staked(address indexed user, uint256 amount, uint256 sSymMinted);

    /// @notice Emitted when sSYM is burned to withdraw SYM collateral
    event Unstaked(address indexed user, uint256 sSymBurned, uint256 symReturned);

    /// @notice Deploys the liquid staking contract linked to the official SYM ERC20 token
    constructor(address _symToken) ERC20("Liquid Staked SYM", "sSYM") {
        symToken = SymbiosisToken(_symToken);
    }

    /// @notice Updates the associated ZK Prover Registry authorized entity
    function updateZkProver(address newRegistry) external {
        require(newRegistry != address(0), "Zero address");
        require(
            zkProverRegistry == address(0) || msg.sender == zkProverRegistry,
            "Unauthorized"
        );
        zkProverRegistry = newRegistry;
    }

    modifier onlyGovernor() {
        require(symToken.isGovernor(msg.sender), "Caller is not an authorized governor");
        _;
    }

    /// @notice Triggers emergency pausing of all staking/unstaking operations
    function pause() external onlyGovernor {
        _pause();
    }

    /// @notice Resumes standard staking/unstaking operations
    function unpause() external onlyGovernor {
        _unpause();
    }

    /// @notice Stakes SYM tokens to receive derivative sSYM shares
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");

        uint256 totalShares = totalSupply();
        uint256 totalSym = symToken.balanceOf(address(this));

        uint256 sharesToMint;
        if (totalShares < 1) {
            _mint(address(0x000000000000000000000000000000000000dEaD), 1000);
            sharesToMint = amount - 1000;
        } else {
            sharesToMint = (amount * totalShares) / totalSym;
        }

        // EFFECTS — обновляем состояние до внешних вызовов
        _mint(msg.sender, sharesToMint);

        // INTERACTIONS — безопасный перевод через SafeERC20
        IERC20(address(symToken)).safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, amount, sharesToMint);
    }

    /// @notice Burns sSYM shares to reclaim the corresponding underlying SYM tokens
    function unstake(uint256 shares) external nonReentrant whenNotPaused {
        require(shares > 0, "Shares must be greater than 0");

        uint256 totalShares = totalSupply();
        uint256 totalSym = symToken.balanceOf(address(this));

        uint256 symToReturn = (shares * totalSym) / totalShares;

        // EFFECTS
        _burn(msg.sender, shares);

        // INTERACTIONS
        IERC20(address(symToken)).safeTransfer(msg.sender, symToReturn);

        emit Unstaked(msg.sender, shares, symToReturn);
    }
}
