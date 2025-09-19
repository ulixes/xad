// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/CampaignPayments.sol";

contract MockUSDC is IERC20 {
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;
    
    function mint(address to, uint256 amount) external {
        balances[to] += amount;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balances[from] >= amount, "Insufficient balance");
        require(allowances[from][msg.sender] >= amount, "Insufficient allowance");
        balances[from] -= amount;
        balances[to] += amount;
        allowances[from][msg.sender] -= amount;
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowances[msg.sender][spender] = amount;
        return true;
    }
    
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}

contract CampaignPaymentsTest is Test {
    CampaignPayments public campaignPayments;
    MockUSDC public usdc;
    
    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public withdrawalAddress = address(0x3);
    
    uint256 constant DEPOSIT_AMOUNT = 1000 * 10**6; // 1000 USDC (6 decimals)
    
    event CampaignPaymentReceived(
        string indexed campaignId,
        address indexed sender,
        uint256 amount,
        uint256 timestamp
    );
    
    function setUp() public {
        usdc = new MockUSDC();
        campaignPayments = new CampaignPayments(address(usdc));
        
        // Mint USDC to test users
        usdc.mint(user1, 10000 * 10**6); // 10000 USDC
        usdc.mint(user2, 10000 * 10**6); // 10000 USDC
        
        // Users approve campaign payments contract
        vm.prank(user1);
        usdc.approve(address(campaignPayments), type(uint256).max);
        
        vm.prank(user2);
        usdc.approve(address(campaignPayments), type(uint256).max);
    }
    
    function testGetUSDCBalance() public {
        assertEq(campaignPayments.getUSDCBalance(), 0);
    }
    
    function testOwner() public {
        assertEq(campaignPayments.owner(), owner);
    }
    
    function testUSDCToken() public {
        assertEq(campaignPayments.usdcToken(), address(usdc));
    }
    
    function testOnlyOwnerCanWithdraw() public {
        // Try to withdraw as non-owner
        vm.expectRevert(CampaignPayments.OnlyOwner.selector);
        vm.prank(user1);
        campaignPayments.withdrawUSDC(withdrawalAddress, DEPOSIT_AMOUNT);
        
        // Try withdrawAll as non-owner
        vm.expectRevert(CampaignPayments.OnlyOwner.selector);
        vm.prank(user2);
        campaignPayments.withdrawAllUSDC(withdrawalAddress);
    }
    
    function testCalculatePrice() public view {
        // Test base price (no multipliers)
        uint256 basePrice = campaignPayments.calculatePrice("all", false, false, false);
        uint256 expectedBase = (20 * 200000) + (10 * 400000); // 20 likes + 10 follows
        assertEq(basePrice, expectedBase);
        
        // Test with country multiplier (US = 1.5x)
        uint256 usPrice = campaignPayments.calculatePrice("US", false, false, false);
        assertEq(usPrice, expectedBase * 1500 / 1000);
        
        // Test with all multipliers
        uint256 maxPrice = campaignPayments.calculatePrice("US", true, true, true);
        // US: 1.5x, Gender: 1.2x, Age: 1.4x, Verified: 1.5x = 3.78x total
        uint256 expectedMax = (basePrice * 1500 * 1200 * 1400 * 1500) / (1000 ** 4);
        assertEq(maxPrice, expectedMax);
    }
    
    function testUpdatePackage() public {
        // Update package
        campaignPayments.updatePackage(30, 15);
        assertEq(campaignPayments.campaignLikes(), 30);
        assertEq(campaignPayments.campaignFollows(), 15);
        
        // Test that price calculation uses new values
        uint256 newPrice = campaignPayments.calculatePrice("all", false, false, false);
        uint256 expectedPrice = (30 * 200000) + (15 * 400000); // 30 likes + 15 follows
        assertEq(newPrice, expectedPrice);
        
        // Test zero values revert
        vm.expectRevert(CampaignPayments.InvalidAmount.selector);
        campaignPayments.updatePackage(0, 10);
    }
    
    function testUpdateBasePrices() public {
        // Update base prices
        campaignPayments.updateBasePrices(300000, 500000); // $0.30 and $0.50
        assertEq(campaignPayments.baseLikePrice(), 300000);
        assertEq(campaignPayments.baseFollowPrice(), 500000);
        
        // Test that price calculation uses new values
        uint256 newPrice = campaignPayments.calculatePrice("all", false, false, false);
        uint256 expectedPrice = (20 * 300000) + (10 * 500000);
        assertEq(newPrice, expectedPrice);
    }
    
    function testUpdateTargetingMultipliers() public {
        // Update targeting multipliers
        campaignPayments.updateTargetingMultipliers(1100, 1300, 1600);
        assertEq(campaignPayments.genderMultiplier(), 1100);
        assertEq(campaignPayments.ageMultiplier(), 1300);
        assertEq(campaignPayments.verifiedMultiplier(), 1600);
        
        // Test invalid multipliers
        vm.expectRevert(CampaignPayments.InvalidMultiplier.selector);
        campaignPayments.updateTargetingMultipliers(400, 1300, 1600); // Too low
        
        vm.expectRevert(CampaignPayments.InvalidMultiplier.selector);
        campaignPayments.updateTargetingMultipliers(1100, 6000, 1600); // Too high
    }
    
    function testUpdateCountryMultiplier() public {
        // Update single country
        campaignPayments.updateCountryMultiplier("BR", 1500);
        assertEq(campaignPayments.countryMultipliers("BR"), 1500);
        
        // Test batch update
        string[] memory countries = new string[](3);
        countries[0] = "KR";
        countries[1] = "CN";
        countries[2] = "TH";
        
        uint256[] memory multipliers = new uint256[](3);
        multipliers[0] = 1250;
        multipliers[1] = 1100;
        multipliers[2] = 950;
        
        campaignPayments.updateCountryMultipliersBatch(countries, multipliers);
        assertEq(campaignPayments.countryMultipliers("KR"), 1250);
        assertEq(campaignPayments.countryMultipliers("CN"), 1100);
        assertEq(campaignPayments.countryMultipliers("TH"), 950);
        
        // Test invalid multiplier
        vm.expectRevert(CampaignPayments.InvalidMultiplier.selector);
        campaignPayments.updateCountryMultiplier("XX", 50); // Too low
    }
    
    function testOnlyOwnerModifiers() public {
        // Try to update as non-owner
        vm.prank(user1);
        vm.expectRevert(CampaignPayments.OnlyOwner.selector);
        campaignPayments.updatePackage(25, 12);
        
        vm.prank(user1);
        vm.expectRevert(CampaignPayments.OnlyOwner.selector);
        campaignPayments.updateBasePrices(250000, 450000);
        
        vm.prank(user1);
        vm.expectRevert(CampaignPayments.OnlyOwner.selector);
        campaignPayments.updateTargetingMultipliers(1100, 1300, 1400);
        
        vm.prank(user1);
        vm.expectRevert(CampaignPayments.OnlyOwner.selector);
        campaignPayments.updateCountryMultiplier("US", 2000);
    }
    
    function testCountryMultipliers() public {
        assertEq(campaignPayments.countryMultipliers("US"), 1500);
        assertEq(campaignPayments.countryMultipliers("UK"), 1400);
        assertEq(campaignPayments.countryMultipliers("IN"), 900);
        assertEq(campaignPayments.countryMultipliers("all"), 1000);
    }
}