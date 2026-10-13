// netlify/functions/extract.mjs
// Server-side proxy to the Anthropic API. The API key lives ONLY here,
// as an environment variable on Netlify — never in the browser bundle.

const DEFAULT_MODEL = "claude-sonnet-5-5";

export default async (req) => {
  if (req.method !== "POST") {
    return json({ error: { message: "Method not allowed" } }, 405);
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return json(
      { error: { message: "Server is missing ANTHROPIC_API_KEY. Set it in Netlify > Site configuration > Environment variables." } },
      500
    );
  }

  let body;
  try {
    const parsed = JSON.parse(await req.text());
    // The server decides the model, so a retired model can be swapped by
    // setting ANTHROPIC_MODEL in Netlify — no code change or redeploy of the app needed.
    parsed.model = process.env.ANTHROPIC_MODEL || parsed.model || DEFAULT_MODEL;
    body = JSON.stringify(parsed);
  } catch {
    return json({ error: { message: "Could not read request body." } }, 400);
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body,
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return json({ error: { message: "Upstream request failed: " + (e?.message || "unknown") } }, 502);
  }
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
