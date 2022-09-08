// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract ERC721Dummy is ERC721URIStorage{
    using Strings for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIDs;

    string[] public sampleNFTs;
    address public owner;

    mapping(string => bool) _sampleNFTsExists;


    constructor() ERC721('ONEPIECE','OP') {
        owner = _msgSender();
    }

        function mint(string memory _sampleNFT) public {
        require(!_sampleNFTsExists[_sampleNFT], 'Error: Already Exists!');

        sampleNFTs.push(_sampleNFT);

        //uint _id = sampleNFTs.length - 1;
        _tokenIDs.increment();
        uint256 newTokenID = _tokenIDs.current();

        _mint(msg.sender, newTokenID);

        _sampleNFTsExists[_sampleNFT] = true;

        _setTokenURI(newTokenID, getTokenURI(newTokenID, _sampleNFT));
        
    }   

        function getTokenURI(uint256 tokenID, string memory _sampleNFT) pure public returns(string memory) {
        bytes memory dataURI = abi.encodePacked(
            '{',
                '"name": "Sample NFT #', tokenID.toString(), '",',
                '"description": "Sample nft Description",',
                '"image": "', _sampleNFT , '"',
             '}'
        );

        return string(
         abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(dataURI)
         )
        );
    }
}