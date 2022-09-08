// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract ERC1155Dummy is ERC1155 {
    constructor() ERC1155("") {}

    function mint(
        address _to,
        uint256 _id,
        uint256 _amount
    ) public {
        _mint(_to, _id, _amount, "");
    }
}
