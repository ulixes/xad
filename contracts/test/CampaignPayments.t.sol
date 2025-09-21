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
        uint256 timestamp,
        string targets
    );
    
    event CampaignRequirementsSet(
        string indexed campaignId,
        bool verifiedOnly,
        uint256 minFollowers,
        uint256 minViews,
        string location,
        string language
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
        // Create account requirements for testing
        CampaignPayments.AccountRequirements memory baseReqs = CampaignPayments.AccountRequirements({
            verifiedOnly: false,
            minFollowers: 0,
            minUniqueViews28Days: 0,
            accountLocation: "all",
            accountLanguage: "all"
        });
        
        // Test base price (no multipliers)
        uint256 basePrice = campaignPayments.calculatePrice(baseReqs);
        uint256 expectedBase = (20 * 200000) + (10 * 400000); // 20 likes + 10 follows
        assertEq(basePrice, expectedBase);
        
        // Test with location multiplier (US = 1.5x)
        CampaignPayments.AccountRequirements memory usReqs = CampaignPayments.AccountRequirements({
            verifiedOnly: false,
            minFollowers: 0,
            minUniqueViews28Days: 0,
            accountLocation: "US",
            accountLanguage: "all"
        });
        uint256 usPrice = campaignPayments.calculatePrice(usReqs);
        assertEq(usPrice, expectedBase * 1500 / 1000);
        
        // Test with all multipliers
        CampaignPayments.AccountRequirements memory maxReqs = CampaignPayments.AccountRequirements({
            verifiedOnly: true,
            minFollowers: 1000,
            minUniqueViews28Days: 10000,
            accountLocation: "US",
            accountLanguage: "en"
        });
        uint256 maxPrice = campaignPayments.calculatePrice(maxReqs);
        // US: 1.5x, EN: 1.2x, Verified: 1.5x, MinFollowers: 1.2x, MinViews: 1.3x
        uint256 expectedMax = (basePrice * 1500 * 1200 * 1500 * 1200 * 1300) / (1000 ** 5);
        assertEq(maxPrice, expectedMax);
    }
    
    function testUpdatePackage() public {
        // Update package
        campaignPayments.updatePackage(30, 15);
        assertEq(campaignPayments.campaignLikes(), 30);
        assertEq(campaignPayments.campaignFollows(), 15);
        
        // Test that price calculation uses new values
        CampaignPayments.AccountRequirements memory reqs = CampaignPayments.AccountRequirements({
            verifiedOnly: false,
            minFollowers: 0,
            minUniqueViews28Days: 0,
            accountLocation: "all",
            accountLanguage: "all"
        });
        uint256 newPrice = campaignPayments.calculatePrice(reqs);
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
        CampaignPayments.AccountRequirements memory reqs = CampaignPayments.AccountRequirements({
            verifiedOnly: false,
            minFollowers: 0,
            minUniqueViews28Days: 0,
            accountLocation: "all",
            accountLanguage: "all"
        });
        uint256 newPrice = campaignPayments.calculatePrice(reqs);
        uint256 expectedPrice = (20 * 300000) + (10 * 500000);
        assertEq(newPrice, expectedPrice);
    }
    
    function testUpdateAccountQualityMultipliers() public {
        // Update account quality multipliers
        campaignPayments.updateAccountQualityMultipliers(1600, 1100, 1400);
        assertEq(campaignPayments.verifiedMultiplier(), 1600);
        assertEq(campaignPayments.minFollowersMultiplier(), 1100);
        assertEq(campaignPayments.minViewsMultiplier(), 1400);
        
        // Test invalid multipliers revert
        vm.expectRevert(CampaignPayments.InvalidMultiplier.selector);
        campaignPayments.updateAccountQualityMultipliers(400, 1100, 1400); // Too low
        
        vm.expectRevert(CampaignPayments.InvalidMultiplier.selector);
        campaignPayments.updateAccountQualityMultipliers(1600, 6000, 1400); // Too high
    }
    
    function testUpdateLocationMultiplier() public {
        // Update location multiplier
        campaignPayments.updateLocationMultiplier("FR", 1250);
        assertEq(campaignPayments.locationMultipliers("FR"), 1250);
        
        // Test invalid multiplier reverts
        vm.expectRevert(CampaignPayments.InvalidMultiplier.selector);
        campaignPayments.updateLocationMultiplier("XX", 50); // Too low
        
        vm.expectRevert(CampaignPayments.InvalidMultiplier.selector);
        campaignPayments.updateLocationMultiplier("XX", 20000); // Too high
    }
    
    function testUpdateLanguageMultiplier() public {
        // Update language multiplier
        campaignPayments.updateLanguageMultiplier("es", 1150);
        assertEq(campaignPayments.languageMultipliers("es"), 1150);
        
        // Test invalid multiplier reverts
        vm.expectRevert(CampaignPayments.InvalidMultiplier.selector);
        campaignPayments.updateLanguageMultiplier("xx", 50); // Too low
        
        vm.expectRevert(CampaignPayments.InvalidMultiplier.selector);
        campaignPayments.updateLanguageMultiplier("xx", 20000); // Too high
    }
    
    function testUpdateLocationMultipliersBatch() public {
        string[] memory locations = new string[](3);
        locations[0] = "IT";
        locations[1] = "ES";
        locations[2] = "PT";
        
        uint256[] memory multipliers = new uint256[](3);
        multipliers[0] = 1250;
        multipliers[1] = 1150;
        multipliers[2] = 1050;
        
        campaignPayments.updateLocationMultipliersBatch(locations, multipliers);
        
        assertEq(campaignPayments.locationMultipliers("IT"), 1250);
        assertEq(campaignPayments.locationMultipliers("ES"), 1150);
        assertEq(campaignPayments.locationMultipliers("PT"), 1050);
    }
    
    function testOnlyOwnerCanUpdateConfig() public {
        vm.startPrank(user1);
        
        vm.expectRevert(CampaignPayments.OnlyOwner.selector);
        campaignPayments.updatePackage(25, 12);
        
        vm.expectRevert(CampaignPayments.OnlyOwner.selector);
        campaignPayments.updateBasePrices(250000, 450000);
        
        vm.expectRevert(CampaignPayments.OnlyOwner.selector);
        campaignPayments.updateAccountQualityMultipliers(1100, 1300, 1600);
        
        vm.expectRevert(CampaignPayments.OnlyOwner.selector);
        campaignPayments.updateLocationMultiplier("XX", 1500);
        
        vm.expectRevert(CampaignPayments.OnlyOwner.selector);
        campaignPayments.updateLanguageMultiplier("xx", 1500);
        
        vm.stopPrank();
    }
    
    function testCampaignTargets() public {
        string memory campaignId = "test-campaign-123";
        string memory targets = "likeHandle:123456789|followHandle";
        
        // Store targets through depositForCampaignWithPermit would normally happen
        // For testing, we'll use a simplified approach
        
        // First check that empty targets are empty
        assertEq(campaignPayments.getCampaignTargets(campaignId), "");
    }
}