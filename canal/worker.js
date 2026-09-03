const ORIGIN = "https://acorn-royal-dune-blend.grok.me";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export default {
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method !== "GET" || url.pathname !== "/juge") {
      const u = new URL(url.pathname + url.search, ORIGIN);
      return fetch(u.toString(), { method: req.method, headers: req.headers });
    }

    const p = url.searchParams;
    const quelle = p.get("quelle") || "os";
    const temoin =
      !p.get("temoin") || p.get("temoin") === "none" ? "aucun" : p.get("temoin");
    const epsilonRaw = p.get("epsilon");
    const horizon = p.get("horizon");
    const transcript = p.get("transcript");

    if (
      !["os", "qrng", "qkd"].includes(quelle) ||
      !["aucun", "stat", "fabricant", "di"].includes(temoin)
    ) {
      return json(400, {
        error: "cards",
        phrase: "Unknown quelle or temoin",
        preview: true,
      });
    }

    const eps = Number(epsilonRaw);
    if (epsilonRaw == null || !Number.isFinite(eps) || eps <= 0) {
      return json(400, {
        error: "lie",
        phrase: "Error margin zero is a lie",
        preview: true,
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (!horizon || !/^\d{4}-\d{2}-\d{2}$/.test(horizon) || horizon < today) {
      return json(400, {
        error: "horizon",
        phrase: "Need a calendar end date",
        preview: true,
      });
    }

    if (temoin === "di" && !transcript) {
      return json(400, {
        error: "transcript",
        phrase: "Device-independent needs a transcript",
        preview: true,
      });
    }

    const id = "preview00001";
    return json(200, {
      id,
      url: "/c/" + id,
      status: quelle === "os" ? "CLASSIQUE" : "APERÇU",
      preview: true,
      quelle,
      temoin,
      epsilon: eps,
      horizon,
    });
  },
};
