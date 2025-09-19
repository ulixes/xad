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
    
    // Targeting multipliers (1000 = 1.0x) - configurable by owner
    uint256 public genderMultiplier = 1200;     // 1.2x when targeting specific gender
    uint256 public ageMultiplier = 1400;        // 1.4x when targeting specific age
    uint256 public verifiedMultiplier = 1500;   // 1.5x when targeting verified only
    
    // Country multipliers (1000 = 1.0x)
    mapping(string => uint256) public countryMultipliers;
    
    // Events
    event CampaignPaymentReceived(
        string indexed campaignId,
        address indexed sender,
        uint256 amount,
        uint256 timestamp
    );
    
    event PriceCalculated(
        string indexed campaignId,
        uint256 totalPrice,
        string country,
        bool targetGender,
        bool targetAge,
        bool verifiedOnly
    );
    
    event PackageUpdated(
        uint256 likes,
        uint256 follows
    );
    
    event BasePricesUpdated(
        uint256 likePrice,
        uint256 followPrice
    );
    
    event TargetingMultipliersUpdated(
        uint256 genderMult,
        uint256 ageMult,
        uint256 verifiedMult
    );
    
    event CountryMultiplierUpdated(
        string country,
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
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    constructor(address _usdcToken) {
        owner = msg.sender;
        usdcToken = _usdcToken;
        
        // Initialize default country multipliers
        countryMultipliers["all"] = 1000;      // 1.0x
        countryMultipliers["US"] = 1500;       // 1.5x
        countryMultipliers["UK"] = 1400;       // 1.4x
        countryMultipliers["CA"] = 1400;       // 1.4x
        countryMultipliers["AU"] = 1300;       // 1.3x
        countryMultipliers["DE"] = 1300;       // 1.3x
        countryMultipliers["FR"] = 1200;       // 1.2x
        countryMultipliers["JP"] = 1200;       // 1.2x
        countryMultipliers["BR"] = 1100;       // 1.1x
        countryMultipliers["MX"] = 1000;       // 1.0x
        countryMultipliers["IN"] = 900;        // 0.9x
        countryMultipliers["PH"] = 800;        // 0.8x
        countryMultipliers["ID"] = 700;        // 0.7x
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
    
    function updateTargetingMultipliers(
        uint256 _genderMult,
        uint256 _ageMult,
        uint256 _verifiedMult
    ) external onlyOwner {
        // Multipliers should be reasonable (e.g., between 0.5x and 5x)
        if (_genderMult < 500 || _genderMult > 5000) revert InvalidMultiplier();
        if (_ageMult < 500 || _ageMult > 5000) revert InvalidMultiplier();
        if (_verifiedMult < 500 || _verifiedMult > 5000) revert InvalidMultiplier();
        
        genderMultiplier = _genderMult;
        ageMultiplier = _ageMult;
        verifiedMultiplier = _verifiedMult;
        
        emit TargetingMultipliersUpdated(_genderMult, _ageMult, _verifiedMult);
    }
    
    function updateCountryMultiplier(string calldata country, uint256 multiplier) external onlyOwner {
        // Multiplier should be reasonable (e.g., between 0.1x and 10x)
        if (multiplier < 100 || multiplier > 10000) revert InvalidMultiplier();
        countryMultipliers[country] = multiplier;
        emit CountryMultiplierUpdated(country, multiplier);
    }
    
    function updateCountryMultipliersBatch(
        string[] calldata countries,
        uint256[] calldata multipliers
    ) external onlyOwner {
        require(countries.length == multipliers.length, "Array length mismatch");
        
        for (uint256 i = 0; i < countries.length; i++) {
            if (multipliers[i] < 100 || multipliers[i] > 10000) revert InvalidMultiplier();
            countryMultipliers[countries[i]] = multipliers[i];
            emit CountryMultiplierUpdated(countries[i], multipliers[i]);
        }
    }
    
    function calculatePrice(
        string memory country,
        bool targetGender,
        bool targetAge,
        bool verifiedOnly
    ) public view returns (uint256) {
        // Get country multiplier (default to "all" if not found)
        uint256 countryMult = countryMultipliers[country];
        if (countryMult == 0) {
            countryMult = countryMultipliers["all"];
        }
        
        // Apply targeting multipliers
        uint256 genderMult = targetGender ? genderMultiplier : 1000;    
        uint256 ageMult = targetAge ? ageMultiplier : 1000;          
        uint256 verifiedMult = verifiedOnly ? verifiedMultiplier : 1000;  
        
        // Calculate combined multiplier
        uint256 combinedMultiplier = countryMult * genderMult * ageMult * verifiedMult;
        
        // Calculate prices with multipliers applied
        uint256 likePrice = (baseLikePrice * combinedMultiplier) / (BASE_PRECISION ** 4);
        uint256 followPrice = (baseFollowPrice * combinedMultiplier) / (BASE_PRECISION ** 4);
        
        // Calculate total for the campaign package
        return (campaignLikes * likePrice) + (campaignFollows * followPrice);
    }
    
    function depositForCampaignWithPermit(
        string calldata campaignId,
        string calldata country,
        bool targetGender,
        bool targetAge,
        bool verifiedOnly,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        if (bytes(campaignId).length == 0) revert InvalidCampaignId();
        
        // Calculate required payment
        uint256 requiredAmount = calculatePrice(country, targetGender, targetAge, verifiedOnly);
        
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
        
        emit PriceCalculated(
            campaignId,
            requiredAmount,
            country,
            targetGender,
            targetAge,
            verifiedOnly
        );
        
        emit CampaignPaymentReceived(
            campaignId,
            msg.sender,
            requiredAmount,
            block.timestamp
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