import path from "path";
import { defineConfig, normalizePath } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  return {
    plugins: [
      react(),
      tsconfigPaths(),
      ...(isDev
        ? [
            viteStaticCopy({
              targets: [
                {
                  src: normalizePath(
                    path.resolve(__dirname, "./node_modules/onnxruntime-web/dist") +
                      "/*.wasm"
                  ),
                  dest: "/node_modules/.vite/deps",
                },
              ],
            }),
          ]
        : []),
    ],
    base: "./",
    build: {
      emptyOutDir: true,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            onnx: ["onnxruntime-web"],
          },
        },
      },
    },
    worker: {
      format: "es",
      plugins: () => [tsconfigPaths()],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "onnxruntime-web/all": path.resolve(
          __dirname,
          "node_modules/onnxruntime-web/dist/ort.all.bundle.min.mjs"
        ),
      },
    },
    server: {
      port: 3000,
    },
    optimizeDeps: {
      exclude: ["onnxruntime-web"],
    },
  };
});
