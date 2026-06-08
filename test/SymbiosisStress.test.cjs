const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Symbiosis Protocol - High-Load & Stress Testing Suite", function () {
  let SymbiosisToken, symToken;
  let LiquidStakingSsym, sSymToken;
  let NashConsensusRegistry, consensus;
  let owner, whistleblower;
  let signers = [];
  const gov2Address = "0x2c6F91Ce3a6ABd991FfCD4C6deE3b689cdE1528B";
  let gov2Signer;

  before(async function () {
    // Get all available signers for concurrent user simulation
    const allSigners = await ethers.getSigners();
    owner = allSigners[0];
    whistleblower = allSigners[1];
    // Keep 30 signers for user simulation
    signers = allSigners.slice(2, 32); 

    // Setup Impersonated Signer for hardcoded gov2Address
    await ethers.provider.send("hardhat_impersonateAccount", [gov2Address]);
    gov2Signer = await ethers.getSigner(gov2Address);

    // Fund the impersonated governor with some ETH for gas
    await owner.sendTransaction({
      to: gov2Address,
      value: ethers.parseEther("5.0")
    });
  });

  beforeEach(async function () {
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

    // Set consensus registry address in token contract using the DAO Multi-sig Timelock proposals
    const propId = await symToken.proposeAction("setConsensusRegistry", await consensus.getAddress());
    
    // Vote from Gov2 (voting is allowed before timelock expires)
    await symToken.connect(gov2Signer).voteProposal(0);

    // Increase time by 24 hours to satisfy the timelock
    await ethers.provider.send("evm_increaseTime", [86400]); 
    await ethers.provider.send("evm_mine");
    
    // Execute proposal
    await symToken.executeProposal(0);

    // Also link ZkProverAddr to Consensus to be ready
    await consensus.setZkProverRegistry(owner.address);
  });

  describe("1. Concurrency and Multi-User Staking Stress Cases", function () {
    it("Should handle 30 simultaneous users staking and unstaking in sSYM safely", async function () {
      const stakeAmount = ethers.parseEther("500");
      const sSymAddress = await sSymToken.getAddress();

      // Distribute SYM tokens to all 30 users
      for (const signer of signers) {
        await symToken.transfer(signer.address, stakeAmount);
        await symToken.connect(signer).approve(sSymAddress, stakeAmount);
      }

      // Concurrently stake (sequential in execution, but simulating high throughput)
      for (const signer of signers) {
        await sSymToken.connect(signer).stake(stakeAmount);
      }

      // Verify overall pool integrity after major stakings
      const poolStats = await sSymToken.totalAssets();
      const expectedBalance = stakeAmount * BigInt(signers.length);
      expect(poolStats).to.equal(expectedBalance);

      // Now verify standard convertToShares and convertToAssets calculations at high bounds
      for (const signer of signers) {
        const shares = await sSymToken.balanceOf(signer.address);
        expect(shares).to.be.greaterThan(0n);
        
        // Unstake half
        const halfShares = shares / 2n;
        await sSymToken.connect(signer).unstake(halfShares);
        
        const postShares = await sSymToken.balanceOf(signer.address);
        expect(postShares).to.be.closeTo(halfShares, 1000n); // 1000n tolerance due to dead-shares protection offsets
      }
    });

    it("Should prevent underflows and reject staking/unstaking under dust or 0 assets conditions", async function () {
      const tinyAmount = 1n; // 1 wei of SYM
      await symToken.transfer(signers[0].address, tinyAmount);
      await symToken.connect(signers[0]).approve(await sSymToken.getAddress(), tinyAmount);

      // LiquidStakingSsym converts assets <= 1000 to 0 shares before liquidity is seeded,
      // and deposit requires assets > 1000 on first stake.
      await expect(
        sSymToken.connect(signers[0]).stake(tinyAmount)
      ).to.be.revertedWith("Minimum first stake is 1001 SYM");

      // Verify that unstaking 0 shares is completely rejected
      await expect(
        sSymToken.connect(signers[0]).unstake(0)
      ).to.be.revertedWith("Shares must be greater than 0");
    });
  });

  describe("2. Lazy Slashing and Multi-Node Penalty Performance", function () {
    it("Should stress-test the Nash Consensus by registering multiple validators, rewarding them and lazily slashing them", async function () {
      const initialStake = ethers.parseEther("200");
      const consensusAddress = await consensus.getAddress();
      const registeredValidators = [];

      // Register 10 validators safely
      for (let i = 0; i < 10; i++) {
        const val = signers[i];
        await symToken.transfer(val.address, initialStake);
        await symToken.connect(val).approve(consensusAddress, initialStake);

        const fakeFalconPubKey = ethers.hexlify(ethers.randomBytes(32));
        await consensus.connect(val).registerValidator(initialStake, fakeFalconPubKey);
        registeredValidators.push(val);
      }

      // Ensure all 10 are active in consensus
      for (const val of registeredValidators) {
        const valInfo = await consensus.validators(val.address);
        expect(valInfo.stakedAmount).to.equal(initialStake);
        expect(valInfo.isSlashed).to.be.false;
      }

      // Concurrently reward validators multiple times under heavy load
      for (let i = 0; i < 5; i++) {
        for (const val of registeredValidators) {
          await consensus.connect(val).submitBlockVerification(20); // 20 blocks per verification run
        }
      }

      // Slashing 3 malicious nodes consecutively with block signature proof verification
      const whistleblowerPrevBal = await symToken.balanceOf(whistleblower.address);
      const nodesToSlash = [registeredValidators[0], registeredValidators[3], registeredValidators[7]];
      const blockHash1 = ethers.zeroPadValue("0xaa", 32);
      const blockHash2 = ethers.zeroPadValue("0xbb", 32);
      const sig1 = "0x" + "00".repeat(99);
      const sig2 = "0x" + "00".repeat(99);

      for (const badNode of nodesToSlash) {
        await consensus.triggerLazySlashing(
          badNode.address,
          whistleblower.address,
          500n,
          blockHash1,
          sig1,
          blockHash2,
          sig2
        );

        // Verify slashed node status is updated properly
        const profile = await consensus.validators(badNode.address);
        expect(profile.isSlashed).to.be.true;
        expect(profile.reputation).to.equal(0n);
      }

      // Verify financial incentives paid to whistleblower
      const whistleblowerPostBal = await symToken.balanceOf(whistleblower.address);
      const singlePenalty = (initialStake * 15n) / 100n; // 15% penalty
      const singleReward = singlePenalty / 2n;
      const expectedTotalWhistleblowerReward = singleReward * 3n;

      expect(whistleblowerPostBal - whistleblowerPrevBal).to.equal(expectedTotalWhistleblowerReward);
    });

    it("Should revert multi-slashing requests on nodes already marked as slashed", async function () {
      const initialStake = ethers.parseEther("100");
      const targetVal = signers[0];
      await symToken.transfer(targetVal.address, initialStake);
      await symToken.connect(targetVal).approve(await consensus.getAddress(), initialStake);

      const fakeFalconPubKey = ethers.hexlify(ethers.randomBytes(32));
      await consensus.connect(targetVal).registerValidator(initialStake, fakeFalconPubKey);

      const blockHash1 = ethers.zeroPadValue("0x66", 32);
      const blockHash2 = ethers.zeroPadValue("0x77", 32);
      const sig1 = "0x" + "00".repeat(99);
      const sig2 = "0x" + "00".repeat(99);

      // First slash succeeds
      await consensus.triggerLazySlashing(
        targetVal.address,
        whistleblower.address,
        450n,
        blockHash1,
        sig1,
        blockHash2,
        sig2
      );

      // Attempting to slash again should immediately revert
      await expect(
        consensus.triggerLazySlashing(
          targetVal.address,
          whistleblower.address,
          450n,
          blockHash1,
          sig1,
          blockHash2,
          sig2
        )
      ).to.be.revertedWith("Node is already slashed");
    });
  });

  describe("3. DAO Governance queue performance & Timelock Delay Bounds", function () {
    it("Should safely handle sequential proposal submissions and verify parameters upper/lower boundary conditions", async function () {
      // 1. Stress the proposal mechanism with multiple simultaneous creations
      for (let i = 0; i < 5; i++) {
        await symToken.proposeAction("setGasBackPercentage", ethers.zeroPadValue(ethers.toBeHex(30 + i), 20));
      }

      // Check boundary validations on governance executions
      // Reject delay setting that is out of range (< 1 hour or > 30 days)
      const tinyDelay = ethers.zeroPadValue(ethers.toBeHex(1800), 20); // 30 minutes
      const hugeDelay = ethers.zeroPadValue(ethers.toBeHex(31 * 86400), 20); // 31 days

      await expect(
        symToken.proposeAction("setTimelockDelay", tinyDelay)
      ).to.be.revertedWith("Invalid timelock delay range");

      await expect(
        symToken.proposeAction("setTimelockDelay", hugeDelay)
      ).to.be.revertedWith("Invalid timelock delay range");

      // Verify that voting beyond timelock parameters fails properly
      // We expect this to be proposal index 6, since 0 was setConsensusRegistry in beforeEach,
      // 1-5 were created in the loops above.
      const votingExpiryPropTx = await symToken.proposeAction("setGasBackPercentage", ethers.zeroPadValue(ethers.toBeHex(40), 20));
      await votingExpiryPropTx.wait();
      const votingExpiryPropIndex = 6n;
      
      // Let's travel 25 hours to close voting period (votes are rejected after ETA is reached)
      await ethers.provider.send("evm_increaseTime", [90000]); 
      await ethers.provider.send("evm_mine");

      await expect(
        symToken.connect(gov2Signer).voteProposal(votingExpiryPropIndex)
      ).to.be.revertedWith("Voting period has ended");
    });
  });

  describe("4. Gas Recycling precision and Basefee safety", function () {
    it("Should accurately calculate recycled gas refunds across different fee bounds without throwing division-by-zero", async function () {
      // Simulate gas recycling with low and high params
      const gasUsed = 150000n;
      
      // Transfer treasury balance to the contract itself to handle gas recycling
      await symToken.transfer(await symToken.getAddress(), ethers.parseEther("10000"));

      // Set basefee manually to test
      await ethers.provider.send("hardhat_setNextBlockBaseFeePerGas", ["0x3B9ACA00"]); // 1 Gwei Basefee

      // Impersonate the consensus registry address to be authorized
      const consensusAddr = await consensus.getAddress();
      await ethers.provider.send("hardhat_impersonateAccount", [consensusAddr]);
      const consensusSigner = await ethers.getSigner(consensusAddr);

      // Force state-level ETH balance on the registry contract to bypass receive checks
      await ethers.provider.send("hardhat_setBalance", [
        consensusAddr,
        "0xde0b6b3a7640000" // 1 ETH in hex
      ]);

      // Make a dummy call to recycleGas pretending to be consensusRegistry
      const preRefundBal = await symToken.balanceOf(signers[0].address);
      await symToken.connect(consensusSigner).recycleGas(signers[0].address, gasUsed, { gasPrice: 1000000000 });
      const postRefundBal = await symToken.balanceOf(signers[0].address);

      // GasBackPercentage = 25% by default
      const baseFee = 1000000000n; // 1 Gwei
      const refundAmount = (gasUsed * baseFee * 25n) / 100n;
      
      expect(postRefundBal - preRefundBal).to.equal(refundAmount);
    });
  });
});
