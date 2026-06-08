// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./SymbiosisToken.sol";

/// @title Liquid Staking for Symbiosis Protocol (sSYM) conforming to ERC-4626
/// @notice This contract enables users to stake SYM tokens to receive liquid sSYM tokens (shares).
/// @dev Fully conforms to ERC-4626 Tokenized Vault Standard while supporting custom initialization math.
contract LiquidStakingSsym is ERC4626, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using Math for uint256;

    /// @notice Registry address for the ZK Prover security network
    address public zkProverRegistry;

    /// @notice Emitted when a user stakes SYM to mint sSYM
    event Staked(address indexed user, uint256 amount, uint256 sSymMinted);

    /// @notice Emitted when sSYM is burned to withdraw SYM collateral
    event Unstaked(address indexed user, uint256 sSymBurned, uint256 symReturned);

    /// @notice Deploys the liquid staking contract linked to the official SYM ERC20 token
    constructor(address _symToken) 
        ERC20("Liquid Staked SYM", "sSYM") 
        ERC4626(IERC20(_symToken)) 
    {
        require(_symToken != address(0), "Invalid token address");
    }

    /// @notice Updates the associated ZK Prover Registry authorized entity
    function updateZkProver(address newRegistry) external {
        require(newRegistry != address(0), "Zero address");
        // Only governors can initialize it if empty, otherwise only current registry can change (Fixed V-06)
        require(
            (zkProverRegistry == address(0) && SymbiosisToken(payable(asset())).isGovernor(msg.sender)) || msg.sender == zkProverRegistry,
            "Unauthorized"
        );
        zkProverRegistry = newRegistry;
    }

    modifier onlyGovernor() {
        require(SymbiosisToken(payable(asset())).isGovernor(msg.sender), "Caller is not an authorized governor");
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

    /// @dev Custom conversion from assets to shares matching the 1000 dead-shares protection
    function _convertToShares(uint256 assets, Math.Rounding rounding) internal view override returns (uint256) {
        uint256 totalShares = totalSupply();
        if (totalShares < 1) {
            if (assets <= 1000) return 0;
            return assets - 1000;
        }
        return assets.mulDiv(totalShares, totalAssets(), rounding);
    }

    /// @dev Custom conversion from shares to assets matching the 1000 dead-shares protection
    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view override returns (uint256) {
        uint256 totalShares = totalSupply();
        if (totalShares < 1) {
            return shares + 1000;
        }
        return shares.mulDiv(totalAssets(), totalShares, rounding);
    }

    /// @dev Override internal deposit hook to ensure Pausable enforcement, initial dead-minting, and event logging
    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal override whenNotPaused {
        if (totalSupply() < 1) {
            require(assets > 1000, "Minimum first stake is 1001 SYM");
            _mint(address(0x000000000000000000000000000000000000dEaD), 1000);
        }
        super._deposit(caller, receiver, assets, shares);
        emit Staked(receiver, assets, shares);
    }

    /// @dev Override internal withdraw hook to ensure Pausable enforcement and event logging
    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares
    ) internal override whenNotPaused {
        super._withdraw(caller, receiver, owner, assets, shares);
        emit Unstaked(owner, shares, assets);
    }

    /// @notice Legacy stakes SYM tokens to receive derivative sSYM shares (for backward-compatibility)
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        deposit(amount, msg.sender);
    }

    /// @notice Legacy burns sSYM shares to reclaim the corresponding underlying SYM tokens (for backward-compatibility)
    function unstake(uint256 shares) external nonReentrant whenNotPaused {
        require(shares > 0, "Shares must be greater than 0");
        redeem(shares, msg.sender, msg.sender);
    }
}
