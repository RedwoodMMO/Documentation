/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const fsExtra = require("fs-extra");
const path = require("path");

const sourceBuildPath = path.join(__dirname, "build");
const targetBuildPath = path.join(__dirname, "..", "public");

try {
  fs.rmSync(path.join(targetBuildPath, "assets"), { recursive: true });
} catch (e) {}
try {
  fs.rmSync(path.join(targetBuildPath, "blog"), { recursive: true });
} catch (e) {}
try {
  fs.rmSync(path.join(targetBuildPath, "docs"), { recursive: true });
} catch (e) {}

try {
  fs.rmSync(path.join(targetBuildPath, ".nojekyll"), { force: true });
} catch (e) {}
try {
  fs.rmSync(path.join(targetBuildPath, "404.html"), { force: true });
} catch (e) {}
try {
  fs.rmSync(path.join(targetBuildPath, "docusaurus-sitemap.xml"), {
    force: true,
  });
} catch (e) {}

fsExtra.copySync(
  path.join(sourceBuildPath, "assets"),
  path.join(targetBuildPath, "assets"),
);
fsExtra.copySync(
  path.join(sourceBuildPath, "blog"),
  path.join(targetBuildPath, "blog"),
);
fsExtra.copySync(
  path.join(sourceBuildPath, "docs"),
  path.join(targetBuildPath, "docs"),
);

fsExtra.copySync(
  path.join(sourceBuildPath, ".nojekyll"),
  path.join(targetBuildPath, ".nojekyll"),
);

fsExtra.copySync(
  path.join(sourceBuildPath, "404.html"),
  path.join(targetBuildPath, "404.html"),
);

fsExtra.copySync(
  path.join(sourceBuildPath, "docusaurus-sitemap.xml"),
  path.join(targetBuildPath, "docusaurus-sitemap.xml"),
);

fsExtra.copySync(
  path.join(
    __dirname,
    ".docusaurus",
    "docusaurus-plugin-content-blog",
    "default",
    "blog-archive-80c.json",
  ),
  path.join(__dirname, "..", "src", "blog-archive.json"),
);
