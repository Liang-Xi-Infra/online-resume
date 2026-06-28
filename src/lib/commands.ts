/**
 * Terminal command definitions and response generators.
 * All resume data is passed in at init time (serialized from build-time YAML imports).
 */

export interface ResumeData {
  basics: {
    name: string;
    title: string;
    tagline: string;
    location: string;
    email: string;
    github: string;
    linkedin?: string;
    phone?: string;
    social?: { platform: string; url: string }[];
  };
  experience: {
    company: string;
    role: string;
    period: string;
    highlights: string[];
    tech: string[];
  }[];
  skills: {
    categories: {
      name: string;
      items: { name: string; level?: number }[];
    }[];
  };
  education: {
    school: string;
    degree: string;
    field: string;
    period: string;
    highlights?: string[];
  }[];
  projects: {
    name: string;
    description: string;
    url?: string;
    github?: string;
    stars?: number;
    tech: string[];
    highlights?: string[];
  }[];
}

const ASCII_BANNER = [
  "  _     _    _                 __  _       __        ___ ____  ____ ",
  " | |   (_)__(_) __ _  __  __  / /_(_)___  / /____   /  _/ __ \\/ __/",
  " | |  / / _  / _  / / / / / / / __/ / __/ / __/ _ \\  / // /_/ / /_/ ",
  " | |_/ / / / / , / / /_/ / / /_/ / / / / /_/  __/_/ / _, _/ __/  ",
  "  \\___/_/_/ /_/|_|  \\__, /  \\____/ \\__/  \\__/\\___/___/_/ |_/_/   ",
  "                   /____/          AI INFRASTRUCTURE ENGINEER       ",
];

const HELP_TEXT = [
  "╔══════════════════════════════════════════════════════╗",
  "║              AVAILABLE COMMANDS                      ║",
  "╠══════════════════════════════════════════════════════╣",
  "║  whoami          Display profile summary            ║",
  "║  cat experience  Show work history                  ║",
  "║  cat skills      Show skill matrix                  ║",
  "║  cat education   Show education background          ║",
  "║  ls projects     List open-source projects          ║",
  "║  ls skills/      List skill categories              ║",
  "║  ls skills/<cat> Show skills in a category          ║",
  "║  contact         Show contact information           ║",
  "║  github          Show GitHub stats summary          ║",
  "║  neofetch        Display system info (tech stack)   ║",
  "║  banner          Print ASCII art banner             ║",
  "║  clear           Clear terminal                     ║",
  "║  exit            Return to main resume page         ║",
  "║  help            Show this help message             ║",
  "╚══════════════════════════════════════════════════════╝",
];

type Color = "green" | "blue" | "cyan" | "red" | "yellow" | "magenta" | "white" | "dim";

const ANSI: Record<Color, string> = {
  green: "\x1b[32m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
  dim: "\x1b[90m",
};

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function c(text: string, color: Color): string {
  return `${ANSI[color]}${text}${RESET}`;
}

function section(title: string): string {
  return `\n${c(BOLD + title, "cyan")}\n${"─".repeat(title.length)}\n`;
}

function bullet(items: string[]): string {
  return items.map((i) => `  ${c("●", "blue")} ${i}`).join("\n");
}

function whoami(data: ResumeData): string {
  const lines: string[] = [];
  lines.push(section("PROFILE"));
  lines.push(`  ${c("Name:", "dim")}      ${data.basics.name}`);
  lines.push(`  ${c("Role:", "dim")}      ${data.basics.title}`);
  lines.push(`  ${c("Location:", "dim")}  ${data.basics.location}`);
  lines.push(`  ${c("Tagline:", "dim")}   ${data.basics.tagline}`);
  return lines.join("\n");
}

function catExperience(data: ResumeData): string {
  const lines: string[] = [];
  lines.push(section("WORK EXPERIENCE"));
  data.experience.forEach((exp, idx) => {
    lines.push(`  ${c(`${exp.role}`, "yellow")} ${c("@", "dim")} ${c(exp.company, "green")}`);
    lines.push(`  ${c(exp.period, "dim")}`);
    exp.highlights.forEach((h) => {
      lines.push(`    ${c("▸", "blue")} ${h}`);
    });
    lines.push(`  ${c("Tech:", "dim")} ${exp.tech.map((t) => c(t, "magenta")).join("  ")}`);
    if (idx < data.experience.length - 1) lines.push("");
  });
  return lines.join("\n");
}

function catSkills(data: ResumeData): string {
  const lines: string[] = [];
  lines.push(section("SKILL MATRIX"));
  data.skills.categories.forEach((cat) => {
    lines.push(`  ${c(cat.name, "yellow")}`);
    cat.items.forEach((item) => {
      const bar = item.level != null ? "█".repeat(Math.round(item.level / 10)) + "░".repeat(10 - Math.round(item.level / 10)) : "";
      const levelStr = item.level != null ? ` ${c(`[${bar}]`, "dim")} ${item.level}%` : "";
      lines.push(`    ${c("▸", "blue")} ${item.name}${levelStr}`);
    });
    lines.push("");
  });
  return lines.join("\n");
}

function catEducation(data: ResumeData): string {
  const lines: string[] = [];
  lines.push(section("EDUCATION"));
  data.education.forEach((edu) => {
    lines.push(`  ${c(edu.degree, "yellow")} in ${c(edu.field, "green")}`);
    lines.push(`  ${c(edu.school, "white")}  ${c(edu.period, "dim")}`);
    if (edu.highlights) {
      edu.highlights.forEach((h) => lines.push(`    ${c("▸", "blue")} ${h}`));
    }
    lines.push("");
  });
  return lines.join("\n");
}

function lsSkills(args: string[], data: ResumeData): string {
  const category = args[0]?.toLowerCase();

  if (!category) {
    // List all categories
    const lines: string[] = [section("SKILL CATEGORIES")];
    data.skills.categories.forEach((cat) => {
      lines.push(`  ${c("▸", "blue")} ${cat.name} ${c(`(${cat.items.length} skills)`, "dim")}`);
    });
    lines.push(`\n  ${c("Usage: ls skills/<category>", "dim")}`);
    return lines.join("\n");
  }

  // Show specific category
  const cat = data.skills.categories.find(
    (c) => c.name.toLowerCase().includes(category)
  );
  if (!cat) {
    return `${c("error:", "red")} category "${category}" not found. Run ${c("ls skills/", "cyan")} to list categories.`;
  }

  const lines: string[] = [section(cat.name.toUpperCase())];
  cat.items.forEach((item) => {
    const bar = item.level != null ? "█".repeat(Math.round(item.level / 10)) + "░".repeat(10 - Math.round(item.level / 10)) : "";
    const levelStr = item.level != null ? ` ${c(`[${bar}]`, "dim")} ${item.level}%` : "";
    lines.push(`  ${c("▸", "blue")} ${item.name}${levelStr}`);
  });
  return lines.join("\n");
}

function lsProjects(data: ResumeData): string {
  const lines: string[] = [section("PROJECTS")];
  data.projects.forEach((proj) => {
    lines.push(`  ${c(proj.name, "yellow")}`);
    if (proj.stars != null) {
      lines.push(`    ${c("★", "yellow")} ${proj.stars} stars  ${c(proj.description, "dim")}`);
    } else {
      lines.push(`    ${c(proj.description, "dim")}`);
    }
    lines.push(`    ${c("Tech:", "dim")} ${proj.tech.map((t) => c(t, "magenta")).join("  ")}`);
    if (proj.github) {
      lines.push(`    ${c("Repo:", "dim")} ${proj.github}`);
    }
    lines.push("");
  });
  return lines.join("\n");
}

function contact(data: ResumeData): string {
  const lines: string[] = [section("CONTACT")];
  lines.push(`  ${c("Email:", "dim")}    ${data.basics.email}`);
  lines.push(`  ${c("GitHub:", "dim")}   ${data.basics.github}`);
  if (data.basics.linkedin) {
    lines.push(`  ${c("LinkedIn:", "dim")} ${data.basics.linkedin}`);
  }
  if (data.basics.social) {
    data.basics.social.forEach((s) => {
      lines.push(`  ${c(s.platform + ":", "dim")} ${s.url}`);
    });
  }
  lines.push("");
  lines.push(`  ${c("┌──────────────────────────────┐", "dim")}`);
  lines.push(`  ${c("│", "dim")}  █▀▀▀▀▀█ █ ▄▀ █ ▄▀ █▀▀▀▀▀█  ${c("│", "dim")}`);
  lines.push(`  ${c("│", "dim")}  █ ███ █ ▀▄▀ █ ▀▄▀ █ ███ █  ${c("│", "dim")}`);
  lines.push(`  ${c("│", "dim")}  █ ▀▀▀ █ ▀ ▄ █ ▀█▀ █ ▀▀▀ █  ${c("│", "dim")}`);
  lines.push(`  ${c("│", "dim")}  ▀▀▀▀▀▀▀ █▄▀ █ █▄█ ▀▀▀▀▀▀▀  ${c("│", "dim")}`);
  lines.push(`  ${c("│", "dim")}  [ scan to add contact ]      ${c("│", "dim")}`);
  lines.push(`  ${c("└──────────────────────────────┘", "dim")}`);
  return lines.join("\n");
}

function githubStats(data: ResumeData): string {
  const lines: string[] = [section("GITHUB STATS")];
  const totalStars = data.projects.reduce((sum, p) => sum + (p.stars ?? 0), 0);
  lines.push(`  ${c("Username:", "dim")}   ${data.basics.github.split("/").pop()}`);
  lines.push(`  ${c("Repos:", "dim")}      ${data.projects.length} featured projects`);
  lines.push(`  ${c("Total Stars:", "dim")} ${totalStars}`);
  lines.push(`  ${c("Profile:", "dim")}    ${data.basics.github}`);
  lines.push("");
  lines.push(`  ${c("▸", "blue")} ${c("Live contribution heatmap available on main resume page", "dim")}`);
  return lines.join("\n");
}

function neofetch(data: ResumeData): string {
  const lines: string[] = [];
  const logo = [
    "      █████████      ",
    "    █████████████    ",
    "   ███████████████   ",
    "  █████████████████  ",
    "  █████████████████  ",
    "  █████████████████  ",
    "   ███████████████   ",
    "    █████████████    ",
    "      █████████      ",
  ];

  const info = [
    `${c(data.basics.name, "yellow")} ${c("@", "dim")} ${c("Liang-Xi-Infra", "green")}`,
    `${c("───────────────", "dim")}`,
    `${c("Role:", "blue")}     大模型推理工程师 @ EVAS`,
    `${c("Framework:", "blue")} vLLM / PyTorch / torch.compile`,
    `${c("Compiler:", "blue")}  MLIR / XLA / OpenXLA / Triton`,
    `${c("Kernel:", "blue")}    Custom CUDA / CCL / AI-Chip Ops`,
    `${c("Models:", "blue")}    Qwen2/3 (0.6B-32B) / Llama2 (7B/70B)`,

    `${c("Deploy:", "blue")}    DP/TP/CP/DCP / SPMD Mesh 切分`,
    `${c("Editor:", "blue")}    Neovim + VS Code + Copilot`,
    `${c("Projects:", "blue")}  ${data.projects.length} 个核心项目`,
  ];

  const maxLen = Math.max(logo.length, info.length);
  for (let i = 0; i < maxLen; i++) {
    const logoLine = logo[i] ?? " ".repeat(logo[0].length);
    const infoLine = info[i] ?? "";
    lines.push(`  ${c(logoLine, "cyan")}    ${infoLine}`);
  }
  return lines.join("\n");
}

// ── Command Router ─────────────────────────────────────────────

export function executeCommand(input: string, data: ResumeData): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const [cmd, ...args] = trimmed.split(/\s+/);
  const rest = args.join(" ");

  switch (cmd.toLowerCase()) {
    case "help":
      return HELP_TEXT.join("\n");

    case "whoami":
      return whoami(data);

    case "banner":
      return c(ASCII_BANNER.join("\n"), "cyan");

    case "cat":
      switch (rest) {
        case "experience": return catExperience(data);
        case "skills": return catSkills(data);
        case "education": return catEducation(data);
        default: return `${c("error:", "red")} unknown file "${rest}". Try: cat experience | skills | education`;
      }

    case "ls":
      if (rest.startsWith("skills")) {
        const skillArgs = rest.replace(/^skills\/?\s*/, "").trim();
        return lsSkills(skillArgs ? [skillArgs] : [], data);
      }
      if (rest === "projects" || rest === "projects/") {
        return lsProjects(data);
      }
      return `${c("error:", "red")} unknown path "${rest}". Try: ls projects | ls skills/`;

    case "contact":
      return contact(data);

    case "github":
      return githubStats(data);

    case "neofetch":
      return neofetch(data);

    case "clear":
      return "__CLEAR__";

    case "exit":
      return "__EXIT__";

    default:
      return [
        `${c("bash:", "red")} ${c(`command not found: ${cmd}`, "white")}`,
        `Type ${c("help", "cyan")} to list available commands.`,
      ].join("\n");
  }
}

export function getPrompt(): string {
  return `\n${c("➜", "green")}  ${c("~", "blue")} `;
}

export function getWelcome(data: ResumeData): string {
  return [
    c(ASCII_BANNER.join("\n"), "cyan"),
    "",
    `${c("Welcome,", "white")} ${c(data.basics.name, "yellow")}`,
    `${c("Type", "dim")} ${c("help", "cyan")} ${c("to explore this resume in terminal mode.", "dim")}`,
    "",
  ].join("\n");
}
