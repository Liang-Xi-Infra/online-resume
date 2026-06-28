/**
 * GitHub GraphQL API client for fetching contribution data.
 * Used at build time (SSG) to pre-fetch and inline data into HTML.
 */

export interface ContributionDay {
  date: string;
  count: number;
  color: string;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionWeek {
  days: ContributionDay[];
}

export interface GitHubStats {
  totalContributions: number;
  weeks: ContributionWeek[];
  username: string;
  fetchedAt: string;
}

const QUERY = `
query($username: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $username) {
    contributionsCollection(from: $from, to: $to) {
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
      nodes {
        name
        stargazerCount
        description
        primaryLanguage { name }
      }
    }
  }
}
`;

function mapColorToLevel(color: string): 0 | 1 | 2 | 3 | 4 {
  if (color === "#ebedf0") return 0;
  if (color === "#9be9a8") return 1;
  if (color === "#40c463") return 2;
  if (color === "#30a14e") return 3;
  if (color === "#216e39") return 4;
  return 0;
}

export async function fetchGitHubStats(
  username: string,
  token?: string
): Promise<GitHubStats | null> {
  if (!token) {
    console.warn("[github-api] No PUBLIC_GITHUB_TOKEN set — skipping API fetch");
    return null;
  }

  const now = new Date();
  const from = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString();
  const to = now.toISOString();

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: QUERY, variables: { username, from, to } }),
    });

    if (!res.ok) {
      console.error(`[github-api] HTTP ${res.status}: ${await res.text()}`);
      return null;
    }

    const json = await res.json();
    if (json.errors) {
      console.error("[github-api] GraphQL errors:", json.errors);
      return null;
    }

    const calendar = json.data?.user?.contributionsCollection?.contributionCalendar;
    if (!calendar) return null;

    const weeks: ContributionWeek[] = calendar.weeks.map((w: any) => ({
      days: w.contributionDays.map((d: any) => ({
        date: d.date,
        count: d.contributionCount,
        color: d.color,
        level: mapColorToLevel(d.color),
      })),
    }));

    return {
      totalContributions: calendar.totalContributions,
      weeks,
      username,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[github-api] Fetch error:", err);
    return null;
  }
}
