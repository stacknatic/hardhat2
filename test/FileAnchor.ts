import { expect } from "chai";
import { ethers } from "hardhat";
import type { FileAnchor } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("FileAnchor", function () {
  let anchor: FileAnchor;
  let deployer: SignerWithAddress;
  let other: SignerWithAddress;

  beforeEach(async () => {
    [deployer, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("FileAnchor");
    anchor = (await factory.deploy()) as FileAnchor;
    // ethers-v6 / hardhat-ethers no longer needs await anchor.deployed();
  });

  describe("anchorSingle / anchorRoot", () => {
    const H = ethers.id("some-file-content"); // keccak256 hash

    it("anchors a single hash and emits Anchored", async () => {
      await expect(anchor.connect(other).anchorSingle(H))
        .to.emit(anchor, "Anchored")
        .withArgs(
          other.address,
          H,
          anyValue, // wildcard for blockNumber
          anyValue // wildcard for timestamp
        );

      const info = await anchor.getAnchor(H);
      expect(info.uploader).to.equal(other.address);
      expect(info.blockNumber).to.be.a("bigint").that.is.greaterThan(0n);
      expect(info.timestamp).to.be.a("bigint").that.is.greaterThan(0n);
    });

    it("anchors via anchorRoot identically", async () => {
      await anchor.connect(other).anchorRoot(H);
      const info = await anchor.getAnchor(H);
      expect(info.uploader).to.equal(other.address);
    });

    it("rejects the zero hash", async () => {
      await expect(anchor.anchorSingle(ethers.ZeroHash)).to.be.revertedWith(
        "FileAnchor: invalid hash"
      );
      await expect(anchor.anchorRoot(ethers.ZeroHash)).to.be.revertedWith(
        "FileAnchor: invalid hash"
      );
    });

    it("rejects double‐anchoring", async () => {
      await anchor.anchorSingle(H);
      await expect(anchor.anchorSingle(H)).to.be.revertedWith(
        "FileAnchor: already anchored"
      );
    });

    it("getAnchor reverts if not anchored", async () => {
      await expect(anchor.getAnchor(H)).to.be.revertedWith(
        "FileAnchor: not anchored"
      );
    });
  });

  describe("anchorBatch", () => {
    const h1 = ethers.id("file1");
    const h2 = ethers.id("file2");
    const h3 = ethers.id("file3");

    it("anchors multiple hashes, skipping zero or already-anchored", async () => {
      // pre-anchor h2 so it’s skipped
      await anchor.anchorSingle(h2);

      const batch = [h1, h2, ethers.ZeroHash, h3];
      const tx = await anchor.anchorBatch(batch);
      const receipt = await tx.wait();

      // parse only our "Anchored" logs
      const anchoredLogs = receipt?.logs
        .map((l) => {
          try {
            return anchor.interface.parseLog(l);
          } catch {
            return null;
          }
        })
        .filter(
          (x): x is ReturnType<typeof anchor.interface.parseLog> =>
            !!x && x.name === "Anchored"
        );

      // Should have anchored only h1 & h3
      expect(anchoredLogs).to.have.length(2);
      const hashes = anchoredLogs?.map((ev) => ev?.args.dataHash);
      expect(hashes).to.include.members([h1, h3]);

      // verify via getAnchor
      const info1 = await anchor.getAnchor(h1);
      const info3 = await anchor.getAnchor(h3);
      expect(info1.uploader).to.equal(deployer.address);
      expect(info3.uploader).to.equal(deployer.address);
    });
  });

  describe("verifyInclusion", () => {
    // Build a small Merkle tree off-chain
    const leaves = ["a", "b", "c", "d"].map((x) =>
      Buffer.from(ethers.keccak256(ethers.toUtf8Bytes(x)).slice(2), "hex")
    );
    let tree: MerkleTree;
    let root: string;

    before(() => {
      tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      root = "0x" + tree.getRoot().toString("hex");
    });

    it("verifies a valid proof", async () => {
      const leafBuf = leaves[2]; // "c"
      const proof = tree
        .getProof(leafBuf)
        .map((p) => "0x" + p.data.toString("hex"));
      const leafHex = "0x" + leafBuf.toString("hex");

      const ok = await anchor.verifyInclusion(proof, root, leafHex);
      expect(ok).to.be.true;
    });

    it("rejects an invalid proof", async () => {
      const fakeLeafBuf = leaves[0]; // "a"
      const proofForC = tree
        .getProof(leaves[2])
        .map((p) => "0x" + p.data.toString("hex"));
      const fakeLeafHex = "0x" + fakeLeafBuf.toString("hex");

      const ok = await anchor.verifyInclusion(proofForC, root, fakeLeafHex);
      expect(ok).to.be.false;
    });
  });
});
