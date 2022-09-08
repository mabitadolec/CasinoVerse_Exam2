// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./BankCore.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Receiver.sol";

contract BankUpgrade is BankCore, ERC1155Holder{
    //Inherited ERC1155Holder and override function supportsInterface so that BankUpgrade Smart contract can received ERC1155 Tokens
    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControl, ERC1155Receiver) returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId || super.supportsInterface(interfaceId);
    }

    mapping(address => mapping(address => erc1155_DataDeposit)) public erc1155_DepositList;

    struct erc1155_DataDeposit {
        uint256 tokenId;
        address contract_address;
        address owner;
        uint amount;
        bool canWithdraw;
    }

    address payable deposit_payment_recipient;


    function depositERC1155(address _contractAddress, uint256 _tokenId, uint256 _amount) public payable onlyEOA {
        ERC1155 token = ERC1155(_contractAddress);

        require(token.balanceOf(_msgSender(), _tokenId) > 0,"Error: Not the owner!");
        require(token.isApprovedForAll(_msgSender(), address(this)), 'Error: Contract must be approved.');
        require(msg.value >= 0.001 ether, "Error: Not enough ETH to deposit");

        token.safeTransferFrom(_msgSender(), address(this), _tokenId, _amount, "");

        erc1155_DepositList[_contractAddress][_msgSender()] = erc1155_DataDeposit(_tokenId, _contractAddress, _msgSender(), _amount, false);
    }

    function whitelistWithdrawERC1155(address _contractAddress, address _toBeWhitelisted, bool _canWithdraw) external virtual onlyRole(ADMIN_ROLE) {
        erc1155_DataDeposit storage _erc1155_deposit = erc1155_DepositList[_contractAddress][_toBeWhitelisted];
        _erc1155_deposit.canWithdraw = _canWithdraw;
    }

    function withdrawERC1155(address _contractAddress, uint256 _tokenId, uint256 _amount) public onlyEOA {
        ERC1155 token = ERC1155(_contractAddress);

        erc1155_DataDeposit storage _erc1155_deposit = erc1155_DepositList[_contractAddress][_msgSender()];

        require(_erc1155_deposit.canWithdraw, 'Error: Not whitelisted to withdraw.');
        require(_erc1155_deposit.owner == _msgSender(),"Error: Not the owner!");

        token.safeTransferFrom(address(this) , _msgSender(), _tokenId, _amount, "");
    }

    function setDepositPaymentRecipient(address payable _recipient) external onlyRole(ADMIN_ROLE) {
        deposit_payment_recipient = _recipient;
    }

    function getDepositPaymentRecipient() external view returns (address) {
        return deposit_payment_recipient;
    }

    function withdrawPayments() external {
        uint256 balance = getBalance();

        require(balance > 0, 'Error: Balance should be above to 0.');
        require(deposit_payment_recipient != address(0));
        require(msg.sender == deposit_payment_recipient);

        // address payable receipt = payable(deposit_payment_recipient);
        (bool sent, ) = deposit_payment_recipient.call{value: balance}("");
        require(sent, "Failed to send Ether");
    }

    function getBalance() public view returns(uint256) {
        return address(this).balance;
    }
}