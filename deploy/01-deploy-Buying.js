const { network } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const { verify } = require("../utils/verification");


module.exports = async function ({ getNamedAccounts, deployments }) {

    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    let priceFeedAddress;

    if (developmentChains.includes(network.name)) {
        const mockV3Aggregator = await deployments.get("MockV3Aggregator");
        priceFeedAddress = mockV3Aggregator.address;
    } else {
        priceFeedAddress = networkConfig[chainId]["chainLinkPriceFeedAddress"];
    }

    const args = [priceFeedAddress];

    const buying = await deploy("Buying", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    log("Contract Buying Successfully Deployed \n -----------------------------------------------------------------------------------------------------");

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(buying.address, args);
    }
}

module.exports.tags = ["all", "Buying"];