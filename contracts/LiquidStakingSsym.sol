// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SymbiosisToken.sol";

/// @title Liquid Staking for Symbiosis Protocol (sSYM)
/// @notice This contract enables users to stake SYM tokens to receive liquid sSYM tokens, forming a yield-bearing derivative.
/// @dev Implements standard ERC20 and ReentrancyGuard for robust protection against rentrancy attacks.
contract LiquidStakingSsym is ERC20, ReentrancyGuard {
    /// @notice The underlying Symbiosis utility token
    SymbiosisToken public immutable symToken;
    
    /// @notice Registry address for the ZK Prover security network
    address public zkProverRegistry;
    
    /// @notice Emitted when a user stakes SYM to mint sSYM
    /// @param user The address of the staker
    /// @param amount The amount of SYM collateral staked
    /// @param sSymMinted The amount of sSYM liquid shares minted
    event Staked(address indexed user, uint256 amount, uint256 sSymMinted);
    
    /// @notice Emitted when sSYM is burned to withdraw SYM collateral
    /// @param user The address of the unstaker
    /// @param sSymBurned The number of sSYM shares burned
    /// @param symReturned The amount of SYM tokens returned
    event Unstaked(address indexed user, uint256 sSymBurned, uint256 symReturned);

    /// @notice Deploys the liquid staking contract linked to the official SYM ERC20 token
    /// @param _symToken Address of the SymbiosisToken deployment
    constructor(address _symToken) ERC20("Liquid Staked SYM", "sSYM") {
        symToken = SymbiosisToken(_symToken);
    }

    /// @notice Updates the associated ZK Prover Registry authorized entity
    /// @dev Requires that only an authorized governor of the SYM token, or the existing zkProverRegistry, can set/change this. This fully prevents frontrunning hijack attacks when initial state is address(0).
    /// @param newRegistry The coordinate address of the new ZK Prover Registry
    function updateZkProver(address newRegistry) external {
        require(newRegistry != address(0), "New registry cannot be zero address");
        require(symToken.isGovernor(msg.sender) || (zkProverRegistry != address(0) && msg.sender == zkProverRegistry), "Unauthorized");
        zkProverRegistry = newRegistry;
    }

    /// @notice Stakes SYM tokens to receive derivative sSYM shares representing protocol voting rights and reward claims
    /// @dev Secures token transfers and calculates share division dynamically to avoid first-depositor inflation dilution
    /// @param amount Number of SYM tokens to deposit
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        uint256 totalShares = totalSupply();
        uint256 totalSym = symToken.balanceOf(address(this));

        uint256 sharesToMint;
        if (totalShares == 0 || totalSym == 0) {
            // 🛡️ REMEDIATION: Burn first 1000 shares to make pools mathematically immune to first depositor inflation attacks
            uint256 MINIMUM_LIQUIDITY = 1000;
            require(amount > MINIMUM_LIQUIDITY, "First deposit must exceed MINIMUM_LIQUIDITY (1000 wei)");
            _mint(address(0x000000000000000000000000000000000000dEaD), MINIMUM_LIQUIDITY); // Permanent burn of initial supply
            sharesToMint = amount - MINIMUM_LIQUIDITY;
        } else {
            sharesToMint = (amount * totalShares) / totalSym;
        }

        require(sharesToMint > 0, "Minted sSYM shares cannot be zero");

        symToken.transferFrom(msg.sender, address(this), amount);
        _mint(msg.sender, sharesToMint);
        emit Staked(msg.sender, amount, sharesToMint);
    }

    /// @notice Burns sSYM shares to reclaim the corresponding underlying base SYM tokens
    /// @dev Adjusts transfer pools dynamically based on pool balances
    /// @param shares The amount of sSYM shares to burn
    function unstake(uint256 shares) external nonReentrant {
        require(shares > 0, "Shares must be greater than 0");
        uint256 totalShares = totalSupply();
        uint256 totalSym = symToken.balanceOf(address(this));

        uint256 symToReturn = (shares * totalSym) / totalShares; 
        
        _burn(msg.sender, shares);
        symToken.transfer(msg.sender, symToReturn);
        emit Unstaked(msg.sender, shares, symToReturn);
    }
}
