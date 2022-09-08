// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

//Inheritted ERC721Holder so that BankCore Smart Contract can received ERC721 token
contract BankCore is Initializable, AccessControl, ERC721Holder {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");

    uint256 public transactionFee;

    function addAdmin(address _toAdd) public virtual onlyRole(OWNER_ROLE) {
        _grantRole(ADMIN_ROLE, _toAdd);
    }

    function removeAdmin(address _toAdd) public virtual onlyRole(OWNER_ROLE) {
        _revokeRole(ADMIN_ROLE, _toAdd);
    }

    modifier onlyEOA() {
        bool _isEOA = isContract(_msgSender()) == false;
        bool _isOwner = hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) == true;
        require(_isEOA || _isOwner);
        _;
    }

    function isContract(address _addr) private view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }

    function initialize() public initializer {
        _grantRole(OWNER_ROLE, _msgSender());
        transactionFee = 0.001 ether;
    }


    ///////////////-----------------ERC721----------------////////////////
    mapping(address => mapping(address => erc721_DataDeposit)) public erc721_DepositList;

    struct erc721_DataDeposit {
        uint256 tokenId;
        address contract_address;
        address owner;
        bool canWithdraw;
    }

    function depositERC721(address _contractAddress, uint256 _tokenId) public payable onlyEOA {
        ERC721 token = ERC721(_contractAddress);

        require(token.ownerOf(_tokenId) == _msgSender(),"Error: Not the owner!");
        require(msg.value >= transactionFee, "Error: Not enough ETH to deposit");
        
        token.safeTransferFrom(_msgSender(), address(this), _tokenId, "");

        erc721_DepositList[_contractAddress][_msgSender()] = erc721_DataDeposit(_tokenId, _contractAddress, _msgSender(), false);
    }

    function whitelistWithdrawERC721(address _contractAddress, address _toBeWhitelisted, bool _canWithdraw) external virtual onlyRole(ADMIN_ROLE) {
        erc721_DataDeposit storage _erc721_deposit = erc721_DepositList[_contractAddress][_toBeWhitelisted];
        _erc721_deposit.canWithdraw = _canWithdraw;
    }

    function withdrawERC721(address _contractAddress, uint256 _tokenId) public onlyEOA {
        ERC721 token = ERC721(_contractAddress);
        erc721_DataDeposit storage _erc721_deposit = erc721_DepositList[_contractAddress][_msgSender()];

        require(_erc721_deposit.canWithdraw, 'Error: Not whitelisted to withdraw.');
        require(_erc721_deposit.owner == _msgSender(),"Error: Not the owner!");

        token.safeTransferFrom(address(this) , _msgSender(), _tokenId, "");
    }


        ///////////////-----------------ERC20----------------////////////////
    mapping(address => mapping(address => erc20_DataDeposit)) public erc20_DepositList;
    mapping(address => uint256) public erc20_total_deposited;
    
    struct erc20_DataDeposit {
        uint256 tokenAmount;
        address contract_address;
        address owner;
        bool canWithdraw;
    }

    function depositERC20(address _contractAddress, uint256 _amount) public payable onlyEOA {
        ERC20 token = ERC20(_contractAddress);

        require(token.balanceOf(_msgSender()) >= _amount ,"Error: Not enough token!");
        require(token.allowance(_msgSender(), address(this)) >= _amount, 'Error: Contract must be approved.');
        require(msg.value >= transactionFee, "Error: Not enough ETH to deposit");

        token.transferFrom(_msgSender(), address(this), _amount);
        erc20_DepositList[_contractAddress][_msgSender()] = erc20_DataDeposit(_amount, _contractAddress, _msgSender(), false);

        erc20_total_deposited[_msgSender()] += _amount;
    }

    function whitelistWithdrawERC20(address _contractAddress,address _toBeWhitelisted, bool _canWithdraw) external virtual onlyRole(ADMIN_ROLE) {
        erc20_DataDeposit storage _erc20_deposit = erc20_DepositList[_contractAddress][_toBeWhitelisted];
        _erc20_deposit.canWithdraw = _canWithdraw;
    }

    function withdrawERC20(address _contractAddress, uint256 _amount) public onlyEOA {
        ERC20 token = ERC20(_contractAddress);
        erc20_DataDeposit storage _erc20_deposit = erc20_DepositList[_contractAddress][_msgSender()];

        require(_erc20_deposit.canWithdraw, 'Error: Not whitelisted to withdraw.');
        require(erc20_total_deposited[_erc20_deposit.owner] >= _amount, 'Error: Not enough deposited Tokens.');
        require(_erc20_deposit.tokenAmount >= _amount,'Error: Not enough deposited Tokens.');

        //transferFrom needed approval. hence cannot call approve function of ERC20 using contract address
        token.transfer(_msgSender(), _amount);
        erc20_total_deposited[_msgSender()] -= _amount;
    }

}