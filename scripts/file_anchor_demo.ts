import { ethers } from "hardhat";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";

async function main() {
  const [deployer, user] = await ethers.getSigners();
  console.log("Accounts:", deployer.address, user.address);

  // Deploy
  const Factory = await ethers.getContractFactory("FileAnchor");
  const anchor = await Factory.deploy();
  console.log("Deployed FileAnchor at", anchor.target);

  // Anchor a hash
  const myHash = ethers.id("my file contents");
  console.log("Anchoring hash payload:", myHash);
  await anchor.connect(user).anchorSingle(myHash);
  console.log("AnchoredSingle:", myHash);

  const info = await anchor.getAnchor(myHash);
  console.log("Anchor data:", {
    uploader: info.uploader,
    block: info.blockNumber,
    ts: info.timestamp,
  });

  // Merkle demo
  const leaves = ["x","y","z"].map((x) =>
    Buffer.from(ethers.keccak256(ethers.toUtf8Bytes(x)).slice(2), "hex")
  );
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = "0x" + tree.getRoot().toString("hex");
  const proof = tree.getProof(leaves[0]).map((p) => "0x" + p.data.toString("hex"));
  console.log("Proof valid?", await anchor.verifyInclusion(proof, root, "0x"+leaves[0].toString("hex")));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});