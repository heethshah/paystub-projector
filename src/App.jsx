import { useState, useRef, useMemo, useEffect } from "react";

/* ------------------------------------------------------------------ *
 *  Earnings Ledger — paystub → full-year projection
 *  Upload a stub, pick your pay frequency, get projected
 *  taxable income, federal withholding, and per-state withholding.
 * ------------------------------------------------------------------ */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.elx *{box-sizing:border-box;margin:0;padding:0}
.elx{
  --paper:#F1EDE1; --card:#FBF9F2; --ink:#211F19; --soft:#6A675B;
  --line:#D9D3C2; --accent:#1E5C45; --accent-2:#E1EBE3;
  --gold:#9A7430; --danger:#8C3A2C;
  font-family:'Hanken Grotesk',ui-sans-serif,sans-serif;
  color:var(--ink); background:var(--paper);
  min-height:100%; width:100%;
  background-image:radial-gradient(var(--line) 0.5px,transparent 0.5px);
  background-size:22px 22px;
  padding:clamp(20px,4vw,40px) clamp(14px,4vw,24px) 56px;
}
.elx .wrap{max-width:880px;margin:0 auto}
.elx .mono{font-family:'IBM Plex Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
.elx .serif{font-family:'Fraunces',Georgia,serif}

/* masthead */
.elx .mast{display:flex;align-items:flex-end;justify-content:space-between;
  border-bottom:2px solid var(--ink);padding-bottom:14px;margin-bottom:30px}
.elx .mast h1{font-family:'Fraunces',serif;font-weight:600;font-size:clamp(22px,4.6vw,30px);letter-spacing:-0.5px;line-height:1}
.elx .mast .tag{font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:var(--soft);
  font-weight:600;text-align:right;line-height:1.5}
.elx .kicker{font-size:11px;letter-spacing:2.6px;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:10px}

/* dropzone */
.elx .drop{background:var(--card);border:1.5px dashed var(--line);border-radius:4px;
  padding:54px 30px;text-align:center;cursor:pointer;transition:.22s ease;position:relative}
.elx .drop:hover,.elx .drop.over{border-color:var(--accent);background:#fff;transform:translateY(-1px)}
.elx .drop .ic{width:46px;height:46px;margin:0 auto 16px;border:1.5px solid var(--ink);
  border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px}
.elx .drop h2{font-family:'Fraunces',serif;font-weight:500;font-size:21px;margin-bottom:6px}
.elx .drop p{color:var(--soft);font-size:14px}
.elx .drop .fmt{margin-top:18px;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:var(--soft)}

.elx .note{font-size:12.5px;color:var(--soft);line-height:1.6;margin-top:18px;max-width:560px}

/* frequency cards */
.elx .freqgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:6px}
.elx .freq{background:var(--card);border:1.5px solid var(--line);border-radius:4px;
  padding:20px 18px;cursor:pointer;transition:.16s ease;text-align:left}
.elx .freq:hover{border-color:var(--accent)}
.elx .freq.sel{border-color:var(--accent);background:var(--accent-2);box-shadow:inset 0 0 0 1px var(--accent)}
.elx .freq .n{font-family:'Fraunces',serif;font-size:19px;font-weight:600}
.elx .freq .per{font-size:12px;color:var(--soft);margin-top:3px}
.elx .freq .com{display:inline-block;margin-top:10px;font-size:10px;letter-spacing:1.2px;
  text-transform:uppercase;color:var(--accent);font-weight:700}

.elx .row{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:26px}
.elx button.go{background:var(--accent);color:#fff;border:none;border-radius:3px;
  font-family:'Hanken Grotesk',sans-serif;font-weight:600;font-size:14px;letter-spacing:.3px;
  padding:13px 26px;cursor:pointer;transition:.16s}
.elx button.go:hover{background:#16463380;background:#164633}
.elx button.go:disabled{opacity:.45;cursor:not-allowed}
.elx button.ghost{background:none;border:1px solid var(--line);border-radius:3px;color:var(--ink);
  font-family:'Hanken Grotesk',sans-serif;font-weight:600;font-size:13px;padding:11px 18px;cursor:pointer}
.elx button.ghost:hover{border-color:var(--ink)}

/* analyzing */
.elx .load{text-align:center;padding:70px 0}
.elx .load .bar{width:160px;height:3px;background:var(--line);margin:22px auto 0;overflow:hidden;border-radius:2px}
.elx .load .bar i{display:block;height:100%;width:40%;background:var(--accent);
  animation:slide 1.1s ease-in-out infinite}
@keyframes slide{0%{transform:translateX(-110%)}100%{transform:translateX(310%)}}

/* confirm strip */
.elx .strip{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;
  background:var(--card);border:1px solid var(--line);border-radius:4px;padding:12px 16px;margin-bottom:26px}
.elx .strip .who{font-weight:600;font-size:14px}
.elx .strip .meta{font-size:12px;color:var(--soft)}

/* hero result cards */
.elx .heroes{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.elx .hero{background:var(--card);border:1px solid var(--line);border-radius:4px;padding:22px 20px 24px;
  opacity:0;transform:translateY(10px);animation:rise .5s ease forwards}
.elx .hero:nth-child(1){animation-delay:.05s}
.elx .hero:nth-child(2){animation-delay:.15s}
.elx .hero:nth-child(3){animation-delay:.25s}
@keyframes rise{to{opacity:1;transform:none}}
.elx .hero .lab{font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase;color:var(--soft);font-weight:700}
.elx .hero .val{font-family:'Fraunces',serif;font-weight:600;font-size:clamp(24px,5.4vw,33px);letter-spacing:-1px;margin-top:12px;line-height:1.04;word-break:break-word}
.elx .hero.feature{background:var(--accent);border-color:var(--accent)}
.elx .hero.feature .lab{color:#B9D2C5}
.elx .hero.feature .val{color:#fff}
.elx .hero .sub{font-size:11.5px;color:var(--soft);margin-top:8px}
.elx .hero.feature .sub{color:#A9C4B6}

/* states */
.elx .states{margin-top:14px;background:var(--card);border:1px solid var(--line);border-radius:4px;overflow:hidden}
.elx .states .sh{padding:11px 16px;border-bottom:1px solid var(--line);font-size:10.5px;
  letter-spacing:1.6px;text-transform:uppercase;color:var(--soft);font-weight:700}
.elx .st{display:flex;justify-content:space-between;align-items:flex-start;padding:14px 16px;border-bottom:1px solid var(--line)}
.elx .st .sbody{flex:1}
.elx .sseg{display:inline-flex;margin-top:9px;border:1px solid var(--line);border-radius:3px;overflow:hidden}
.elx .sseg button{border:none;background:#fff;font-family:'Hanken Grotesk',sans-serif;font-size:11px;
  padding:5px 13px;cursor:pointer;color:var(--soft);border-right:1px solid var(--line)}
.elx .sseg button:last-child{border-right:none}
.elx .sseg button.on{background:var(--accent);color:#fff;font-weight:600}
.elx .st:last-child{border-bottom:none}
.elx .st .badge{display:inline-flex;align-items:center;justify-content:center;width:34px;height:24px;
  border:1px solid var(--ink);border-radius:3px;font-weight:700;font-size:12px;margin-right:12px}
.elx .st .nm{font-size:13.5px;color:var(--ink);font-weight:500}
.elx .st .tip{font-size:11px;color:var(--soft);margin-top:2px}
.elx .st .frozen .nm{color:var(--soft)}
.elx .st .pill{display:inline-block;font-size:9px;letter-spacing:1px;text-transform:uppercase;
  font-weight:700;padding:2px 6px;border-radius:2px;margin-left:8px;vertical-align:middle}
.elx .st .pill.live{background:var(--accent-2);color:var(--accent)}
.elx .st .pill.done{background:#EFE7D5;color:var(--gold)}
.elx .st .amt{margin-left:auto;font-weight:600;font-size:15px;text-align:right}

/* controls */
.elx .controls{margin-top:26px;background:var(--card);border:1px solid var(--line);border-radius:4px;padding:18px}
.elx .controls h3{font-family:'Fraunces',serif;font-weight:600;font-size:15px;margin-bottom:14px}
.elx .ctl{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:8px 0;flex-wrap:wrap}
.elx .ctl label{font-size:13px;color:var(--soft);max-width:62%}
.elx .hint{font-size:11px;color:var(--soft);line-height:1.45;margin-top:4px}
.elx .step{display:flex;align-items:center;border:1px solid var(--line);border-radius:3px;overflow:hidden}
.elx .step button{width:32px;height:34px;border:none;background:#fff;cursor:pointer;font-size:17px;color:var(--ink)}
.elx .step button:hover{background:var(--accent-2)}
.elx .step input{width:48px;height:34px;border:none;text-align:center;font-family:'IBM Plex Mono',monospace;
  font-size:14px;border-left:1px solid var(--line);border-right:1px solid var(--line);background:#fff}
.elx .seg{display:flex;border:1px solid var(--line);border-radius:3px;overflow:hidden}
.elx .seg button{border:none;background:#fff;padding:7px 11px;font-size:12px;cursor:pointer;
  font-family:'Hanken Grotesk',sans-serif;border-right:1px solid var(--line)}
.elx .seg button:last-child{border-right:none}
.elx .seg button.on{background:var(--accent);color:#fff}
.elx .moneyin{display:flex;align-items:center;border:1px solid var(--line);border-radius:3px;background:#fff;overflow:hidden}
.elx .moneyin span{padding:0 4px 0 10px;color:var(--soft);font-family:'IBM Plex Mono',monospace}
.elx .moneyin input{border:none;width:110px;height:34px;font-family:'IBM Plex Mono',monospace;font-size:14px}

/* ledger table */
.elx .ledger{margin-top:26px;border:1px solid var(--line);border-radius:4px;overflow-x:auto;-webkit-overflow-scrolling:touch;background:var(--card)}
.elx table{width:100%;min-width:340px;border-collapse:collapse}
.elx thead th{font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:var(--soft);
  font-weight:700;text-align:right;padding:12px 16px;border-bottom:1px solid var(--ink)}
.elx thead th:first-child{text-align:left}
.elx tbody td{padding:11px 16px;font-size:13.5px;border-bottom:1px solid var(--line);text-align:right}
.elx tbody td:first-child{text-align:left;color:var(--soft)}
.elx tbody tr:last-child td{border-bottom:none}
.elx tbody tr.tot td{font-weight:700;color:var(--ink);background:#F3EFE3}
.elx tbody tr.tot td:first-child{color:var(--ink)}

.elx .foot{margin-top:24px;font-size:12px;color:var(--soft);line-height:1.7;
  border-top:1px solid var(--line);padding-top:16px}
.elx .foot b{color:var(--ink);font-weight:600}
.elx .err{background:#F6E7E3;border:1px solid var(--danger);color:var(--danger);
  border-radius:4px;padding:16px;font-size:13.5px;line-height:1.5;margin-top:20px}
@media(max-width:760px){
  .elx .heroes{grid-template-columns:1fr 1fr}
}
@media(max-width:600px){
  .elx .heroes{grid-template-columns:1fr}
  .elx .hero{padding:18px 16px 20px}
}
@media(max-width:560px){
  .elx .freqgrid{grid-template-columns:1fr}
}
@media(max-width:640px){
  .elx thead th,.elx tbody td{padding:10px 11px;font-size:12.5px}
  .elx .controls,.elx .states .sh{font-size:inherit}
  .elx .ctl label,.elx .ctl > div{max-width:100% !important}
  .elx .ctl{justify-content:space-between}
}
@media(max-width:400px){
  .elx thead th,.elx tbody td{padding:9px 8px;font-size:11.5px}
  .elx .hero .lab{font-size:9.5px;letter-spacing:1.2px}
  .elx .mast .tag{font-size:10px;letter-spacing:1.8px}
}
`;

const FREQS = [
  { id: 52, n: "Weekly", per: "52 checks / year" },
  { id: 26, n: "Bi-weekly", per: "26 checks / year", common: "Most common" },
  { id: 24, n: "Semi-monthly", per: "24 checks / year (twice a month)", common: "Twice a month" },
  { id: 12, n: "Monthly", per: "12 checks / year" },
];

const usd = (n) =>
  "$" + (n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const usd2 = (n) =>
  "$" + (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function parseDate(s) {
  if (!s) return null;
  const m = String(s).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    let y = +m[3];
    if (y < 100) y += 2000;
    return new Date(y, +m[1] - 1, +m[2]);
  }
  const t = Date.parse(s);
  return isNaN(t) ? null : new Date(t);
}

// Deterministically count pay periods DATED within this calendar year, up to and
// including the stub's pay date. For weekly/biweekly we anchor on the pay date itself
// (the one payday we know for certain) and step backward by the period length, so the
// count follows the real schedule rather than an estimate.
function suggestPeriods(parsed, freq) {
  const d = parseDate(parsed?.pay_date);
  if (d && !isNaN(d)) {
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();

    if (freq === 26 || freq === 52) {
      const stepDays = freq === 26 ? 14 : 7;
      const jan1 = new Date(year, 0, 1);
      const cur = new Date(year, d.getMonth(), day);
      let count = 0;
      while (cur >= jan1) {
        count++;
        cur.setDate(cur.getDate() - stepDays); // calendar-safe, no DST drift
      }
      return Math.max(1, Math.min(freq, count));
    }
    if (freq === 24) {
      // two fixed paydays per month (mid-month + month-end)
      return Math.max(1, Math.min(24, (month - 1) * 2 + (day >= 16 ? 2 : 1)));
    }
    if (freq === 12) {
      return Math.max(1, Math.min(12, month));
    }
  }
  // fallback only when no pay date is readable: recurring salary ratio
  const sr = parsed?.per_period?.salary_recurring || parsed?.per_period?.gross || 0;
  const ytdSr = parsed?.ytd?.salary_recurring || parsed?.ytd?.gross || 0;
  return sr > 0 ? Math.max(1, Math.min(freq, Math.round(ytdSr / sr))) : 1;
}

function useCountUp(target, ms = 650) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, start;
    const from = 0;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      setV(from + (target - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export default function PaystubProjector() {
  const [step, setStep] = useState("upload"); // upload | analyzing | frequency | results | error
  const [fileName, setFileName] = useState("");
  const [over, setOver] = useState(false);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [freq, setFreq] = useState(26);
  const [completed, setCompleted] = useState(1);
  const [bonus, setBonus] = useState(0);
  const [overrides, setOverrides] = useState({}); // index -> isActive (manual)
  const [lastFile, setLastFile] = useState(null);
  const inputRef = useRef(null);

  const fileToBase64 = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.onerror = () => rej(new Error("read failed"));
      r.readAsDataURL(file);
    });

  async function handleFile(file) {
    if (!file) return;
    setLastFile(file);
    setFileName(file.name);
    setErr("");
    setStep("analyzing");
    try {
      const b64 = await fileToBase64(file);
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const media = isPdf
        ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }
        : { type: "image", source: { type: "base64", media_type: file.type || "image/png", data: b64 } };

      const prompt = `You are a precise payroll data extractor. Read the attached pay stub / earnings statement and return ONLY strict JSON, no markdown, no commentary.

Rules:
- "per_period" = the CURRENT / "this period" column. "ytd" = the Year-to-Date column.
- salary_recurring = the recurring base wages/salary for ONE normal period (exclude one-time items like bonuses, AIP, awards, incentive payouts, RETRO/retroactive pay, true-ups).
- pretax_deductions = SUM of all pre-tax deductions (items marked with * or asterisk, or named like medical, dental, vision, 401k pre-tax, HSA, FSA, cafeteria/section 125, commuter). Do NOT include after-tax deductions (legal plan, identity theft, supplemental life/AD&D, roth).
- imputed_income = group-term life / GTL / imputed income value (add-back). 0 if none.
- federal_withholding = federal income tax withheld (NOT OASDI/social security or medicare).
- states = array, one object per DISTINCT STATE INCOME TAX line only. INCLUDE only lines that are a state income tax / state withholding (e.g. "IL State Income Tax", "NJ State Income Tax", "CA State Withholding"). NEVER include SUI, SDI, disability, unemployment, paid family leave (PFL/FLI), local/city tax, OASDI, social security, or medicare. For each: {"code": two-letter state code, "per_period": the CURRENT/this-period amount for THAT income-tax line only, "ytd": the year-to-date amount for that line}. CRITICAL: if the current/this-period cell for a state income tax line is blank, empty, or zero, set per_period to 0 — do NOT borrow a value from a neighboring line (such as an SUI/SDI line directly below it). Read columns strictly by alignment. If none, empty array.
- All numbers plain (no $, no commas). Missing => 0.

Return exactly:
{"employee_name":"","pay_date":"",
"per_period":{"gross":0,"salary_recurring":0,"pretax_deductions":0,"imputed_income":0,"federal_withholding":0},
"ytd":{"gross":0,"salary_recurring":0,"pretax_deductions":0,"imputed_income":0,"federal_withholding":0},
"states":[]}`;

      const resp = await fetch("/.netlify/functions/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [{ role: "user", content: [media, { type: "text", text: prompt }] }],
        }),
      });

      const raw = await resp.text();
      if (!raw || !raw.trim()) throw new Error("the reader came back empty — usually a quick retry fixes it");

      let json;
      try {
        json = JSON.parse(raw);
      } catch {
        throw new Error("the reader returned a response that wasn't readable — please try again");
      }
      if (json.type === "error" || json.error) {
        throw new Error(json.error?.message || "the reader service reported an error — try again in a moment");
      }

      const text = (json.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      if (!text.trim()) throw new Error("no figures came back from the stub — try a clearer copy");

      let s = text.trim().replace(/```json/gi, "").replace(/```/g, "").trim();
      const a = s.indexOf("{"), z = s.lastIndexOf("}");
      if (a === -1 || z === -1 || z <= a)
        throw new Error("couldn't locate the figures in the reply — please try again");
      s = s.slice(a, z + 1);

      let parsed;
      try {
        parsed = JSON.parse(s);
      } catch {
        throw new Error("the figures came back cut off — please try again");
      }

      setOverrides({});
      setBonus(0);
      setCompleted(suggestPeriods(parsed, freq));
      setData(parsed);
      setStep("frequency");
    } catch (e) {
      setErr(
        "I couldn't read that file cleanly. Make sure it's a clear pay stub PDF or image and try again. (" +
          (e.message || "parse error") +
          ")"
      );
      setStep("error");
    }
  }

  const results = useMemo(() => {
    if (!data) return null;
    const pp = data.per_period || {};
    const ytd = data.ytd || {};
    const remaining = Math.max(0, freq - completed);
    const A = Math.abs;
    const add = (base, per) => A(base || 0) + A(per || 0) * remaining;

    const gross = add(ytd.gross, pp.salary_recurring) + (bonus || 0);
    const pretax = add(ytd.pretax_deductions, pp.pretax_deductions);
    const imputed = add(ytd.imputed_income, pp.imputed_income);
    const taxable = gross + imputed - pretax;

    const ytdTaxable =
      A(ytd.gross || 0) + A(ytd.imputed_income || 0) - A(ytd.pretax_deductions || 0);

    let federal = add(ytd.federal_withholding, pp.federal_withholding) + (bonus || 0) * 0.22;

    const states = (data.states || []).map((st, i) => {
      const auto = A(st.per_period || 0) > 0; // has a current-period deduction
      const active = overrides[i] !== undefined ? overrides[i] : auto;
      let amt = active ? add(st.ytd, st.per_period) : A(st.ytd || 0);
      // a future bonus is withheld in your current state only
      if (active && bonus > 0 && ytdTaxable > 0) amt += bonus * (A(st.ytd || 0) / ytdTaxable);
      return { code: (st.code || "—").toUpperCase(), amt, active };
    });
    const stateTotal = states.reduce((a, b) => a + b.amt, 0);

    return { remaining, gross, pretax, imputed, taxable, federal, states, stateTotal, ytd, ytdTaxable };
  }, [data, freq, completed, bonus, overrides]);

  const heroTaxable = useCountUp(results?.taxable || 0);
  const heroFed = useCountUp(results?.federal || 0);
  const heroState = useCountUp(results?.stateTotal || 0);

  return (
    <div className="elx">
      <style>{STYLES}</style>
      <div className="wrap">
        <div className="mast">
          <h1 className="serif">Earnings Ledger</h1>
          <div className="tag">
            Paystub → full year<br />tax projection
          </div>
        </div>

        {step === "upload" && (
          <>
            <div className="kicker">Step 1 — Upload</div>
            <div
              className={"drop" + (over ? " over" : "")}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setOver(true); }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setOver(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
            >
              <div className="ic serif">↑</div>
              <h2 className="serif">Drop a pay stub here</h2>
              <p>or click to choose a file — I'll read the figures for you</p>
              <div className="fmt">PDF · PNG · JPG</div>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <p className="note">
              One recent stub is all it takes. Nothing is stored — the file is read in the
              moment to pull your gross pay, pre-tax deductions, and the tax already withheld,
              then everything is projected across the rest of the year.
            </p>
          </>
        )}

        {step === "analyzing" && (
          <div className="load">
            <div className="kicker" style={{ marginBottom: 0 }}>Reading your stub</div>
            <p style={{ color: "var(--soft)", marginTop: 10, fontSize: 14 }}>
              {fileName}
            </p>
            <div className="bar"><i /></div>
          </div>
        )}

        {step === "error" && (
          <>
            <div className="err">{err}</div>
            <div className="row">
              {lastFile && (
                <button className="go" onClick={() => handleFile(lastFile)}>
                  Try again
                </button>
              )}
              <button className="ghost" onClick={() => setStep("upload")}>
                Choose another file
              </button>
            </div>
          </>
        )}

        {step === "frequency" && (
          <>
            <div className="kicker">Step 2 — How often are you paid?</div>
            <div className="freqgrid">
              {FREQS.map((f) => (
                <div
                  key={f.id}
                  className={"freq" + (freq === f.id ? " sel" : "")}
                  onClick={() => setFreq(f.id)}
                >
                  <div className="n serif">{f.n}</div>
                  <div className="per">{f.per}</div>
                  {f.common && <div className="com">{f.common}</div>}
                </div>
              ))}
            </div>
            <p className="note">
              This decides how many checks make up your year. Bi-weekly lands on a fixed
              day every two weeks (26 a year); semi-monthly is twice each month on set
              dates (24 a year).
            </p>
            <div className="row">
              <button
                className="go"
                onClick={() => {
                  setCompleted(suggestPeriods(data, freq));
                  setStep("results");
                }}
              >
                Project my year →
              </button>
              <button className="ghost" onClick={() => setStep("upload")}>Start over</button>
            </div>
          </>
        )}

        {step === "results" && results && (
          <>
            <div className="strip">
              <div>
                <div className="who">{data.employee_name || "Your earnings"}</div>
                <div className="meta">
                  {data.pay_date ? `Latest stub dated ${data.pay_date} · ` : ""}
                  {completed} of {freq} pay periods in
                </div>
              </div>
              <button className="ghost" onClick={() => setStep("upload")}>New stub</button>
            </div>

            <div className="heroes">
              <div className="hero feature">
                <div className="lab">Total taxable income</div>
                <div className="val serif mono">{usd2(heroTaxable)}</div>
                <div className="sub">W-2 Box 1 wages, projected</div>
              </div>
              <div className="hero">
                <div className="lab">Federal withheld</div>
                <div className="val serif mono">{usd2(heroFed)}</div>
                <div className="sub">Income tax only</div>
              </div>
              <div className="hero">
                <div className="lab">State withheld</div>
                <div className="val serif mono">{usd2(heroState)}</div>
                <div className="sub">
                  {results.states.length > 1
                    ? `${results.states.length} states combined`
                    : results.states[0]?.code || "—"}
                </div>
              </div>
            </div>

            {results.states.length > 0 && (
              <div className="states">
                <div className="sh">
                  State withholding {results.states.length > 1 ? "— separated by state" : ""}
                </div>
                {results.states.map((st, i) => (
                  <div className={"st" + (st.active ? "" : " frozen")} key={i}>
                    <span className="badge mono">{st.code}</span>
                    <div className="sbody">
                      <div className="nm">
                        {st.active ? "Projected" : "Final"} {st.code} income tax withheld
                      </div>
                      <div className="tip">
                        {st.active
                          ? "Current state — withholding carried through year-end"
                          : "Prior state — frozen at year-to-date, no further withholding"}
                      </div>
                      <div className="sseg">
                        <button
                          className={st.active ? "on" : ""}
                          onClick={() => setOverrides((o) => ({ ...o, [i]: true }))}
                        >
                          Current
                        </button>
                        <button
                          className={!st.active ? "on" : ""}
                          onClick={() => setOverrides((o) => ({ ...o, [i]: false }))}
                        >
                          Prior
                        </button>
                      </div>
                    </div>
                    <span className="amt mono">{usd2(st.amt)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="controls">
              <h3 className="serif">Fine-tune the assumptions</h3>
              <div className="ctl">
                <label>Pay frequency</label>
                <div className="seg">
                  {FREQS.map((f) => (
                    <button
                      key={f.id}
                      className={freq === f.id ? "on" : ""}
                      onClick={() => {
                        setFreq(f.id);
                        setCompleted(suggestPeriods(data, f.id));
                      }}
                    >
                      {f.id}/yr
                    </button>
                  ))}
                </div>
              </div>
              <div className="ctl">
                <div style={{ maxWidth: "60%" }}>
                  <label style={{ maxWidth: "100%" }}>
                    Pay periods already completed this year
                  </label>
                  <div className="hint">
                    {data.pay_date
                      ? (freq === 26 || freq === 52
                          ? `Counted every ${freq === 26 ? "two weeks" : "week"} back from your ${data.pay_date} pay date to Jan 1`
                          : `Based on your ${data.pay_date} pay date`)
                      : "Estimated from year-to-date totals — adjust if needed"}
                  </div>
                </div>
                <div className="step">
                  <button onClick={() => setCompleted((c) => Math.max(0, c - 1))}>−</button>
                  <input
                    className="mono"
                    value={completed}
                    onChange={(e) => {
                      const v = parseInt(e.target.value.replace(/\D/g, "") || "0", 10);
                      setCompleted(Math.max(0, Math.min(freq, v)));
                    }}
                  />
                  <button onClick={() => setCompleted((c) => Math.min(freq, c + 1))}>+</button>
                </div>
              </div>
              <div className="ctl">
                <label>Expected extra bonus before year-end (optional)</label>
                <div className="moneyin">
                  <span className="mono">$</span>
                  <input
                    className="mono"
                    value={bonus || ""}
                    placeholder="0"
                    onChange={(e) =>
                      setBonus(parseFloat(e.target.value.replace(/[^\d.]/g, "")) || 0)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="ledger">
              <table>
                <thead>
                  <tr>
                    <th>Line</th>
                    <th>Year-to-date</th>
                    <th>Projected full year</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Gross wages</td>
                    <td className="mono">{usd2(results.ytd.gross)}</td>
                    <td className="mono">{usd2(results.gross)}</td>
                  </tr>
                  <tr>
                    <td>+ Imputed income</td>
                    <td className="mono">{usd2(results.ytd.imputed_income)}</td>
                    <td className="mono">{usd2(results.imputed)}</td>
                  </tr>
                  <tr>
                    <td>− Pre-tax deductions</td>
                    <td className="mono">{usd2(results.ytd.pretax_deductions)}</td>
                    <td className="mono">{usd2(results.pretax)}</td>
                  </tr>
                  <tr className="tot">
                    <td>= Taxable income</td>
                    <td className="mono">{usd2(results.ytdTaxable)}</td>
                    <td className="mono">{usd2(results.taxable)}</td>
                  </tr>
                  <tr>
                    <td>Federal withheld</td>
                    <td className="mono">{usd2(results.ytd.federal_withholding)}</td>
                    <td className="mono">{usd2(results.federal)}</td>
                  </tr>
                  {results.states.map((st, i) => {
                    const src = (data.states || [])[i] || {};
                    return (
                      <tr key={i}>
                        <td>{st.code} state withheld</td>
                        <td className="mono">{usd2(src.ytd)}</td>
                        <td className="mono">{usd2(st.amt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="foot">
              <b>How this is built:</b> recurring lines (salary, pre-tax deductions, withholding)
              are carried forward by the {results.remaining} remaining pay period
              {results.remaining === 1 ? "" : "s"} at your current per-check rate and added to
              what's already on the stub. One-time items already in your year-to-date — like a
              bonus or award — stay put and aren't repeated. Taxable income follows{" "}
              <b>gross + imputed − pre-tax</b>. Any bonus you enter is taxed at the 22% federal
              supplemental rate, with state applied at your stub's effective rate. When two or
              more states appear, only the one with a current-period deduction is carried to
              year-end — a state showing just a year-to-date balance is treated as final and
              left untouched — use the Current / Prior switch on any state to override that.
              State figures are income tax withholding only; SUI, SDI, and paid-family-leave
              are separate payroll taxes and are left out. Figures are an estimate for planning;
              a raise, a benefits change, or a real bonus will move the federal number the most.
              State withholding tends to be the steadiest.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
