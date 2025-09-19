#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default wallet type
WALLET_TYPE="dotenvx"
LEDGER_PATH="m/44'/60'/0'/0/0"  # Default Ethereum derivation path

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --wallet)
            WALLET_TYPE="$2"
            shift 2
            ;;
        --wallet=*)
            WALLET_TYPE="${1#*=}"
            shift
            ;;
        --ledger-path)
            LEDGER_PATH="$2"
            shift 2
            ;;
        --ledger-path=*)
            LEDGER_PATH="${1#*=}"
            shift
            ;;
        --help|-h)
            echo "Campaign Payments Contract Deployment Script"
            echo ""
            echo "Usage: ./deploy-contracts.sh [options]"
            echo ""
            echo "Options:"
            echo "  --wallet=TYPE       Wallet type: 'dotenvx' (default) or 'ledger'"
            echo "  --ledger-path=PATH  HD derivation path for Ledger (default: m/44'/60'/0'/0/0)"
            echo "  --help, -h          Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./deploy-contracts.sh                      # Deploy using dotenvx (default)"
            echo "  ./deploy-contracts.sh --wallet=ledger      # Deploy using Ledger"
            echo "  ./deploy-contracts.sh --wallet=ledger --ledger-path=\"m/44'/60'/1'/0/0\""
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${GREEN}Campaign Payments Contract Deployment Script${NC}"
echo "============================================="
echo -e "${BLUE}Wallet Type: ${WALLET_TYPE}${NC}"
if [ "$WALLET_TYPE" = "ledger" ]; then
    echo -e "${BLUE}Ledger Path: ${LEDGER_PATH}${NC}"
fi
echo ""

# Check if we're in the right directory
if [ ! -d "contracts" ]; then
    echo -e "${RED}Error: contracts directory not found!${NC}"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Navigate to contracts directory
cd contracts

# Wallet-specific setup
if [ "$WALLET_TYPE" = "dotenvx" ]; then
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
    
    DEPLOY_SCRIPT="script/DeployCampaignPayments.s.sol"
    
elif [ "$WALLET_TYPE" = "ledger" ]; then
    echo -e "${YELLOW}Using Ledger hardware wallet for deployment${NC}"
    echo "Please ensure:"
    echo "  1. Your Ledger is connected and unlocked"
    echo "  2. The Ethereum app is open"
    echo "  3. Blind signing is enabled (Settings > Blind signing)"
    echo ""
    
    # Source .env file if it exists for BASESCAN_API_KEY
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | grep -v 'PRIVATE_KEY' | xargs)
    fi
    
    DEPLOY_SCRIPT="script/DeployCampaignPaymentsLedger.s.sol"
    
else
    echo -e "${RED}Error: Invalid wallet type '${WALLET_TYPE}'${NC}"
    echo "Use --wallet=dotenvx or --wallet=ledger"
    exit 1
fi

# Function to deploy contract with dotenvx
deploy_with_dotenvx() {
    local network=$1
    local network_name=$2
    
    echo -e "${YELLOW}Deploying to ${network_name} with dotenvx...${NC}"
    echo ""
    
    # Run the deployment with dotenvx if available
    if command -v dotenvx &> /dev/null && [ -f ".env" ]; then
        dotenvx run -- forge script $DEPLOY_SCRIPT --rpc-url $network --broadcast --verify
    else
        forge script $DEPLOY_SCRIPT --rpc-url $network --broadcast --verify
    fi
    
    return $?
}

# Function to deploy contract with Ledger
deploy_with_ledger() {
    local network=$1
    local network_name=$2
    
    echo -e "${YELLOW}Deploying to ${network_name} with Ledger...${NC}"
    echo "Using derivation path: ${LEDGER_PATH}"
    echo ""
    
    # Run the deployment with Ledger using dotenvx for env vars
    if command -v dotenvx &> /dev/null && [ -f ".env" ]; then
        dotenvx run -- forge script $DEPLOY_SCRIPT --rpc-url $network --broadcast --ledger --hd-paths "${LEDGER_PATH}" --verify
    else
        forge script $DEPLOY_SCRIPT --rpc-url $network --broadcast --ledger --hd-paths "${LEDGER_PATH}" --verify
    fi
    
    return $?
}

# Function to deploy contract (dispatches to appropriate method)
deploy_contract() {
    local network=$1
    local network_name=$2
    
    if [ "$WALLET_TYPE" = "ledger" ]; then
        deploy_with_ledger "$network" "$network_name"
    else
        deploy_with_dotenvx "$network" "$network_name"
    fi
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Successfully deployed to ${network_name}!${NC}"
        
        # Try to extract deployed address from broadcast file
        local broadcast_file="broadcast/${DEPLOY_SCRIPT##*/}/*/run-latest.json"
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

# Function for dry run
dry_run() {
    echo ""
    echo -e "${GREEN}Running dry run (local simulation)${NC}"
    echo ""
    
    if [ "$WALLET_TYPE" = "ledger" ]; then
        echo -e "${YELLOW}Note: Dry run with Ledger will still require device interaction${NC}"
        if command -v dotenvx &> /dev/null && [ -f ".env" ]; then
            dotenvx run -- forge script $DEPLOY_SCRIPT --ledger --hd-paths "${LEDGER_PATH}"
        else
            forge script $DEPLOY_SCRIPT --ledger --hd-paths "${LEDGER_PATH}"
        fi
    else
        if command -v dotenvx &> /dev/null && [ -f ".env" ]; then
            dotenvx run -- forge script $DEPLOY_SCRIPT
        else
            forge script $DEPLOY_SCRIPT
        fi
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
        dry_run
        ;;
    *)
        echo -e "${RED}Invalid choice!${NC}"
        exit 1
        ;;
esac

echo ""
echo "Done!"