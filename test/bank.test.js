const { expect } = require("chai");
const { loadFixture } = require("ethereum-waffle");
const { ethers } = require("hardhat");
const { inputFile } = require("hardhat/internal/core/params/argumentTypes");
const { beforeEach } = require("mocha");

describe('Deploying Smart Contracts', () => {

let erc20, erc20Main, erc721, erc721Main, erc1155, erc1155Main, bank, bankCore, bankupgrade, bankUpgrade

    async function testFixture() {
        // let erc20, erc20Main, erc721, erc721Main, erc1155, erc1155Main, bank, bankCore, bankupgrade, bankUpgrade
        const [owner, account1, account2, account3] = await ethers.getSigners();

        erc20 = await ethers.getContractFactory('ERC20Dummy');
        erc20Main = await erc20.deploy()
        await erc20Main.deployed()

        erc721 = await ethers.getContractFactory('ERC721Dummy')
        erc721Main = await erc721.deploy()
        await erc721Main.deployed()

        erc721 = await ethers.getContractFactory('ERC721Dummy')
        erc721Main = await erc721.deploy()
        await erc721Main.deployed()

        erc1155 = await ethers.getContractFactory('ERC1155Dummy')
        erc1155Main = await erc1155.deploy()
        await erc1155Main.deployed()

        bank = await ethers.getContractFactory('BankCore')
        // bankCore = await bank.deploy()
        bankCore = await upgrades.deployProxy(bank, [], {initializer: "initialize",});
        await bankCore.deployed()

        bankupgrade = await ethers.getContractFactory("BankUpgrade");
        bankUpgrade = await upgrades.upgradeProxy(bankCore.address, bankupgrade);
        await bankUpgrade.deployed();

        return {owner, account1, account2, account3, erc20Main, erc721Main, erc1155Main, bankCore, bankUpgrade}
    }

    describe('Testing Functions of ERC20, ERC721, ERC1155.', () => {
        it('Should success minting of 2 Tokens of ERC721', async () => {
            const { owner, account1, erc721Main } = await loadFixture(testFixture);
    
            await erc721Main.connect(account1).mint('');
            await erc721Main.connect(account1).mint('1');
            const ownerOF = await erc721Main.ownerOf(1);
            expect(ownerOF).to.equal(account1.address);
        })

        it('Should owner have a balance and totalSupply of 10 ERC20 Tokens', async () => {
            const { owner, account1, erc20Main, bankCore} = await loadFixture(testFixture);
            
            const totalSupply = await erc20Main.totalSupply()
            expect(totalSupply).to.equal(ethers.utils.parseEther('10'))

            const balance = await erc20Main.balanceOf(owner.address)
            expect(balance).to.equal(ethers.utils.parseEther('10'))
        })
    
        it('Should mint tokenId 1 and amount of 2 tokens from ERC1155', async () => {
            let { owner, account1, erc1155Main, bankUpgrade, bankCore } = await loadFixture(testFixture);
            await erc1155Main.mint(owner.address, 1, 2);
    
            const balance = await erc1155Main.balanceOf(owner.address, 1);
            expect(balance).to.be.eq(2)
        })
    })


    describe('Testing Functions of BankCore Smart Contract for ERC721', () => {
        it('can add co-admins', async () => {
            const {owner, account1, account2 , bankCore } = await loadFixture(testFixture);

            await bankCore.addAdmin(owner.address);
            await bankCore.addAdmin(account1.address);
            await bankCore.addAdmin(account2.address);

            const ADMIN_HASH = await bankCore.ADMIN_ROLE();

            expect(await bankCore.hasRole(ADMIN_HASH, account1.address)).to.eq(true);
            expect(await bankCore.hasRole(ADMIN_HASH, account2.address)).to.eq(true);
        })

        it('can remove co-admins', async () => {
            const {owner, account1, account2 , bankCore } = await loadFixture(testFixture);
            
            await bankCore.removeAdmin(account1.address);
            await bankCore.removeAdmin(account2.address);

            const ADMIN_HASH = await bankCore.ADMIN_ROLE();

            expect(await bankCore.hasRole(ADMIN_HASH, account1.address)).to.eq(false);
            expect(await bankCore.hasRole(ADMIN_HASH, account2.address)).to.eq(false);
        })
        
        it('Should fail to deposit ERC721 to Bank contract because it is not yet approved.', async () => {
            const {bankCore , erc721Main } = await loadFixture(testFixture);
    
            await expect(bankCore.depositERC721(erc721Main.address, 1, {value: ethers.utils.parseEther('0.001')})).to.be.reverted;
        })
    
        it('Should success to deposit ERC721 TokenID 1 to Bank contract because it is approved.', async () => {
            const { owner, account1, erc721Main, bankCore} = await loadFixture(testFixture);
    
            // await erc721Main.connect(account1).setApprovalForAll(bankCore.address, true)
            await erc721Main.connect(account1).approve(bankCore.address, 1);
    
            await bankCore.connect(account1).depositERC721(erc721Main.address, 1, {value: ethers.utils.parseEther('0.001')})
            const ownerOF = await erc721Main.connect(account1).ownerOf(1);
            expect(ownerOF).to.equal(bankCore.address);
        })
    
        it('Should fail to withdraw ERC721 TokenId 1 because not yet added in the whitelist.', async () => {
            const { owner, account1, erc721Main, bankCore} = await loadFixture(testFixture);
            
            await expect(bankCore.withdrawERC721(erc721Main.address, 1)).to.be.reverted
        })
    
        it('Should success to withdraw ERC721 TokenId 1.', async () => {
            const { owner, account1, erc721Main, bankCore} = await loadFixture(testFixture);
            
           
            await bankCore.whitelistWithdrawERC721(erc721Main.address, account1.address, true);
            await bankCore.connect(account1).withdrawERC721(erc721Main.address, 1);
    
            const ownerOF = await erc721Main.connect(account1).ownerOf(1);
            expect(ownerOF).to.equal(account1.address);
        }) 

        it('Should fail to withdraw ERC721 TokenId 1 because it is already withdrawn.', async () => {
            const { owner, account1, erc721Main, bankCore} = await loadFixture(testFixture);
            
            await bankCore.whitelistWithdrawERC721(erc721Main.address, account1.address, true);
            await expect(bankCore.connect(account1).withdrawERC721(erc721Main.address, 1)).to.be.reverted;
        }) 
    })
    
    describe('Testing Functions of BankCore Smart Contract for ERC20', () => {

        it('Should fail to deposit ERC20 because not yet approved.', async () => {
            const { owner, account1, erc20Main, bankCore} = await loadFixture(testFixture);

            await expect(bankCore.depositERC20(erc20Main.address, ethers.utils.parseEther('1'), {value: ethers.utils.parseEther('0.001')})).to.be.reverted;
        })

        it('Should success to deposit 1 ERC20 to Bank Smart Contract.', async () => {
            const { owner, account1, erc20Main, bankCore} = await loadFixture(testFixture);

            await erc20Main.approve(bankCore.address, ethers.utils.parseEther('1'))
            await bankCore.depositERC20(erc20Main.address, ethers.utils.parseEther('1'), {value: ethers.utils.parseEther('0.001')})

            const balance1 = await erc20Main.balanceOf(owner.address)
            expect(balance1).to.equal(ethers.utils.parseEther('9'))

            const balance2 = await erc20Main.balanceOf(bankCore.address)
            expect(balance2).to.equal(ethers.utils.parseEther('1'))
        })

        it('Should success again to deposit 1 amount to Bank Smart Contract and Amount Deposited should be equal to 2.', async () => {
            const { owner, account1, erc20Main, bankCore} = await loadFixture(testFixture);

            await erc20Main.approve(bankCore.address, ethers.utils.parseEther('1'))
            await bankCore.depositERC20(erc20Main.address, ethers.utils.parseEther('1'), {value: ethers.utils.parseEther('0.001')})

            const balance1 = await erc20Main.balanceOf(owner.address)
            expect(balance1).to.equal(ethers.utils.parseEther('8'))
            
            const amountDeposited = await bankCore.erc20_total_deposited(owner.address)
            expect(amountDeposited).to.equal(ethers.utils.parseEther('2'))
        })

        it('Should fail to withdraw because not yet added in whitelist', async () => {
            const { owner, account1, erc20Main, bankCore} = await loadFixture(testFixture);

            await expect(bankCore.withdrawERC20(erc20Main.address, ethers.utils.parseEther('1'))).to.be.reverted;
        })

        it('Should success to withdraw 1 amount', async () => {
            let { owner, account1, erc20Main, bankCore} = await loadFixture(testFixture);
            
            const balance1 = await erc20Main.balanceOf(bankCore.address)
            expect(balance1).to.equal(ethers.utils.parseEther('2'))

            //the logic is that bankCore.address should initiate the approve function of ERC20
            // await erc20Main.connect(bankCore.address).approve(owner.address, ethers.utils.parseEther('1'))

            await bankCore.whitelistWithdrawERC20(erc20Main.address, owner.address, true)
            await bankCore.withdrawERC20(erc20Main.address, ethers.utils.parseEther('1'));
        })
    })

    describe('BankCore contract upgraded to BankUpgrade smart contract. Testing functions.', () => {
        it('Should successfully upgraded to BankUpgrade smart contract with same contract address', async () => {
            let {bankUpgrade, bankCore } = await loadFixture(testFixture);

            expect(bankUpgrade.address).to.be.eq(bankCore.address);
        })

        it('can add co-admins', async () => {
            const {owner, account1, account2 , bankCore, bankUpgrade } = await loadFixture(testFixture);
            
            await bankUpgrade.addAdmin(account1.address);
            await bankUpgrade.addAdmin(account2.address);

            const ADMIN_HASH = await bankUpgrade.ADMIN_ROLE();

            expect(await bankUpgrade.hasRole(ADMIN_HASH, account1.address)).to.eq(true);
            expect(await bankUpgrade.hasRole(ADMIN_HASH, account2.address)).to.eq(true);
        })

        it('can remove co-admins', async () => {
            const {owner, account1, account2 , bankCore, bankUpgrade } = await loadFixture(testFixture);
            
            await bankUpgrade.removeAdmin(account1.address);
            await bankUpgrade.removeAdmin(account2.address);

            const ADMIN_HASH = await bankUpgrade.ADMIN_ROLE();

            expect(await bankUpgrade.hasRole(ADMIN_HASH, account1.address)).to.eq(false);
            expect(await bankUpgrade.hasRole(ADMIN_HASH, account2.address)).to.eq(false);
        })

        it('Should fail to deposit ERC1155 token to BankUpgrade because not yet approve', async () => {
            let {erc1155Main, bankUpgrade } = await loadFixture(testFixture);

            await expect(bankUpgrade.depositERC1155(erc1155Main.address, 1, 1)).to.be.reverted;
        })

        it('Should success to deposit ERC1155 token to BankUpgrade', async () => {
            let { owner, erc1155Main, bankUpgrade } = await loadFixture(testFixture);

            await erc1155Main.setApprovalForAll(bankUpgrade.address, true);
            expect(await erc1155Main.isApprovedForAll(owner.address, bankUpgrade.address)).to.be.true;

            await bankUpgrade.depositERC1155(erc1155Main.address, 1, 1, {value: ethers.utils.parseEther('0.001')})

            const balance = await erc1155Main.balanceOf(bankUpgrade.address, 1);
            expect(balance).to.be.eq(1)
        })

        it('Should fail to withdraw because not yet added in whitelist', async () => {
            let { owner, erc1155Main, bankUpgrade } = await loadFixture(testFixture);

            await expect(bankUpgrade.withdrawERC1155(erc1155Main.address, 1, 1)).to.be.reverted;
        })

        it('Should success to withdraw tokenId 1 and amount 1 of ERC1155', async () => {
            let { owner, erc1155Main, bankUpgrade } = await loadFixture(testFixture);

            await bankUpgrade.whitelistWithdrawERC1155(erc1155Main.address, owner.address, true)
            bankUpgrade.withdrawERC1155(erc1155Main.address, 1, 1);

            const balance = await erc1155Main.balanceOf(owner.address, 1);
            expect(balance).to.be.eq(2)
        })

        it('can assign recipient for ETH withdrawal', async () => {
            let { owner, account1, erc1155Main, bankUpgrade } = await loadFixture(testFixture);

            await bankUpgrade.setDepositPaymentRecipient(account1.address);
            expect(await bankUpgrade.getDepositPaymentRecipient()).to.be.eq(account1.address);
        })

        it('Should success to withdraw all ETH from the contract.', async () => {
            let { owner, account1, bankUpgrade, } = await loadFixture(testFixture);

            const balance = await bankUpgrade.getBalance();
            console.log(ethers.utils.formatEther(balance.toString()));

            await bankUpgrade.connect(account1).withdrawPayments()
        })
    })

})
