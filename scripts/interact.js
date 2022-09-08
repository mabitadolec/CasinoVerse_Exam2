const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    let erc20, erc20Main, erc721, erc721Main, erc1155, erc1155Main, bank, bankCore, bankupgrade, bankUpgrade
    const [deployer, account1] = await ethers.getSigners();

    const json = fs.readFileSync("deploy.json", "utf8");
    const BankAddress = JSON.parse(json).address;

    bankupgrade = await ethers.getContractFactory("BankUpgrade");
    bankUpgrade = bankupgrade.attach(BankAddress);
    await bankUpgrade.deployed();

    const erc20_address = '0xbCda3F8743C965ed2BdD32cA9D6dCAE2Db8587E7'
    erc20 = await ethers.getContractFactory("ERC20Dummy");
    erc20Main = erc20.attach(erc20_address);
    await erc20Main.deployed();

    const erc721_address = '0xcC44A4DF40D09381F3431AF9e9c2318a88d5CF9E'
    erc721 = await ethers.getContractFactory("ERC721Dummy");
    erc721Main = erc721.attach(erc721_address);
    await erc721Main.deployed();

    const erc1155_address = '0xE9c599cB6EE41Cf32C6cA5c9df1a5489B73D460d'
    erc1155 = await ethers.getContractFactory("ERC1155Dummy");
    erc1155Main = erc1155.attach(erc1155_address);
    await erc1155Main.deployed();

    console.log('Enrolling deployer address as ADMIN ROLE.')
    await bankUpgrade.addAdmin(deployer.address);
    console.log("DONE!");


    console.log('Depositing ERC20 to BankUpgrade Contract....')
    await erc20Main.approve(bankUpgrade.address, ethers.utils.parseEther('1'))
    const depositERC20 = await bankUpgrade.depositERC20(erc20Main.address, ethers.utils.parseEther('1'), {value: ethers.utils.parseEther('0.001')})
    await depositERC20.wait();
    console.log("DONE!");
    console.log("------------------------------------------------------");

    console.log('Depositing ERC721 to BankUpgrade Contract....')
    await erc721Main.approve(bankUpgrade.address, 1);
    const depositERC721 = await bankUpgrade.depositERC721(erc721Main.address, 1, {value: ethers.utils.parseEther('0.001')})
    await depositERC721.wait();
    console.log("DONE!");
    console.log("------------------------------------------------------");

    console.log('Depositing ERC1155 to BankUpgrade Contract....')
    await erc1155Main.setApprovalForAll(bankUpgrade.address, true);
    await bankUpgrade.depositERC1155(erc1155Main.address, 1, 1, {value: ethers.utils.parseEther('0.001')})
    console.log("DONE!");
    console.log("------------------------------------------------------");

    console.log('Withdrawing ERC20 to BankUpgrade Contract....')
    await bankUpgrade.whitelistWithdrawERC20(erc20Main.address, deployer.address, true)
    const withdrawERC20 = await bankUpgrade.withdrawERC20(erc20Main.address, ethers.utils.parseEther('1'));
    await withdrawERC20.wait();
    console.log("DONE!");
    console.log("------------------------------------------------------");

    console.log('Withdrawing ERC721 to BankUpgrade Contract....')
    await bankUpgrade.whitelistWithdrawERC721(erc721Main.address, deployer.address, true);
    const withdrawERC721 = await bankUpgrade.withdrawERC721(erc721Main.address, 1);
    await withdrawERC721.wait();

    console.log("DONE!");
    console.log("------------------------------------------------------");

    console.log('Withdrawing ERC1155 to BankUpgrade Contract....')
    await bankUpgrade.whitelistWithdrawERC1155(erc1155Main.address, deployer.address, true)
    const withdrawERC115 = await bankUpgrade.withdrawERC1155(erc1155Main.address, 1, 1);
    await withdrawERC115.wait();

    console.log("DONE!");
    console.log("------------------------------------------------------");

    console.log('Withdrawing of ETH from BankUpgrade Contract to Recipient address....')
    await bankUpgrade.setDepositPaymentRecipient(deployer.address);
    const withdrawETH = await bankUpgrade.withdrawPayments()
    await withdrawETH.wait();

    console.log("DONE!");
    console.log("------------------------------------------------------");

}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});
