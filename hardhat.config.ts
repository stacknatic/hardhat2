import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import * as dotenv from "dotenv";
dotenv.config();

const MAINNET_URL = process.env.MAINNET_URL || "http://192.168.1.101:8545";
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: { compilers: [{ version: "0.8.28" }] },

  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      // if you want to use the same deployer key:
      accounts: [],
    },
    // you still have the built-in hardhat in-memory network:
    hardhat: {
      chainId: 31337,
    },
    mainnet: {
      url: MAINNET_URL,
      chainId: 1, // Ethereum mainnet chain-id
      accounts: DEPLOYER_KEY // or [DEPLOYER_KEY] for a single-key array
        ? [DEPLOYER_KEY]
        : [],
      // gasPrice: 20_000_000_000,  // optional
      // allowUnlimitedContractSize: true,
    },
  },
};

export default config;

// const config: HardhatUserConfig = {
//   solidity: "0.8.28",
// };

// export default config;
