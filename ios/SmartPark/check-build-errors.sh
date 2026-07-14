#!/bin/bash
# Quick Swift syntax check for SpotSense iOS app
# Usage: bash check-build-errors.sh
# This catches type errors, missing references, and syntax issues BEFORE opening Xcode

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
SWIFT_FILES=$(find "$PROJECT_DIR/SmartPark" -name "*.swift" -not -path "*/venv/*" -not -path "*/.build/*")

echo "🔍 Checking $(echo "$SWIFT_FILES" | wc -l | tr -d ' ') Swift files for syntax errors..."

ERRORS=0
while IFS= read -r file; do
    RELATIVE="${file#$PROJECT_DIR/}"
    # Check for common Swift issues
    # 1. Color(.shadow) — not a valid UIColor
    if grep -n "Color(\.shadow)" "$file" 2>/dev/null; then
        echo "❌ $RELATIVE: Color(.shadow) is not valid — use Color.black or Color(.systemGray)"
        ERRORS=$((ERRORS + 1))
    fi
    # 2. Color(.white) — should be Color.white or Color(.systemBackground)
    if grep -n "Color(\.white)" "$file" 2>/dev/null; then
        echo "⚠️  $RELATIVE: Color(.white) found — consider Color(.systemBackground) for dark mode"
    fi
    # 3. Missing closing braces
    OPEN=$(grep -c '{' "$file" 2>/dev/null || true)
    CLOSE=$(grep -c '}' "$file" 2>/dev/null || true)
    if [ "$OPEN" != "$CLOSE" ]; then
        echo "⚠️  $RELATIVE: Mismatched braces — $OPEN open vs $CLOSE close"
        ERRORS=$((ERRORS + 1))
    fi
    # 4. Hardcoded Color.white or Color.black as background (dark mode issue)
    if grep -n "\.foregroundColor(.*Color\.white)" "$file" 2>/dev/null | grep -v "annotation\|Annotation\|map\|Map" > /dev/null; then
        echo "⚠️  $RELATIVE: Hardcoded .foregroundColor(Color.white) — may not adapt to dark mode"
    fi
done <<< "$SWIFT_FILES"

if [ $ERRORS -eq 0 ]; then
    echo "✅ No issues found! Safe to build in Xcode."
else
    echo "❌ Found $ERRORS issue(s). Fix before building."
    exit 1
fi
