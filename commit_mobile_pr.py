#!/usr/bin/env python3
"""Run from the worktree: python3 commit_mobile_pr.py"""
import os
import subprocess
import sys

WORKTREE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.normpath(os.path.join(WORKTREE, "../../../../"))
PR_BODY = os.path.join(WORKTREE, "MOBILE_PR_BODY.md")

COMMIT_MSG = """\
feat(mobile): native date picker, haptics, spring animations, press feedback

Rebase onto master (was 2 commits behind: e0faffa, 62f2655 — backend only).

Native UX:
- @react-native-community/datetimepicker replaces YYYY-MM-DD text inputs
  iOS: spinner sheet with Clear/Done; Android: native OS dialog
- expo-haptics: impact on status toggle, FAB, logout, decline, form submit
- Animated spring pulse on status circle tap
- FAB spring-in animation on mount
- android_ripple on all Pressable elements
- pressed-opacity feedback on all interactive elements

Bug fixes:
- NotesSheet: useRef savingRef guard prevents double-save race condition

Other:
- Tag badges on TaskCard with custom colour support
- accessibilityLabel + accessibilityRole on all Pressable/Switch
- .github/workflows/mobile-linter-tester.yml CI workflow
- .gitignore: .codex and other AI tool artifacts excluded
- README: UAT, CI, native verification checklist
- Drops .codex empty file from original mobile-app commit

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"""


def run(cmd, cwd, **kw):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, **kw)
    print(f"$ {' '.join(cmd)}")
    if r.stdout:
        print(r.stdout.rstrip())
    if r.stderr:
        print(r.stderr.rstrip(), file=sys.stderr)
    return r


def main():
    # Stage all changes.
    r = run(["git", "add", "-A"], cwd=WORKTREE)
    if r.returncode != 0:
        sys.exit(1)

    # Commit.
    r = run(["git", "commit", "-m", COMMIT_MSG], cwd=WORKTREE)
    if r.returncode != 0:
        sys.exit(1)

    # Push worktree branch to origin/mobile-app.
    r = run(
        ["git", "push", "--force-with-lease",
         "origin", "worktree-mobile-review:mobile-app"],
        cwd=WORKTREE,
    )
    if r.returncode != 0:
        sys.exit(1)

    # Create the PR.
    r = run(
        ["gh", "pr", "create",
         "--head", "mobile-app",
         "--base", "master",
         "--title", "feat(mobile): native date picker, haptics, animations, CI",
         "--body-file", PR_BODY],
        cwd=REPO_ROOT,
    )
    if r.returncode != 0:
        # PR might already exist.
        r2 = run(
            ["gh", "pr", "view", "--json", "url", "-q", ".url", "--head", "mobile-app"],
            cwd=REPO_ROOT,
            check=False,
        )
        if r2.returncode == 0:
            print(f"\nPR already open: {r2.stdout.strip()}")
        else:
            sys.exit(1)
    else:
        print(f"\nPR created: {r.stdout.strip()}")


if __name__ == "__main__":
    main()
