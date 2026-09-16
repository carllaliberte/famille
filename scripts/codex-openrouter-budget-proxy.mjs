#!/usr/bin/env node
/**
 * ACORN — OpenRouter request budget guard.
 * Codex 0.153.4 can emit a larger wire budget than the configured model limit.
 * This local proxy therefore clamps the actual JSON request before it reaches OpenRouter.
 * No credentials are stored or logged.
 */
import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] != null ? process.argv[i + 1] : fallback;
}

const port = Number(arg("--port", "17891"));
const maxOutputTokens = Number(arg("--max-output-tokens", "1024"));
const upstream = new URL("https://openrouter.ai");

if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("invalid proxy port");
if (!Number.isInteger(maxOutputTokens) || maxOutputTokens < 1) throw new Error("invalid max output token budget");

function requestPath(req) {
  return new URL(req.url || "/", upstream).pathname + new URL(req.url || "/", upstream).search;
}

const server = http.createServer((req, res) => {
  let body = "";
  req.setEncoding("utf8");
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    let outgoing = body;
    let clamped = false;
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        if (Object.prototype.hasOwnProperty.call(parsed, "max_output_tokens")) {
          clamped = parsed.max_output_tokens !== maxOutputTokens;
          parsed.max_output_tokens = maxOutputTokens;
        }
        if (Object.prototype.hasOwnProperty.call(parsed, "max_tokens")) {
          clamped = clamped || parsed.max_tokens !== maxOutputTokens;
          parsed.max_tokens = maxOutputTokens;
        }
        outgoing = JSON.stringify(parsed);
      }
    } catch {
      // Let OpenRouter return the authoritative malformed-request response.
    }

    const headers = { ...req.headers };
    delete headers.host;
    headers.host = upstream.host;
    headers["content-length"] = String(Buffer.byteLength(outgoing));
    headers["connection"] = "close";

    const upstreamReq = https.request({
      protocol: upstream.protocol,
      hostname: upstream.hostname,
      port: 443,
      method: req.method,
      path: requestPath(req),
      headers,
    }, (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    });

    upstreamReq.on("error", (error) => {
      if (!res.headersSent) res.writeHead(502, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "openrouter_proxy_upstream", message: String(error.message || error) }));
    });

    // Intentionally no request/response body logging: the body can contain repository data.
    void clamped;
    upstreamReq.end(outgoing);
  });
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`OPENROUTER_BUDGET_PROXY_READY port=${port} max_output_tokens=${maxOutputTokens}\n`);
});
