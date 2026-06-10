# Mobile App — PR Setup

## Infrastructure Note

The safety classifier (`claude-sonnet-4-6`) was temporarily unavailable during this session, which blocked all local `git add / commit / push` operations via Bash. All source file changes have been written to disk in this worktree. Run the three commands below to finalise the commit and open the PR.

---

## 1. Complete the Commit (Run in this worktree)

```bash
cd /home/aydin/Code/mercor/season_2/task_999142/model_a/.claude/worktrees/mobile-review

# Copy the lock file and binary assets from origin/mobile-app (unchanged)
git checkout origin/mobile-app -- apps/mobile/package-lock.json
git checkout origin/mobile-app -- apps/mobile/assets/

# Stage and commit
git add -A
git commit -m "harden mobile app: tags display, NotesSheet race fix, CI workflow, a11y labels

- Add tag badges to TaskCard (matches web app behaviour; supports custom colours)
- Fix race condition in NotesSheet where onBlur + Close could fire saveIfChanged concurrently
- Add .github/workflows/mobile-linter-tester.yml CI that runs on PRs touching apps/mobile/**
- Add accessibilityLabel + accessibilityRole to all Pressable/Switch elements
- Add customColor prop to Badge for project and tag custom colours
- Make MCP token value and URL selectable in SettingsSheet
- Update README with UAT instructions and CI section
- Bump mobile CHANGELOG to 0.1.3

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"

# Push to origin/mobile-app (force-with-lease to update the branch safely)
git push --force-with-lease origin worktree-mobile-review:mobile-app
```

## 2. Create the PR (Run from repo root or use GitHub web UI)

```bash
cd /home/aydin/Code/mercor/season_2/task_999142/model_a
gh pr create \
  --head mobile-app \
  --base master \
  --title "feat(mobile): harden mobile app for production — tags, race fix, CI, a11y" \
  --body-file MOBILE_PR_BODY.md
```

The PR body is in `MOBILE_PR_BODY.md` at the repo root (also in this worktree).

---

## What Was Changed

### Bug Fixes
- **NotesSheet race condition** (`src/screens/home/sheets/NotesSheet.tsx`) — added `useRef savingRef` guard so concurrent calls to `saveIfChanged` (e.g. TextInput `onBlur` fires at the same moment as the Close button callback) cannot both proceed past the change-check and double-save.

### New Features
- **Tags on task cards** (`src/screens/home/components/TaskCard.tsx`, `Badge.tsx`) — Tags from the backend are now rendered as coloured badges in the chip row, matching the web app. The `Badge` component got a new `customColor` prop (used for project and tag custom colours).
- **CI workflow** (`.github/workflows/mobile-linter-tester.yml`) — Runs `lint`, `typecheck`, and `doctor` on every PR that touches `apps/mobile/**`. Doctor is advisory (`continue-on-error: true`).

### Quality Improvements
- **Accessibility** — every `Pressable` and `Switch` in the app now has `accessibilityLabel` and `accessibilityRole`.
- **Selectable MCP text** — token value and MCP URL are `selectable` in SettingsSheet for easy clipboard copy.
- **Project colour on task cards** — project badge passes `customColor` through, so backend-assigned project colours appear on the card.

### Documentation
- **README** — updated first-boot paths, added UAT / internal distribution section, CI section.
- **CHANGELOG** — new 0.1.3 entry.
