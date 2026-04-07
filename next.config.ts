import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

const LEGACY_SITE_HOSTS = [
  "decisionclarities.com",
  "www.decisionclarities.com",
] as const;

const legacyComparisonRedirects = [
  {
    source: "/compare/forecast-vs-basecamp-for-power-user",
    destination: "/compare/basecamp-vs-forecast-for-power-user",
  },
  {
    source: "/compare/linear-vs-basecamp-for-power-user",
    destination: "/compare/basecamp-vs-linear-for-power-user",
  },
  {
    source: "/compare/pivotal-tracker-vs-basecamp-for-power-user",
    destination: "/compare/basecamp-vs-pivotal-tracker-for-power-user",
  },
  {
    source: "/compare/projectco-vs-notion-for-non-technical-user",
    destination: "/compare/notion-vs-project-co-for-non-technical-user",
  },
  {
    source: "/compare/redmine-vs-clickup-for-power-user",
    destination: "/compare/clickup-vs-redmine-for-power-user",
  },
  {
    source: "/compare/shortcut-vs-basecamp-for-power-user",
    destination: "/compare/basecamp-vs-shortcut-for-power-user",
  },
  {
    source: "/compare/todoist-vs-jira-for-beginner",
    destination: "/compare/jira-vs-todoist-for-beginner",
  },
  {
    source: "/compare/front-vs-apple-mail-for-busy-professional",
    destination: "/compare/apple-mail-vs-front-for-busy-professional",
  },
  {
    source: "/compare/front-vs-fastmail-for-busy-professional",
    destination: "/compare/fastmail-vs-front-for-busy-professional",
  },
  {
    source: "/compare/hey-vs-fastmail-for-minimalist",
    destination: "/compare/fastmail-vs-hey-for-minimalist",
  },
  {
    source: "/compare/hey-vs-gmail-for-busy-professional",
    destination: "/compare/gmail-vs-hey-for-busy-professional",
  },
  {
    source: "/compare/hey-vs-gmail-for-minimalist",
    destination: "/compare/gmail-vs-hey-for-minimalist",
  },
  {
    source: "/compare/hiver-vs-apple-mail-for-busy-professional",
    destination: "/compare/apple-mail-vs-hiver-for-busy-professional",
  },
  {
    source: "/compare/hushmail-vs-gmx-mail-for-minimalist",
    destination: "/compare/gmx-mail-vs-hushmail-for-minimalist",
  },
  {
    source: "/compare/mailboxorg-vs-gmx-mail-for-minimalist",
    destination: "/compare/gmx-mail-vs-mailbox-org-for-minimalist",
  },
  {
    source: "/compare/mailboxorg-vs-yahoo-mail-for-minimalist",
    destination: "/compare/mailbox-org-vs-yahoo-mail-for-minimalist",
  },
  {
    source: "/compare/mailmate-vs-mailbird-for-power-user",
    destination: "/compare/mailbird-vs-mailmate-for-power-user",
  },
  {
    source: "/compare/missive-vs-apple-mail-for-busy-professional",
    destination: "/compare/apple-mail-vs-missive-for-busy-professional",
  },
  {
    source: "/compare/missive-vs-fastmail-for-busy-professional",
    destination: "/compare/fastmail-vs-missive-for-busy-professional",
  },
  {
    source: "/compare/outlook-vs-hey-for-power-user",
    destination: "/compare/hey-vs-outlook-for-power-user",
  },
  {
    source: "/compare/roundcube-vs-gmail-for-power-user",
    destination: "/compare/gmail-vs-roundcube-for-power-user",
  },
  {
    source: "/compare/runbox-vs-gmx-mail-for-minimalist",
    destination: "/compare/gmx-mail-vs-runbox-for-minimalist",
  },
  {
    source: "/compare/startmail-vs-gmx-mail-for-minimalist",
    destination: "/compare/gmx-mail-vs-startmail-for-minimalist",
  },
  {
    source: "/compare/thunderbird-vs-proton-mail-for-power-user",
    destination: "/compare/proton-mail-vs-thunderbird-for-power-user",
  },
];

type RedirectRule = {
  source: string;
  destination: string;
};

type NextRedirectRule = RedirectRule & {
  has?: Array<{
    type: "host";
    value: string;
  }>;
  permanent: true;
};

function loadGeneratedComparisonRedirects(): RedirectRule[] {
  const redirectsPath = path.join(
    process.cwd(),
    "content",
    "system",
    "legacy-comparison-redirects.json"
  );

  if (!fs.existsSync(redirectsPath)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(redirectsPath, "utf8")) as RedirectRule[];
}

function buildDirectLegacyHostRedirects(
  redirects: RedirectRule[]
): NextRedirectRule[] {
  return redirects.flatMap((redirect) =>
    LEGACY_SITE_HOSTS.map((host) => ({
      source: redirect.source,
      destination: `https://gettoolpicker.com${redirect.destination}`,
      has: [{ type: "host", value: host }],
      permanent: true as const,
    }))
  );
}

const nextConfig: NextConfig = {
  async redirects() {
    const generatedRedirects = loadGeneratedComparisonRedirects();
    const redirectMap = new Map<string, RedirectRule>();

    for (const redirect of legacyComparisonRedirects) {
      redirectMap.set(redirect.source, redirect);
    }

    for (const redirect of generatedRedirects) {
      redirectMap.set(redirect.source, redirect);
    }

    const canonicalComparisonRedirects = Array.from(redirectMap.values());

    return [
      ...buildDirectLegacyHostRedirects(canonicalComparisonRedirects),
      ...canonicalComparisonRedirects.map((redirect) => ({
        ...redirect,
        permanent: true as const,
      })),
    ];
  },
};

export default nextConfig;
