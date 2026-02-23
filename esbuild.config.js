import * as esbuild from "esbuild";

async function main() {
  const context = await esbuild.context({
    entryPoints: ["./src/x-word.ts"],
    bundle: true,
    sourcemap: "inline",
    outfile: "./docs/x-word.js",
  });

  await context.watch();

  await context.serve({
    servedir: "./docs",
    port: 8000,
  });
}

main().catch(e => console.error(e));
