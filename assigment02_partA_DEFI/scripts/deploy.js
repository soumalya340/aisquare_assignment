const fs = require("fs");
const { ethers, run, network } = require("hardhat");

const scripts = `scripts/deploy.json`;
const data = fs.readFileSync(scripts, "utf8");
const jsonContent = JSON.parse(data);

let contractAddress;
let blockNumber;
let Verified = false;

async function mockERC20Deploy() {
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20.deploy();
  await mockERC20.deployed();
  console.log("MockERC20 Deployed to:", mockERC20.address);
  contractAddress = mockERC20.address;
  blockNumber = mockERC20.provider._maxInternalBlockNumber;

  if (hre.network.name != "hardhat") {
    await mockERC20.deployTransaction.wait(6);
    await verify(mockERC20.address, []);
  }
}

async function simpleCoinDeploy() {
  const constructorParam = jsonContent.constructorParams;

  const SimpleCoin = await hre.ethers.getContractFactory("SimpleCoin");
  const simpleCoin = await SimpleCoin.deploy();
  await simpleCoin.deployed();
  console.log("SimpleCoin Deployed to:", simpleCoin.address);
  contractAddress = simpleCoin.address;
  blockNumber = simpleCoin.provider._maxInternalBlockNumber;

  if (hre.network.name != "hardhat") {
    await simpleCoin.deployTransaction.wait(6);
    await verify(simpleCoin.address, []);
  }
}

async function souSimpleLendingProtocolDeploy() {
  const constructorParam = jsonContent.constructorParams;
  const SouSimpleLendingProtocol = await hre.ethers.getContractFactory(
    "SouSimpleLendingProtocol"
  );
  const souSimpleLendingProtocol = await SouSimpleLendingProtocol.deploy(
    constructorParam.param1,
    constructorParam.param2,
    constructorParam.param3
  );
  await souSimpleLendingProtocol.deployed();
  console.log(
    "SouSimpleLendingProtocol Deployed to:",
    souSimpleLendingProtocol.address
  );
  contractAddress = souSimpleLendingProtocol.address;
  blockNumber = souSimpleLendingProtocol.provider._maxInternalBlockNumber;

  if (hre.network.name != "hardhat") {
    await souSimpleLendingProtocol.deployTransaction.wait(6);
    await verify(souSimpleLendingProtocol.address, [
      constructorParam.param1,
      constructorParam.param2,
      constructorParam.param3,
    ]);
  }
}

async function simpleStakingDeploy() {
  const constructorParam = jsonContent.constructorParams;
  const SimpleStaking = await hre.ethers.getContractFactory("SimpleStaking");
  const simpleStaking = await SimpleStaking.deploy(constructorParam.param1);
  await simpleStaking.deployed();
  console.log("SimpleStaking Deployed to:", simpleStaking.address);
  contractAddress = simpleStaking.address;
  blockNumber = simpleStaking.provider._maxInternalBlockNumber;

  if (hre.network.name != "hardhat") {
    await simpleStaking.deployTransaction.wait(6);
    await verify(simpleStaking.address, [constructorParam.param1]);
  }
}

async function souSwapDeploy() {
  const constructorParam = jsonContent.constructorParams;
  const SouSwap = await hre.ethers.getContractFactory("SouSwap");
  const souSwap = await SouSwap.deploy(constructorParam.param1);
  await souSwap.deployed();
  console.log("SouSwap Deployed to:", souSwap.address);
  contractAddress = souSwap.address;
  blockNumber = souSwap.provider._maxInternalBlockNumber;

  if (hre.network.name != "hardhat") {
    await souSwap.deployTransaction.wait(6);
    await verify(souSwap.address, [constructorParam.param1]);
  }
}

async function main() {
  if (jsonContent.contractName == "MockERC20") {
    await mockERC20Deploy();
  }
  if (jsonContent.contractName == "SimpleCoin") {
    await simpleCoinDeploy();
  }
  if (jsonContent.contractName == "SouSimpleLendingProtocol") {
    await souSimpleLendingProtocolDeploy();
  }
  if (jsonContent.contractName == "SimpleStaking") {
    await simpleStakingDeploy();
  }
  if (jsonContent.contractName == "SouSwap") {
    await souSwapDeploy();
  }

  let chainId = network.config.chainId || network.config.networkId;

  console.log(`The chainId is ${chainId}`);
  const data = { chainId, contractAddress, Verified, blockNumber };
  const jsonString = JSON.stringify(data);
  console.log(jsonString);
}

const verify = async (contractAddress, args) => {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
    Verified = true;
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already Verified!");
    } else {
      console.log(e);
    }
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
