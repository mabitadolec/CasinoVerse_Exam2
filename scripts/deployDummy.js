const { ethers, upgrades } = require("hardhat");

async function deployDummy() {
    const [deployer, account1] = await ethers.getSigners();

    let erc20, erc20Main, erc721, erc721Main, erc1155, erc1155Main

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    console.log("Deploying ERC20 Dummy");
    console.log("------------------------------------------------------");

    erc20 = await ethers.getContractFactory('ERC20Dummy');
    erc20Main = await erc20.deploy();
    await erc20Main.deployed();

    console.log("ERC20Dummy address:", erc20Main.address);

    console.log("Deploying ERC721 Dummy");
    console.log("------------------------------------------------------");

    erc721 = await ethers.getContractFactory('ERC721Dummy');
    erc721Main = await erc721.deploy();
    await erc721Main.deployed();

    console.log("ERC721Dummy address:", erc721Main.address);

    console.log('Minting token from ERC721Dummy using account1.')
    console.log("------------------------------------------------------");

    await erc721Main.mint('1');
    await erc721Main.mint('2');

    console.log("DONE!")
    
    console.log("Deploying ERC1155 Dummy");
    console.log("------------------------------------------------------");

    erc1155 = await ethers.getContractFactory('ERC1155Dummy');
    erc1155Main = await erc1155.deploy();
    await erc1155Main.deployed();

    console.log("ERC1155Dummy address:", erc1155Main.address);

    console.log('Minting token from ERC1155Dummy using account1.')
    console.log("------------------------------------------------------");

    await erc1155Main.mint(deployer.address, 1, 2);
    console.log("DONE!")
}   

deployDummy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});