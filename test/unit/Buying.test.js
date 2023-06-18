const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name) ? describe.skip :
    describe("Buying", function () {

        let buying;
        let deployer;
        let mockV3Aggregator;
        let user;
        let userSigner;
        let deployerSigner;
        beforeEach(async function () {
            deployer = (await getNamedAccounts()).deployer;
            user = (await getNamedAccounts()).user;
            await deployments.fixture(["all"]);
            buying = await ethers.getContract("Buying", deployer);
            mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
            userSigner = ethers.provider.getSigner(user);
            deployerSigner = ethers.provider.getSigner(deployer);
        });
        describe("constructor", function () {
            it("Should set the priceFeed Address correctly", async function () {
                //Note to self
                //first things first, you can't user internal and private variables in your tests.
                const response = await buying.getPriceFeed();
                assert.equal(response, mockV3Aggregator.address);
            });
            it("Should set the owner of the contract correctly", async function () {
                const response = await buying.getOwnerAddress();
                assert.equal(response, deployer);
            });
        });
        describe("OwnershipAccess", function () {
            it("Should set the owner to be the one with access", async function () {
                const response = await buying.getOwnerAddress();
                assert.equal(response, deployer);
            });
        });
        describe("addItemToList", function () {
            it("Should add the item and the price", async function () {
                const _itemName = "TestItem1";
                const _itemPrice = ethers.BigNumber.from("100");
                await buying.addItemToList(_itemName, _itemPrice);

                const storePrice = await buying.getPriceOfItem(_itemName);
                const storedItemNames = await buying.getListedItems();

                expect(storePrice).to.equal(_itemPrice.mul(
                    ethers.BigNumber.from("1" + "0".repeat(18))));
                expect(storedItemNames.length).to.equal(1);
                expect(storedItemNames[0]).to.equal(_itemName);
            });
            it("Should revert when the name is empty", async function () {
                const _itemName = "";
                const _itemPrice = ethers.BigNumber.from("30");

                await expect(buying.addItemToList(_itemName, _itemPrice)
                ).to.be.revertedWith("Please enter the item's name");
            });
            it("Should revert when the price is empty", async function () {
                const _itemName = "Test Item";
                const _itemPrice = ethers.BigNumber.from("0");

                await expect(buying.addItemToList(_itemName, _itemPrice)
                ).to.be.revertedWith("Please enter a valid amount");
            });
        });
        describe("removeAnItem", function () {
            it("Should remove the selected item along with its price", async function () {
                const _itemName = "Test Item";
                const _itemPrice = ethers.BigNumber.from("50");

                await buying.addItemToList(_itemName, _itemPrice);

                let itemExists = await buying.getPriceOfItem(_itemName) > 0;
                expect(itemExists).to.be.true;

                await buying.removeAnItem(_itemName);

                let itemExistsAfter = await buying.getPriceOfItem(_itemName) > 0;
                expect(itemExistsAfter).to.be.false;
            });
            it("Should check if a valid item name is entered", async function () {
                const _itemName = "meh item";
                await expect(buying.removeAnItem(_itemName)
                ).to.be.revertedWith("Item Does not Exist");
            });
            it("Should check if there's no item name entered", async function () {
                const _itemName = "";
                await expect(buying.removeAnItem(_itemName)
                ).to.be.revertedWith("Please enter a valid item name");
            });
        });
        describe("getItems", function () {
            it("Should return the stored items", async function () {
                await buying.addItemToList("Test Item 1", 30);
                await buying.addItemToList("Test Item 2", 50);
                await buying.addItemToList("Test Item 3", 70);

                const [itemNames, itemPrices] = await buying.getItems();

                assert.equal(itemNames.length, 3);
                assert.equal(itemPrices.length, 3);

                expect(itemNames[0]).to.equal("Test Item 1");
                expect(itemPrices[0]).to.equal(30);

                expect(itemNames[1]).to.equal("Test Item 2");
                expect(itemPrices[1]).to.equal(50);

                expect(itemNames[2]).to.equal("Test Item 3");
                expect(itemPrices[2]).to.equal(70);
            });
        });
        describe("buy", function () {
            it("Should check if a name is entered or not", async function () {
                const _itemName = "";
                await expect(buying.buy(_itemName)
                ).to.be.revertedWith("Please Enter the Item's name");
            });
            it("Should check if an amount is entered or not", async function () {
                await buying.addItemToList("Test Item 1", 30);
                await expect(buying.buy("Test Item 1", {
                    value: 0,
                })).to.be.revertedWith("Please Enter an Amount");
            });
            it("Should check if 'user' can buy (multiple) items", async function () {
                const _itemName = "Test Item";
                const _itemName2 = "Test Item 2";
                const _itemPriceInUSD = ethers.BigNumber.from("20");
                const _itemPriceInUSD2 = ethers.BigNumber.from("30");
                const msgValue = ethers.utils.parseUnits("0.011", "ether");
                const msgValue2 = ethers.utils.parseUnits("0.016", "ether");

                await buying.connect(deployerSigner).addItemToList(_itemName, _itemPriceInUSD);
                await buying.connect(deployerSigner).addItemToList(_itemName2, _itemPriceInUSD2);
                const tx = await buying.connect(userSigner).buy(_itemName, {
                    value: msgValue
                });
                await tx.wait();
                const tx2 = await buying.connect(userSigner).buy(_itemName2, {
                    value: msgValue2
                });
                await tx2.wait(1);

                const itemExists = buying.getPriceOfItem(_itemName) > 0;
                expect(itemExists).to.be.false;
                const item2Exists = buying.getPriceOfItem(_itemName2) > 0;
                expect(item2Exists).to.be.false;

                const personBalance = await buying.getPropleWhoBought(user);
                const boughtAmount = msgValue.add(msgValue2);
                assert.equal(personBalance.toString(), boughtAmount.toString());
            });
            it("Should check if a valid price is entered", async function () {
                const _itemName = "Test Item";
                const _itemPrice = ethers.BigNumber.from("20");
                const msgValue = ethers.utils.parseUnits("0.001", "ether");

                await buying.connect(deployerSigner).addItemToList(_itemName, _itemPrice);

                await expect(buying.connect(userSigner).buy(_itemName, {
                    value: msgValue
                })).to.be.revertedWith("Please");
            });
        });
        describe("withdraw", function () {
            beforeEach(async function () {
                const _itemName = "Test Item";
                const _itemPrice = ethers.BigNumber.from("100");
                const sentValue = ethers.utils.parseUnits("0.055", "ether");
                await buying.connect(deployerSigner).addItemToList(_itemName, _itemPrice);
                await buying.connect(userSigner).buy(_itemName, {
                    value: sentValue
                });
            });
            it("Should withdraw funds to a single account", async function () {
                const startBuyingBalance = await buying.provider.getBalance(
                    buying.address
                );
                const startDeployerBalance = await buying.provider.getBalance(
                    deployer
                );

                const transactionResponse = await buying.withdraw();
                const transactionReciept = await transactionResponse.wait(1);
                const { gasUsed, effectiveGasPrice } = transactionReciept;
                const gasCost = gasUsed.mul(effectiveGasPrice);

                const finalBuyingBalance = await buying.provider.getBalance(
                    buying.address
                );
                const finalDeployerBalance = await buying.provider.getBalance(
                    deployer
                );

                assert.equal(finalBuyingBalance, 0);
                assert.equal(startBuyingBalance.add(startDeployerBalance).toString(),
                    finalDeployerBalance.add(gasCost).toString());
            });
        });
    });
