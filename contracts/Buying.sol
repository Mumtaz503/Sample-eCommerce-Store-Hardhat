// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

contract Buying {
    using PriceConverter for uint256;
    using SafeMath for uint256;

    address[] private s_sendersAddress;
    address private immutable i_owner1;
    AggregatorV3Interface internal s_priceFeed;
    string[] private s_itemNames;
    mapping(string => uint256) private s_itemsToPrice;
    mapping(address => uint256) private s_peopleWhoBought;

    constructor(address priceFeed) {
        s_priceFeed = AggregatorV3Interface(priceFeed);
        i_owner1 = msg.sender;
    }

    modifier OwnershipAccess() {
        require(
            msg.sender == i_owner1,
            "Only the owner of this contract can perform this action"
        );
        _;
    }

    function addItemToList(
        string memory _itemName,
        uint256 _itemPrice
    ) public OwnershipAccess {
        require(bytes(_itemName).length > 0, "Please enter the item's name");
        require(_itemPrice > 0, "Please enter a valid amount");

        s_itemsToPrice[_itemName] = _itemPrice.mul(1e18);
        s_itemNames.push(_itemName);
    }

    function removeAnItem(string memory _itemName) public {
        require(bytes(_itemName).length > 0, "Please enter a valid item name");
        require(s_itemsToPrice[_itemName] > 0, "Item Does not Exist");

        uint256 itemIndex = 0;
        bool found = false;

        for (uint256 i = 0; i < s_itemNames.length; i++) {
            if (
                keccak256(bytes(s_itemNames[i])) == keccak256(bytes(_itemName))
            ) {
                itemIndex = i;
                found = true;
                break;
            }
        }

        require(found, "Item Does Not found");

        s_itemNames[itemIndex] = s_itemNames[s_itemNames.length - 1];
        s_itemNames.pop();

        delete s_itemsToPrice[_itemName];
    }

    function getItems()
        public
        view
        returns (string[] memory, uint256[] memory)
    {
        uint256 itemCount = s_itemNames.length;
        string[] memory itemNames = new string[](itemCount);
        uint256[] memory itemPrices = new uint256[](itemCount);

        for (uint256 i = 0; i < itemCount; i++) {
            itemNames[i] = s_itemNames[i];
            itemPrices[i] = s_itemsToPrice[itemNames[i]].div(1e18);
        }

        return (itemNames, itemPrices);
    }

    function buy(string memory _itemName) public payable {
        require(bytes(_itemName).length > 0, "Please Enter the Item's name");
        require(msg.value > 0, "Please Enter an Amount");

        uint256 itemPrice = s_itemsToPrice[_itemName];
        require(itemPrice > 0, "Item Does not exist");

        uint256 messageValue = PriceConverter.getConversionRate(
            msg.value,
            s_priceFeed
        );

        require(messageValue >= itemPrice, "Please");

        s_peopleWhoBought[msg.sender] += msg.value;
        removeAnItem(_itemName);
    }

    function withdraw() public OwnershipAccess {
        delete s_sendersAddress;

        (bool success, ) = i_owner1.call{value: address(this).balance}("");
        require(success);
    }

    //These functions are for testing in hardhat.

    function getBuyerAddressList() public view returns (address[] memory) {
        return s_sendersAddress;
    }

    function getListedItems() public view returns (string[] memory) {
        return s_itemNames;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }

    function getOwnerAddress() public view returns (address) {
        return i_owner1;
    }

    function getPriceOfItem(
        string memory _itemName
    ) public view returns (uint256) {
        return s_itemsToPrice[_itemName];
    }

    function getPropleWhoBought(
        address _buyerAddress
    ) public view returns (uint256) {
        return s_peopleWhoBought[_buyerAddress];
    }
}
