# Online Resume — Technical Design Document

> **Owner:** Liang Xi (AI Infrastructure Engineer)  
> **Repository:** [Liang-Xi-Infra/liang-xi-infra.github.io](https://github.com/Liang-Xi-Infra)  
> **Status:** Draft | **Version:** 1.0.0 | **Date:** 2026-06-28

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack & Rationale](#2-technology-stack--rationale)
3. [Project Directory Structure](#3-project-directory-structure)
4. [Data-Driven Content Management](#4-data-driven-content-management)
5. [Component Architecture](#5-component-architecture)
6. [Infra Signature Features](#6-infra-signature-features)
7. [CI/CD Automation Pipeline](#7-cicd-automation-pipeline)
8. [Performance Strategy](#8-performance-strategy)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    DATA LAYER (YAML)                      │
│  basics.yaml  experience.yaml  skills.yaml  projects.yaml │
│  education.yaml          resume/config.ts (Zod schemas)   │
└──────────────────────┬───────────────────────────────────┘
                       │ import (type-safe)
┌──────────────────────▼───────────────────────────────────┐
│                 ASTRO SSG BUILD PIPELINE                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Header   │  │Experience│  │  Skills  │  │ Terminal │ │
│  │ (static)  │  │ (static) │  │ (static) │  │ (island) │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│                 Output: Zero-JS Static HTML                │
└──────────────────────┬───────────────────────────────────┘
                       │ deploy
┌──────────────────────▼───────────────────────────────────┐
│              GITHUB PAGES (CDN-backed)                     │
│         https://liang-xi-infra.github.io                   │
└──────────────────────────────────────────────────────────┘
```

**Core design principles:**

- **Content is data, not markup.** Resume information lives in YAML files. Pages are pure rendering templates.
- **Build-time, not runtime.** Everything that can be pre-computed is pre-computed. The output is static HTML with zero mandatory JavaScript.
- **Islands of interactivity.** xterm.js terminal and GitHub heatmap are the only client-side components. They load lazily and never block the initial render.
- **Pipeline as quality gate.** CI runs Lighthouse assertions. Performance regressions block deploy.

---

## 2. Technology Stack & Rationale

### 2.1 Final Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| SSG Framework | Astro | 5.x |
| Styling | Tailwind CSS | 4.x |
| Type System | TypeScript | 5.x |
| Content Validation | Zod | 3.x |
| Data Format | YAML | — |
| Terminal Emulator | xterm.js | 5.x |
| CI/CD | GitHub Actions | — |
| Hosting | GitHub Pages | — |
| Quality Gate | Lighthouse CI | — |

### 2.2 Why Not the Alternatives

| Alternative | Verdict | Reason |
|-------------|---------|--------|
| **Hugo** | Rejected | Go template system is less composable; YAML data handling less type-safe; no native partial hydration |
| **Next.js** | Rejected | React runtime is unnecessary overhead for a content site; >100KB JS baseline for what should be <5KB |
| **Pure HTML** | Rejected | No component reuse; manual data duplication; no content collection validation |
| **Jekyll** | Rejected | Ruby dependency chain; slow build; limited component model |

### 2.3 Why Astro Wins for This Use Case

1. **Content Collections** — type-safe, Zod-validated data layer built into the framework. A misspelled YAML key fails at build time, not at page load.
2. **Islands Architecture** — 99% of the page is static HTML. Only the Terminal widget and GitHub heatmap ship JavaScript. This is the correct architecture for a resume site.
3. **SSG-first, not SSG-bolted-on** — unlike Next.js which started as SSR, Astro was designed for static output from day one.
4. **Framework agnostic** — Terminal widget can use vanilla JS; heatmap can use Preact or vanilla Canvas API; no framework lock-in.
5. **Build performance** — Vite-powered HMR during development; sub-second builds in production.

---

## 3. Project Directory Structure

```
online-resume/
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml              # Production deploy pipeline
│   │   └── preview.yml             # PR preview deploy
│   └── lighthouserc.json           # Lighthouse CI assertions
├── public/
│   ├── favicon.svg
│   ├── og-image.png
│   └── .nojekyll                   # Disable Jekyll on GitHub Pages
├── src/
│   ├── content/
│   │   ├── config.ts               # Content collection schemas (Zod)
│   │   └── resume/
│   │       ├── basics.yaml          # Personal info, contact, social
│   │       ├── experience.yaml      # Work history timeline
│   │       ├── skills.yaml          # Skill categories with levels
│   │       ├── education.yaml       # Education background
│   │       └── projects.yaml        # Side projects / open source
│   ├── components/
│   │   ├── layout/
│   │   │   ├── BaseLayout.astro    # Root layout: SEO, OG, structure
│   │   │   └── Section.astro       # Reusable section wrapper
│   │   ├── resume/
│   │   │   ├── Header.astro        # Name, title, contact links
│   │   │   ├── About.astro         # Bio paragraph
│   │   │   ├── Experience.astro    # Timeline with highlights
│   │   │   ├── Skills.astro        # Skill grid with progress bars
│   │   │   ├── Education.astro     # Education cards
│   │   │   └── Projects.astro      # Project cards
│   │   ├── terminal/
│   │   │   └── Terminal.astro      # xterm.js island component
│   │   └── github/
│   │       └── ContributionGraph.astro  # Canvas heatmap island
│   ├── pages/
│   │   ├── index.astro             # Main resume page
│   │   └── terminal.astro          # Full-screen terminal mode
│   ├── lib/
│   │   ├── commands.ts             # Terminal command definitions
│   │   ├── github-api.ts           # GitHub GraphQL client
│   │   └── utils.ts                # Shared utilities
│   ├── styles/
│   │   └── global.css              # Tailwind directives + theme
│   └── types/
│       └── resume.ts               # Inferred types from Zod schemas
├── astro.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 4. Data-Driven Content Management

### 4.1 Design Philosophy

**Single source of truth → `src/content/resume/`**

Every piece of resume information is stored as structured YAML. Astro components are "dumb renderers" — they receive typed props and produce HTML. Updating the resume means editing a YAML file, never touching markup.

### 4.2 Zod Schema Definitions

All schemas are defined in `src/content/config.ts` using Zod via Astro's `defineCollection`:

```typescript
import { z, defineCollection } from "astro:content";

const basicsSchema = z.object({
  name: z.string(),
  title: z.string(),
  tagline: z.string(),
  location: z.string(),
  email: z.string().email(),
  github: z.string().url(),
  linkedin: z.string().url().optional(),
  avatar: z.string().optional(),
  social: z.array(z.object({
    platform: z.string(),
    url: z.string().url(),
  })).optional(),
});

const experienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  period: z.string(),
  highlights: z.array(z.string()),
  tech: z.array(z.string()),
});

// ... similar for skills, education, projects
```

**Type-safety guarantee:** Astro generates TypeScript types from these Zod schemas. A typo in a YAML file is caught at `astro check` time — it will never reach production.

### 4.3 Updating Content (Example Workflow)

```bash
# 1. Edit the YAML
vim src/content/resume/experience.yaml

# 2. Verify correctness locally
npm run astro check    # Type-check content against Zod schemas
npm run dev            # Preview in browser at localhost:4321

# 3. Ship it
git add src/content/resume/experience.yaml
git commit -m "update: add new role at CompanyX"
git push origin main
# → GitHub Actions auto-builds + deploys (~45 seconds)
```

---

## 5. Component Architecture

### 5.1 Component Tree

```
BaseLayout.astro
├── Header.astro            ← name, title, social links
├── About.astro             ← bio paragraph
├── Section.astro ("Experience")
│   └── Experience.astro[]  ← timeline entries
├── Section.astro ("Skills")
│   └── Skills.astro        ← skill categories grid
├── Section.astro ("Projects")
│   └── Projects.astro[]    ← project cards
├── Section.astro ("Education")
│   └── Education.astro[]   ← education cards
├── ContributionGraph.astro ← client:visible island
└── Terminal.astro          ← client:idle island (minimized entry)
```

### 5.2 Rendering Modes

| Component | Mode | Rationale |
|-----------|------|-----------|
| Header, About, Experience, Skills, Education, Projects | `static` (SSG only) | Pure content display, zero JS needed |
| ContributionGraph | `client:visible` | Only loads Canvas JS when scrolled into viewport |
| Terminal | `client:idle` | Lowest priority; loads after main thread is idle |

### 5.3 Data Flow

```
YAML files ──import──► Astro page (index.astro)
                         │
                         ├──► Header (props: basics)
                         ├──► About (props: basics.bio)
                         ├──► Experience (props: experience[])
                         ├──► Skills (props: skills.categories[])
                         ├──► Education (props: education[])
                         └──► Projects (props: projects[])
```

No global state. No data fetching at runtime (except the GitHub heatmap island). Pure function components receiving typed props.

---

## 6. Infra Signature Features

### 6.1 Terminal Emulator (`/terminal`)

**Why:** A terminal is the universal interface of infrastructure engineers. Browsing a resume via shell commands is a signal of tribe membership.

**Implementation:**

- **Rendering:** xterm.js with `addon-fit` for responsive resizing
- **Command parser:** Simple tokenizer + switch/case dispatch (no heavy framework)
- **Commands implemented:**

| Command | Behavior |
|---------|----------|
| `help` | List all commands with descriptions |
| `whoami` | Print name + title |
| `cat experience` | Print work history with syntax highlighting |
| `cat skills` | Print skill matrix |
| `ls projects` | List projects with descriptions |
| `ls skills/` | List skill categories |
| `ls skills/<category>` | Expand specific category |
| `contact` | Print contact info with ASCII QR hint |
| `neofetch` | ASCII art logo + system info (tech stack as "system specs") |
| `github` | Quick GitHub stats summary |
| `clear` | Clear terminal |
| `banner` | Print ASCII art banner |
| `exit` | Return to main resume page |

**ASCII Banner Design:**

```
  _     _    _                 __  _       __        ___ ____  ____
 | |   (_)__(_) __ _  __  __  / /_(_)___  / /____   /  _/ __ \/ __/
 | |  / / _  / _  / / / / / / / __/ / __/ / __/ _ \  / // /_/ / /_/
 | |_/ / / / / , / / /_/ / / /_/ / / / / /_/  __/_/ / _, _/ __/
  \___/_/_/ /_/|_|  \__, /  \____/ \__/  \__/\___/___/_/ |_/_/
                   /____/          AI INFRASTRUCTURE ENGINEER
```

### 6.2 GitHub Contribution Heatmap (on main page)

**Why:** For an engineer, GitHub activity is a live resume supplement. Showing it directly is more authentic than describing it.

**Architecture:**

1. **Data fetch:** GitHub GraphQL API v4 (`contributionsCollection`) via build-time script or edge function
2. **Fallback strategy:** Cache response in build output; if API is unavailable, hide the component gracefully
3. **Rendering:** Custom `<canvas>` element, 52×7 grid matching GitHub's own heatmap design
4. **Interaction:** Hover tooltip showing date + contribution count; click opens GitHub profile
5. **Performance:** Component is `client:visible`; API response is inlined into HTML at build time when possible, avoiding a runtime network call

**GraphQL Query:**

```graphql
query($username: String!) {
  user(login: $username) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
            color
          }
        }
      }
    }
    repositories(first: 6, orderBy: {field: STARGAZERS, direction: DESC}) {
      nodes { name, stargazerCount, description, primaryLanguage { name } }
    }
  }
}
```

### 6.3 Future: Local AI "Interviewer" (v2 Roadmap)

A browser-local LLM (WebLLM / ONNX Runtime Web) loaded as a chat widget. The model receives the resume as a system prompt and acts as a mock interviewer. This is deferred to a future iteration due to model size constraints (~500MB download) and WebGPU browser requirements.

---

## 7. CI/CD Automation Pipeline

### 7.1 Pipeline Stages

```
Trigger: Push to main / PR opened
         │
         ▼
┌─────────────────────┐
│ 1. Checkout + Setup  │
│    Node 22, npm ci   │
└────────┬────────────┘
         ▼
┌─────────────────────┐
│ 2. Type Check + Lint │
│    astro check       │
│    astro sync        │
└────────┬────────────┘
         ▼
┌─────────────────────┐
│ 3. Build             │
│    astro build       │
└────────┬────────────┘
         ▼
┌─────────────────────┐
│ 4. Lighthouse CI     │
│    Perf ≥ 95         │
│    SEO  ≥ 95         │
│    A11y ≥ 95         │
│    BP   ≥ 95         │
│    FCP  ≤ 1.5s       │
│    LCP  ≤ 2.5s       │
└────────┬────────────┘
         ▼
┌─────────────────────┐
│ 5. Deploy            │
│    GitHub Pages      │
│    (on main only)    │
└─────────────────────┘
```

### 7.2 Environment Variables & Secrets

| Variable | Purpose | Set In |
|----------|---------|--------|
| `PUBLIC_GITHUB_TOKEN` | GitHub API authentication for heatmap | GitHub Secrets |
| `CF_API_TOKEN` | Cloudflare API (PR previews) | GitHub Secrets |
| `CF_ACCOUNT_ID` | Cloudflare account ID (PR previews) | GitHub Secrets |

### 7.3 Branch Strategy

| Branch | Purpose | Deploy Target |
|--------|---------|---------------|
| `main` | Production resume | `liang-xi-infra.github.io` |
| `feat/*` | Feature branches | Cloudflare Pages Preview |
| `content/*` | Content-only updates | Skip heavy checks (future optimization) |

---

## 8. Performance Strategy

### 8.1 Performance Budget

| Metric | Target | Enforcement |
|--------|--------|-------------|
| Lighthouse Performance | ≥ 95 | CI assertion (error) |
| Lighthouse SEO | ≥ 95 | CI assertion (error) |
| Lighthouse Accessibility | ≥ 95 | CI assertion (error) |
| Lighthouse Best Practices | ≥ 95 | CI assertion (error) |
| First Contentful Paint | ≤ 1.5s | CI assertion (error) |
| Largest Contentful Paint | ≤ 2.5s | CI assertion (error) |
| Total JS size | ≤ 60KB (gzipped) | Manual review |
| Total CSS size | ≤ 10KB (gzipped) | Tailwind JIT guarantees this |

### 8.2 Optimization Techniques

1. **Zero JS by default** — every resume section is a static Astro component. No hydration.
2. **Font subsetting** — use `@fontsource` with Latin-only subset; no Google Fonts external request
3. **Image optimization** — Astro's built-in `<Image />` component for responsive `srcset` + WebP/AVIF
4. **CSS pruning** — Tailwind JIT removes all unused utility classes; output is <5KB
5. **No frameworks shipped** — the main page loads zero JavaScript frameworks. xterm.js is only loaded on `/terminal` route.
6. **Preload critical path** — `<link rel="preload">` for the primary font file
7. **Static `og:image`** — pre-generated at build time, no runtime generation

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Day 1)

- [x] Initialize Astro project with TypeScript + Tailwind
- [x] Set up Content Collections with Zod schemas
- [x] Create all YAML data files
- [x] Build static components: Header, About, Experience, Skills, Education, Projects
- [x] Build BaseLayout with SEO meta tags + OG tags
- [x] Create `index.astro` page (main resume)
- [x] Configure `astro.config.ts` for GitHub Pages deployment

### Phase 2: Infra Features (Day 2)

- [x] Build xterm.js Terminal component with command system
- [x] Create `/terminal` full-screen route
- [x] Add mini-terminal entry point on main page
- [x] Build GitHub contribution heatmap component
- [x] Integrate GitHub GraphQL API for live data

### Phase 3: CI/CD (Day 2-3)

- [x] Create `deploy.yml` workflow
- [x] Create `preview.yml` workflow
- [x] Configure Lighthouse CI assertions
- [x] First deploy to GitHub Pages
- [x] Validate Lighthouse scores pass all gates

### Phase 4: Polish (Day 3)

- [x] Responsive design audit (mobile, tablet, desktop)
- [x] Dark/light theme toggle
- [x] Cross-browser testing
- [x] Print stylesheet (`@media print`)
- [x] Custom 404 page

---

## Appendix A: Key Dependencies

```json
{
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/tailwind": "^6.0.0",
    "@xterm/xterm": "^5.5.0",
    "@xterm/addon-fit": "^0.10.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/typography": "^0.5.0"
  }
}
```

## Appendix B: References

- [Astro Documentation](https://docs.astro.build)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [xterm.js Documentation](https://xtermjs.org/docs/)
- [GitHub GraphQL API Explorer](https://docs.github.com/en/graphql/overview/explorer)
- [GitHub Pages Deployment (Astro Guide)](https://docs.astro.build/en/guides/deploy/github/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
