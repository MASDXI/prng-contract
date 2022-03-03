// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "./IPRNG.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

contract PRNG is IPRNG {
    // Example data for testing on Remix IDE
    // ["0x2c7536E3605D9C16a7a3D7b1898e529396a65c23","0x1da44b586eb0729ff70a73c326926f6ed5a25f5b056e7f47fbc6e58d86871655","0xb91467e570a6466aa9e9876cbcd013baba02900b8979d43fe208a4a4f339f5fd6007e74cd82e037b800186422fc2da167c747ef045e5d18a5f5d4300f8e1a0291c"]

    /**
     * @notice checking length before
     * @param n input number
     */
    modifier checkLength(uint256 n) {
        require(n > 0 && n > 1, "modifier: length '0' or '1' is not allow");
        _;
    }

    /**
     * @notice Random number
     * @param client struct Entropy signed message from client
     * @param oracle struct Entropy signed message from oracle
     * @param length possible number under length for random
     * @return uint256
     */
    // TODO modifier isWorker(oracle.signer);
    //      for preventing client crate their own fake signed message for abuse RNG
    function random(
        Entropy calldata client,
        Entropy calldata oracle,
        uint256 length
    ) external override checkLength(length) returns (uint256) {
        require(
            SignatureChecker.isValidSignatureNow(
                oracle.signer,
                oracle.hash,
                oracle.sig
            ),
            "random: invalid off-chain entropy"
        );
        require(
            ECDSA.recover(client.hash, client.sig) == client.signer,
            "random: invalid on-chain entropy"
        );
        bytes memory s1 = _salt(client.hash, client.sig);
        bytes memory s2 = _salt(oracle.hash, oracle.sig);
        uint256 result = _random(s1, s2, length);
        emit Random(result, s1, s2, length);
        return result;
    }

    /**
     * @notice Salt for random
     * @param hash hash of message
     * @param sig signature of signed message
     * @return bytes
     */
    function _salt(bytes32 hash, bytes memory sig)
        private
        view
        returns (bytes memory)
    {
        bytes32 blockHash = blockhash(block.number - 1);
        uint256 blockTimeStamp = block.timestamp;
        bytes memory salted = abi.encodePacked(
            blockHash,
            blockTimeStamp,
            keccak256(abi.encodePacked(hash)),
            keccak256(sig)
        );
        return salted;
    }

    /**
     * @notice random internal logic
     * @param s1 salted secret signed message from client
     * @param s2 salted secret signed message from oracle
     * @param length possible number under length for random
     * @return boolean
     */
    function _random(
        bytes memory s1,
        bytes memory s2,
        uint256 length
    ) private pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(s1, s2))) % length;
    }

    /**
     * @notice Proving random
     * @param number result of random
     * @param s1 salted secret signed message from client
     * @param s2 salted secret signed message from oracle
     * @return boolean
     */
    function proving(
        uint256 number,
        bytes memory s1,
        bytes memory s2,
        uint256 length
    ) external pure override returns (bool) {
        uint256 result = _random(s1, s2, length);
        return (number == result);
    }
}
