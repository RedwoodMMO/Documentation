// Mirrors the docs from the landing site into this repo, one branch per docs version:
//   main  -> the latest released version (versions.json[0], what redwoodmmo.com/docs shows)
//   <ver> -> versioned_docs/version-<ver> for each entry in versions.json (e.g. 5.x)
//   next  -> the unreleased working copy in docs/
//
// Each branch holds that version's markdown at its root next to this script. Images linked as
// /img/... are copied into img/ and rewritten to relative paths, and other root-relative links
// point at the live site, so the docs read correctly on GitHub and in the backend's docs/ submodule.
//
// Env:
//   SKIP_CLONE=true  use the existing ./landing-site checkout instead of cloning it (CI does this)
//   GITHUB_TOKEN     token for cloning the landing site when SKIP_CLONE isn't set
//   COMMIT_MESSAGE   message for the mirror commits (defaults to "Update mirror")
//   DRY_RUN=true     commit locally but don't push

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = __dirname;
const SOURCE = path.join(ROOT, "landing-site");
const SITE = path.join(SOURCE, "docusaurus");
const SITE_URL = "https://redwoodmmo.com";
const DRY_RUN = process.env.DRY_RUN === "true";

// Repo files kept on every branch. Read them now, because checking out a branch swaps them out.
const KEPT_FILES = [".gitattributes", ".gitignore", "update.js"];
// Left alone when clearing a branch's tree before copying the docs in
const UNTOUCHED = new Set([".git", "landing-site", "node_modules"]);

function git(args, options = {}) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf-8", ...options }).trim();
}

const keptFiles = Object.fromEntries(
  KEPT_FILES.filter((file) => fs.existsSync(path.join(ROOT, file))).map((file) => [
    file,
    fs.readFileSync(path.join(ROOT, file)),
  ]),
);

const cloned = process.env.SKIP_CLONE !== "true";
if (cloned) {
  fs.rmSync(SOURCE, { recursive: true, force: true });
  execFileSync(
    "git",
    [
      "clone",
      "--depth",
      "1",
      `https://oauth2:${process.env.GITHUB_TOKEN}@github.com/Incanta/redwood-landing-site.git`,
      SOURCE,
    ],
    { stdio: "ignore" },
  );
}

const sourceSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: SOURCE, encoding: "utf-8" }).trim();
const message =
  `${process.env.COMMIT_MESSAGE || "Update mirror"}\n\n` +
  `Mirrored from Incanta/redwood-landing-site@${sourceSha}`;

const versions = JSON.parse(fs.readFileSync(path.join(SITE, "versions.json"), "utf-8"));
if (versions.length === 0) {
  throw new Error("versions.json is empty; main mirrors the latest released version");
}

const targets = [
  { branch: "main", dir: `versioned_docs/version-${versions[0]}` },
  ...versions.map((version) => ({ branch: version, dir: `versioned_docs/version-${version}` })),
  { branch: "next", dir: "docs" },
];

for (const target of targets) {
  mirror(target);
}

if (cloned) {
  fs.rmSync(SOURCE, { recursive: true, force: true });
}

function mirror({ branch, dir }) {
  checkout(branch);

  for (const entry of fs.readdirSync(ROOT)) {
    if (!UNTOUCHED.has(entry)) {
      fs.rmSync(path.join(ROOT, entry), { recursive: true, force: true });
    }
  }
  for (const [file, content] of Object.entries(keptFiles)) {
    fs.writeFileSync(path.join(ROOT, file), content);
  }

  const images = new Set();
  copyDocs(path.join(SITE, dir), ROOT, 0, images);

  for (const image of images) {
    const src = path.join(SITE, "static", "img", image);
    if (!fs.existsSync(src)) {
      console.log(`::warning::${branch}: ${dir} links to missing image /img/${image}`);
      continue;
    }
    const dest = path.join(ROOT, "img", image);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }

  git(["add", "-A"]);
  if (git(["status", "--porcelain"]) === "") {
    console.log(`${branch}: no changes`);
    return;
  }

  git(["commit", "-F", "-"], { input: message });
  if (DRY_RUN) {
    console.log(`${branch}: committed (dry run, not pushed)`);
    return;
  }
  git(["push", "origin", `HEAD:refs/heads/${branch}`]);
  console.log(`${branch}: pushed`);
}

function checkout(branch) {
  const exists = git(["ls-remote", "--heads", "origin", branch]) !== "";
  if (exists) {
    git(["fetch", "--depth", "1", "origin", `+refs/heads/${branch}:refs/remotes/origin/${branch}`]);
    git(["checkout", "-f", "-B", branch, `origin/${branch}`]);
  } else {
    // The index still holds the previous branch's files; clearing the tree and `git add -A` drops them
    git(["checkout", "-f", "--orphan", branch]);
  }
}

function copyDocs(srcDir, destDir, depth, images) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDocs(src, dest, depth + 1, images);
    } else if (/\.mdx?$/.test(entry.name)) {
      fs.writeFileSync(dest, rewriteLinks(fs.readFileSync(src, "utf-8"), depth, images));
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

// Rewrites root-relative targets in markdown links and src/href attributes: /img/... becomes
// relative to the file (and is recorded so the image gets copied), anything else goes to the live site
function rewriteLinks(content, depth, images) {
  const toRoot = depth === 0 ? "./" : "../".repeat(depth);
  return content.replace(
    /(\]\(|\b(?:src|href)=["'])\/(?!\/)([^)\s"']*)/g,
    (match, opener, target) => {
      if (target.startsWith("img/")) {
        images.add(decodeURIComponent(target.slice("img/".length).split(/[?#]/)[0]));
        return `${opener}${toRoot}${target}`;
      }
      return `${opener}${SITE_URL}/${target}`;
    },
  );
}
