#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Contract Deployment Status Check${NC}"
echo "================================="
echo ""

# Check if contracts directory exists
if [ ! -d "contracts" ]; then
    echo -e "${RED}Error: contracts directory not found!${NC}"
    exit 1
fi

cd contracts

# Function to check deployment on network
check_deployment() {
    local network=$1
    local network_name=$2
    local chain_id=$3
    
    echo -e "${YELLOW}Checking ${network_name}...${NC}"
    
    # Look for broadcast files
    local broadcast_dir="broadcast/DeployCampaignPayments.s.sol/${chain_id}"
    
    if [ -d "$broadcast_dir" ]; then
        local latest_file="${broadcast_dir}/run-latest.json"
        if [ -f "$latest_file" ]; then
            # Extract contract address
            local contract_address=$(cat "$latest_file" | grep -o '"contractAddress":"0x[^"]*' | head -1 | cut -d'"' -f4)
            local deployer=$(cat "$latest_file" | grep -o '"from":"0x[^"]*' | head -1 | cut -d'"' -f4)
            local timestamp=$(cat "$latest_file" | grep -o '"timestamp":[0-9]*' | head -1 | cut -d':' -f2)
            
            if [ ! -z "$contract_address" ]; then
                echo -e "${GREEN}✅ Deployed${NC}"
                echo "   Contract: $contract_address"
                echo "   Deployer: $deployer"
                
                if [ ! -z "$timestamp" ]; then
                    # Convert timestamp to readable date
                    if command -v date &> /dev/null; then
                        local deploy_date=$(date -d @$timestamp 2>/dev/null || date -r $timestamp 2>/dev/null || echo "timestamp: $timestamp")
                        echo "   Date: $deploy_date"
                    fi
                fi
                
                # Show explorer link
                if [ "$network" = "base_sepolia" ]; then
                    echo "   Explorer: https://sepolia.basescan.org/address/${contract_address}"
                elif [ "$network" = "base_mainnet" ]; then
                    echo "   Explorer: https://basescan.org/address/${contract_address}"
                fi
            else
                echo -e "${YELLOW}⚠️  No deployment found${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  No deployment found${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No deployment found${NC}"
    fi
    echo ""
}

# Check both networks
check_deployment "base_sepolia" "Base Sepolia" "84532"
check_deployment "base_mainnet" "Base Mainnet" "8453"

# Check if .env is configured
echo -e "${BLUE}Environment Configuration:${NC}"
if [ -f ".env" ]; then
    if grep -q "PRIVATE_KEY=." .env; then
        echo -e "${GREEN}✅ Private key configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Private key not configured${NC}"
    fi
    
    if grep -q "BASESCAN_API_KEY=." .env; then
        echo -e "${GREEN}✅ Basescan API key configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Basescan API key not configured (optional)${NC}"
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
    echo "   Run ./deploy-contracts.sh to create one"
fi

echo ""
echo "To deploy a new contract, run: ./deploy-contracts.sh"