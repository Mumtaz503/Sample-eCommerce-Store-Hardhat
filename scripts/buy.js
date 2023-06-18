const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
  const { deployer, user } = await getNamedAccounts();
  const deployerSigner = ethers.provider.getSigner(deployer);
  const userSigner = ethers.provider.getSigner(user);
  const buying = await ethers.getContract("Buying", deployer);

  console.log("buying Contract....");

  const _itemName = "Item1";
  const _itemPriceInUSD = ethers.BigNumber.from("50");
  const msgValue = ethers.utils.parseUnits("0.030", "ether");

  await buying.connect(deployerSigner)
    .addItemToList(_itemName, _itemPriceInUSD);
  const transactionResponse = await buying.connect(userSigner).buy(_itemName, {
    value: msgValue
  });
  await transactionResponse.wait(1);
  console.log("success!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  });