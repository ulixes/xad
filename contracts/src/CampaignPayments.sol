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
    
    // Campaign package (configurable by owner)
    uint256 public campaignLikes = 40;
    uint256 public campaignFollows = 20;
    
    // Base prices in USDC (6 decimals) - configurable by owner
    uint256 public baseLikePrice = 200000;    // $0.20
    uint256 public baseFollowPrice = 400000;  // $0.40
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
    mapping(string => uint256) public locationMultipliers;  // Account location
    mapping(string => uint256) public languageMultipliers;  // Account language
    
    // Store action targets for each campaign (minimal data)
    // Format: "h:v|h" where h=handle(without @), v=videoId
    // Example: "jacoboestreicher:7551115162124635447|jacoboestreicher"
    mapping(string => string) public campaignTargets;
    
    // Events
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
    
    event PackageUpdated(
        uint256 likes,
        uint256 follows
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
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    constructor(address _usdcToken) {
        owner = msg.sender;
        usdcToken = _usdcToken;
        
        // Initialize default location multipliers
        locationMultipliers["all"] = 1000;      // 1.0x
        locationMultipliers["US"] = 1500;       // 1.5x
        locationMultipliers["UK"] = 1400;       // 1.4x
        locationMultipliers["CA"] = 1400;       // 1.4x
        locationMultipliers["AU"] = 1300;       // 1.3x
        locationMultipliers["DE"] = 1300;       // 1.3x
        locationMultipliers["FR"] = 1200;       // 1.2x
        locationMultipliers["ES"] = 1150;       // 1.15x
        locationMultipliers["IT"] = 1150;       // 1.15x
        locationMultipliers["JP"] = 1200;       // 1.2x
        locationMultipliers["KR"] = 1100;       // 1.1x
        locationMultipliers["BR"] = 1100;       // 1.1x
        locationMultipliers["MX"] = 1000;       // 1.0x
        locationMultipliers["IN"] = 900;        // 0.9x
        locationMultipliers["PH"] = 800;        // 0.8x
        locationMultipliers["ID"] = 700;        // 0.7x
        
        // Initialize default language multipliers
        languageMultipliers["all"] = 1000;      // 1.0x
        languageMultipliers["en"] = 1200;       // 1.2x
        languageMultipliers["es"] = 1100;       // 1.1x
        languageMultipliers["fr"] = 1100;       // 1.1x
        languageMultipliers["de"] = 1100;       // 1.1x
        languageMultipliers["it"] = 1050;       // 1.05x
        languageMultipliers["pt"] = 1050;       // 1.05x
        languageMultipliers["ru"] = 1000;       // 1.0x
        languageMultipliers["ja"] = 1000;       // 1.0x
        languageMultipliers["ko"] = 1000;       // 1.0x
        languageMultipliers["zh"] = 900;        // 0.9x
        languageMultipliers["ar"] = 950;        // 0.95x
        languageMultipliers["hi"] = 900;        // 0.9x
        languageMultipliers["id"] = 850;        // 0.85x
        languageMultipliers["th"] = 850;        // 0.85x
        languageMultipliers["vi"] = 850;        // 0.85x
    }
    
    // Owner functions to update configuration
    function updatePackage(uint256 _likes, uint256 _follows) external onlyOwner {
        if (_likes == 0 || _follows == 0) revert InvalidAmount();
        campaignLikes = _likes;
        campaignFollows = _follows;
        emit PackageUpdated(_likes, _follows);
    }
    
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
    
    function calculatePrice(
        AccountRequirements memory requirements
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
        uint256 likePrice = (baseLikePrice * combinedMultiplier) / (BASE_PRECISION ** 5);
        uint256 followPrice = (baseFollowPrice * combinedMultiplier) / (BASE_PRECISION ** 5);
        
        // Calculate total for the campaign package
        return (campaignLikes * likePrice) + (campaignFollows * followPrice);
    }
    
    function depositForCampaignWithPermit(
        string calldata campaignId,
        AccountRequirements calldata requirements,
        string calldata targets, // Simple string: "likeUrl|followUrl"
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        if (bytes(campaignId).length == 0) revert InvalidCampaignId();
        if (bytes(targets).length == 0) revert InvalidTargets();
        
        // Store the targets (simple string)
        campaignTargets[campaignId] = targets;
        
        // Calculate required payment
        uint256 requiredAmount = calculatePrice(requirements);
        
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
            targets
        );
    }
    
    // Function to retrieve targets for a campaign
    function getCampaignTargets(string calldata campaignId) external view returns (string memory) {
        return campaignTargets[campaignId];
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