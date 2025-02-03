/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const fs = require("fs");
const { JSDOM } = require("jsdom");

const customCss = `
  .main-wrapper {
    max-width: 37.5rem;
    margin: auto;
  }
`;

(async () => {
  if (process.argv.length < 3) {
    const folderNames = fs
      .readdirSync(path.resolve(__dirname, "build", "blog"), {
        withFileTypes: true,
      })
      .filter(file => file.isDirectory())
      .map(file => file.name);

    console.error(
      `Please provide the folder of the built blog post. Options:\n  ${folderNames.join(
        "\n  ",
      )}`,
    );

    process.exit(1);
  }

  const clipboardy = await import("clipboardy");

  const stylesheets = fs.readdirSync(
    path.resolve(__dirname, "build", "assets", "css"),
  );

  const css = fs.readFileSync(
    path.resolve(__dirname, "build", "assets", "css", stylesheets[0]),
    "utf8",
  );

  const blogPostName = process.argv[2];

  const htmlFile = fs.readFileSync(
    path.resolve(__dirname, "build", "blog", blogPostName, "index.html"),
    "utf8",
  );

  const dom = new JSDOM(htmlFile);

  const wrapper = dom.window.document.getElementsByClassName("main-wrapper")[0];

  const headerSpan = wrapper
    .querySelector("header")
    .querySelector(".margin-vert--md");

  headerSpan.innerHTML = `${headerSpan.innerHTML} · <a href="https://redwoodmultiplayer.com/blog/${blogPostName}?ref=newsletter" target="_blank">View in browser</a>`;

  wrapper.querySelector("article").querySelector("footer").remove();
  wrapper.querySelector("main").querySelector("nav").remove();

  const htmlBody = `<style>${css}${customCss}</style>${wrapper.outerHTML
    .replace(/src="\//g, `src="https://redwoodmultiplayer.com/`)
    .replace(/href="\//g, `href="https://redwoodmultiplayer.com/`)}`;

  clipboardy.default.write(htmlBody);
})();
