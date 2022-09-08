const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

async function upgrade_Bank() {
  console.log("Upgrading Bank...");
  console.log("------------------------------------------------------");
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const json = fs.readFileSync("deploy.json", "utf8");
  const BankAddress = JSON.parse(json).address;

  const BankV2 = await ethers.getContractFactory("BankUpgrade");
  await upgrades.upgradeProxy(BankAddress, BankV2);

  console.log("[Bank] [upgraded] address:", BankAddress);

  // const contract = await ethers.getContractAt("BankV2", BankAddress);
  // console.log(await contract.getSavedValue());

  return BankAddress;
}

upgrade_Bank()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
