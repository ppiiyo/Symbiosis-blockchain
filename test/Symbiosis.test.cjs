const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Symbiosis Protocol Test Suite", function () {
  let SymbiosisToken, symToken;
  let LiquidStakingSsym, sSymToken;
  let NashConsensusRegistry, consensus;
  let owner, validator, whistleblower, user, externalUser;
  const gov2Address = "0x2c6F91Ce3a6ABd991FfCD4C6deE3b689cdE1528B";
  let gov2Signer;

  beforeEach(async function () {
    [owner, validator, whistleblower, user, externalUser] = await ethers.getSigners();

    // 1. Deploy SymbiosisToken
    SymbiosisToken = await ethers.getContractFactory("SymbiosisToken");
    symToken = await SymbiosisToken.deploy();
    await symToken.waitForDeployment();

    // 2. Deploy LiquidStakingSsym
    LiquidStakingSsym = await ethers.getContractFactory("LiquidStakingSsym");
    sSymToken = await LiquidStakingSsym.deploy(await symToken.getAddress());
    await sSymToken.waitForDeployment();

    // 3. Deploy NashConsensusRegistry
    NashConsensusRegistry = await ethers.getContractFactory("NashConsensusRegistry");
    consensus = await NashConsensusRegistry.deploy(await symToken.getAddress());
    await consensus.waitForDeployment();

    // Setup Impersonated Signer for hardcoded gov2Address
    await ethers.provider.send("hardhat_impersonateAccount", [gov2Address]);
    gov2Signer = await ethers.getSigner(gov2Address);

    // Fund the impersonated governor with some ETH for gas
    await owner.sendTransaction({
      to: gov2Address,
      value: ethers.parseEther("1.0")
    });
  });

  describe("1. Deployment", function () {
    it("Should correctly mint 80% to owner and 20% to the token contract", async function () {
      const maxSupply = await symToken.MAX_SUPPLY();
      const ownerBalance = await symToken.balanceOf(owner.address);
      const contractBalance = await symToken.balanceOf(await symToken.getAddress());

      expect(ownerBalance).to.equal(maxSupply * 80n / 100n);
      expect(contractBalance).to.equal(maxSupply * 20n / 100n);
    });
  });

  describe("2. Liquid Staking - Stake & Unstake", function () {
    it("Should allow multiple users to stake and receive sSYM proportional to pool shares", async function () {
      const stakeAmount = ethers.parseEther("100");

      // User 1 stakes
      await symToken.transfer(user.address, stakeAmount);
      await symToken.connect(user).approve(await sSymToken.getAddress(), stakeAmount);
      await sSymToken.connect(user).stake(stakeAmount);

      // 🛡️ User 1 should have stakeAmount - 1000 due to MINIMUM_LIQUIDITY burn (Uniswap pool inflation protection)
      expect(await sSymToken.balanceOf(user.address)).to.equal(stakeAmount - 1000n);
      expect(await symToken.balanceOf(await sSymToken.getAddress())).to.equal(stakeAmount);

      // User 2 stakes (this covers the totalShares > 0 / else branch in stake)
      await symToken.transfer(externalUser.address, stakeAmount);
      await symToken.connect(externalUser).approve(await sSymToken.getAddress(), stakeAmount);
      await sSymToken.connect(externalUser).stake(stakeAmount);

      // User 2 receives full proportional shares
      expect(await sSymToken.balanceOf(externalUser.address)).to.equal(stakeAmount);
    });

    it("Should revert staking 0 amount", async function () {
      await expect(
        sSymToken.connect(user).stake(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should burn sSYM and return SYM properly upon unstaking", async function () {
      const stakeAmount = ethers.parseEther("100");
      const unstakeAmount = ethers.parseEther("50");

      await symToken.transfer(user.address, stakeAmount);
      await symToken.connect(user).approve(await sSymToken.getAddress(), stakeAmount);
      await sSymToken.connect(user).stake(stakeAmount);

      await sSymToken.connect(user).unstake(unstakeAmount);

      expect(await sSymToken.balanceOf(user.address)).to.equal(ethers.parseEther("50") - 1000n);
      expect(await symToken.balanceOf(user.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should revert unstaking 0 shares", async function () {
      await expect(
        sSymToken.connect(user).unstake(0)
      ).to.be.revertedWith("Shares must be greater than 0");
    });

    it("Should handle updateZkProver correctly for authorized and unauthorized callers", async function () {
      // 1. Initial set (zkProverRegistry is address(0)) should require owner (who is governor)
      await sSymToken.connect(owner).updateZkProver(user.address);
      expect(await sSymToken.zkProverRegistry()).to.equal(user.address);

      // 2. Random user attempt to overwrite should fail
      await expect(
        sSymToken.connect(externalUser).updateZkProver(externalUser.address)
      ).to.be.revertedWith("Unauthorized");

      // 3. Current registry attempt to update should succeed
      await sSymToken.connect(user).updateZkProver(externalUser.address);
      expect(await sSymToken.zkProverRegistry()).to.equal(externalUser.address);
    });
  });

  describe("3. Nash Consensus Slashing & Signatures", function () {
    it("Should register a validator and trigger lazy slashing", async function () {
      const initialStake = ethers.parseEther("100");

      await symToken.transfer(validator.address, initialStake);
      await symToken.connect(validator).approve(await consensus.getAddress(), initialStake);

      const fakeFalconPubKey = ethers.hexlify(ethers.randomBytes(32));
      await consensus.connect(validator).registerValidator(initialStake, fakeFalconPubKey);

      let valInfo = await consensus.validators(validator.address);
      expect(valInfo.stakedAmount).to.equal(initialStake);
      expect(valInfo.isSlashed).to.be.false;

      const prevWhistleblowerBal = await symToken.balanceOf(whistleblower.address);

      const penalty = (initialStake * 15n) / 100n; 
      const rewardAmount = penalty / 2n; 

      const blockHash1 = ethers.zeroPadValue("0x11", 32);
      const blockHash2 = ethers.zeroPadValue("0x22", 32);
      const sig1 = "0x" + "00".repeat(99);
      const sig2 = "0x" + "00".repeat(99);

      await consensus.triggerLazySlashing(validator.address, whistleblower.address, 12345n, blockHash1, sig1, blockHash2, sig2);

      valInfo = await consensus.validators(validator.address);
      expect(valInfo.isSlashed).to.be.true;
      expect(valInfo.stakedAmount).to.equal(initialStake - penalty);
      expect(valInfo.reputation).to.equal(0n);

      const postWhistleblowerBal = await symToken.balanceOf(whistleblower.address);
      expect(postWhistleblowerBal - prevWhistleblowerBal).to.equal(rewardAmount);
    });

    it("Should revert registering validator with insufficient stake", async function () {
      const lowStake = ethers.parseEther("99");
      await symToken.transfer(validator.address, lowStake);
      await symToken.connect(validator).approve(await consensus.getAddress(), lowStake);

      const fakeFalconPubKey = ethers.hexlify(ethers.randomBytes(32));
      await expect(
        consensus.connect(validator).registerValidator(lowStake, fakeFalconPubKey)
      ).to.be.revertedWith("Minimum stake is 100 SYM");
    });

    it("Should revert registering validator with empty public key", async function () {
      const initialStake = ethers.parseEther("100");
      await symToken.transfer(validator.address, initialStake);
      await symToken.connect(validator).approve(await consensus.getAddress(), initialStake);

      await expect(
        consensus.connect(validator).registerValidator(initialStake, "0x")
      ).to.be.revertedWith("Falcon Public Key required");
    });

    it("Should verify Falcon Signatures and execute precompile branch coverage", async function () {
      const initialStake = ethers.parseEther("100");
      await symToken.transfer(validator.address, initialStake);
      await symToken.connect(validator).approve(await consensus.getAddress(), initialStake);
      const fakeFalconPubKey = ethers.hexlify(ethers.randomBytes(32));
      await consensus.connect(validator).registerValidator(initialStake, fakeFalconPubKey);

      const fakeHash = ethers.zeroPadValue("0x12", 32);
      const fakeSig = ethers.hexlify(ethers.randomBytes(64));

      // 1. Standard local network execution (returns true quickly)
      const isOkNormal = await consensus.verifyFalconSignature(validator.address, fakeHash, fakeSig);
      expect(isOkNormal).to.be.true;

      // 2. Custom execution bypassing quick return (signature of length 99)
      const specialSig = "0x" + "00".repeat(99);
      const isOkSpecial = await consensus.verifyFalconSignature(validator.address, fakeHash, specialSig);
      expect(isOkSpecial).to.be.true;
    });

    it("Should revert if trying to slash an already slashed node", async function () {
      const initialStake = ethers.parseEther("100");
      await symToken.transfer(validator.address, initialStake);
      await symToken.connect(validator).approve(await consensus.getAddress(), initialStake);
      const fakeFalconPubKey = ethers.hexlify(ethers.randomBytes(32));
      await consensus.connect(validator).registerValidator(initialStake, fakeFalconPubKey);

      const blockHash1 = ethers.zeroPadValue("0x11", 32);
      const blockHash2 = ethers.zeroPadValue("0x22", 32);
      const sig1 = "0x" + "00".repeat(99);
      const sig2 = "0x" + "00".repeat(99);

      // First slash
      await consensus.triggerLazySlashing(validator.address, whistleblower.address, 12345n, blockHash1, sig1, blockHash2, sig2);

      // Second slash must fail
      await expect(
        consensus.triggerLazySlashing(validator.address, whistleblower.address, 12345n, blockHash1, sig1, blockHash2, sig2)
      ).to.be.revertedWith("Node is already slashed");
    });

    it("Should allow validator exit and withdraw stake after unbonding period", async function () {
      const initialStake = ethers.parseEther("100");
      await symToken.transfer(validator.address, initialStake);
      await symToken.connect(validator).approve(await consensus.getAddress(), initialStake);
      const fakeFalconPubKey = ethers.hexlify(ethers.randomBytes(32));
      await consensus.connect(validator).registerValidator(initialStake, fakeFalconPubKey);

      // Check exit request
      await consensus.connect(validator).initiateValidatorExit();
      const eta = await consensus.unbondingEta(validator.address);
      expect(eta).to.be.greaterThan(0n);

      // Try withdrawing before period (fails)
      await expect(
        consensus.connect(validator).withdrawValidatorStake()
      ).to.be.revertedWith("Unbonding period active");

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      // Withdraw stake
      const prevBal = await symToken.balanceOf(validator.address);
      await consensus.connect(validator).withdrawValidatorStake();
      const postBal = await symToken.balanceOf(validator.address);
      expect(postBal - prevBal).to.equal(initialStake);

      const valInfo = await consensus.validators(validator.address);
      expect(valInfo.stakedAmount).to.equal(0n);
    });
  });

  describe("4. DAO Governance & Proposals", function () {
    it("Should correctly proposed, vote, and execute actions with DAO timelock", async function () {
      const consensusAddress = await consensus.getAddress();

      // 1. Create a proposal action
      const proposeTx = await symToken.connect(owner).proposeAction("setConsensusRegistry", consensusAddress);
      await proposeTx.wait();

      const proposalId = 0;
      let prop = await symToken.proposals(proposalId);
      expect(prop.actionType).to.equal("setConsensusRegistry");
      expect(prop.targetAddress).to.equal(consensusAddress);
      expect(prop.yesVotes).to.equal(1n);
      expect(prop.executed).to.be.false;

      // 2. Vote as governor 2
      await symToken.connect(gov2Signer).voteProposal(proposalId);
      prop = await symToken.proposals(proposalId);
      expect(prop.yesVotes).to.equal(2n);

      // 3. Try to vote again (fails)
      await expect(
        symToken.connect(gov2Signer).voteProposal(proposalId)
      ).to.be.revertedWith("Already voted on this proposal");

      // 4. Try to execute before timelock expires (fails)
      await expect(
        symToken.connect(owner).executeProposal(proposalId)
      ).to.be.revertedWith("Timelock delay is not over yet");

      // 5. Fast forward time and execute proposal 0
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      await symToken.connect(owner).executeProposal(proposalId);
      prop = await symToken.proposals(proposalId);
      expect(prop.executed).to.be.true;
      expect(await symToken.consensusRegistry()).to.equal(consensusAddress);

      // 6. Attempt to vote on executed proposal (fails)
      await expect(
        symToken.connect(gov2Signer).voteProposal(proposalId)
      ).to.be.revertedWith("Proposal already executed");

      // 7. Attempt to execute executed proposal (fails)
      await expect(
        symToken.connect(owner).executeProposal(proposalId)
      ).to.be.revertedWith("Proposal already executed");
    });

    it("Should revert execute if proposal misses quorum signatures", async function () {
      const proposeTx = await symToken.connect(owner).proposeAction("registerValidator", validator.address);
      await proposeTx.wait();
      const proposalId = 0;

      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      await expect(
        symToken.connect(owner).executeProposal(proposalId)
      ).to.be.revertedWith("Insufficient consensus signatures (min 2 required)");
    });

    it("Should execute alternative proposal action types of registerValidator and updateGovernor", async function () {
      // 1. Proposal: registerValidator
      let tx = await symToken.connect(owner).proposeAction("registerValidator", validator.address);
      await tx.wait();
      const propIdVal = 0;
      await symToken.connect(gov2Signer).voteProposal(propIdVal);

      // 2. Proposal: updateGovernor
      tx = await symToken.connect(owner).proposeAction("updateGovernor", gov2Address);
      await tx.wait();
      const propIdGov = 1;
      await symToken.connect(gov2Signer).voteProposal(propIdGov);

      // 3. Proposal: Unknown action
      tx = await symToken.connect(owner).proposeAction("invalidAction", gov2Address);
      await tx.wait();
      const propIdUnknown = 2;
      await symToken.connect(gov2Signer).voteProposal(propIdUnknown);

      // Fast forward
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      // Execute registerValidator
      await symToken.connect(owner).executeProposal(propIdVal);
      expect(await symToken.isValidatorNode(validator.address)).to.be.true;

      // Execute updateGovernor (removes gov2)
      await symToken.connect(owner).executeProposal(propIdGov);
      expect(await symToken.isGovernor(gov2Address)).to.be.false;

      // Execute Unknown and see revert
      await expect(
        symToken.connect(owner).executeProposal(propIdUnknown)
      ).to.be.revertedWith("Unknown action type");
    });

    it("Should revert if non-governor tries to create action or execute proposal", async function () {
      const consensusAddress = await consensus.getAddress();
      await expect(
        symToken.connect(user).proposeAction("setConsensusRegistry", consensusAddress)
      ).to.be.revertedWith("Caller is not an authorized governor");

      await expect(
        symToken.connect(user).executeProposal(0)
      ).to.be.revertedWith("Caller is not an authorized governor");
    });
  });

  describe("5. Gas Recycling Engine", function () {
    it("Should recycle gas correctly when called by Consensus Registry", async function () {
      const ownerAddress = owner.address;
      // 1. Setup Consensus Registry address via mock-DAO proposal
      const proposeTx = await symToken.connect(owner).proposeAction("setConsensusRegistry", ownerAddress); // Make owner the registry for easy testing
      await proposeTx.wait();
      await symToken.connect(gov2Signer).voteProposal(0);
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");
      await symToken.connect(owner).executeProposal(0);

      // 2. Recycle small gas (standard flow)
      const prevBal = await symToken.balanceOf(validator.address);
      // gasUsed = 100,000, tx.gasprice = 10 gwei, refundPercentage = 25%
      // cap is 5000 SYM
      const txRecycle = await symToken.connect(owner).recycleGas(validator.address, 100000n);
      await txRecycle.wait();

      const postBal = await symToken.balanceOf(validator.address);
      expect(postBal).to.be.greaterThan(prevBal);

      // 3. Recycle large gas (covers maxRefund capping logic)
      const hugeGasUsed = 100000000000000n; // Exceeds capping logic
      const txHugeRecycle = await symToken.connect(owner).recycleGas(validator.address, hugeGasUsed);
      await txHugeRecycle.wait();

      const maxCappedBal = await symToken.balanceOf(validator.address);
      expect(maxCappedBal).to.be.greaterThan(postBal);
    });

    it("Should revert if recycling is triggered by non-registry address", async function () {
      await expect(
        symToken.connect(user).recycleGas(validator.address, 1000n)
      ).to.be.revertedWith("Only Consensus Registry can trigger recycling");
    });
  });

  describe("6. Emergency Pausable Guards", function () {
    it("Should allow only governors to pause/unpause staking, and revert operations when paused", async function () {
      // 1. Non-governor attempts to pause staking (must revert)
      await expect(
        sSymToken.connect(user).pause()
      ).to.be.revertedWith("Caller is not an authorized governor");

      // 2. Governor pauses staking (must succeed)
      await sSymToken.connect(owner).pause();

      // 3. Attempt staking when paused (must revert with EnforcedPause)
      const stakeAmount = ethers.parseEther("10");
      await symToken.transfer(user.address, stakeAmount);
      await symToken.connect(user).approve(await sSymToken.getAddress(), stakeAmount);
      await expect(
        sSymToken.connect(user).stake(stakeAmount)
      ).to.be.revertedWithCustomError(sSymToken, "EnforcedPause");

      // 4. Governor unpauses staking (must succeed)
      await sSymToken.connect(owner).unpause();

      // 5. Staking after unpausing (must succeed)
      await sSymToken.connect(user).stake(stakeAmount);
      expect(await sSymToken.balanceOf(user.address)).to.be.greaterThan(0n);
    });

    it("Should allow only governors to pause/unpause consensus, and revert operations when paused", async function () {
      // 1. Non-governor attempts to pause consensus (must revert)
      await expect(
        consensus.connect(user).pause()
      ).to.be.revertedWith("Caller is not an authorized governor");

      // 2. Governor pauses consensus (must succeed)
      await consensus.connect(owner).pause();

      // 3. Validator registration attempt when paused (must revert with EnforcedPause)
      const initialStake = ethers.parseEther("100");
      await symToken.transfer(validator.address, initialStake);
      await symToken.connect(validator).approve(await consensus.getAddress(), initialStake);
      const fakeFalconPubKey = ethers.hexlify(ethers.randomBytes(32));

      await expect(
        consensus.connect(validator).registerValidator(initialStake, fakeFalconPubKey)
      ).to.be.revertedWithCustomError(consensus, "EnforcedPause");

      // 4. Governor unpauses consensus (must succeed)
      await consensus.connect(owner).unpause();

      // 5. Validator registration after unpausing (must succeed)
      await consensus.connect(validator).registerValidator(initialStake, fakeFalconPubKey);
      const valInfo = await consensus.validators(validator.address);
      expect(valInfo.stakedAmount).to.equal(initialStake);
    });
  });

  describe("7. Additional Modern Security & Parameter Auditing Checks", function () {
    it("Should prevent invalid governance parameters out of range", async function () {
      // 1. Slash penalty out of range
      await expect(
        consensus.connect(owner).setSlashPenaltyPercent(2)
      ).to.be.revertedWith("Slash penalty out of range");

      await expect(
        consensus.connect(owner).setSlashPenaltyPercent(51)
      ).to.be.revertedWith("Slash penalty out of range");

      // 2. Unbonding period out of range
      await expect(
        consensus.connect(owner).setUnbondingPeriod(0)
      ).to.be.revertedWith("Unbonding period out of range");

      // 3. Propose action checks
      await expect(
        symToken.connect(owner).proposeAction("setGasBackPercentage", "0x0000000000000000000000000000000000000065") // 101%
      ).to.be.revertedWith("Gas back percentage too high");

      await expect(
        symToken.connect(owner).proposeAction("setTimelockDelay", "0x0000000000000000000000000000000000000000") // 0 delay
      ).to.be.revertedWith("Invalid timelock delay range");
    });

    it("Should enforce proposalId bounds check in voting and execution", async function () {
      await expect(
        symToken.connect(owner).voteProposal(99)
      ).to.be.revertedWith("Invalid proposal ID");

      await expect(
        symToken.connect(owner).executeProposal(99)
      ).to.be.revertedWith("Invalid proposal ID");
    });

    it("Should support pausing with Uniswap/DeFi escape whitelisting compatibility", async function () {
      const transferAmount = ethers.parseEther("10");
      await symToken.transfer(user.address, transferAmount);

      // Pause token
      await symToken.connect(owner).pause();

      // Normal user transfers must revert when token is paused
      await expect(
        symToken.connect(user).transfer(externalUser.address, ethers.parseEther("1"))
      ).to.be.revertedWith("Token transfer is paused");

      // Governor whitelists user
      await symToken.connect(owner).setWhitelistedContract(user.address, true);

      // Whitelisted user can now transfer even when paused
      await symToken.connect(user).transfer(externalUser.address, ethers.parseEther("1"));
      expect(await symToken.balanceOf(externalUser.address)).to.equal(ethers.parseEther("1"));

      // Unpause token
      await symToken.connect(owner).unpause();
    });

    it("Should enforce reward accrual and prevent unauthorized claim drainages", async function () {
      // Set consensus registry address in token contract via DAO Proposal
      const consensusAddr = await consensus.getAddress();
      await symToken.connect(owner).proposeAction("setConsensusRegistry", consensusAddr);
      await symToken.connect(gov2Signer).voteProposal(0);
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");
      await symToken.connect(owner).executeProposal(0);

      // Register validator
      const initialStake = ethers.parseEther("100");
      await symToken.transfer(validator.address, initialStake);
      await symToken.connect(validator).approve(consensusAddr, initialStake);
      const fakeFalconPubKey = ethers.hexlify(ethers.randomBytes(32));
      await consensus.connect(validator).registerValidator(initialStake, fakeFalconPubKey);

      // Try claiming rewards without verifying blocks (fails because accumulated is 0)
      await expect(
        consensus.connect(validator).claimValidatorRewards(ethers.parseEther("5"))
      ).to.be.revertedWith("Exceeds accumulated rewards");

      // Verify 2 blocks -> earns 10 SYM (2 * 5)
      await consensus.connect(validator).submitBlockVerification(2);

      const maxClaim = await consensus.accumulatedRewards(validator.address);
      expect(maxClaim).to.equal(ethers.parseEther("10"));

      // Claim some rewards (succeeds)
      const prevBal = await symToken.balanceOf(validator.address);
      await consensus.connect(validator).claimValidatorRewards(ethers.parseEther("5"));
      const postBal = await symToken.balanceOf(validator.address);
      expect(postBal - prevBal).to.equal(ethers.parseEther("5"));

      // Attempt to double claim or claim too much (fails)
      await expect(
        consensus.connect(validator).claimValidatorRewards(ethers.parseEther("10"))
      ).to.be.revertedWith("Exceeds accumulated rewards");
    });
  });

  describe("8. ERC-4626 Standard & ZK-Cops Integration Tests", function () {
    let zkProverRegistry;

    beforeEach(async function () {
      const ZkProverRegistry = await ethers.getContractFactory("ZkProverRegistry");
      zkProverRegistry = await ZkProverRegistry.deploy(await symToken.getAddress());
      await zkProverRegistry.waitForDeployment();
    });

    it("Should provide standard ERC-4626 interfaces (totalAssets, asset, convertToShares)", async function () {
      const assetAddr = await sSymToken.asset();
      expect(assetAddr).to.equal(await symToken.getAddress());

      const initialAssets = await sSymToken.totalAssets();
      expect(initialAssets).to.equal(0n);

      const sharesFor100SYM = await sSymToken.convertToShares(ethers.parseEther("100"));
      // First deposit burns 1000 shares
      expect(sharesFor100SYM).to.equal(ethers.parseEther("100") - 1000n);
    });

    it("Should support standard ERC-4626 deposit and redeem calls", async function () {
      const stakeAmount = ethers.parseEther("100");
      await symToken.transfer(user.address, stakeAmount);
      await symToken.connect(user).approve(await sSymToken.getAddress(), stakeAmount);

      // Call standard ERC-4626 deposit(assets, receiver)
      await sSymToken.connect(user).deposit(stakeAmount, user.address);

      const shares = await sSymToken.balanceOf(user.address);
      expect(shares).to.equal(stakeAmount - 1000n);

      // Redeem shares using standard ERC-4626 redeem(shares, receiver, owner)
      await sSymToken.connect(user).approve(await sSymToken.getAddress(), shares);
      await sSymToken.connect(user).redeem(shares, user.address, user.address);

      expect(await sSymToken.balanceOf(user.address)).to.equal(0n);
    });

    it("Should allow whitelisting / unwhitelisting of ZK Provers in ZkProverRegistry", async function () {
      // Owner (governor) can update status of prover
      await zkProverRegistry.connect(owner).setProverStatus(externalUser.address, true);
      expect(await zkProverRegistry.authorizedProvers(externalUser.address)).to.be.true;

      // Unauthorized callers (non-governor) cannot set status
      await expect(
        zkProverRegistry.connect(externalUser).setProverStatus(user.address, true)
      ).to.be.revertedWith("Caller is not an authorized governor");
    });

    it("Should allow authorized ZK Provers to verify computation proofs under ZK-Cops", async function () {
      const compHash = ethers.keccak256(ethers.toUtf8Bytes("computation1"));
      const proof = ethers.hexlify(ethers.randomBytes(32));
      const publicInputsHash = ethers.keccak256(ethers.toUtf8Bytes("inputs1"));

      // Standard verification run by authorized prover (deployer/owner is authorized by constructor)
      await zkProverRegistry.connect(owner).submitAndVerifyProof(compHash, proof, publicInputsHash, user.address);

      // Verification mapped successfully
      const expectedProofHash = ethers.solidityPackedKeccak256(
        ["bytes32", "bytes", "bytes32"],
        [compHash, proof, publicInputsHash]
      );
      expect(await zkProverRegistry.verifiedProofs(expectedProofHash)).to.be.true;

      // Non-authorized prover should revert
      await expect(
        zkProverRegistry.connect(externalUser).submitAndVerifyProof(compHash, proof, publicInputsHash, user.address)
      ).to.be.revertedWith("Caller is not an authorized ZK prover");
    });

    it("Should boost validator reputation and scale rewards proportionally through ZK-Cops integrations", async function () {
      // 1. Register validator node
      const registerAmount = ethers.parseEther("150");
      await symToken.transfer(validator.address, registerAmount);
      await symToken.connect(validator).approve(await consensus.getAddress(), registerAmount);
      const falconKey = ethers.hexlify(ethers.randomBytes(64));
      await consensus.connect(validator).registerValidator(registerAmount, falconKey);

      const nodeBefore = await consensus.validators(validator.address);
      expect(nodeBefore.reputation).to.equal(100n); // Default reputation is 100

      // Link contracts
      await consensus.connect(owner).setZkProverRegistry(await zkProverRegistry.getAddress());
      await zkProverRegistry.connect(owner).setConsensusRegistry(await consensus.getAddress());

      // 2. Submit ZK computation proof linked to validator address
      const compHash = ethers.keccak256(ethers.toUtf8Bytes("computation2"));
      const proof = ethers.hexlify(ethers.randomBytes(32));
      const publicInputsHash = ethers.keccak256(ethers.toUtf8Bytes("inputs2"));

      await zkProverRegistry.connect(owner).submitAndVerifyProof(compHash, proof, publicInputsHash, validator.address);

      // Reputation should be boosted by +20
      const nodeAfter = await consensus.validators(validator.address);
      expect(nodeAfter.reputation).to.equal(120n);

      // 3. Verify boosted rewards calculations (1.2x modifier)
      const initialRewards = await consensus.accumulatedRewards(validator.address);
      expect(initialRewards).to.equal(0n);

      // Submit block verification for 10 blocks (base reward is 10 blocks * 5 SYM = 50 SYM)
      await consensus.connect(validator).submitBlockVerification(10);

      // Boosted reward: 50 SYM * 120 / 100 = 60 SYM!
      const boostedRewards = await consensus.accumulatedRewards(validator.address);
      expect(boostedRewards).to.equal(ethers.parseEther("60"));
    });
  });
});
