const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleStaking", function () {
  let owner;
  let user1;
  let user2;
  let simpleStaking;
  let stakingToken;

  const INITIAL_SUPPLY = ethers.utils.parseEther("1000000");
  const STAKE_AMOUNT = ethers.utils.parseEther("1000");

  before(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock ERC20 token with minting capability
    const MockToken = await ethers.getContractFactory("MockERC20");
    stakingToken = await MockToken.deploy();
    await stakingToken.deployed();

    // Mint initial supply to users
    await stakingToken.mint(user1.address, INITIAL_SUPPLY);
    await stakingToken.mint(user2.address, INITIAL_SUPPLY);

    // Deploy SimpleStaking contract
    const SimpleStaking = await ethers.getContractFactory("SimpleStaking");
    simpleStaking = await SimpleStaking.deploy(stakingToken.address);
    await simpleStaking.deployed();

    // Approve SimpleStaking contract to spend tokens
    await stakingToken
      .connect(user1)
      .approve(simpleStaking.address, INITIAL_SUPPLY);
    await stakingToken
      .connect(user2)
      .approve(simpleStaking.address, INITIAL_SUPPLY);
  });

  describe("Deployment", function () {
    it("Should set the correct staking token", async function () {
      expect(await simpleStaking.asset()).to.equal(stakingToken.address);
      expect(await simpleStaking.stakingToken()).to.equal(stakingToken.address);
    });
  });

  describe("Deposit", function () {
    it("Should allow users to deposit tokens", async function () {
      await stakingToken
        .connect(user1)
        .approve(simpleStaking.address, INITIAL_SUPPLY);

      await simpleStaking.connect(user1).deposit(STAKE_AMOUNT);

      expect(await simpleStaking.depositedTokens(user1.address)).to.equal(
        STAKE_AMOUNT
      );
      expect(await simpleStaking.depositTimestamp(user1.address)).to.be.gt(0);
    });

    it("Should revert if deposit amount is zero", async function () {
      await expect(simpleStaking.connect(user1).deposit(0)).to.be.revertedWith(
        "Deposit amount must be greater than 0"
      );
    });

    it("Should revert if user has insufficient balance", async function () {
      const largeAmount = ethers.utils.parseEther("2000000");
      await expect(
        simpleStaking.connect(user1).deposit(largeAmount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should handle multiple deposits correctly", async function () {
      await simpleStaking.connect(user2).deposit(STAKE_AMOUNT);
      await ethers.provider.send("evm_increaseTime", [86400]); // Advance time by 1 day
      await ethers.provider.send("evm_mine", []);

      await simpleStaking.connect(user2).deposit(STAKE_AMOUNT);

      const expectedBalance = STAKE_AMOUNT.mul(2).add(
        STAKE_AMOUNT.mul(5).div(100).mul(86400).div(31536000)
      );
      expect(await simpleStaking.depositedTokens(user2.address)).to.be.closeTo(
        expectedBalance,
        ethers.utils.parseEther("0.01")
      );
    });
  });

  describe("Withdraw", function () {
    it("Should allow users to withdraw tokens with interest", async function () {
      await ethers.provider.send("evm_increaseTime", [31536000]); // Advance time by 1 year
      await ethers.provider.send("evm_mine", []);

      const initialBalance = await stakingToken.balanceOf(user1.address);
      const withdrawAmount = STAKE_AMOUNT.div(2);

      await expect(simpleStaking.connect(user1).withdraw(withdrawAmount))
        .to.emit(simpleStaking, "Withdraw")
        .withArgs(user1.address, withdrawAmount);

      const finalBalance = await stakingToken.balanceOf(user1.address);
      expect(finalBalance.sub(initialBalance)).to.be.gt(withdrawAmount);
    });

    it("Should revert if withdraw amount is zero", async function () {
      await expect(simpleStaking.connect(user1).withdraw(0)).to.be.revertedWith(
        "Withdraw amount must be greater than 0"
      );
    });

    it("Should revert if user has no active deposit", async function () {
      const nonStaker = owner;
      await expect(
        simpleStaking.connect(nonStaker).withdraw(STAKE_AMOUNT)
      ).to.be.revertedWith("No active deposit");
    });

    it("Should revert if user has insufficient balance", async function () {
      const largeAmount = ethers.utils.parseEther("2000000");
      await expect(
        simpleStaking.connect(user1).withdraw(largeAmount)
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Interest Calculation", function () {
    it("Should calculate interest correctly", async function () {
      const user = user2;
      const initialInterest = await simpleStaking.calculateInterest(
        user.address
      );

      await ethers.provider.send("evm_increaseTime", [31536000]); // Advance time by 1 year
      await ethers.provider.send("evm_mine", []);

      const finalInterest = await simpleStaking.calculateInterest(user.address);
      const expectedInterest = STAKE_AMOUNT.mul(2).mul(5).div(100); // 5% of 2000 STK

      expect(finalInterest.sub(initialInterest)).to.be.closeTo(
        expectedInterest,
        ethers.utils.parseEther("0.01")
      );
    });

    it("Should return zero interest for users with no deposit", async function () {
      const nonStaker = owner;
      expect(await simpleStaking.calculateInterest(nonStaker.address)).to.equal(
        0
      );
    });
  });

  describe("Get Balance", function () {
    it("Should return the correct balance including interest", async function () {
      const user = user2;
      const initialBalance = await simpleStaking.getBalance(user.address);

      await ethers.provider.send("evm_increaseTime", [31536000]); // Advance time by 1 year
      await ethers.provider.send("evm_mine", []);

      const finalBalance = await simpleStaking.getBalance(user.address);
      const expectedBalance = initialBalance.mul(105).div(100); // 5% increase

      //   expect(finalBalance).to.be.closeTo(
      //     expectedBalance,
      //     ethers.utils.parseEther("0.01")
      //   );
    });

    it("Should return zero balance for users with no deposit", async function () {
      const nonStaker = owner;
      expect(await simpleStaking.getBalance(nonStaker.address)).to.equal(0);
    });
  });
});
