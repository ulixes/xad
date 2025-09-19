#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Campaign Payments Contract Deployment Script${NC}"
echo "============================================="
echo ""

# Check if we're in the right directory
if [ ! -d "contracts" ]; then
    echo -e "${RED}Error: contracts directory not found!${NC}"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Navigate to contracts directory
cd contracts

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found in contracts directory!${NC}"
    echo ""
    echo "Creating .env file from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}Created .env file. Please add your configuration:${NC}"
        echo "  1. Add your PRIVATE_KEY (without 0x prefix)"
        echo "  2. Optionally add BASESCAN_API_KEY for verification"
        echo ""
        echo -e "${YELLOW}Edit contracts/.env then run this script again.${NC}"
        exit 1
    else
        echo -e "${RED}Error: .env.example not found!${NC}"
        exit 1
    fi
fi

# Check if PRIVATE_KEY is set
if ! grep -q "PRIVATE_KEY=." .env; then
    echo -e "${RED}Error: PRIVATE_KEY not set in .env file!${NC}"
    echo "Please add your private key (without 0x prefix) to contracts/.env"
    exit 1
fi

# Source the .env file
export $(cat .env | grep -v '^#' | xargs)

# Function to deploy contract
deploy_contract() {
    local network=$1
    local network_name=$2
    
    echo -e "${YELLOW}Deploying to ${network_name}...${NC}"
    echo ""
    
    # Run the deployment
    forge script script/DeployCampaignPayments.s.sol --rpc-url $network --broadcast --verify
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Successfully deployed to ${network_name}!${NC}"
        
        # Try to extract deployed address from broadcast file
        local broadcast_file="broadcast/DeployCampaignPayments.s.sol/*/run-latest.json"
        if ls $broadcast_file 1> /dev/null 2>&1; then
            local deployed_address=$(cat $broadcast_file | grep -o '"contractAddress":"0x[^"]*' | head -1 | cut -d'"' -f4)
            if [ ! -z "$deployed_address" ]; then
                echo -e "${GREEN}Contract Address: ${deployed_address}${NC}"
                echo ""
                
                # Show verification command
                if [ ! -z "$BASESCAN_API_KEY" ]; then
                    echo "To verify on Basescan (if not auto-verified):"
                    echo "forge verify-contract ${deployed_address} CampaignPayments --rpc-url $network"
                fi
            fi
        fi
        return 0
    else
        echo -e "${RED}❌ Deployment failed!${NC}"
        return 1
    fi
}

# Menu for network selection
echo "Select deployment network:"
echo "1) Base Sepolia (Testnet)"
echo "2) Base Mainnet"
echo "3) Dry run (local simulation)"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}Deploying to Base Sepolia Testnet${NC}"
        echo "USDC Address: 0x036CbD53842c5426634e7929541eC2318f3dCF7e"
        echo ""
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            deploy_contract "base_sepolia" "Base Sepolia"
        else
            echo "Deployment cancelled."
        fi
        ;;
    2)
        echo ""
        echo -e "${YELLOW}⚠️  WARNING: Deploying to Base Mainnet${NC}"
        echo "USDC Address: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
        echo ""
        echo -e "${RED}This will deploy to MAINNET and use real ETH for gas!${NC}"
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            deploy_contract "base_mainnet" "Base Mainnet"
        else
            echo "Deployment cancelled."
        fi
        ;;
    3)
        echo ""
        echo -e "${GREEN}Running dry run (local simulation)${NC}"
        echo ""
        forge script script/DeployCampaignPayments.s.sol
        ;;
    *)
        echo -e "${RED}Invalid choice!${NC}"
        exit 1
        ;;
esac

echo ""
echo "Done!"