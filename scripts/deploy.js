const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

async function deploy_Bank() {
  console.log("Deploying Bank...");
  console.log("------------------------------------------------------");
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Bank = await ethers.getContractFactory("BankCore");
  const contract = await upgrades.deployProxy(Bank, [], {
    initializer: "initialize",
  });
  await contract.deployed();

  console.log("[Bank] address:", contract.address);

  fs.writeFileSync(
    "deploy.json",
    JSON.stringify({
      address: contract.address,
    }),
    "utf8"
  );

  return contract.address;
}

deploy_Bank()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
