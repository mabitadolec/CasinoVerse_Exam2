// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Dummy is ERC20{
    
    constructor() ERC20("BOUNTY","BTY"){
        _mint(_msgSender(), 10000000000000000000);
    }

} 