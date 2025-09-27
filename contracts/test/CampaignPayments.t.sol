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
        
        // Create actions for testing - 2 posts with 20 likes each, 10 follows
        string[] memory likeTargets = new string[](2);
        likeTargets[0] = "post1";
        likeTargets[1] = "post2";
        
        CampaignPayments.CampaignActions memory baseActions = CampaignPayments.CampaignActions({
            followTarget: "@account",
            followCount: 10,
            likeTargets: likeTargets,
            likeCountPerPost: 20,
            commentTarget: "",
            commentContent: "",
            commentCount: 0
        });
        
        // Test base price (no multipliers)
        uint256 basePrice = campaignPayments.calculatePrice(baseReqs, baseActions);
        uint256 expectedBase = (2 * 20 * 200000) + (10 * 400000); // 2 posts * 20 likes each + 10 follows
        assertEq(basePrice, expectedBase);
        
        // Test with location multiplier (US = 1.5x)
        CampaignPayments.AccountRequirements memory usReqs = CampaignPayments.AccountRequirements({
            verifiedOnly: false,
            minFollowers: 0,
            minUniqueViews28Days: 0,
            accountLocation: "US",
            accountLanguage: "all"
        });
        uint256 usPrice = campaignPayments.calculatePrice(usReqs, baseActions);
        assertEq(usPrice, expectedBase * 1500 / 1000);
        
        // Test with all multipliers (100k followers, 1M views)
        CampaignPayments.AccountRequirements memory maxReqs = CampaignPayments.AccountRequirements({
            verifiedOnly: true,
            minFollowers: 100000,
            minUniqueViews28Days: 1000000,
            accountLocation: "US",
            accountLanguage: "en"
        });
        uint256 maxPrice = campaignPayments.calculatePrice(maxReqs, baseActions);
        // US: 1.5x, EN: 1.2x, Verified: 1.5x, 100k followers: 1.5x, 1M views: 1.6x
        uint256 expectedMax = (basePrice * 1500 * 1200 * 1500 * 1500 * 1600) / (1000 ** 5);
        assertEq(maxPrice, expectedMax);
    }
    
    // Package control was removed - actions are now flexible per campaign
    
    function testUpdateBasePrices() public {
        // Update base prices
        campaignPayments.updateBasePrices(300000, 500000, 150000); // $0.30, $0.50, $0.15
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
        
        string[] memory likeTargets = new string[](2);
        likeTargets[0] = "post1";
        likeTargets[1] = "post2";
        
        CampaignPayments.CampaignActions memory actions = CampaignPayments.CampaignActions({
            followTarget: "@account",
            followCount: 10,
            likeTargets: likeTargets,
            likeCountPerPost: 20,
            commentTarget: "",
            commentContent: "",
            commentCount: 0
        });
        
        uint256 newPrice = campaignPayments.calculatePrice(reqs, actions);
        uint256 expectedPrice = (2 * 20 * 300000) + (10 * 500000); // 2 posts * 20 likes + 10 follows with new prices
        assertEq(newPrice, expectedPrice);
    }
    
    function testUpdateVerifiedMultiplier() public {
        // Update verified multiplier
        campaignPayments.updateVerifiedMultiplier(1600);
        assertEq(campaignPayments.verifiedMultiplier(), 1600);
        
        // Test invalid multipliers revert
        vm.expectRevert(CampaignPayments.InvalidMultiplier.selector);
        campaignPayments.updateVerifiedMultiplier(400); // Too low
        
        vm.expectRevert(CampaignPayments.InvalidMultiplier.selector);
        campaignPayments.updateVerifiedMultiplier(6000); // Too high
    }
    
    function testUpdateFollowersMultipliers() public {
        // Update followers multipliers
        campaignPayments.updateFollowersMultipliers(1100, 1250, 1400, 1600, 1850, 2100);
        assertEq(campaignPayments.followersMultiplier1k(), 1100);
        assertEq(campaignPayments.followersMultiplier10k(), 1250);
        assertEq(campaignPayments.followersMultiplier50k(), 1400);
        assertEq(campaignPayments.followersMultiplier100k(), 1600);
        assertEq(campaignPayments.followersMultiplier500k(), 1850);
        assertEq(campaignPayments.followersMultiplier1M(), 2100);
        
        // Test invalid order reverts
        vm.expectRevert(CampaignPayments.InvalidMultiplier.selector);
        campaignPayments.updateFollowersMultipliers(1100, 1050, 1400, 1600, 1850, 2100); // 10k < 1k
    }
    
    function testUpdateViewsMultipliers() public {
        // Update views multipliers
        campaignPayments.updateViewsMultipliers(1100, 1200, 1350, 1500, 1650, 1900, 2200);
        assertEq(campaignPayments.viewsMultiplier10k(), 1100);
        assertEq(campaignPayments.viewsMultiplier50k(), 1200);
        assertEq(campaignPayments.viewsMultiplier100k(), 1350);
        assertEq(campaignPayments.viewsMultiplier500k(), 1500);
        assertEq(campaignPayments.viewsMultiplier1M(), 1650);
        assertEq(campaignPayments.viewsMultiplier5M(), 1900);
        assertEq(campaignPayments.viewsMultiplier10M(), 2200);
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
        campaignPayments.updateBasePrices(250000, 450000, 125000);
        
        vm.expectRevert(CampaignPayments.OnlyOwner.selector);
        campaignPayments.updateVerifiedMultiplier(1600);
        
        vm.expectRevert(CampaignPayments.OnlyOwner.selector);
        campaignPayments.updateLocationMultiplier("XX", 1500);
        
        vm.expectRevert(CampaignPayments.OnlyOwner.selector);
        campaignPayments.updateLanguageMultiplier("xx", 1500);
        
        vm.stopPrank();
    }
    
    // Campaign targets are now passed as CampaignActions struct, not stored
}