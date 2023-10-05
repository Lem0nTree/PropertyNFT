// contracts/MockERC20.sol

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MCK") {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
