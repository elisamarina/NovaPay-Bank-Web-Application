// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {IPriceOracle} from "../../src/interfaces/IPriceOracle.sol";

contract MockPriceOracle is IPriceOracle {
    PriceData private _price;
    bool private _shouldRevert;

    function setPrice(int256 answer, uint8 decimals_, uint256 updatedAt, uint256 maxAge) external {
        _price = PriceData({answer: answer, decimals: decimals_, updatedAt: updatedAt, maxAge: maxAge});
    }

    function setShouldRevert(bool shouldRevert) external {
        _shouldRevert = shouldRevert;
    }

    function latestPrice() external view returns (PriceData memory price) {
        if (_shouldRevert) revert InvalidOraclePrice();

        return _price;
    }
}
