#!/usr/bin/env bash
# ==============================================================================
# YesFancy Multi-User Setup Script for macOS user 'Ravi' (Achalla Ravi Kiran)
# ==============================================================================
# Run this script when logged into the Mac as user 'Ravi':
#   bash /Users/divyakodukula/Documents/yesfancy/setup_ravi_access.sh
# ==============================================================================

set -e

SOURCE_DIR="/Users/divyakodukula/Documents/yesfancy"
TARGET_DOCUMENTS="$HOME/Documents/yesfancy"
CLAUDE_SKILLS_DIR="$HOME/.claude/skills/yesfancy"

echo "✨ Setting up YesFancy link for user: $(whoami)..."

# 1. Verify access to source directory
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: Cannot access $SOURCE_DIR. Ensure macOS ACL permissions are granted."
    exit 1
fi

# 2. Create symlink in Ravi's Documents
if [ -L "$TARGET_DOCUMENTS" ]; then
    echo "ℹ️ Symlink $TARGET_DOCUMENTS already exists."
elif [ -d "$TARGET_DOCUMENTS" ]; then
    echo "⚠️ A folder already exists at $TARGET_DOCUMENTS. Backing it up to ${TARGET_DOCUMENTS}.backup..."
    mv "$TARGET_DOCUMENTS" "${TARGET_DOCUMENTS}.backup"
    ln -s "$SOURCE_DIR" "$TARGET_DOCUMENTS"
    echo "✅ Created symlink: $TARGET_DOCUMENTS -> $SOURCE_DIR"
else
    ln -s "$SOURCE_DIR" "$TARGET_DOCUMENTS"
    echo "✅ Created symlink: $TARGET_DOCUMENTS -> $SOURCE_DIR"
fi

# 3. Register the Claude Skill for Claude Code / Claude CLI
mkdir -p "$CLAUDE_SKILLS_DIR"
cp "$SOURCE_DIR/.claude/skills/yesfancy/SKILL.md" "$CLAUDE_SKILLS_DIR/SKILL.md"
echo "✅ Installed YesFancy skill into Claude: $CLAUDE_SKILLS_DIR/SKILL.md"

# 4. Verify environment file
if [ -f "$TARGET_DOCUMENTS/.env" ]; then
    echo "✅ Environment (.env) is linked and accessible."
else
    echo "⚠️ Warning: .env not found in $SOURCE_DIR."
fi

# 5. Summary
echo ""
echo "🎉 Setup complete! You can now access YesFancy anytime by running:"
echo "   cd ~/Documents/yesfancy"
echo "   npm test"
echo "   npx wrangler pages deploy dist --project-name yesfancy"
echo "=============================================================================="
