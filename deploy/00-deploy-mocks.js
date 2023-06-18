const { network } = require("hardhat");
const { developmentChains, DECIMALS, INITIAL_ANSWER } = require("../helper-hardhat-config");


module.exports = async function ({ getNamedAccounts, deployments }) {

    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    if (developmentChains.includes(network.name)) {
        log("Deploying Mocks for the Local Network....");

        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER],
        });


        log("Mocks Successfuly deployer!");
        log("-----------------------------------------------------------------------------------------------------");


    }
}

module.exports.tags = ["all", "mocks"];