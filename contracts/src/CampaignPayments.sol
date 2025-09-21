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
    uint256 public campaignLikes = 20;
    uint256 public campaignFollows = 10;
    
    // Base prices in USDC (6 decimals) - configurable by owner
    uint256 public baseLikePrice = 200000;    // $0.20
    uint256 public baseFollowPrice = 400000;  // $0.40
    uint256 public constant BASE_PRECISION = 1000;       // For multiplier calculations
    
    // Account quality multipliers (1000 = 1.0x) - configurable by owner
    uint256 public verifiedMultiplier = 1500;   // 1.5x when targeting verified only
    uint256 public minFollowersMultiplier = 1200;  // 1.2x for minimum followers requirement
    uint256 public minViewsMultiplier = 1300;       // 1.3x for minimum views requirement
    
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
    
    event AccountQualityMultipliersUpdated(
        uint256 verifiedMult,
        uint256 minFollowersMult,
        uint256 minViewsMult
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
    
    function updateAccountQualityMultipliers(
        uint256 _verifiedMult,
        uint256 _minFollowersMult,
        uint256 _minViewsMult
    ) external onlyOwner {
        // Multipliers should be reasonable (e.g., between 0.5x and 5x)
        if (_verifiedMult < 500 || _verifiedMult > 5000) revert InvalidMultiplier();
        if (_minFollowersMult < 500 || _minFollowersMult > 5000) revert InvalidMultiplier();
        if (_minViewsMult < 500 || _minViewsMult > 5000) revert InvalidMultiplier();
        
        verifiedMultiplier = _verifiedMult;
        minFollowersMultiplier = _minFollowersMult;
        minViewsMultiplier = _minViewsMult;
        
        emit AccountQualityMultipliersUpdated(_verifiedMult, _minFollowersMult, _minViewsMult);
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
        uint256 followersMult = requirements.minFollowers > 0 ? minFollowersMultiplier : 1000;
        uint256 viewsMult = requirements.minUniqueViews28Days > 0 ? minViewsMultiplier : 1000;
        
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