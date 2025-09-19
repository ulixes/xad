// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/CampaignPayments.sol";

contract DeployCampaignPayments is Script {
    // USDC addresses
    address constant USDC_BASE_MAINNET = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    
    function run() external returns (CampaignPayments) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Determine USDC address based on chain ID
        uint256 chainId = block.chainid;
        address usdcAddress;
        
        if (chainId == 8453) {
            // Base Mainnet
            usdcAddress = USDC_BASE_MAINNET;
            console.log("Deploying to Base Mainnet with USDC:", usdcAddress);
        } else if (chainId == 84532) {
            // Base Sepolia
            usdcAddress = USDC_BASE_SEPOLIA;
            console.log("Deploying to Base Sepolia with USDC:", usdcAddress);
        } else {
            revert("Unsupported chain. Deploy to Base Mainnet (8453) or Base Sepolia (84532)");
        }
        
        vm.startBroadcast(deployerPrivateKey);
        
        CampaignPayments campaignPayments = new CampaignPayments(usdcAddress);
        
        console.log("CampaignPayments deployed at:", address(campaignPayments));
        console.log("Owner:", campaignPayments.owner());
        console.log("USDC Token:", campaignPayments.usdcToken());
        
        vm.stopBroadcast();
        
        return campaignPayments;
    }
}