import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployFileAnchor: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("FileAnchor", {
    from: deployer,
    args: [],      // no constructor arguments
    log: true,     // display gas, address, etc.
  });
};

export default deployFileAnchor;
deployFileAnchor.tags = ["FileAnchor"];