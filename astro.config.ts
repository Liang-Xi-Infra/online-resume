import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://liang-xi-infra.github.io",
  base: "/online-resume/",
  output: "static",
  integrations: [tailwind()],
  markdown: {
    shikiConfig: {
      theme: "github-dark",
      wrap: true,
    },
  },
  build: {
    assets: "assets",
  },
});
