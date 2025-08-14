import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * FileAnchorModule
 *
 * Deploys FileAnchor and (optionally) anchors a list of hashes immediately.
 *
 * @param initialAnchors – array of bytes32 hex‐strings to anchorSingle right after deploy
 */
const FileAnchorModule = buildModule("FileAnchorModule", (m) => {

  // 1) deploy FileAnchor (no constructor args)
  const fileAnchor = m.contract("FileAnchor", []);


  // expose the deployed contract
  return { fileAnchor };
});

export default FileAnchorModule;