#!/usr/bin/env bash
#
# MCP Inspector Verification Script
# =================================
# This script verifies the Ballistic MCP server implementation using
# the official MCP Inspector CLI tool.
#
# Prerequisites:
# - Node.js 18+ and npm installed
# - Sail container running (APP_SERVICE=model_a ./vendor/bin/sail up -d)
# - A test user with a Sanctum token
#
# Usage:
#   ./mcp-verify.sh [command]
#
# Commands:
#   install     Install MCP Inspector globally
#   stdio       Test the local STDIO transport
#   http        Test the HTTP transport (requires auth token)
#   all         Run all verification tests
#
# Environment Variables:
#   MCP_AUTH_TOKEN  Bearer token for HTTP transport authentication
#   APP_URL         Application URL (default: http://localhost)
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAIL="${SCRIPT_DIR}/vendor/bin/sail"
APP_URL="${APP_URL:-http://localhost}"
MCP_ENDPOINT="${APP_URL}/mcp"

# Colours for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Colour

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Install MCP Inspector if not present
install_inspector() {
    log_info "Checking for MCP Inspector..."

    if command -v npx &> /dev/null; then
        log_success "npx is available"
    else
        log_error "npx is not installed. Please install Node.js 18+ first."
        exit 1
    fi

    log_info "MCP Inspector will be downloaded on first use via npx"
}

# Test STDIO transport using artisan command
test_stdio() {
    log_info "Testing STDIO transport via artisan mcp:start..."

    # Create a test file with JSON-RPC messages
    TEMP_INPUT=$(mktemp)
    TEMP_OUTPUT=$(mktemp)

    # Write initialization request
    cat > "$TEMP_INPUT" << 'EOF'
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"mcp-verify","version":"1.0.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
{"jsonrpc":"2.0","id":3,"method":"resources/list","params":{}}
EOF

    log_info "Sending test messages to STDIO server..."

    # Run the MCP server via artisan and capture output
    timeout 10 APP_SERVICE=model_a "$SAIL" artisan mcp:start ballistic < "$TEMP_INPUT" > "$TEMP_OUTPUT" 2>&1 || true

    # Check for expected responses
    if grep -q '"serverInfo"' "$TEMP_OUTPUT" 2>/dev/null; then
        log_success "STDIO: Server info returned correctly"
    else
        log_warn "STDIO: Could not verify server info (may need database)"
    fi

    if grep -q '"tools"' "$TEMP_OUTPUT" 2>/dev/null; then
        log_success "STDIO: Tools list returned"
    fi

    if grep -q '"resources"' "$TEMP_OUTPUT" 2>/dev/null; then
        log_success "STDIO: Resources list returned"
    fi

    # Cleanup
    rm -f "$TEMP_INPUT" "$TEMP_OUTPUT"

    log_info "STDIO transport test complete"
}

# Test HTTP transport
test_http() {
    log_info "Testing HTTP transport at ${MCP_ENDPOINT}..."

    if [ -z "$MCP_AUTH_TOKEN" ]; then
        log_warn "MCP_AUTH_TOKEN not set. Skipping authenticated tests."
        log_info "To test HTTP transport, set MCP_AUTH_TOKEN environment variable:"
        log_info "  export MCP_AUTH_TOKEN='your-sanctum-token'"
        log_info "  ./mcp-verify.sh http"
        return 0
    fi

    # Test initialize
    log_info "Testing initialize method..."
    INIT_RESPONSE=$(curl -s -X POST "$MCP_ENDPOINT" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
        -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"mcp-verify","version":"1.0.0"}}}')

    if echo "$INIT_RESPONSE" | grep -q '"Ballistic Social"'; then
        log_success "HTTP: Initialize returned correct server name"
    else
        log_error "HTTP: Initialize failed"
        echo "$INIT_RESPONSE"
    fi

    # Test tools/list
    log_info "Testing tools/list method..."
    TOOLS_RESPONSE=$(curl -s -X POST "$MCP_ENDPOINT" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
        -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}')

    if echo "$TOOLS_RESPONSE" | grep -q '"create_item"'; then
        log_success "HTTP: Tools list includes create_item"
    else
        log_error "HTTP: Tools list failed"
        echo "$TOOLS_RESPONSE"
    fi

    # Test resources/list
    log_info "Testing resources/list method..."
    RESOURCES_RESPONSE=$(curl -s -X POST "$MCP_ENDPOINT" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
        -d '{"jsonrpc":"2.0","id":3,"method":"resources/list","params":{}}')

    # Note: JSON escapes forward slashes as \/, so we check for the escaped version
    if echo "$RESOURCES_RESPONSE" | grep -q 'ballistic:.*users.*me'; then
        log_success "HTTP: Resources list includes user profile"
    else
        log_error "HTTP: Resources list failed"
        echo "$RESOURCES_RESPONSE"
    fi

    # Measure initialization latency
    log_info "Measuring initialization latency..."
    START_TIME=$(date +%s%N)
    curl -s -X POST "$MCP_ENDPOINT" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
        -d '{"jsonrpc":"2.0","id":99,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"latency-test","version":"1.0.0"}}}' > /dev/null
    END_TIME=$(date +%s%N)

    LATENCY_MS=$(( (END_TIME - START_TIME) / 1000000 ))

    if [ "$LATENCY_MS" -lt 100 ]; then
        log_success "HTTP: Initialization latency ${LATENCY_MS}ms (< 100ms benchmark)"
    else
        log_warn "HTTP: Initialization latency ${LATENCY_MS}ms (exceeds 100ms benchmark)"
    fi

    log_info "HTTP transport test complete"
}

# Run MCP Inspector UI
run_inspector() {
    log_info "Launching MCP Inspector UI..."
    log_info "This will open a browser interface for interactive testing."
    log_info ""
    log_info "To test the STDIO transport:"
    log_info "  1. In the Inspector, select 'Connect to server'"
    log_info "  2. Use command: php artisan mcp:start ballistic"
    log_info "  3. Set working directory to: ${SCRIPT_DIR}"
    log_info ""

    npx @modelcontextprotocol/inspector
}

# Verify tool schema reflection
test_schema_reflection() {
    log_info "Testing dynamic schema reflection..."

    if [ -z "$MCP_AUTH_TOKEN" ]; then
        log_warn "MCP_AUTH_TOKEN not set. Skipping schema reflection test."
        return 0
    fi

    # Get tools list and verify schema structure
    TOOLS_RESPONSE=$(curl -s -X POST "$MCP_ENDPOINT" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
        -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}')

    # Check that create_item has proper input schema
    if echo "$TOOLS_RESPONSE" | grep -q '"inputSchema".*"type".*"object"'; then
        log_success "Schema: Tools have proper JSON Schema definitions"
    else
        log_error "Schema: Tools missing proper input schema"
    fi

    # Verify required fields are marked
    if echo "$TOOLS_RESPONSE" | grep -q '"required"'; then
        log_success "Schema: Required fields are specified"
    else
        log_warn "Schema: No required fields found in schemas"
    fi

    log_info "Schema reflection test complete"
}

# Print usage
usage() {
    echo "Ballistic MCP Server Verification Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  install     Install MCP Inspector dependencies"
    echo "  stdio       Test STDIO transport"
    echo "  http        Test HTTP transport (requires MCP_AUTH_TOKEN)"
    echo "  schema      Test dynamic schema reflection"
    echo "  inspector   Launch MCP Inspector UI"
    echo "  all         Run all verification tests"
    echo ""
    echo "Environment Variables:"
    echo "  MCP_AUTH_TOKEN  Bearer token for authentication"
    echo "  APP_URL         Application URL (default: http://localhost)"
    echo ""
    echo "Examples:"
    echo "  $0 install"
    echo "  MCP_AUTH_TOKEN='1|abc123...' $0 http"
    echo "  $0 all"
}

# Main
case "${1:-all}" in
    install)
        install_inspector
        ;;
    stdio)
        test_stdio
        ;;
    http)
        test_http
        ;;
    schema)
        test_schema_reflection
        ;;
    inspector)
        run_inspector
        ;;
    all)
        install_inspector
        echo ""
        test_stdio
        echo ""
        test_http
        echo ""
        test_schema_reflection
        echo ""
        log_success "All verification tests complete!"
        ;;
    -h|--help|help)
        usage
        ;;
    *)
        log_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac
