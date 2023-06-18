const { getNamedAccounts, ethers, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { expect, assert } = require("chai");

developmentChains.includes(network.name) ? describe.skip :
    describe("Buying", function () {
        let buying;
        let deployer;
        let user;
        const msgValue = ethers.utils.parseUnits("0.030", "ether");
        beforeEach(async function () {
            user = (await getNamedAccounts()).user;
            deployer = (await getNamedAccounts()).deployer;
            buying = await ethers.getContract("Buying", deployer);
            userSigner = ethers.provider.getSigner(user);
            deployerSigner = ethers.provider.getSigner(deployer);
        });
        it("Should allow people to buy and the owner to withdraw", async function () {
            const _itemName = "Test Item";
            const _itemPriceInUSD = ethers.BigNumber.from("50");
            await buying.connect(deployerSigner).addItemToList(_itemName, _itemPriceInUSD);
            const tx = await buying.connect(deployerSigner).buy(_itemName, {
                value: msgValue
            });
            tx.wait(1);

            const itemExists = buying.getPriceOfItem(_itemName) > 0;
            expect(itemExists).to.be.false;

            const initialContractBalance = await buying.provider.getBalance(
                buying.address
            );
            const startDeployerBalance = await buying.provider.getBalance(
                deployer
            );
            const transactionResponse = await buying.withdraw();
            const transactionReciept = await transactionResponse.wait(1);

            const finalBuyingBalance = await buying.provider.getBalance(
                buying.address
            );


            assert.equal(finalBuyingBalance, 0);
        });
    });