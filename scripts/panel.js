#!/usr/bin/env node
/**
 * Buyer panel for founder-consumer in pure Node.js (Standard library only).
 * 100% compatible with panel.py specification and data schema.
 */

const fs = require("fs");
const path = require("path");

const FIRST_NAMES = [
  "Aarav", "Priya", "Rohan", "Ananya", "Vikram", "Sneha", "Aditya", "Neha", "Kabir", "Pooja",
  "Arjun", "Kavya", "Rahul", "Meera", "Siddharth", "Tanvi", "Nikhil", "Isha", "Karan", "Riya",
  "Amit", "Divya", "Varun", "Simran", "Gaurav", "Shreya", "Abhishek", "Kritika", "Deepak", "Anjali",
  "Rajesh", "Sunita", "Manoj", "Preeti", "Suresh", "Geeta", "Harish", "Rekha", "Alok", "Swati",
  "Manish", "Pallavi", "Sachin", "Jyoti", "Pradeep", "Aarti", "Ashok", "Sangeeta", "Sanjay", "Ritu",
  "Dev", "Zara", "Farhan", "Nisha", "Sameer", "Tara", "Tariq", "Zoya", "Imran", "Fatima",
  "Maya", "Jordan", "Marcus", "Sofia", "Ethan", "Aisha", "Liam", "Chloe", "Daniel", "Nadia",
  "Owen", "Grace", "Ravi", "Emma", "Kenji", "Zoe", "Luca", "Hana", "Noah", "Caleb",
  "Isla", "Mateo", "Leah", "Omar", "Ava", "Theo", "Mei", "Jonah", "Sara", "Diego",
  "Ruby", "Kofi", "Nora", "Felix", "Amara", "Ben", "Lina", "Sam", "Aria", "Julian"
];

const REASONS = ["price", "habit", "need", "trust", "quality", "convenience", "timing", "values", "other"];
const ANSWER_FIELDS = new Set(["id", "buys", "reason_code", "reason"]);
const WAVE = 10;

class PanelError extends Error {}

function quota(items, n, key = "share") {
  const total = items.reduce((sum, it) => sum + (parseFloat(it[key]) || 1.0), 0) || 1.0;
  const raw = items.map((it) => (n * (parseFloat(it[key]) || 1.0)) / total);
  const counts = raw.map((r) => Math.floor(r));
  const diffs = raw.map((r, i) => ({ i, diff: r - counts[i] })).sort((a, b) => b.diff - a.diff);
  const remainder = n - counts.reduce((a, b) => a + b, 0);
  for (let i = 0; i < remainder; i++) {
    counts[diffs[i].i] += 1;
  }
  return counts;
}

function validateCustomer(c) {
  for (const k of ["business", "target", "segments", "behaviours", "objections"]) {
    if (!c[k] || (Array.isArray(c[k]) && c[k].length === 0)) {
      throw new PanelError(`customer.json needs '${k}'`);
    }
  }
  for (const s of c.segments) {
    if (!s.name || !s.income || s.income.length !== 2) {
      throw new PanelError("every segment needs a name and an income [low, high]");
    }
  }
  for (const b of c.behaviours) {
    if (!b.name) throw new PanelError("every behaviour needs a name");
  }
}

// Pseudo-random generator with seed
function createRng(seed = 7) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deal(customer, n = 100, seed = 7) {
  validateCustomer(customer);
  if (n < 1) throw new PanelError("--n must be at least 1");
  const rng = createRng(seed);
  const age = customer.age || [25, 45];

  const segQuotas = quota(customer.segments, n);
  let segs = [];
  customer.segments.forEach((s, idx) => {
    for (let k = 0; k < segQuotas[idx]; k++) segs.push(s);
  });

  const behQuotas = quota(customer.behaviours, n);
  let behs = [];
  customer.behaviours.forEach((b, idx) => {
    for (let k = 0; k < behQuotas[idx]; k++) behs.push(b);
  });

  segs = shuffle(segs, rng);
  behs = shuffle(behs, rng);
  let names = shuffle(FIRST_NAMES, rng);
  while (names.length < n) {
    names = names.concat(FIRST_NAMES.map((x) => `${x} ${Math.floor(names.length / FIRST_NAMES.length) + 1}`));
  }

  const objections = customer.objections;
  const habits = customer.habits || [];
  const cards = [];

  for (let i = 0; i < n; i++) {
    const s = segs[i];
    const b = behs[i];
    const lo = parseFloat(s.income[0]);
    const hi = parseFloat(s.income[1]);
    const inc = Math.round((lo + rng() * (hi - lo)) / 1000) * 1000;
    const a = Math.floor(age[0] + rng() * (age[1] - age[0] + 1));

    cards.push({
      id: `P${String(i + 1).padStart(3, "0")}`,
      name: names[i],
      age: a,
      segment: s.name,
      income: inc,
      behaviour: b.name,
      behaviour_how: b.how || "",
      objection: objections[Math.floor(rng() * objections.length)],
      habit: habits.length ? habits[Math.floor(rng() * habits.length)] : "",
    });
  }
  return cards;
}

function readJson(fp) {
  return JSON.parse(fs.readFileSync(fp, "utf-8"));
}

function writeJson(fp, data) {
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function loadState(d) {
  try {
    const panel = readJson(path.join(d, "panel.json"));
    const personas = readJson(path.join(d, "personas.json"));
    return { panel, personas };
  } catch (e) {
    throw new PanelError(`no panel in ${d}: run init first`);
  }
}

const BRIEF_TEMPLATE = `You are a simulated buyer on a consumer panel. A founder wants to know, before spending any money, whether real people like you would buy. Your answer is only useful if it is honest: most people do not buy most things, and a polite yes is worse than a clear no.

=== WHO YOU ARE ===
{name}, {age}. {segment}. You earn about ₹{income} a year.
How you buy: {behaviour}. {behaviour_how}
{habit_line}The first thing that comes to mind when you hear an offer like this: "{objection}"
You are one of these people: {target}.
=== END ===

=== WHAT IS BEING OFFERED (you see it for the first time, the way a passer-by or a scroller would) ===
{pitch}
=== END ===

Decide as {name} would, with {name}'s money, habits and doubts, in a normal week. Do not be agreeable. Do not invent facts about the business beyond what is written above.

Create the file {out} with your file-writing tool (do not just print the answer in your reply) containing ONLY this JSON, no markdown fence, nothing else:
{{
  "id": "{id}",
  "buys": true or false,
  "purchases_first_month": how many times you would buy in the first month (0 if you would not buy),
  "reason_code": one of {reasons},
  "reason": "why, in one or two sentences, in your own voice",
  "objection": "the doubt that weighs most for you, in your own words",
  "would_change_my_mind": "the one thing that would flip your answer, or empty",
  "price_too_cheap": the price at which it would seem too cheap to be any good (a number),
  "price_cheap": the price at which it would feel like a bargain (a number),
  "price_expensive": the price at which it starts to feel expensive but you might still buy (a number),
  "price_too_expensive": the price at which you would not buy it at all (a number)
}}
`;

function answerOk(fp, pid) {
  if (!fs.existsSync(fp)) return "missing";
  let a;
  try {
    a = JSON.parse(fs.readFileSync(fp, "utf-8"));
  } catch (e) {
    return "not valid JSON";
  }
  for (const f of ANSWER_FIELDS) {
    if (!(f in a)) return `missing ${f}`;
  }
  if (a.id !== pid) return `id is ${a.id}, expected ${pid}`;
  if (typeof a.buys !== "boolean") return "'buys' must be true or false";
  if (!REASONS.includes(a.reason_code)) return `reason_code ${a.reason_code} not in valid list`;
  return null;
}

function init(d, customerPath, pitchPath, n = 100, seed = 7) {
  const customer = readJson(customerPath);
  const pitch = fs.readFileSync(pitchPath, "utf-8").trim();
  if (!pitch) throw new PanelError("the pitch is empty");
  const actualSeed = seed || Math.floor(Math.random() * 1000000);
  const cards = deal(customer, n, actualSeed);
  writeJson(path.join(d, "panel.json"), { n, seed: actualSeed, customer, pitch });
  writeJson(path.join(d, "personas.json"), cards);
  fs.mkdirSync(path.join(d, "briefs"), { recursive: true });
  fs.mkdirSync(path.join(d, "answers"), { recursive: true });
  return cards;
}

function writeBriefs(d, wave = WAVE) {
  const { panel, personas } = loadState(d);
  const target = panel.customer.target;
  const todo = [];

  for (const c of personas) {
    const out = path.join(d, "answers", `${c.id}.json`);
    if (answerOk(out, c.id) === null) continue;

    let b = BRIEF_TEMPLATE
      .replace(/{name}/g, c.name)
      .replace(/{age}/g, c.age)
      .replace(/{segment}/g, c.segment)
      .replace(/{income}/g, c.income.toLocaleString())
      .replace(/{behaviour}/g, c.behaviour)
      .replace(/{behaviour_how}/g, c.behaviour_how)
      .replace(/{habit_line}/g, c.habit ? `Your day: ${c.habit}.\n` : "")
      .replace(/{objection}/g, c.objection)
      .replace(/{target}/g, target)
      .replace(/{pitch}/g, panel.pitch)
      .replace(/{out}/g, path.resolve(out))
      .replace(/{id}/g, c.id)
      .replace(/{reasons}/g, REASONS.join(" / "));

    const bp = path.join(d, "briefs", `${c.id}.md`);
    fs.writeFileSync(bp, b, "utf-8");
    todo.push({ id: c.id, path: path.resolve(bp) });
  }

  const waves = [];
  for (let i = 0; i < todo.length; i += wave) {
    waves.push(todo.slice(i, i + wave));
  }
  return waves;
}

function tally(d) {
  const { panel, personas } = loadState(d);
  const byId = {};
  personas.forEach((c) => (byId[c.id] = c));
  const rows = [];
  const skipped = [];

  for (const c of personas) {
    const fp = path.join(d, "answers", `${c.id}.json`);
    const p = answerOk(fp, c.id);
    if (p) {
      skipped.push({ id: c.id, reason: p });
      continue;
    }
    const a = readJson(fp);
    rows.push({ ...byId[c.id], ...a });
  }

  if (rows.length === 0) throw new PanelError("no valid answers yet: run briefs first");

  function group(key) {
    const out = {};
    for (const r of rows) {
      out[r[key]] = out[r[key]] || [];
      out[r[key]].push(r);
    }
    return Object.entries(out)
      .map(([k, list]) => [k, list.length, list.filter((x) => x.buys).length / list.length])
      .sort((a, b) => b[2] - a[2]);
  }

  const incomes = rows.map((r) => r.income).sort((a, b) => a - b);
  const cut1 = incomes[Math.floor(incomes.length / 3)];
  const cut2 = incomes[Math.floor((2 * incomes.length) / 3)];

  for (const r of rows) {
    if (r.income < cut1) r.income_band = `under ₹${cut1.toLocaleString()}`;
    else if (r.income >= cut2) r.income_band = `₹${cut2.toLocaleString()} and up`;
    else r.income_band = `₹${cut1.toLocaleString()} to ₹${cut2.toLocaleString()}`;
  }

  const yes = rows.filter((r) => r.buys);
  const no = rows.filter((r) => !r.buys);

  function groupReasons(list) {
    const out = {};
    for (const r of list) {
      out[r.reason_code] = out[r.reason_code] || [];
      out[r.reason_code].push(r);
    }
    return Object.entries(out)
      .map(([code, arr]) => [code, arr.length, arr.slice(0, 2).map((x) => x.reason), arr.slice(0, 2).map((x) => x.id)])
      .sort((a, b) => b[1] - a[1]);
  }

  const res = {
    business: panel.customer.business,
    seed: panel.seed,
    dealt: personas.length,
    answered: rows.length,
    skipped,
    buys: yes.length,
    passes: no.length,
    buy_rate: yes.length / rows.length,
    by_segment: group("segment"),
    by_behaviour: group("behaviour"),
    by_income: group("income_band"),
    why_not: groupReasons(no),
    why_yes: groupReasons(yes),
    flip: no.map((r) => (r.would_change_my_mind || "").trim()).filter(Boolean),
    purchases_first_month_per_buyer:
      yes.length > 0
        ? yes.reduce((acc, curr) => acc + (Number(curr.purchases_first_month) || 0), 0) / yes.length
        : 0,
    price_answers: rows.filter((r) =>
      ["price_too_cheap", "price_cheap", "price_expensive", "price_too_expensive"].every((k) => !isNaN(Number(r[k])))
    ).length,
  };
  return res;
}

function resultsMd(res) {
  const pct = (v) => `${Math.round(v * 100)}%`;
  const L = [
    `# Buyer panel: ${res.business}`,
    "",
    `**${res.buys} buy · ${res.passes} pass** (${pct(res.buy_rate)} buy) out of ${res.answered} simulated buyers. Seed ${res.seed}, so the same cards can be dealt again.`,
  ];
  if (res.skipped.length > 0) {
    L.push("", `${res.skipped.length} of ${res.dealt} buyers have no valid answer and are left out.`);
  }
  L.push("", "These are simulated buyers, not customers. Use this to find objections and weak spots, then confirm the big ones with real people before you spend.");

  for (const [title, key] of [["By segment", "by_segment"], ["By buying behaviour", "by_behaviour"], ["By income", "by_income"]]) {
    L.push("", `## ${title}`, "", "| group | buyers | buy rate |", "| --- | ---: | ---: |");
    for (const [k, n, r] of res[key]) {
      L.push(`| ${k} | ${n} | ${pct(r)}${n < 8 ? "  (thin)" : ""} |`);
    }
  }

  L.push("", "## Why they pass", "", "| reason | buyers | in their words |", "| --- | ---: | --- |");
  for (const [k, n, quotes, ids] of res.why_not) {
    const qStr = quotes.map((q, idx) => `"${q.replace(/\|/g, "/")}" (${ids[idx]})`).join(" · ");
    L.push(`| ${k} | ${n} | ${qStr} |`);
  }

  L.push("", "## Why they buy", "", "| reason | buyers | in their words |", "| --- | ---: | --- |");
  for (const [k, n, quotes, ids] of res.why_yes) {
    const qStr = quotes.map((q, idx) => `"${q.replace(/\|/g, "/")}" (${ids[idx]})`).join(" · ");
    L.push(`| ${k} | ${n} | ${qStr} |`);
  }

  if (res.flip.length > 0) {
    L.push("", "## What would flip a no", "");
    for (const f of res.flip.slice(0, 12)) {
      L.push(`- ${f}`);
    }
  }

  if (res.purchases_first_month_per_buyer !== null) {
    L.push("", `Buyers say they would buy **${res.purchases_first_month_per_buyer.toFixed(1)} times** in the first month on average.`);
  }
  if (res.price_answers) {
    L.push("", `${res.price_answers} buyers gave all four price answers. Ready for founder-pricing analysis.`);
  }
  return L.join("\n") + "\n";
}

// CLI handler
const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd) {
  console.log("Usage: node scripts/panel.js <init|prompts|check|save|tally|status> [options]");
  process.exit(1);
}

const dirIdx = args.indexOf("--dir");
const dir = dirIdx !== -1 ? args[dirIdx + 1] : path.join("founder", "panel");

try {
  if (cmd === "init") {
    const cIdx = args.indexOf("--customer");
    const pIdx = args.indexOf("--pitch");
    const nIdx = args.indexOf("--n");
    const sIdx = args.indexOf("--seed");
    const customer = cIdx !== -1 ? args[cIdx + 1] : "founder/customer.json";
    const pitch = pIdx !== -1 ? args[pIdx + 1] : "founder/pitch.md";
    const n = nIdx !== -1 ? parseInt(args[nIdx + 1], 10) : 100;
    const seed = sIdx !== -1 ? parseInt(args[sIdx + 1], 10) : 7;

    const cards = init(dir, customer, pitch, n, seed);
    const { panel } = loadState(dir);
    console.log(`dealt ${cards.length} buyers (seed ${panel.seed}) into ${dir}. Next: prompts`);
  } else if (cmd === "prompts") {
    const wIdx = args.indexOf("--wave");
    const wave = wIdx !== -1 ? parseInt(args[wIdx + 1], 10) : WAVE;
    const waves = writeBriefs(dir, wave);
    const total = waves.reduce((sum, w) => sum + w.length, 0);
    if (total === 0) {
      console.log("every buyer has a valid answer. Next: tally");
    } else {
      console.log(`${total} briefs in ${waves.length} waves of up to ${wave}. Launch one wave at a time:`);
      waves.forEach((w, idx) => {
        console.log(`wave ${idx + 1}: ${w.map((j) => `${j.id}=${j.path}`).join(" ")}`);
      });
    }
  } else if (cmd === "check") {
    const { personas } = loadState(dir);
    const probs = [];
    for (const c of personas) {
      const p = answerOk(path.join(dir, "answers", `${c.id}.json`), c.id);
      if (p) probs.push({ id: c.id, prob: p });
    }
    if (probs.length === 0) {
      console.log("all answers present and valid");
    } else {
      probs.forEach((p) => console.log(`${p.id}: ${p.prob}`));
    }
  } else if (cmd === "tally") {
    const res = tally(dir);
    const text = resultsMd(res);
    const out = path.join(dir, "results.md");
    fs.writeFileSync(out, text, "utf-8");
    writeJson(path.join(dir, "results.json"), res);
    console.log(`${res.buys} buy · ${res.passes} pass (${Math.round(res.buy_rate * 100)}%). Wrote ${out}`);
  }
} catch (e) {
  console.error("error:", e.message);
  process.exit(2);
}
