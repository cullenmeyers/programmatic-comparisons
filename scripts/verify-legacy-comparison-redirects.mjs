import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import http from "node:http";
import https from "node:https";

const LEGACY_SITE_HOSTS = ["decisionclarities.com", "www.decisionclarities.com"];
const PRIMARY_HOST = "gettoolpicker.com";
const DEFAULT_BASE_URL = process.env.REDIRECT_AUDIT_BASE_URL || "http://127.0.0.1:3100";

function loadRedirectRules() {
  const nextConfigSource = fs.readFileSync("next.config.ts", "utf8");
  const startMarker = "const legacyComparisonRedirects = [";
  const startIndex = nextConfigSource.indexOf(startMarker);
  const endIndex = nextConfigSource.indexOf("];", startIndex);
  const arrayLiteral = nextConfigSource.slice(
    startIndex + "const legacyComparisonRedirects = ".length,
    endIndex + 1
  );

  const legacyRedirects = vm.runInNewContext(arrayLiteral);
  const generatedRedirects = JSON.parse(
    fs.readFileSync(path.join("content", "system", "legacy-comparison-redirects.json"), "utf8")
  );

  return [...legacyRedirects, ...generatedRedirects];
}

function requestOnce(logicalUrl) {
  const base = new URL(DEFAULT_BASE_URL);
  const target = new URL(logicalUrl);
  const transport = base.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = transport.request(
      {
        protocol: base.protocol,
        hostname: base.hostname,
        port: base.port,
        method: "GET",
        path: `${target.pathname}${target.search}`,
        agent: false,
        headers: {
          host: target.host,
        },
      },
      (res) => {
        res.resume();
        res.on("end", () => {
          resolve({
            url: logicalUrl,
            status: res.statusCode ?? 0,
            location: res.headers.location ?? null,
          });
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}

async function traceRedirects(startUrl, maxHops = 10) {
  const hops = [];
  let currentUrl = startUrl;

  for (let hopIndex = 0; hopIndex < maxHops; hopIndex += 1) {
    const response = await requestOnce(currentUrl);
    hops.push(response);

    if (
      !response.location ||
      response.status < 300 ||
      response.status >= 400
    ) {
      break;
    }

    currentUrl = new URL(response.location, currentUrl).toString();
  }

  return hops;
}

async function main() {
  const redirects = loadRedirectRules();
  const results = [];

  for (const redirect of redirects) {
    for (const host of LEGACY_SITE_HOSTS) {
      const startUrl = `https://${host}${redirect.source}`;
      const expectedUrl = `https://${PRIMARY_HOST}${redirect.destination}`;
      const hops = await traceRedirects(startUrl);
      const redirectStatuses = hops
        .filter((hop) => hop.status >= 300 && hop.status < 400)
        .map((hop) => hop.status);
      const finalHop = hops[hops.length - 1];

      results.push({
        host,
        source: redirect.source,
        expectedUrl,
        finalUrl: finalHop.url,
        hopCount: redirectStatuses.length,
        redirectStatuses,
        has302: redirectStatuses.includes(302),
        hasChain: redirectStatuses.length !== 1,
        matchesExpected: finalHop.url === expectedUrl,
        isPermanentRedirect: redirectStatuses.every((status) => status === 308 || status === 301),
        finalStatus: finalHop.status,
      });
    }
  }

  const failures = results.filter(
    (result) =>
      result.has302 ||
      result.hasChain ||
      !result.matchesExpected ||
      !result.isPermanentRedirect
  );

  const examples = results.slice(0, 5).map((result) => ({
    host: result.host,
    source: result.source,
    hopCount: result.hopCount,
    redirectStatuses: result.redirectStatuses,
    finalUrl: result.finalUrl,
  }));

  console.log(
    JSON.stringify(
      {
        baseUrl: DEFAULT_BASE_URL,
        summary: {
          configuredRedirects: redirects.length,
          checkedRoutes: results.length,
          failures: failures.length,
          chains: results.filter((result) => result.hasChain).length,
          mismatches: results.filter((result) => !result.matchesExpected).length,
          redirectsWith302: results.filter((result) => result.has302).length,
        },
        examples,
        failures,
      },
      null,
      2
    )
  );

  if (failures.length > 0) {
    process.exitCode = 1;
  }

  process.exit(process.exitCode ?? 0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
