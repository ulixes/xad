// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IERC20Permit {
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}

contract CampaignPayments {
    address public immutable owner;
    address public immutable usdcToken;
    
    // Base prices in USDC (6 decimals) - configurable by owner
    uint256 public baseLikePrice = 300000;    // $0.30 (increased from $0.20)
    uint256 public baseFollowPrice = 600000;  // $0.60 (increased from $0.40)
    uint256 public constant BASE_PRECISION = 1000;       // For multiplier calculations
    
    // Account quality multipliers (1000 = 1.0x) - configurable by owner
    uint256 public verifiedMultiplier = 1500;   // 1.5x when targeting verified only
    
    // Tiered multipliers for followers (1000 = 1.0x)
    uint256 public followersMultiplier1k = 1100;      // 1.1x for 1k+ followers
    uint256 public followersMultiplier10k = 1200;     // 1.2x for 10k+ followers
    uint256 public followersMultiplier50k = 1350;     // 1.35x for 50k+ followers
    uint256 public followersMultiplier100k = 1500;    // 1.5x for 100k+ followers
    uint256 public followersMultiplier500k = 1750;    // 1.75x for 500k+ followers
    uint256 public followersMultiplier1M = 2000;      // 2.0x for 1M+ followers
    
    // Tiered multipliers for views (1000 = 1.0x)
    uint256 public viewsMultiplier10k = 1100;         // 1.1x for 10k+ views
    uint256 public viewsMultiplier50k = 1200;         // 1.2x for 50k+ views
    uint256 public viewsMultiplier100k = 1300;        // 1.3x for 100k+ views
    uint256 public viewsMultiplier500k = 1450;        // 1.45x for 500k+ views
    uint256 public viewsMultiplier1M = 1600;          // 1.6x for 1M+ views
    uint256 public viewsMultiplier5M = 1850;          // 1.85x for 5M+ views
    uint256 public viewsMultiplier10M = 2100;         // 2.1x for 10M+ views
    
    // Location/Language multipliers (1000 = 1.0x)
    mapping(string => uint256) public locationMultipliers;  // Account location (based on 2025 CPM data)
    mapping(string => uint256) public languageMultipliers;  // Account language (based on global ad demand)
    
    // Minimum requirements to ensure campaigns meet $40+ threshold
    uint256 public constant MIN_FOLLOW_COUNT = 40;      // Min 40 follows if follow target set
    uint256 public constant MIN_LIKES_PER_POST = 40;    // Min 40 likes per post
    uint256 public constant MIN_TOTAL_PAYMENT = 40000000; // Min $40 total (40 USDC)
    
    // Campaign data structure
    struct CampaignData {
        string followTarget;      // Single account URL for follows
        uint256 followCount;      // Number of follows requested
        string[] likeTargets;     // Array of post URLs for likes
        uint256 likeCountPerPost;  // Same number of likes for each post
        uint256 totalAmount;      // Total USDC paid
        address depositor;        // Who paid for the campaign
    }
    
    // Store campaign data
    mapping(string => CampaignData) public campaigns;
    
    // Events
    event CampaignPaymentReceived(
        string indexed campaignId,
        address indexed sender,
        uint256 amount,
        uint256 timestamp,
        uint256 totalFollows,
        uint256 totalLikes
    );
    
    event CampaignRequirementsSet(
        string indexed campaignId,
        bool verifiedOnly,
        uint256 minFollowers,
        uint256 minViews,
        string location,
        string language
    );
    
    event BasePricesUpdated(
        uint256 likePrice,
        uint256 followPrice
    );
    
    event VerifiedMultiplierUpdated(uint256 multiplier);
    event FollowersMultipliersUpdated(
        uint256 mult1k,
        uint256 mult10k,
        uint256 mult50k,
        uint256 mult100k,
        uint256 mult500k,
        uint256 mult1M
    );
    event ViewsMultipliersUpdated(
        uint256 mult10k,
        uint256 mult50k,
        uint256 mult100k,
        uint256 mult500k,
        uint256 mult1M,
        uint256 mult5M,
        uint256 mult10M
    );
    
    event LocationMultiplierUpdated(
        string location,
        uint256 multiplier
    );
    
    event LanguageMultiplierUpdated(
        string language,
        uint256 multiplier
    );
    
    // Errors
    error OnlyOwner();
    error TransferFailed();
    error InvalidAmount();
    error InvalidCampaignId();
    error PermitFailed();
    error InsufficientPayment();
    error InvalidMultiplier();
    error InvalidTargets();
    error ArrayLengthMismatch();
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    constructor(address _usdcToken) {
        owner = msg.sender;
        usdcToken = _usdcToken;
        
        // Initialize location multipliers based on 2025 CPM data
        locationMultipliers["all"] = 1000;      // 1.0x baseline
        locationMultipliers["US"] = 1500;       // 1.5x - Highest CPM (~$20)
        locationMultipliers["UK"] = 1000;       // 1.0x - ~0.53x US CPM (~$11)
        locationMultipliers["CA"] = 1100;       // 1.1x - ~0.68x US CPM (~$14)
        locationMultipliers["AU"] = 900;        // 0.9x - ~0.54x US CPM (~$11)
        locationMultipliers["DE"] = 800;        // 0.8x - ~0.49x US CPM (~$10)
        locationMultipliers["FR"] = 600;        // 0.6x - ~0.39x US CPM (~$8)
        locationMultipliers["ES"] = 700;        // 0.7x - ~0.46x US CPM (~$9)
        locationMultipliers["IT"] = 600;        // 0.6x - ~0.39x US CPM (~$8)
        locationMultipliers["JP"] = 500;        // 0.5x - ~0.35x US CPM (~$7)
        locationMultipliers["KR"] = 600;        // 0.6x - ~0.40x US CPM (~$8)
        locationMultipliers["BR"] = 400;        // 0.4x - ~0.25x US CPM (~$5)
        locationMultipliers["MX"] = 400;        // 0.4x - ~0.27x US CPM (~$5.5)
        locationMultipliers["IN"] = 200;        // 0.2x - ~0.13x US CPM (~$2.7)
        locationMultipliers["PH"] = 700;        // 0.7x - ~0.52x US CPM (~$10.7)
        locationMultipliers["ID"] = 200;        // 0.2x - ~0.10-0.15x US CPM (~$2-3)
        
        // Additional emerging markets
        locationMultipliers["VN"] = 200;        // 0.2x - Vietnam low CPM ~$1-3
        locationMultipliers["CN"] = 400;        // 0.4x - China CPM ~$4-7
        locationMultipliers["TH"] = 300;        // 0.3x - Thailand CPM ~$3-5
        locationMultipliers["TW"] = 600;        // 0.6x - Taiwan CPM ~$7-9
        locationMultipliers["MM"] = 200;        // 0.2x - Myanmar low CPM ~$2-3
        locationMultipliers["LA"] = 200;        // 0.2x - Laos very low CPM ~$1-2
        locationMultipliers["MN"] = 250;        // 0.25x - Mongolia CPM ~$2-4
        locationMultipliers["KZ"] = 350;        // 0.35x - Kazakhstan CPM ~$4-6
        
        // Initialize language multipliers - FIXED 25% premium for all specific languages
        languageMultipliers["all"] = 1000;      // 1.0x baseline (no language targeting)
        languageMultipliers["en"] = 1250;       // 1.25x - Fixed 25% premium
        languageMultipliers["es"] = 1250;       // 1.25x - Fixed 25% premium
        languageMultipliers["fr"] = 1250;       // 1.25x - Fixed 25% premium
        languageMultipliers["de"] = 1250;       // 1.25x - Fixed 25% premium
        languageMultipliers["it"] = 1250;       // 1.25x - Fixed 25% premium
        languageMultipliers["pt"] = 1250;       // 1.25x - Fixed 25% premium
        languageMultipliers["ru"] = 1250;       // 1.25x - Fixed 25% premium
        languageMultipliers["ja"] = 1250;       // 1.25x - Fixed 25% premium
        languageMultipliers["ko"] = 1250;       // 1.25x - Fixed 25% premium
        languageMultipliers["zh"] = 1250;       // 1.25x - Fixed 25% premium
        languageMultipliers["ar"] = 1250;       // 1.25x - Fixed 25% premium
        languageMultipliers["hi"] = 1250;       // 1.25x - Fixed 25% premium
        languageMultipliers["id"] = 1250;       // 1.25x - Fixed 25% premium
        languageMultipliers["th"] = 1250;       // 1.25x - Fixed 25% premium
        languageMultipliers["vi"] = 1250;       // 1.25x - Fixed 25% premium
    }
    
    // Owner functions to update configuration
    function updateBasePrices(uint256 _likePrice, uint256 _followPrice) external onlyOwner {
        if (_likePrice == 0 || _followPrice == 0) revert InvalidAmount();
        baseLikePrice = _likePrice;
        baseFollowPrice = _followPrice;
        emit BasePricesUpdated(_likePrice, _followPrice);
    }
    
    function updateVerifiedMultiplier(uint256 _multiplier) external onlyOwner {
        if (_multiplier < 500 || _multiplier > 5000) revert InvalidMultiplier();
        verifiedMultiplier = _multiplier;
        emit VerifiedMultiplierUpdated(_multiplier);
    }
    
    function updateFollowersMultipliers(
        uint256 _mult1k,
        uint256 _mult10k,
        uint256 _mult50k,
        uint256 _mult100k,
        uint256 _mult500k,
        uint256 _mult1M
    ) external onlyOwner {
        // Validate multipliers are reasonable and in ascending order
        if (_mult1k < 1000 || _mult1k > 5000) revert InvalidMultiplier();
        if (_mult10k < _mult1k || _mult10k > 5000) revert InvalidMultiplier();
        if (_mult50k < _mult10k || _mult50k > 5000) revert InvalidMultiplier();
        if (_mult100k < _mult50k || _mult100k > 5000) revert InvalidMultiplier();
        if (_mult500k < _mult100k || _mult500k > 5000) revert InvalidMultiplier();
        if (_mult1M < _mult500k || _mult1M > 5000) revert InvalidMultiplier();
        
        followersMultiplier1k = _mult1k;
        followersMultiplier10k = _mult10k;
        followersMultiplier50k = _mult50k;
        followersMultiplier100k = _mult100k;
        followersMultiplier500k = _mult500k;
        followersMultiplier1M = _mult1M;
        
        emit FollowersMultipliersUpdated(_mult1k, _mult10k, _mult50k, _mult100k, _mult500k, _mult1M);
    }
    
    function updateViewsMultipliers(
        uint256 _mult10k,
        uint256 _mult50k,
        uint256 _mult100k,
        uint256 _mult500k,
        uint256 _mult1M,
        uint256 _mult5M,
        uint256 _mult10M
    ) external onlyOwner {
        // Validate multipliers are reasonable and in ascending order
        if (_mult10k < 1000 || _mult10k > 5000) revert InvalidMultiplier();
        if (_mult50k < _mult10k || _mult50k > 5000) revert InvalidMultiplier();
        if (_mult100k < _mult50k || _mult100k > 5000) revert InvalidMultiplier();
        if (_mult500k < _mult100k || _mult500k > 5000) revert InvalidMultiplier();
        if (_mult1M < _mult500k || _mult1M > 5000) revert InvalidMultiplier();
        if (_mult5M < _mult1M || _mult5M > 5000) revert InvalidMultiplier();
        if (_mult10M < _mult5M || _mult10M > 5000) revert InvalidMultiplier();
        
        viewsMultiplier10k = _mult10k;
        viewsMultiplier50k = _mult50k;
        viewsMultiplier100k = _mult100k;
        viewsMultiplier500k = _mult500k;
        viewsMultiplier1M = _mult1M;
        viewsMultiplier5M = _mult5M;
        viewsMultiplier10M = _mult10M;
        
        emit ViewsMultipliersUpdated(_mult10k, _mult50k, _mult100k, _mult500k, _mult1M, _mult5M, _mult10M);
    }
    
    function updateLocationMultiplier(string calldata location, uint256 multiplier) external onlyOwner {
        // Multiplier should be reasonable (e.g., between 0.1x and 10x)
        if (multiplier < 100 || multiplier > 10000) revert InvalidMultiplier();
        locationMultipliers[location] = multiplier;
        emit LocationMultiplierUpdated(location, multiplier);
    }
    
    function updateLanguageMultiplier(string calldata language, uint256 multiplier) external onlyOwner {
        // Multiplier should be reasonable (e.g., between 0.1x and 10x)
        if (multiplier < 100 || multiplier > 10000) revert InvalidMultiplier();
        languageMultipliers[language] = multiplier;
        emit LanguageMultiplierUpdated(language, multiplier);
    }
    
    function updateLocationMultipliersBatch(
        string[] calldata locations,
        uint256[] calldata multipliers
    ) external onlyOwner {
        require(locations.length == multipliers.length, "Array length mismatch");
        
        for (uint256 i = 0; i < locations.length; i++) {
            if (multipliers[i] < 100 || multipliers[i] > 10000) revert InvalidMultiplier();
            locationMultipliers[locations[i]] = multipliers[i];
            emit LocationMultiplierUpdated(locations[i], multipliers[i]);
        }
    }
    
    function updateLanguageMultipliersBatch(
        string[] calldata languages,
        uint256[] calldata multipliers
    ) external onlyOwner {
        require(languages.length == multipliers.length, "Array length mismatch");
        
        for (uint256 i = 0; i < languages.length; i++) {
            if (multipliers[i] < 100 || multipliers[i] > 10000) revert InvalidMultiplier();
            languageMultipliers[languages[i]] = multipliers[i];
            emit LanguageMultiplierUpdated(languages[i], multipliers[i]);
        }
    }
    
    // Struct for account requirements
    struct AccountRequirements {
        bool verifiedOnly;
        uint256 minFollowers;
        uint256 minUniqueViews28Days;
        string accountLocation;
        string accountLanguage;
    }
    
    // Struct for campaign actions (privacy-protected)
    struct CampaignActions {
        string followTarget;       // Encoded account identifier (obfuscated for privacy)
        uint256 followCount;       // Number of follows requested
        string[] likeTargets;      // Array of encoded post identifiers (obfuscated for privacy)
        uint256 likeCountPerPost;  // Same number of likes for each post
    }
    
    function calculatePrice(
        AccountRequirements memory requirements,
        CampaignActions memory actions
    ) public view returns (uint256) {
        // Get location multiplier (default to "all" if not found)
        uint256 locationMult = locationMultipliers[requirements.accountLocation];
        if (locationMult == 0) {
            locationMult = locationMultipliers["all"];
        }
        
        // Get language multiplier (default to "all" if not found)
        uint256 languageMult = languageMultipliers[requirements.accountLanguage];
        if (languageMult == 0) {
            languageMult = languageMultipliers["all"];
        }
        
        // Apply account quality multipliers
        uint256 verifiedMult = requirements.verifiedOnly ? verifiedMultiplier : 1000;
        
        // Calculate followers multiplier based on tier
        uint256 followersMult = 1000; // Default 1.0x
        if (requirements.minFollowers >= 1000000) {
            followersMult = followersMultiplier1M;
        } else if (requirements.minFollowers >= 500000) {
            followersMult = followersMultiplier500k;
        } else if (requirements.minFollowers >= 100000) {
            followersMult = followersMultiplier100k;
        } else if (requirements.minFollowers >= 50000) {
            followersMult = followersMultiplier50k;
        } else if (requirements.minFollowers >= 10000) {
            followersMult = followersMultiplier10k;
        } else if (requirements.minFollowers >= 1000) {
            followersMult = followersMultiplier1k;
        }
        
        // Calculate views multiplier based on tier
        uint256 viewsMult = 1000; // Default 1.0x
        if (requirements.minUniqueViews28Days >= 10000000) {
            viewsMult = viewsMultiplier10M;
        } else if (requirements.minUniqueViews28Days >= 5000000) {
            viewsMult = viewsMultiplier5M;
        } else if (requirements.minUniqueViews28Days >= 1000000) {
            viewsMult = viewsMultiplier1M;
        } else if (requirements.minUniqueViews28Days >= 500000) {
            viewsMult = viewsMultiplier500k;
        } else if (requirements.minUniqueViews28Days >= 100000) {
            viewsMult = viewsMultiplier100k;
        } else if (requirements.minUniqueViews28Days >= 50000) {
            viewsMult = viewsMultiplier50k;
        } else if (requirements.minUniqueViews28Days >= 10000) {
            viewsMult = viewsMultiplier10k;
        }
        
        // Calculate combined multiplier
        uint256 combinedMultiplier = locationMult * languageMult * verifiedMult * followersMult * viewsMult;
        
        // Calculate prices with multipliers applied (5 multipliers now)
        uint256 adjustedLikePrice = (baseLikePrice * combinedMultiplier) / (BASE_PRECISION ** 5);
        uint256 adjustedFollowPrice = (baseFollowPrice * combinedMultiplier) / (BASE_PRECISION ** 5);
        
        // Calculate total likes requested
        uint256 totalLikes = actions.likeTargets.length * actions.likeCountPerPost;
        
        // Calculate total price
        return (totalLikes * adjustedLikePrice) + (actions.followCount * adjustedFollowPrice);
    }
    
    function depositForCampaignWithPermit(
        string calldata campaignId,
        AccountRequirements calldata requirements,
        CampaignActions calldata actions,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        if (bytes(campaignId).length == 0) revert InvalidCampaignId();
        
        // Must have at least one action (follows OR likes)
        if (actions.likeTargets.length == 0 && actions.followCount == 0) revert InvalidTargets();
        
        // If follows are specified, enforce minimum
        if (actions.followCount > 0 && actions.followCount < MIN_FOLLOW_COUNT) {
            revert InvalidAmount(); // Min 40 follows if follow action is used
        }
        
        // If likes are specified, enforce minimum
        if (actions.likeTargets.length > 0 && actions.likeCountPerPost < MIN_LIKES_PER_POST) {
            revert InvalidAmount(); // Min 40 likes per post if like action is used
        }
        
        // Calculate required payment
        uint256 requiredAmount = calculatePrice(requirements, actions);
        
        // Only enforce minimum total payment - let users choose their actions
        if (requiredAmount < MIN_TOTAL_PAYMENT) {
            revert InvalidAmount(); // Campaign must be at least $40 total
        }
        
        // Store campaign data
        CampaignData storage campaign = campaigns[campaignId];
        campaign.followTarget = actions.followTarget;
        campaign.followCount = actions.followCount;
        campaign.likeTargets = actions.likeTargets;
        campaign.likeCountPerPost = actions.likeCountPerPost;
        campaign.totalAmount = requiredAmount;
        campaign.depositor = msg.sender;
        
        // Call permit on USDC to set allowance via signature
        try IERC20Permit(usdcToken).permit(
            msg.sender,
            address(this),
            requiredAmount,
            deadline,
            v,
            r,
            s
        ) {
            // Permit succeeded
        } catch {
            revert PermitFailed();
        }
        
        // Transfer USDC from sender to this contract
        bool success = IERC20(usdcToken).transferFrom(
            msg.sender,
            address(this),
            requiredAmount
        );
        if (!success) revert TransferFailed();
        
        // Calculate total likes
        uint256 totalLikes = actions.likeTargets.length * actions.likeCountPerPost;
        
        // Emit events for tracking
        emit CampaignRequirementsSet(
            campaignId,
            requirements.verifiedOnly,
            requirements.minFollowers,
            requirements.minUniqueViews28Days,
            requirements.accountLocation,
            requirements.accountLanguage
        );
        
        emit CampaignPaymentReceived(
            campaignId,
            msg.sender,
            requiredAmount,
            block.timestamp,
            actions.followCount,
            totalLikes
        );
    }
    
    // Function to retrieve campaign data
    function getCampaignData(string calldata campaignId) external view returns (
        string memory followTarget,
        uint256 followCount,
        string[] memory likeTargets,
        uint256 likeCountPerPost,
        uint256 totalAmount,
        address depositor
    ) {
        CampaignData memory campaign = campaigns[campaignId];
        return (
            campaign.followTarget,
            campaign.followCount,
            campaign.likeTargets,
            campaign.likeCountPerPost,
            campaign.totalAmount,
            campaign.depositor
        );
    }
    
    function withdrawUSDC(address to, uint256 amount) external onlyOwner {
        bool success = IERC20(usdcToken).transfer(to, amount);
        if (!success) revert TransferFailed();
    }
    
    function withdrawAllUSDC(address to) external onlyOwner {
        uint256 balance = IERC20(usdcToken).balanceOf(address(this));
        if (balance > 0) {
            bool success = IERC20(usdcToken).transfer(to, balance);
            if (!success) revert TransferFailed();
        }
    }
    
    function getUSDCBalance() external view returns (uint256) {
        return IERC20(usdcToken).balanceOf(address(this));
    }
}