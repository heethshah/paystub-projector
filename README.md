# Earnings Ledger — Netlify deployment

A paystub → full-year tax projection web app (Vite + React). It reads an
uploaded pay stub using the Anthropic API. The API key is kept server-side
in a Netlify Function, so it never reaches the browser.

---

## What's in here

```
paystub-projector/
├─ index.html              # page shell
├─ package.json            # dependencies + build scripts
├─ vite.config.js          # build config
├─ netlify.toml            # tells Netlify how to build + where functions live
├─ src/
│  ├─ main.jsx             # mounts the app
│  └─ App.jsx              # the whole app (calls /.netlify/functions/extract)
└─ netlify/functions/
   └─ extract.mjs          # server-side proxy that holds your API key
```

---

## Before you start

You need:
1. A free **GitHub** account (to host the code).
2. A free **Netlify** account (https://www.netlify.com) — sign in with GitHub.
3. An **Anthropic API key** from https://console.anthropic.com (Settings → API Keys).
   Note: the API is pay-as-you-go and billed to that account. Each stub read is
   one small request.

---

## Step-by-step (GitHub + Netlify — recommended)

### 1. Put the code on GitHub
- Create a new, empty repository on GitHub (e.g. `paystub-projector`).
- Upload the contents of this folder to it. Easiest in the browser:
  on the new repo page choose **uploading an existing file**, then drag in
  everything inside `paystub-projector/` (not the folder itself).
- (Or, with git installed: `git init`, `git add .`, `git commit -m "init"`,
  `git remote add origin <your-repo-url>`, `git push -u origin main`.)

### 2. Connect it to Netlify
- Log in to Netlify → **Add new site** → **Import an existing project**.
- Pick **GitHub**, authorize, and select your repo.
- Netlify reads `netlify.toml`, so the build settings auto-fill:
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Functions directory: `netlify/functions`
  Leave them as-is.

### 3. Add your API key (the important part)
- Before the first build finishes, or right after, go to
  **Site configuration → Environment variables → Add a variable**.
- Key: `ANTHROPIC_API_KEY`
- Value: paste your Anthropic key (starts with `sk-ant-...`).
- Save.

### 4. Deploy
- Go to **Deploys → Trigger deploy → Deploy site** (so it rebuilds with the
  key in place).
- When it finishes you'll get a live URL like `your-site.netlify.app`.
  Open it, upload a stub, and it should work end to end.

That's it. Every time you push a change to GitHub, Netlify rebuilds automatically.

---

## Alternative: deploy from your computer with the Netlify CLI

If you'd rather not use GitHub:

```bash
npm install -g netlify-cli      # one-time
cd paystub-projector
npm install
netlify deploy --build --prod   # follow the prompts to create/link a site
```

Then set the key once:
```bash
netlify env:set ANTHROPIC_API_KEY sk-ant-your-key-here
netlify deploy --build --prod   # redeploy so the function sees the key
```

(Plain drag-and-drop of a folder onto Netlify will NOT work here, because that
path doesn't run the build or the serverless function.)

---

## Run it locally first (optional but nice)

```bash
cd paystub-projector
npm install
npm install -g netlify-cli
netlify env:set ANTHROPIC_API_KEY sk-ant-your-key-here   # stores locally too
netlify dev
```
Open the URL it prints (usually http://localhost:8888). Using `netlify dev`
(rather than `npm run dev`) is what makes the `/.netlify/functions/extract`
endpoint work on your machine.

---

## Notes

- **Model:** the app uses `claude-sonnet-5-5`. If that model is ever retired
  (you'll see an error like `model: claude-...`), add an environment variable
  `ANTHROPIC_MODEL` in Netlify with a current model name and redeploy. No code
  change needed.
- **Cost control:** keep the key in Netlify's environment variables only. Don't
  paste it into any `.jsx`/`.html` file or commit it to GitHub.
- **Privacy:** stubs are sent to the Anthropic API to be read, then discarded.
  Nothing is stored by this app.
