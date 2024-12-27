const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

if (fs.existsSync("docusaurus")) {
  fs.rmSync("docusaurus", { recursive: true });
}

if (process.env.SKIP_CLONE !== "true") {
  if (fs.existsSync("landing-site")) {
    fs.rmSync("landing-site", { recursive: true });
  }

  execSync(
    `git clone https://oauth2:${process.env.GITHUB_TOKEN}@github.com/Incanta/redwood-landing-site.git landing-site`,
    {
      stdio: "ignore"
    }
  );
}

fs.cpSync("landing-site/docusaurus", "docusaurus", { recursive: true });

fs.rmSync("landing-site", { recursive: true });

const blogFolders = fs.readdirSync(
  path.join(__dirname, "docusaurus", "blog"),
  { withFileTypes: true}
).filter((file) => file.isDirectory());

for (const folder of blogFolders) {
  const indexFile = path.join(__dirname, "docusaurus", "blog", folder.name, "index.md");

  if (fs.existsSync(indexFile)) {
    const content = fs.readFileSync(indexFile, "utf-8");
    const isUnlisted = /^unlisted: true$/m.test(content);

    if (isUnlisted) {
      fs.rmSync(path.join(__dirname, "docusaurus", "blog", folder.name), { recursive: true });
    }
  }
}