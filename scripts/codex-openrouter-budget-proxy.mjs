#!/usr/bin/env node
/**
 * ACORN — OpenRouter request budget guard.
 * Codex 0.153.4 can emit a larger wire budget than the configured model limit.
 * This local proxy therefore clamps the actual JSON request before it reaches OpenRouter.
 * No credentials or request/response bodies are stored or logged.
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
const upstream = new URL("https://openrouter.ai/api/v1");
const diagnostic = process.env.CODEX_PROXY_DIAGNOSTIC === "1";

if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("invalid proxy port");
if (!Number.isInteger(maxOutputTokens) || maxOutputTokens < 1) throw new Error("invalid max output token budget");

function requestPath(req) {
  const incoming = new URL(req.url || "/", "http://127.0.0.1");
  const suffix = incoming.pathname.replace(/^\/v1(?=\/|$)/, "");
  return `${upstream.pathname.replace(/\/$/, "")}${suffix || "/"}${incoming.search}`;
}

function diag(message) {
  if (diagnostic) process.stderr.write(`OPENROUTER_PROXY_DIAG ${message}\n`);
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

    const path = requestPath(req);
    const headers = { ...req.headers };
    delete headers.host;
    headers.host = upstream.host;
    headers["content-length"] = String(Buffer.byteLength(outgoing));
    headers["connection"] = "close";

    diag(`request method=${req.method || ""} path=${path} clamped=${clamped}`);

    const upstreamReq = https.request({
      protocol: upstream.protocol,
      hostname: upstream.hostname,
      port: 443,
      method: req.method,
      path,
      headers,
    }, (upstreamRes) => {
      diag(`response status=${upstreamRes.statusCode || 0} content_type=${String(upstreamRes.headers["content-type"] || "").replace(/\s+/g, "_")}`);
      upstreamRes.on("aborted", () => diag("response aborted"));
      upstreamRes.on("end", () => diag("response end"));
      upstreamRes.on("close", () => diag("response close"));
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    });

    upstreamReq.on("socket", (socket) => {
      socket.on("secureConnect", () => diag("tls secureConnect"));
    });
    upstreamReq.on("error", (error) => {
      diag(`upstream_error message=${String(error.message || error).replace(/\s+/g, "_")}`);
      if (!res.headersSent) res.writeHead(502, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "openrouter_proxy_upstream", message: String(error.message || error) }));
    });

    void clamped;
    upstreamReq.end(outgoing);
  });
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`OPENROUTER_BUDGET_PROXY_READY port=${port} max_output_tokens=${maxOutputTokens}\n`);
});
