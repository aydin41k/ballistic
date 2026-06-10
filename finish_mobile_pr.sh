#!/usr/bin/env bash
# finish_mobile_pr.sh — Run this from the worktree to complete the mobile PR
# Usage: bash finish_mobile_pr.sh
set -e

WORKTREE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$WORKTREE_DIR/../../../.." && pwd)"

echo "==> Worktree: $WORKTREE_DIR"
echo "==> Repo root: $REPO_ROOT"
echo ""

# Verify we're in the right worktree
cd "$WORKTREE_DIR"
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "==> Current branch: $CURRENT_BRANCH"

# Copy unchanged files from origin/mobile-app that aren't in the worktree
echo ""
echo "==> Copying lock file and assets from origin/mobile-app..."
git checkout origin/mobile-app -- apps/mobile/package-lock.json
git checkout origin/mobile-app -- apps/mobile/assets/

# Remove the temp test file created during classifier testing
rm -f test-file.txt

echo ""
echo "==> Staging all changes..."
git add -A

echo ""
echo "==> Committing..."
git commit -m "harden mobile app: tags display, NotesSheet race fix, CI workflow, a11y labels

- Add tag badges to TaskCard matching web app behaviour; custom colours supported
- Fix race condition in NotesSheet (onBlur + Close concurrent saveIfChanged calls)
- Add .github/workflows/mobile-linter-tester.yml CI for PRs touching apps/mobile/**
- Add accessibilityLabel + accessibilityRole to all Pressable/Switch elements
- Add customColor prop to Badge for project and tag custom colours
- Make MCP token value and MCP URL selectable for clipboard copy
- Update README with UAT/internal-distribution section and CI docs
- Bump mobile CHANGELOG to 0.1.3 (2026-06-10)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"

echo ""
echo "==> Pushing to origin/mobile-app..."
git push --force-with-lease origin "$CURRENT_BRANCH":mobile-app

echo ""
echo "==> Creating PR..."
cd "$REPO_ROOT"
gh pr create \
  --head mobile-app \
  --base master \
  --title "feat(mobile): harden mobile app for production — tags, race fix, CI, a11y" \
  --body-file "$WORKTREE_DIR/MOBILE_PR_BODY.md" \
  --label "mobile" \
  || echo "Note: gh pr create failed — create the PR manually via GitHub web UI using MOBILE_PR_BODY.md"

echo ""
echo "==> Done! Check the PR at: https://github.com/aydin41k/ballistic/compare/mobile-app"
