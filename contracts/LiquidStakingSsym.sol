// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SymbiosisToken.sol";

contract LiquidStakingSsym is ERC20, ReentrancyGuard {
    SymbiosisToken public immutable symToken;
    address public zkProverRegistry;
    
    event Staked(address indexed user, uint256 amount, uint256 sSymMinted);
    event Unstaked(address indexed user, uint256 sSymBurned, uint256 symReturned);

    constructor(address _symToken) ERC20("Liquid Staked SYM", "sSYM") {
        symToken = SymbiosisToken(_symToken);
    }

    function updateZkProver(address newRegistry) external {
        require(zkProverRegistry == address(0) || msg.sender == zkProverRegistry, "Unauthorized");
        zkProverRegistry = newRegistry;
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        uint256 totalShares = totalSupply();
        uint256 totalSym = symToken.balanceOf(address(this));

        uint256 sharesToMint;
        if (totalShares == 0 || totalSym == 0) {
            sharesToMint = amount;
        } else {
            sharesToMint = (amount * totalShares) / totalSym;
        }

        symToken.transferFrom(msg.sender, address(this), amount);
        _mint(msg.sender, sharesToMint);
        emit Staked(msg.sender, amount, sharesToMint);
    }

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
