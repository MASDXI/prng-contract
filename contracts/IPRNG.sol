// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IPRNG {
    struct Entropy {
        address signer;
        bytes32 hash;
        bytes sig;
    }

    event Random(uint256, bytes, bytes, uint256);

    function random(
        Entropy calldata oracle,
        Entropy calldata client,
        uint256 lenght
    ) external returns (uint256);

    function proving(
        uint256 number,
        bytes memory s1,
        bytes memory s2,
        uint256 length
    ) external view returns (bool);
}
