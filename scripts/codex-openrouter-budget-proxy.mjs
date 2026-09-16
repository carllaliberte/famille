#!/usr/bin/env node
/**
 * ACORN — OpenRouter request budget guard.
 * Codex 0.153.4 can omit a wire budget; OpenRouter then bills the model max (65535).
 * Clamp every known token-limit field and inject top-level max_output_tokens.
 * No credentials or request/response bodies are stored or logged.
 */
import http from "node:http";
import https from "node:https";
import { pathToFileURL, URL } from "node:url";

export const TOKEN_LIMIT_KEYS = Object.freeze([
  "max_output_tokens",
  "max_tokens",
  "max_completion_tokens",
  "maxOutputTokens",
]);

export function requestPath(req, upstream = new URL("https://openrouter.ai/api/v1")) {
  const incoming = new URL(req.url || "/", "http://127.0.0.1");
  const suffix = incoming.pathname.replace(/^\/v1(?=\/|$)/, "");
  return `${upstream.pathname.replace(/\/$/, "")}${suffix || "/"}${incoming.search}`;
}

export function clampOpenRouterBudget(parsed, maxOutputTokens) {
  const hits = [];
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { body: parsed, clamped: false, hits };
  }
  const walk = (node, path) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    for (const key of TOKEN_LIMIT_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
      const before = node[key];
      if (Number(before) !== maxOutputTokens) {
        hits.push({ key: path ? `${path}.${key}` : key, from: before, to: maxOutputTokens });
      }
      node[key] = maxOutputTokens;
    }
    for (const [key, value] of Object.entries(node)) {
      if (TOKEN_LIMIT_KEYS.includes(key)) continue;
      if (value && typeof value === "object") walk(value, path ? `${path}.${key}` : key);
    }
  };
  walk(parsed, "");
  if (!Object.prototype.hasOwnProperty.call(parsed, "max_output_tokens")) {
    parsed.max_output_tokens = maxOutputTokens;
    hits.push({ key: "max_output_tokens", from: null, to: maxOutputTokens });
  }
  return { body: parsed, clamped: hits.length > 0, hits };
}

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] != null ? process.argv[i + 1] : fallback;
}

export function startProxy({ port, maxOutputTokens, diagnostic = false } = {}) {
  const listenPort = Number(port ?? arg("--port", "17891"));
  const budget = Number(maxOutputTokens ?? arg("--max-output-tokens", "1024"));
  const upstream = new URL("https://openrouter.ai/api/v1");
  const diagOn = diagnostic || process.env.CODEX_PROXY_DIAGNOSTIC === "1";

  if (!Number.isInteger(listenPort) || listenPort < 1 || listenPort > 65535) throw new Error("invalid proxy port");
  if (!Number.isInteger(budget) || budget < 1) throw new Error("invalid max output token budget");

  const diag = (message) => {
    if (diagOn) process.stderr.write(`OPENROUTER_PROXY_DIAG ${message}\n`);
  };

  const server = http.createServer((req, res) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      let outgoing = body;
      let clamped = false;
      let clampKeys = "";
      try {
        const parsed = JSON.parse(body);
        const result = clampOpenRouterBudget(parsed, budget);
        outgoing = JSON.stringify(result.body);
        clamped = result.clamped;
        clampKeys = result.hits.map((h) => `${h.key}:${h.from}->${h.to}`).join(",");
      } catch {
        // Let OpenRouter return the authoritative malformed-request response.
      }

      const path = requestPath(req, upstream);
      const headers = { ...req.headers };
      delete headers.host;
      headers.host = upstream.host;
      headers["content-length"] = String(Buffer.byteLength(outgoing));
      headers["connection"] = "close";

      diag(`request method=${req.method || ""} path=${path} clamped=${clamped} keys=${clampKeys || "none"}`);

      const upstreamReq = https.request({
        protocol: upstream.protocol,
        hostname: upstream.hostname,
        port: 443,
        method: req.method,
        path,
        headers,
      }, (upstreamRes) => {
        const contentType = String(upstreamRes.headers["content-type"] || "").replace(/\s+/g, "_");
        const kind = /json/i.test(contentType) ? "json" : /html/i.test(contentType) ? "html" : "other";
        diag(`response status=${upstreamRes.statusCode || 0} content_type=${contentType} body_kind=${kind}`);
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

      upstreamReq.end(outgoing);
    });
  });

  server.listen(listenPort, "127.0.0.1", () => {
    process.stdout.write(`OPENROUTER_BUDGET_PROXY_READY port=${listenPort} max_output_tokens=${budget}\n`);
  });
  return server;
}

const launchedDirectly = import.meta.url === pathToFileURL(process.argv[1] || "").href;
if (launchedDirectly) startProxy();
