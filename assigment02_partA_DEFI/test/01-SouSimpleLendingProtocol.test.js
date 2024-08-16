const { expect } = require("chai");
const { log } = require("console");
const { ethers } = require("hardhat");

describe("SouSimpleLendingProtocol", function () {
  let owner;
  let user1;
  let user2;
  let liquidator;
  let lendingProtocol;
  let usdc;
  let simpleCoin;
  let souSwap;

  const USDC_AMOUNT = ethers.utils.parseEther("1000"); // 1000 USDC
  const SIMPLECOIN_AMOUNT = ethers.utils.parseEther("500"); // 500 SimpleCoin
  const BORROW_AMOUNT = ethers.utils.parseEther("100"); // 100 USDC

  before(async function () {
    [owner, user1, user2, liquidator] = await ethers.getSigners();

    // Deploy mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20.deploy();
    await usdc.deployed();

    // Deploy mock SimpleCoin
    simpleCoin = await MockERC20.deploy();
    await simpleCoin.deployed();

    // Deploy mock SouSwap
    const SouSwap = await ethers.getContractFactory("SouSwap");
    souSwap = await SouSwap.deploy(simpleCoin.address);
    await souSwap.deployed();

    // Deploy SouSimpleLendingProtocol
    const SouSimpleLendingProtocol = await ethers.getContractFactory(
      "SouSimpleLendingProtocol"
    );
    lendingProtocol = await SouSimpleLendingProtocol.deploy(
      usdc.address,
      simpleCoin.address,
      souSwap.address
    );
    await lendingProtocol.deployed();

    // Mint USDC and SimpleCoin to users
    await usdc.mint(user1.address, USDC_AMOUNT);
    await usdc.mint(user2.address, USDC_AMOUNT);
    await usdc.mint(owner.address, USDC_AMOUNT);
    await simpleCoin.mint(user1.address, SIMPLECOIN_AMOUNT);
    await simpleCoin.mint(user2.address, SIMPLECOIN_AMOUNT);
    await simpleCoin.mint(owner.address, SIMPLECOIN_AMOUNT);

    const tokenValue = ethers.utils.parseEther("100");
    const ethValue = ethers.utils.parseEther("1");

    await simpleCoin.connect(user1).approve(souSwap.address, SIMPLECOIN_AMOUNT);

    await souSwap.connect(user1).init(tokenValue, { value: ethValue });

    // Approve lendingProtocol to spend user's tokens
    await usdc
      .connect(user1)
      .approve(lendingProtocol.address, ethers.constants.MaxUint256);
    await usdc
      .connect(user2)
      .approve(lendingProtocol.address, ethers.constants.MaxUint256);
    await simpleCoin
      .connect(user1)
      .approve(lendingProtocol.address, ethers.constants.MaxUint256);
    await simpleCoin
      .connect(user2)
      .approve(lendingProtocol.address, ethers.constants.MaxUint256);
  });

  describe("Deposit USDC", function () {
    it("Should allow users to deposit USDC", async function () {
      const depositAmount = ethers.utils.parseEther("100");
      await expect(lendingProtocol.connect(user1).depositUSDC(depositAmount))
        .to.emit(lendingProtocol, "DepositUSDC")
        .withArgs(user1.address, depositAmount);

      const userAccount = await lendingProtocol.accounts(user1.address);
      expect(userAccount.depositedUSDC).to.equal(depositAmount);
    });

    it("Should revert if deposit amount is zero", async function () {
      await expect(
        lendingProtocol.connect(user1).depositUSDC(0)
      ).to.be.revertedWith("Deposit amount must be greater than 0");
    });

    it("Should revert if user has insufficient USDC balance", async function () {
      const largeAmount = ethers.utils.parseEther("10000");
      await expect(
        lendingProtocol.connect(user1).depositUSDC(largeAmount)
      ).to.be.revertedWith("Insufficient USDC balance");
    });
  });

  describe("Withdraw USDC", function () {
    it("Should allow users to withdraw USDC", async function () {
      const withdrawAmount = ethers.utils.parseEther("50");
      await lendingProtocol.connect(user1).withdrawUSDC(withdrawAmount);
      const userAccount = await lendingProtocol.accounts(user1.address);
      console.log(userAccount.depositAmount);
      expect(userAccount.depositedUSDC).to.equal(ethers.utils.parseEther("50"));
    });

    it("Should revert if withdraw amount is zero", async function () {
      await expect(
        lendingProtocol.connect(user1).withdrawUSDC(0)
      ).to.be.revertedWith("Withdraw amount must be greater than 0");
    });

    it("Should revert if user has insufficient deposited USDC", async function () {
      const largeAmount = ethers.utils.parseEther("1000");
      await expect(
        lendingProtocol.connect(user1).withdrawUSDC(largeAmount)
      ).to.be.revertedWith("Insufficient deposited USDC");
    });
  });

  describe("Deposit SimpleCoin as Collateral", function () {
    it("Should allow users to deposit SimpleCoin as collateral", async function () {
      const depositAmount = ethers.utils.parseEther("100");
      await lendingProtocol
        .connect(user1)
        .depositSimpleCoinAsCollateral(depositAmount);

      const userAccount = await lendingProtocol.accounts(user1.address);
      expect(userAccount.depositedSimpleCoin).to.equal(depositAmount);
    });

    it("Should revert if deposit amount is zero", async function () {
      await expect(
        lendingProtocol.connect(user1).depositSimpleCoinAsCollateral(0)
      ).to.be.revertedWith("Deposit amount must be greater than 0");
    });

    it("Should revert if user has insufficient SimpleCoin balance", async function () {
      const largeAmount = ethers.utils.parseEther("10000");
      await expect(
        lendingProtocol
          .connect(user1)
          .depositSimpleCoinAsCollateral(largeAmount)
      ).to.be.revertedWith("Insufficient SimpleCoin balance");
    });
  });

  describe("Withdraw SimpleCoin", function () {
    it("Should allow users to withdraw SimpleCoin if they have enough collateral", async function () {
      const withdrawAmount = ethers.utils.parseEther("5");

      await lendingProtocol.connect(user1).withdrawSimpleCoin(withdrawAmount);
      const userAccount = await lendingProtocol.accounts(user1.address);

      let value = ethers.utils.parseEther("100");

      expect(userAccount.depositedSimpleCoin).to.be.equal(
        value.sub(withdrawAmount)
      );
    });

    it("Should revert if withdraw amount is zero", async function () {
      await expect(
        lendingProtocol.connect(user1).withdrawSimpleCoin(0)
      ).to.be.revertedWith("Withdraw amount must be greater than 0");
    });

    it("Should revert if user has insufficient SimpleCoin balance", async function () {
      const largeAmount = ethers.utils.parseEther("1000");
      await expect(
        lendingProtocol.connect(user1).withdrawSimpleCoin(largeAmount)
      ).to.be.revertedWith("Insufficient SimpleCoin balance");
    });
  });

  describe("Borrow USDC", function () {
    it("Should allow users to borrow USDC using their SimpleCoin as collateral", async function () {
      await simpleCoin
        .connect(user2)
        .approve(lendingProtocol.address, SIMPLECOIN_AMOUNT);

      let value = ethers.utils.parseEther("100");

      await lendingProtocol.connect(user2).depositSimpleCoinAsCollateral(value);

      const BORROW_AMOUNT_2 = ethers.utils.parseEther("5");

      await lendingProtocol.connect(user2).borrowUSDC(BORROW_AMOUNT_2);

      const userAccount = await lendingProtocol.accounts(user2.address);

      expect(userAccount.borrowedUSDC).to.equal(BORROW_AMOUNT_2);
    });

    it("Should revert if borrow amount is zero", async function () {
      await expect(
        lendingProtocol.connect(user2).borrowUSDC(0)
      ).to.be.revertedWith("Borrow amount must be greater than 0");
    });

    it("Should revert if user has insufficient collateral", async function () {
      const largeAmount = ethers.utils.parseEther("1000");
      await expect(
        lendingProtocol.connect(user2).borrowUSDC(largeAmount)
      ).to.be.revertedWith("Insufficient collateral for this borrow");
    });
  });

  describe("Repay USDC", function () {
    it("Should allow users to repay borrowed USDC with interest", async function () {
      const repayAmount = ethers.utils.parseEther("5");

      await lendingProtocol.connect(user2).repayUSDC(repayAmount);

      const userAccount = await lendingProtocol.accounts(user2.address);
      expect(userAccount.borrowedUSDC).to.be.lt(BORROW_AMOUNT);
    });

    it("Should revert if repay amount is zero", async function () {
      await expect(
        lendingProtocol.connect(user2).repayUSDC(0)
      ).to.be.revertedWith("Repay amount must be greater than 0");
    });

    it("Should revert if user has no active borrow", async function () {
      await expect(
        lendingProtocol.connect(user1).repayUSDC(BORROW_AMOUNT)
      ).to.be.revertedWith("No active borrow");
    });

    it("Should revert if repay amount exceeds debt", async function () {
      const largeAmount = ethers.utils.parseEther("1000");
      await expect(
        lendingProtocol.connect(user2).repayUSDC(largeAmount)
      ).to.be.revertedWith("Repay amount exceeds debt");
    });
  });

  describe("Liquidation", function () {
    // it("Should allow liquidation of undercollateralized positions", async function () {
    //   let value = ethers.utils.parseEther("10000000");
    //   await simpleCoin.mint(owner.address, value);
    //   await simpleCoin.approve(souSwap.address, value);
    //   // Manipulate the price of SimpleCoin to make user2's position undercollateralized
    //   await souSwap.tokenToEth(value); // 1 SimpleCoin = 0.1 ETH
    //   await lendingProtocol.connect(liquidator).liquidate(user2.address);
    //   const userAccount = await lendingProtocol.accounts(user2.address);
    //   expect(userAccount.depositedSimpleCoin).to.equal(0);
    //   expect(userAccount.borrowedUSDC).to.equal(0);
    // });
    it("Should revert if user's collateral ratio is sufficient", async function () {
      // Reset the price of SimpleCoin
      await expect(
        lendingProtocol.connect(liquidator).liquidate(user1.address)
      ).to.be.revertedWith("User's collateral ratio is sufficient");
    });
  });

  //   describe("Interest Calculation", function () {
  //     it("Should accrue interest on borrowed amounts", async function () {
  //       // Fast forward time by 1 year
  //       await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
  //       await ethers.provider.send("evm_mine", []);

  //       // Deposit some USDC to trigger interest calculation
  //       await lendingProtocol
  //         .connect(user1)
  //         .depositUSDC(ethers.utils.parseEther("1"));

  //       const userAccount = await lendingProtocol.accounts(user1.address);
  //       expect(userAccount.borrowedUSDC).to.be.gt(BORROW_AMOUNT);
  //     });
  //   });

  //   describe("Collateral Value Calculation", function () {
  //     it("Should correctly calculate collateral value in USDC", async function () {
  //       const simpleCoinAmount = ethers.utils.parseEther("100");
  //       const collateralValue = await lendingProtocol.getCollateralValueInUSDC(
  //         simpleCoinAmount
  //       );

  //       // Assuming 1 ETH = 2000 USDC and 1 SimpleCoin = 1 ETH (from SouSwap)
  //       const expectedValue = ethers.utils.parseEther("200000"); // 100 * 2000 USDC
  //       expect(collateralValue).to.be.equal(expectedValue);
  //     });
  //   });
});
