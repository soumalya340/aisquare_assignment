const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

describe("SouSwap Contract", () => {
  let souSwap;
  let mockToken;

  const INITIAL_SUPPLY = ethers.utils.parseEther("1000000");
  const INITIAL_LIQUIDITY = ethers.utils.parseEther("100");

  before(async () => {
    [owner, user1, user2] = await ethers.getSigners();
  });

  beforeEach(async () => {
    // Deploy MockERC20 token
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20Factory.deploy();
    await mockToken.deployed();

    // Deploy SouSwap
    const SouSwapFactory = await ethers.getContractFactory("SouSwap");
    souSwap = await SouSwapFactory.deploy(mockToken.address);
    await souSwap.deployed();

    // Approve SouSwap to spend tokens
    await mockToken.approve(souSwap.address, INITIAL_SUPPLY);
    await mockToken.connect(user1).approve(souSwap.address, INITIAL_SUPPLY);
    await mockToken.connect(user2).approve(souSwap.address, INITIAL_SUPPLY);

    // Transfer some tokens to users for testing
    await mockToken.transfer(user1.address, INITIAL_SUPPLY.div(4));
    await mockToken.transfer(user2.address, INITIAL_SUPPLY.div(4));
  });

  describe("Deployment", () => {
    it("Should set the correct token address", async () => {
      expect(await souSwap.token()).to.equal(mockToken.address);
    });

    it("Should have zero initial liquidity", async () => {
      expect(await souSwap.totalLiquidity()).to.equal(0);
    });
  });

  describe("Initialization", () => {
    it("Should initialize liquidity correctly", async () => {
      await souSwap.init(INITIAL_LIQUIDITY, { value: INITIAL_LIQUIDITY });

      expect(await souSwap.totalLiquidity()).to.equal(INITIAL_LIQUIDITY);
      expect(await souSwap.liquidityByUser(owner.address)).to.equal(
        INITIAL_LIQUIDITY
      );
      expect(await mockToken.balanceOf(souSwap.address)).to.equal(
        INITIAL_LIQUIDITY
      );
    });

    it("Should revert if trying to initialize twice", async () => {
      await souSwap.init(INITIAL_LIQUIDITY, { value: INITIAL_LIQUIDITY });
      await expect(
        souSwap.init(INITIAL_LIQUIDITY, { value: INITIAL_LIQUIDITY })
      ).to.be.revertedWith("DEX already has liquidity");
    });
  });

  describe("Swapping", () => {
    beforeEach(async () => {
      await souSwap.init(INITIAL_LIQUIDITY, { value: INITIAL_LIQUIDITY });
    });

    it("Should swap ETH for tokens correctly", async () => {
      const ethAmount = ethers.utils.parseEther("1");
      const initialTokenBalance = await mockToken.balanceOf(user1.address);

      await souSwap.connect(user1).ethToToken({ value: ethAmount });

      const finalTokenBalance = await mockToken.balanceOf(user1.address);
      expect(finalTokenBalance.gt(initialTokenBalance)).to.be.true;
    });

    it("Should swap tokens for ETH correctly", async () => {
      const tokenAmount = ethers.utils.parseEther("10");
      const initialEthBalance = await ethers.provider.getBalance(user1.address);

      await souSwap.connect(user1).tokenToEth(tokenAmount);

      const finalEthBalance = await ethers.provider.getBalance(user1.address);
      expect(finalEthBalance.gt(initialEthBalance)).to.be.true;
    });

    it("Should revert if trying to swap more tokens than available", async () => {
      const excessiveAmount = INITIAL_SUPPLY.mul(2);
      await expect(souSwap.connect(user1).tokenToEth(excessiveAmount)).to.be
        .reverted;
    });
  });

  describe("Liquidity", () => {
    beforeEach(async () => {
      await souSwap.init(INITIAL_LIQUIDITY, { value: INITIAL_LIQUIDITY });
    });

    it("Should provide liquidity correctly", async () => {
      const addedLiquidity = ethers.utils.parseEther("10");
      const initialTotalLiquidity = await souSwap.totalLiquidity();

      await souSwap.connect(user1).provideLiquidity({ value: addedLiquidity });

      const finalTotalLiquidity = await souSwap.totalLiquidity();
      expect(finalTotalLiquidity.gt(initialTotalLiquidity)).to.be.true;

      const userLiquidity = await souSwap.liquidityByUser(user1.address);
      expect(userLiquidity.gt(0)).to.be.true;
    });

    it("Should withdraw liquidity correctly", async () => {
      const addedLiquidity = ethers.utils.parseEther("10");
      await souSwap.connect(user1).provideLiquidity({ value: addedLiquidity });

      const initialEthBalance = await ethers.provider.getBalance(user1.address);
      const initialTokenBalance = await mockToken.balanceOf(user1.address);

      const userLiquidity = await souSwap.liquidityByUser(user1.address);
      await souSwap.connect(user1).withdrawLiquidity(userLiquidity);

      const finalEthBalance = await ethers.provider.getBalance(user1.address);
      const finalTokenBalance = await mockToken.balanceOf(user1.address);

      expect(finalEthBalance.gt(initialEthBalance)).to.be.true;
      expect(finalTokenBalance.gt(initialTokenBalance)).to.be.true;

      const remainingLiquidity = await souSwap.liquidityByUser(user1.address);
      expect(remainingLiquidity).to.equal(0);
    });

    it("Should revert when trying to withdraw more liquidity than available", async () => {
      const excessiveLiquidity = INITIAL_LIQUIDITY.mul(2);
      await expect(
        souSwap.connect(user1).withdrawLiquidity(excessiveLiquidity)
      ).to.be.revertedWith("Insufficient liquidity");
    });
  });

  describe("Price Calculation", () => {
    it("Should calculate input price correctly", async () => {
      const inputAmount = ethers.utils.parseEther("1");
      const inputReserve = ethers.utils.parseEther("100");
      const outputReserve = ethers.utils.parseEther("1000");

      const expectedOutput = inputAmount
        .mul(997)
        .mul(outputReserve)
        .div(inputReserve.mul(1000).add(inputAmount.mul(997)));
      const calculatedOutput = await souSwap.getInputPrice(
        inputAmount,
        inputReserve,
        outputReserve
      );

      expect(calculatedOutput).to.equal(expectedOutput);
    });

    it("Should revert when reserves are zero", async () => {
      const inputAmount = ethers.utils.parseEther("1");
      await expect(souSwap.getInputPrice(inputAmount, 0, 0)).to.be.revertedWith(
        "INVALID_VALUE"
      );
    });
  });

  describe("Edge Cases", () => {
    it("Should handle minimum swap amounts", async () => {
      await souSwap.init(INITIAL_LIQUIDITY, { value: INITIAL_LIQUIDITY });
      const minAmount = BigNumber.from(1);

      await expect(souSwap.connect(user1).ethToToken({ value: minAmount })).to
        .not.be.reverted;

      await expect(souSwap.connect(user1).tokenToEth(minAmount)).to.not.be
        .reverted;
    });

    // it("Should handle maximum uint256 values", async () => {
    //   const maxUint256 = ethers.constants.MaxUint256;
    //   await expect(souSwap.getInputPrice(maxUint256, maxUint256, maxUint256)).to
    //     .not.be.reverted;
    // });
  });

  describe("Gas Usage", () => {
    it("Should estimate gas for swapping ETH to tokens", async () => {
      await souSwap.init(INITIAL_LIQUIDITY, { value: INITIAL_LIQUIDITY });
      const ethAmount = ethers.utils.parseEther("1");

      const gasEstimate = await souSwap
        .connect(user1)
        .estimateGas.ethToToken({ value: ethAmount });
      console.log("Gas estimate for ethToToken:", gasEstimate.toString());

      expect(gasEstimate.lt(300000)).to.be.true; // Adjust the threshold as needed
    });

    it("Should estimate gas for swapping tokens to ETH", async () => {
      await souSwap.init(INITIAL_LIQUIDITY, { value: INITIAL_LIQUIDITY });
      const tokenAmount = ethers.utils.parseEther("10");

      const gasEstimate = await souSwap
        .connect(user1)
        .estimateGas.tokenToEth(tokenAmount);
      console.log("Gas estimate for tokenToEth:", gasEstimate.toString());

      expect(gasEstimate.lt(300000)).to.be.true; // Adjust the threshold as needed
    });
  });
});
