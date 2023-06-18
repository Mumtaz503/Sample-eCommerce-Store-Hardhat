const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
    const { deployer } = await getNamedAccounts();
    const deployerSigner = ethers.provider.getSigner(deployer);
    const buying = await ethers.getContract("Buying", deployer);

    const transactionResponse = await buying.connect(deployerSigner).withdraw();
    await transactionResponse.wait(1);
    console.log("retrieved funds");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    });