import react from "@vitejs/plugin-react";

import { defineConfig } from "vite";

const extraTsFilenames = ["contentScript", "background"];

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: "popup.html",
        ...Object.fromEntries(
          extraTsFilenames.map((filename) => [filename, `src/${filename}.ts`]),
        ),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (["contentScript", "background"].includes(chunkInfo.name)) {
            return "[name].js";
          }
          return "assets/[name].js";
        },
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
