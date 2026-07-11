const fs = require("fs");
const path = require("path");
const s = JSON.parse(fs.readFileSync("benchmark/output/beta-validation-2/summary.json", "utf8"));
const rows = s.products.map((p) => {
  const m = JSON.parse(
    fs.readFileSync(path.join("benchmark/output/beta-validation-2", p.slot, "metrics.json"), "utf8"),
  );
  return {
    slot: p.slot,
    cat: p.category,
    overall: p.overall,
    dom: m.daos.productDominance,
    wbDom: m.leader.productDominance,
    fail: p.failureReason || "—",
  };
});
const bodyRows = rows
  .map((r) => {
    const cls = r.overall === "daos" ? "d" : r.overall === "wb" ? "w" : "dr";
    return `<tr><td>${r.slot}</td><td>${r.cat}</td><td class="${cls}">${r.overall}</td><td>${r.dom}</td><td>${r.wbDom}</td><td>${r.fail}</td></tr>`;
  })
  .join("");
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>BV2 Report</title>
<style>body{font-family:system-ui;background:#0f172a;color:#e2e8f0;margin:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #334155;padding:6px;font-size:12px}th{background:#1e293b}.d{color:#4ade80}.w{color:#f87171}.dr{color:#fbbf24}</style></head><body>
<h1>Beta Validation 2 Report</h1><p>n=${s.productCount} · Win Rate ${s.aggregate.marketWinRate}% · Gen ${s.aggregate.genSuccessRate}% · ${s.council.closedBetaReady}</p>
<table><tr><th>Slot</th><th>Category</th><th>Verdict</th><th>DAOS Dom</th><th>WB Dom</th><th>Failure</th></tr>${bodyRows}</table></body></html>`;
fs.writeFileSync("benchmark/output/beta-validation-2/report.html", html);
console.log("report.html written");
