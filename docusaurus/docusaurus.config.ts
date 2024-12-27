// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import { themes } from "prism-react-renderer";
import { EnumChangefreq } from "sitemap";

const config: Config = {
  title: "Redwood MMO Framework Documentation",
  tagline: "Dinosaurs are cool",
  favicon: "favicon.ico",

  // Set the production url of your site here
  url: "https://redwoodmmo.com",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "IncantaGames", // Usually your GitHub org/user name.
  projectName: "RedwoodMMO", // Usually your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "throw",

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  scripts: [{src: 'https://plausible.io/js/script.js', defer: true, 'data-domain': 'redwoodmmo.com'}],

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",

          sidebarCollapsed: true,
          sidebarCollapsible: true,
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
          blogSidebarCount: "ALL"
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
        sitemap: {
          filename: "docusaurus-sitemap.xml",
          changefreq: EnumChangefreq.WEEKLY,
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig:
    {
      // Replace with your project's social card
      image: "img/redwood/redwood-hero-card.jpg",
      navbar: {
        title: "Redwood",
        logo: {
          alt: "Redwood Logo",
          src: "logo512.png",
        },
        items: [
          {
            type: "docSidebar",
            sidebarId: "docsWelcome",
            position: "left",
            label: "Docs",
          },
          { to: "https://github.com/orgs/RedwoodMMO/projects/1/views/1", label: "Roadmap", position: "left" },
          { to: "/blog", label: "Blog", position: "left" },
          {
            href: "https://license.redwoodmmo.com",
            label: "License Manager",
            position: "right",
          },
          {
            href: "https://discord.gg/Gj23MHhCQR",
            label: "Discord",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Docs",
            items: [
              {
                label: "Welcome to Redwood",
                to: "/docs/",
              },
              {
                label: "Getting Started",
                to: "/docs/getting-started/overview",
              },
              {
                label: "Intro to Multiplayer",
                to: "/docs/support/intro-to-multiplayer",
              },
              {
                label: "Architecture Overview",
                to: "/docs/architecture/overview",
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "Discord",
                href: "https://discord.gg/Gj23MHhCQR",
              },
              {
                label: "YouTube",
                href: "https://youtube.com/@incantagames",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "Blog",
                to: "/blog",
              },
              {
                label: "GitHub",
                href: "https://github.com/redwoodmmo",
              },
              {
                label: "License Manager",
                href: "https://license.redwoodmmo.com",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Incanta Games.`,
      },
      prism: {
        theme: themes.github,
        darkTheme: themes.dracula,
        additionalLanguages: [
          "bash",
          "diff",
          "json",
          "javascript",
          "typescript",
          "csharp",
        ],
      },
      algolia: {
        appId: 'PFF7I0GE7L',
        apiKey: 'b571904d14f18c530c0f5337065ae2b1',
        indexName: 'redwoodmmo',

        contextualSearch: true,

        searchParameters: {},

        searchPagePath: 'search',
      }
    } satisfies Preset.ThemeConfig,
};

export default config;
