# Design AI — Full Project Archive & Recovery Manifest

Generated: 2026-07-02  
Branch: `cursor/design-ai-book-ch1-11-0e50`  
Repository: `egmen1-dev/design-ai`

## Contents of This Archive

| Artifact | Description | Size (approx) |
|----------|-------------|---------------|
| `design-ai-workspace-snapshot.tar.gz` | Full workspace at fullest known state (excludes `node_modules`, `.git`, `.next`, `dist`) | ~220 MB |
| `design-ai-all-branches.bundle` | Git bundle with **132 branches** (all local + `origin/*`) | ~223 MB |
| `recovered-hung-agent-stash/untracked/` | 21 files from dangling stash commit `0ad82ab1` (untracked hung-agent work) | small |
| `recovered-hung-agent-stash/index-stash/` | 2138 files from dangling stash commit `b5b58cf3` (full staged snapshot when agent hung) | ~300 MB |
| `audit-export/` | Prior audit bundle (chapters 1–11 index, tests log, chief architect audit) | ~125 KB |

## Hung Agent Recovery (stash `audit-temp`)

The broken agent session left **unreachable git objects** (not on GitHub):

| Commit | Role | Parent |
|--------|------|--------|
| `e435fdcc` | Stash merge commit (`audit-temp`) | merge of index + untracked |
| `b5b58cf3` | Index stash — full project snapshot at hang time | `6f25ec7` (ch6.13 Rendering Stage) |
| `0ad82ab1` | Untracked files only | same base |

### Untracked files recovered (21)

- `commercial-intelligence-platform/` — early Ch11 platform implementation (11.1–11.3 engines + ecosystem registry)
- `design-ai-os/` — **incorrect scaffold** (wrong chapter naming; superseded by `design-ai-book/` + platform libs)
- `AUDIT-DESIGN-AI-OS-CHAPTERS-1-11.md` — audit doc from hung session
- `run-commercial-intelligence-specs.sh`, `run-design-ai-os-specs.sh`

### What is NOT in git / this VM

| Item | Status |
|------|--------|
| Hung agent commits `7bbe04ee`, `ddaf1ff5` | Not found anywhere in this VM |
| Ch8–10 full engine implementations | Never pushed; only registry scaffolds on `design-ai-book` branch |
| Ch11.1–11.17 full specs | Registry names only; 11.18–11.20 implemented |
| Ch7.29–7.40 | Not in any branch |
| Production v18 integration | `main` is v17.1 only |

## Restore Instructions

### 1. Workspace snapshot

```bash
tar -xzf design-ai-workspace-snapshot.tar.gz -C /path/to/restore/
cd /path/to/restore/marketplace-infographic
npm install
```

### 2. All git branches (from bundle)

```bash
git clone design-ai-all-branches.bundle design-ai-restored
cd design-ai-restored
git checkout cursor/design-ai-book-ch1-11-0e50   # fullest book state
# or: git checkout cursor/render-validator-agent-ch728-b8ae  # fullest v18 render-blueprint
```

### 3. Hung agent stash overlay

Compare and merge manually:

```bash
# Untracked-only (Ch11 early work + wrong design-ai-os scaffold)
diff -r recovered-hung-agent-stash/untracked/marketplace-infographic/src/lib/ \
        marketplace-infographic/src/lib/

# Full snapshot at hang time (base = ch6.13, before ch6.14–7.28)
diff -r recovered-hung-agent-stash/index-stash/marketplace-infographic/ \
        marketplace-infographic/
```

### 4. Reassemble split archives (if downloaded from GitHub)

```bash
cat FULL-PROJECT-ARCHIVE.tar.gz.part-* > FULL-PROJECT-ARCHIVE.tar.gz
tar -xzf FULL-PROJECT-ARCHIVE.tar.gz
```

## Canonical Branches

| Purpose | Branch |
|---------|--------|
| Full book ch1–11 (audit scaffold) | `cursor/design-ai-book-ch1-11-0e50` |
| Fullest v18 render-blueprint (120/120 tests) | `cursor/render-validator-agent-ch728-b8ae` |
| Production (v17.1 only) | `main` |

## Test Commands (after restore)

```bash
cd marketplace-infographic
./scripts/run-v18-blueprint-tests.sh          # 120 specs (ch3–7)
./scripts/run-platform-chapters-8-11-specs.sh  # 88 platform specs
./scripts/run-design-ai-book-audit.sh         # 208 total
```
