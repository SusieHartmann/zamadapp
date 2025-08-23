// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./FHELib.sol";

contract FHELibTest {
    using FHELib for *;

    function testEncryptUint(uint256 value) external pure returns (FHELib.EncryptedUint memory) {
        return FHELib.encrypt(value);
    }

    function testEncryptBool(bool value) external pure returns (FHELib.EncryptedBool memory) {
        return FHELib.encrypt(value);
    }

    function testHomomorphicAdd(uint256 a, uint256 b) external pure returns (FHELib.EncryptedUint memory) {
        FHELib.EncryptedUint memory encA = FHELib.encrypt(a);
        FHELib.EncryptedUint memory encB = FHELib.encrypt(b);
        return FHELib.add(encA, encB);
    }

    function testHomomorphicSub(uint256 a, uint256 b) external pure returns (FHELib.EncryptedUint memory) {
        FHELib.EncryptedUint memory encA = FHELib.encrypt(a);
        FHELib.EncryptedUint memory encB = FHELib.encrypt(b);
        return FHELib.sub(encA, encB);
    }

    function testEncryptedEq(uint256 a, uint256 b) external pure returns (FHELib.EncryptedBool memory) {
        FHELib.EncryptedUint memory encA = FHELib.encrypt(a);
        FHELib.EncryptedUint memory encB = FHELib.encrypt(b);
        return FHELib.eq(encA, encB);
    }

    function testEncryptedGt(uint256 a, uint256 b) external pure returns (FHELib.EncryptedBool memory) {
        FHELib.EncryptedUint memory encA = FHELib.encrypt(a);
        FHELib.EncryptedUint memory encB = FHELib.encrypt(b);
        return FHELib.gt(encA, encB);
    }

    function testEncryptedLt(uint256 a, uint256 b) external pure returns (FHELib.EncryptedBool memory) {
        FHELib.EncryptedUint memory encA = FHELib.encrypt(a);
        FHELib.EncryptedUint memory encB = FHELib.encrypt(b);
        return FHELib.lt(encA, encB);
    }

    function testGeneratePublicKey(address user) external pure returns (bytes32) {
        return FHELib.generatePublicKey(user);
    }

    function testGeneratePrivateKey(address user, string memory secret) external pure returns (uint256) {
        return FHELib.generatePrivateKey(user, secret);
    }

    function testDecryptUint(uint256 value, uint256 secretKey) external pure returns (uint256) {
        FHELib.EncryptedUint memory encrypted = FHELib.encrypt(value);
        return FHELib.decrypt(encrypted, secretKey);
    }

    function testDecryptBool(bool value, uint256 secretKey) external pure returns (bool) {
        FHELib.EncryptedBool memory encrypted = FHELib.encrypt(value);
        return FHELib.decrypt(encrypted, secretKey);
    }

    function testVerifyEncryption(uint256 value, bytes32 publicKey) external pure returns (bool) {
        FHELib.EncryptedUint memory encrypted = FHELib.encrypt(value);
        return FHELib.verifyEncryption(encrypted, publicKey);
    }
}