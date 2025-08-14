// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title FileAnchor
/// @notice Anchor single file hashes or Merkle roots on-chain, and verify inclusion proofs.
contract FileAnchor {
    struct AnchorData {
        address uploader;
        uint256 blockNumber;
        uint256 timestamp;
    }

    // bytes32 → who anchored it, when
    mapping(bytes32 => AnchorData) private _anchors;

    event Anchored(
        address indexed uploader,
        bytes32 indexed dataHash,
        uint256 blockNumber,
        uint256 timestamp
    );

    /// @notice Anchor a single file-hash (keccak256 of the file)
    function anchorSingle(bytes32 fileHash) external {
        _anchor(fileHash);
    }

    /// @notice Anchor a Merkle root computed off-chain
    function anchorRoot(bytes32 merkleRoot) external {
        _anchor(merkleRoot);
    }

    /// @notice Anchor multiple hashes (leaves or roots) in one tx
    function anchorBatch(bytes32[] calldata hashes) external {
        uint256 blk = block.number;
        uint256 ts  = block.timestamp;
        for (uint i = 0; i < hashes.length; i++) {
            bytes32 h = hashes[i];
            if (h != bytes32(0) && _anchors[h].uploader == address(0)) {
                _anchors[h] = AnchorData(msg.sender, blk, ts);
                emit Anchored(msg.sender, h, blk, ts);
            }
        }
    }

    /// @notice Verifies that a leaf is in an anchored Merkle root
    function verifyInclusion(
        bytes32[] calldata proof,
        bytes32  root,
        bytes32  leaf
    ) external pure returns (bool) {
        return MerkleProof.verify(proof, root, leaf);
    }

    /// @notice Get who and when a hash/root was anchored
    function getAnchor(bytes32 dataHash)
        external
        view
        returns (
            address uploader,
            uint256 blockNumber,
            uint256 timestamp
        )
    {
        AnchorData memory info = _anchors[dataHash];
        require(info.uploader != address(0), "FileAnchor: not anchored");
        return (info.uploader, info.blockNumber, info.timestamp);
    }

    // --- internal helper ---
    function _anchor(bytes32 h) private {
        require(h != bytes32(0), "FileAnchor: invalid hash");
        require(_anchors[h].uploader == address(0), "FileAnchor: already anchored");

        _anchors[h] = AnchorData(msg.sender, block.number, block.timestamp);
        emit Anchored(msg.sender, h, block.number, block.timestamp);
    }
}