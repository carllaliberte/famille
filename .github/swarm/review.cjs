const { readFileSync } = require("fs");

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;
const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const pr = event.pull_request?.number || event.issue?.number;
if (!token || !repo || !pr) process.exit(0);

let file = "(FILE.md absent)";
try {
  file = readFileSync("FILE.md", "utf8").slice(0, 1800);
} catch {
  /* board missing */
}

const present = ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "DEEPSEEK_API_KEY", "GEMINI_API_KEY"].filter(
  (k) => process.env[k] && process.env[k].length > 8
);

const body = [
  "## Bus GitHub",
  "Carl squash. Pas de collage apps. Pas PRÉSENT. Pas merge.",
  present.length
    ? "Clés swarm : " + present.length + " (appel modèles hors de cette v0)."
    : "Modèles : skip (pas de clés). Ce commentaire + Grok suffisent.",
  "",
  "### FILE.md",
  "```",
  file,
  "```",
].join("\n");

fetch("https://api.github.com/repos/" + repo + "/issues/" + pr + "/comments", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "famille-swarm",
  },
  body: JSON.stringify({ body }),
})
  .then((r) => {
    if (!r.ok) return r.text().then((t) => Promise.reject(new Error(r.status + " " + t)));
  })
  .catch((e) => {
    console.error(e);
    process.exit(0);
  });
