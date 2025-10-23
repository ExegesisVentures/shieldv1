#!/bin/bash
# Script to remove all .md files (except README.md) from git history
# WARNING: This rewrites git history - use with caution!

echo "⚠️  WARNING: This will rewrite git history!"
echo "This operation will:"
echo "  - Remove all .md files (except README.md) from ALL commits"
echo "  - Require force push to remote"
echo "  - Anyone who has cloned the repo will need to re-clone"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted."
    exit 1
fi

echo ""
echo "🔍 Checking for git-filter-repo..."

# Check if git-filter-repo is installed
if ! command -v git-filter-repo &> /dev/null; then
    echo "📦 git-filter-repo not found. Installing..."
    
    # Try to install via pip
    if command -v pip3 &> /dev/null; then
        pip3 install git-filter-repo
    elif command -v pip &> /dev/null; then
        pip install git-filter-repo
    else
        echo "❌ Please install git-filter-repo manually:"
        echo "   pip install git-filter-repo"
        echo "   or visit: https://github.com/newren/git-filter-repo"
        exit 1
    fi
fi

echo ""
echo "🗂️  Creating backup branch..."
git branch backup-before-md-removal 2>/dev/null || echo "Backup branch already exists"

echo ""
echo "🔄 Removing .md files from git history (keeping README.md)..."

# Use git-filter-repo to remove all .md files except README.md
git filter-repo --invert-paths \
    --path-glob '*.md' \
    --path README.md \
    --force

echo ""
echo "✅ Complete! All .md files (except README.md) have been removed from git history."
echo ""
echo "📋 Next steps:"
echo "   1. Verify the repository looks correct"
echo "   2. Force push to remote: git push origin --force --all"
echo "   3. Notify team members to re-clone the repository"
echo ""
echo "💡 If something went wrong, restore from backup:"
echo "   git checkout backup-before-md-removal"

