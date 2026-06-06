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

      expect(await sSymToken.balanceOf(user.address)).to.equal(stakeAmount);
      expect(await symToken.balanceOf(await sSymToken.getAddress())).to.equal(stakeAmount);

      // User 2 stakes (this covers the totalShares > 0 / else branch in stake)
      await symToken.transfer(externalUser.address, stakeAmount);
      await symToken.connect(externalUser).approve(await sSymToken.getAddress(), stakeAmount);
      await sSymToken.connect(externalUser).stake(stakeAmount);

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

      expect(await sSymToken.balanceOf(user.address)).to.equal(ethers.parseEther("50"));
      expect(await symToken.balanceOf(user.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should revert unstaking 0 shares", async function () {
      await expect(
        sSymToken.connect(user).unstake(0)
      ).to.be.revertedWith("Shares must be greater than 0");
    });

    it("Should handle updateZkProver correctly for authorized and unauthorized callers", async function () {
      // 1. Initial set (since zkProverRegistry is address(0)) should succeed for anyone
      await sSymToken.connect(user).updateZkProver(user.address);
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

      await consensus.triggerLazySlashing(validator.address, whistleblower.address, 12345n);

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

      // First slash
      await consensus.triggerLazySlashing(validator.address, whistleblower.address, 12345n);

      // Second slash must fail
      await expect(
        consensus.triggerLazySlashing(validator.address, whistleblower.address, 12345n)
      ).to.be.revertedWith("Node is already slashed");
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
});
