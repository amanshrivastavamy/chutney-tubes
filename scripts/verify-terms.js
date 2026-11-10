const cp = require("child_process");

const forbidden = [
  "office",
  "desk",
  "colleague",
  "schezwan chutney",
  "chutney2026",
  "919876543210",
  "B.NO",
  "Borosil",
  "Milton",
  "zero-leak",
  "Plastic Dabba",
  "Postal Zones",
  "Pre-launch",
  "Kissan",
  "Maggi",
  "Ching's",
  "15+"
];

const paths = [
  "src",
  "public",
  "tests",
  "data",
  "dev-server.js",
  "README.md",
  ".env.example",
  "package.json"
];

let totalHits = 0;
for (const word of forbidden) {
  try {
    const res = cp.execSync(`git grep -i "${word}" -- ${paths.join(" ")}`, { encoding: "utf8" }).trim();
    if (res) {
      console.log(`MATCH for '${word}':\n${res}\n`);
      totalHits++;
    }
  } catch (e) {
    // exit code 1 means no match, which is good
  }
}

console.log(`Total forbidden word hits in project files: ${totalHits}`);
process.exit(totalHits === 0 ? 0 : 1);
