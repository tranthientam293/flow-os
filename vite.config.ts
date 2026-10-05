import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const pkg = (names: string) =>
  new RegExp(`[\\\\/]node_modules[\\\\/](${names})[\\\\/]`);

// Font files get hashed names at build time, so the <link rel="preload"> can't
// live in index.html. This adds it for every built asset matching `pattern`,
// so the browser fetches the font with the HTML instead of after the CSS.
function preloadFonts(pattern: RegExp): Plugin {
  let base = "/";
  return {
    name: "flowos:preload-fonts",
    apply: "build",
    configResolved: (config) => {
      base = config.base;
    },
    transformIndexHtml: {
      order: "post",
      handler: (_html, { bundle }) =>
        Object.keys(bundle ?? {})
          .filter((file) => pattern.test(file))
          .map((file) => ({
            tag: "link",
            injectTo: "head",
            attrs: {
              rel: "preload",
              href: `${base}${file}`,
              as: "font",
              type: "font/woff2",
              crossorigin: "",
            },
          })),
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const port = parseInt(env.VITE_APP_PORT) || 5173;

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Inter (body text), Latin subset only: the app is English.
      preloadFonts(/inter-latin-wght-normal-[\w-]+\.woff2$/),
    ],
    server: { host: true, port, strictPort: true },
    preview: { host: true, port: 4173 },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    build: {
      rolldownOptions: {
        output: {
          // Libraries every page needs get their own long-cached chunks, so an
          // app-only deploy doesn't re-download them. antd is left to automatic
          // splitting so each route only loads the components it uses.
          codeSplitting: {
            groups: [
              {
                name: "react",
                test: pkg("react|react-dom|scheduler|react-router|cookie"),
                priority: 30,
              },
              { name: "supabase", test: pkg("@supabase"), priority: 20 },
              { name: "query", test: pkg("@tanstack"), priority: 20 },
              {
                // antd's styling engine, needed by every antd component.
                name: "antd-core",
                test: pkg(
                  "@ant-design[\\\\/](cssinjs|cssinjs-utils|colors|fast-color)|@rc-component[\\\\/](util|motion)|stylis|@emotion",
                ),
                priority: 20,
              },
            ],
          },
        },
      },
    },
  };
});
