#!/bin/bash

# XAD API Test Script - Dynamic Brand & Task Creation
# Creates 5-7 brands, each with 1-5 tasks

BASE_URL="http://localhost:3001"
ADMIN_TOKEN="xad-admin-token-2025-early-poc"
CREATED_BRANDS=()

echo "🚀 Starting XAD API Test Script..."
echo "Creating brands and tasks dynamically..."
echo "----------------------------------------"

# Brand configurations
declare -a BRANDS=(
  "Nike"
  "Apple" 
  "Starbucks"
  "Tesla"
  "Amazon"
  "Netflix"
  "Spotify"
)

# X platform like tasks only - specific posts to like
declare -A PLATFORM_TASKS=(
  ["x"]="like"
)

declare -A PLATFORM_TARGETS=(
  ["x-like"]="https://x.com/elonmusk/status/1963110769434013763 https://x.com/animeupdates__/status/1963036361466003683 https://x.com/amXFreeze/status/1963119774344368269 https://x.com/DefiantLs/status/1963025519978459266 https://x.com/Starlink/status/1963016187903934547 https://x.com/RupertLowe10/status/1962937323718369321 https://x.com/SawyerMerritt/status/1962884202421952720 https://x.com/thatsKAIZEN/status/1963017378448789620 https://x.com/elonmusk/status/1963117880163119285 https://x.com/thatsKAIZEN/status/1963081490004377708"
)

# Function to create a brand
create_brand() {
  local brand_name="$1"
  echo "📋 Creating brand: $brand_name"
  
  response=$(curl -s -X POST "$BASE_URL/api/brands" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"$brand_name\"}")
  
  brand_id=$(echo "$response" | grep -o '"brand_id":"[^"]*' | cut -d'"' -f4)
  
  if [ -n "$brand_id" ]; then
    echo "✅ Brand created: $brand_name (ID: $brand_id)"
    CREATED_BRANDS+=("$brand_id")
    return 0
  else
    echo "❌ Failed to create brand: $brand_name"
    echo "Response: $response"
    return 1
  fi
}

# Function to create a task
create_task() {
  local brand_id="$1"
  local task_num="$2"
  local brand_name="$3"
  
  # Only use X platform
  local platform="x"
  
  # Get valid task types for this platform
  local task_types_str="${PLATFORM_TASKS[$platform]}"
  local task_types_array=($task_types_str)
  local task_type=${task_types_array[$RANDOM % ${#task_types_array[@]}]}
  
  # Get appropriate target for this platform-task combination
  local target_key="${platform}-${task_type}"
  local targets_str="${PLATFORM_TARGETS[$target_key]}"
  local targets_array=($targets_str)
  local target=${targets_array[$RANDOM % ${#targets_array[@]}]}
  
  local volume=$((50 + RANDOM % 200))  # 50-250 volume
  local budget=$((10 + RANDOM % 40))   # $10-50 budget
  local max_actions=1
  
  # Instructions for X platform like tasks only
  local instructions='["Like the X post if you find it interesting", "Engage authentically with content", "Do not spam or use automation", "Only like posts you actually view and appreciate"]'
  
  echo "  📝 Creating task #$task_num: $platform $task_type (Vol: $volume, Budget: \$$budget)"
  
  response=$(curl -s -X POST "$BASE_URL/api/tasks" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"brand_id\": \"$brand_id\",
      \"platform\": \"$platform\",
      \"type\": \"$task_type\",
      \"targets\": [\"$target\"],
      \"volume\": $volume,
      \"budget\": $budget,
      \"currency\": \"USD\",
      \"reward_per_action\": null,
      \"expiration_date\": \"2025-12-31T23:59:59Z\",
      \"payout_release_after\": \"P7D\",
      \"active\": true,
      \"instructions\": $instructions,
      \"verification\": \"manual\",
      \"max_actions_per_user\": $max_actions,
      \"reward_distribution\": {
        \"mode\": \"static\",
        \"tiers\": null
      }
    }")
  
  task_id=$(echo "$response" | grep -o '"task_id":"[^"]*' | cut -d'"' -f4)
  reward=$(echo "$response" | grep -o '"reward_per_action":"[^"]*' | cut -d'"' -f4)
  
  if [ -n "$task_id" ]; then
    echo "    ✅ Task created: $task_id (Reward: \$$reward per action)"
  else
    echo "    ❌ Failed to create task"
    echo "    Response: $response"
  fi
}

# Main execution - Use existing brands
echo "🏢 Using existing brands..."

# Get existing brands from API
brands_response=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE_URL/api/brands")
existing_brands=$(echo "$brands_response" | grep -o '"brandId":"[^"]*' | cut -d'"' -f4)
existing_names=$(echo "$brands_response" | grep -o '"name":"[^"]*' | cut -d'"' -f4)

# Convert to arrays
CREATED_BRANDS=($existing_brands)
selected_brands=($existing_names)

echo "✅ Found ${#CREATED_BRANDS[@]} existing brands: ${selected_brands[*]}"

echo ""
echo "🎯 Creating tasks for each brand..."

# Create exactly 10 tasks total across all brands
total_tasks_to_create=10
tasks_created=0

for i in "${!CREATED_BRANDS[@]}"; do
  if [ $tasks_created -ge $total_tasks_to_create ]; then
    break
  fi
  
  brand_id="${CREATED_BRANDS[$i]}"
  brand_name="${selected_brands[$i]}"
  
  # Calculate how many tasks to create for this brand
  remaining_tasks=$((total_tasks_to_create - tasks_created))
  remaining_brands=$((${#CREATED_BRANDS[@]} - i))
  
  if [ $remaining_brands -eq 1 ]; then
    # Last brand gets all remaining tasks
    num_tasks=$remaining_tasks
  else
    # Distribute tasks evenly, with at least 1 per brand
    max_for_brand=$((remaining_tasks - remaining_brands + 1))
    num_tasks=$((1 + RANDOM % max_for_brand))
    if [ $num_tasks -gt $remaining_tasks ]; then
      num_tasks=$remaining_tasks
    fi
  fi
  
  echo ""
  echo "📊 Creating $num_tasks tasks for $brand_name..."
  
  for ((j=1; j<=num_tasks; j++)); do
    create_task "$brand_id" "$j" "$brand_name"
    tasks_created=$((tasks_created + 1))
    sleep 0.3  # Small delay between task creation
  done
done

echo ""
echo "🎉 Setup complete!"
echo "----------------------------------------"
echo "📈 Summary:"
echo "  • Brands created: ${#CREATED_BRANDS[@]}"

# Count total tasks
total_tasks=0
for brand_id in "${CREATED_BRANDS[@]}"; do
  tasks_response=$(curl -s -X GET "$BASE_URL/api/tasks")
  brand_tasks=$(echo "$tasks_response" | grep -o "\"$brand_id\"" | wc -l)
  total_tasks=$((total_tasks + brand_tasks))
done

echo "  • Total tasks created: $tasks_created"
echo ""
echo "🔍 Test the API:"
echo "  • View all tasks: curl $BASE_URL/api/tasks"
echo "  • View all brands: curl -H 'Authorization: Bearer $ADMIN_TOKEN' $BASE_URL/api/brands"
echo ""
echo "🎯 Ready for testing user interactions!"