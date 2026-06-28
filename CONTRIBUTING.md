# Contributing

How to update your online resume and deploy changes.

## Updating Content

**One rule: edit YAML, never touch components.**

| Want to change | Edit this file |
|---------------|----------------|
| Name / title / phone / email / GitHub | `src/content/basics/basics.yaml` |
| Work experience (company, role, highlights) | `src/content/experience/experience.yaml` |
| Skills or proficiency levels | `src/content/skills/skills.yaml` |
| Education background | `src/content/education/education.yaml` |
| Projects | `src/content/projects/projects.yaml` |

**YAML formatting rules:**
- Indent with 2 spaces, never tabs
- Field names must match the Zod schema in `src/content/config.ts` (typos fail at build time)
- Use `- "text"` for list items

**Example — adding a new project:**

```yaml
# Append to src/content/projects/projects.yaml:
- name: "New Project Name"
  description: "One-line summary"
  period: "2026/07 ~ present"
  tech:
    - "Tech A"
    - "Tech B"
  highlights:
    - "Key outcome 1"
    - "Key outcome 2"
```

## Build & Preview

```bash
cd /home/loanx/online-resume

# Hot-reload dev server (save to refresh)
npm run dev                  # → http://localhost:4321

# Build only (check for errors)
npm run build                # → output in dist/

# Build + preview production output
npm run build && npm run preview
```

## Deployment Workflow

```bash
vim src/content/experience/experience.yaml   # 1. Edit content
npm run dev                                   # 2. Preview in browser (auto hot-reload)
# ... when satisfied ...
git add -A
git commit -m "update: describe what changed" # 3. Commit
git push origin main                          # 4. Trigger auto-deploy
```

Push to `main` triggers GitHub Actions: `astro build` → Lighthouse CI → deploy to GitHub Pages (~45 seconds).

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/). The CI pipeline validates commit messages on push.

**Format:**

```
<type>: <short description>
```

**Valid types:**

- **`content`** — Editing resume data (YAML files)
- **`feat`** — New feature or component
- **`fix`** — Bug fix
- **`style`** — UI/styling changes (Tailwind, layout)
- **`refactor`** — Code restructuring without behavior change
- **`docs`** — Documentation only
- **`ci`** — CI/CD pipeline changes
- **`chore`** — Build config, dependencies, etc.

**Examples:**

```bash
git commit -m "content: update experience and skills"
git commit -m "feat: add terminal interactive mode"
git commit -m "style: adjust header layout to left-right split"
git commit -m "fix: correct Zod schema for optional fields"
git commit -m "ci: add Lighthouse performance gate"
```

**Enforcement:** A pre-commit hook validates the message format locally. A CI check blocks non-conforming commits from merging.

```bash
# Install the pre-commit hook
cp .githooks/commit-msg .git/hooks/commit-msg && chmod +x .git/hooks/commit-msg
```

## Project Structure

```
src/
├── content/           # Data layer (YAML + Zod schemas) — edit here
│   ├── config.ts      # Zod validation schemas
│   ├── basics/        # Personal info
│   ├── experience/    # Work history
│   ├── skills/        # Skill matrix
│   ├── education/     # Education
│   └── projects/      # Projects
├── components/        # Rendering layer — do not edit unless changing layout
│   ├── layout/        # BaseLayout, Section wrappers
│   ├── resume/        # Header, Experience, Skills, Education, Projects
│   ├── terminal/      # xterm.js interactive terminal
│   └── github/        # Contribution heatmap
├── pages/
│   ├── index.astro    # Main resume page
│   └── terminal.astro # Full-screen terminal mode
├── lib/               # Utilities (terminal commands, GitHub API client)
└── styles/            # Global CSS + Tailwind
```

## CI/CD Pipeline

```
Git Push (main) → GitHub Actions
  ├── Checkout + Setup Node
  ├── npm ci + astro build
  ├── Lighthouse CI (perf/SEO/a11y ≥ 95)
  └── Deploy to GitHub Pages
```
