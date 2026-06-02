const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Symbiosis Protocol Test Suite", function () {
  let SymbiosisToken, symToken;
  let LiquidStakingSsym, sSymToken;
  let NashConsensusRegistry, consensus;
  let owner, governor2, governor3, validator, whistleblower, user;

  beforeEach(async function () {
    [owner, governor2, governor3, validator, whistleblower, user] = await ethers.getSigners();

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

  describe("2. Liquid Staking - Stake (Happy Path)", function () {
    it("Should allow a user to stake SYM and receive sSYM proportional to pool shares", async function () {
      const stakeAmount = ethers.parseEther("100");

      await symToken.transfer(user.address, stakeAmount);
      expect(await symToken.balanceOf(user.address)).to.equal(stakeAmount);

      await symToken.connect(user).approve(await sSymToken.getAddress(), stakeAmount);
      await sSymToken.connect(user).stake(stakeAmount);

      expect(await sSymToken.balanceOf(user.address)).to.equal(stakeAmount);
      expect(await symToken.balanceOf(await sSymToken.getAddress())).to.equal(stakeAmount);
    });
  });

  describe("3. Liquid Staking - Unstake", function () {
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
  });

  describe("4. Slashing (Nash Consensus Slashing Protocol)", function () {
    it("Should register a validator and trigger lazy slashing, burning 50% of penalty and reward 50% to whistleblower", async function () {
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
  });
});
