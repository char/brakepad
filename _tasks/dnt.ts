import * as dnt from "https://deno.land/x/dnt@0.40.0/mod.ts"

const denoJson = JSON.parse(Deno.readTextFileSync("./deno.json"))

await dnt.emptyDir("./npm")
await dnt.build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  shims: {
    custom: [
      {
        module: "node:crypto",
        globalNames: [{ name: "crypto", exportName: "default" }]
      }
    ],
    deno: "dev"
  },
  typeCheck: false,
  package: {
    name: "@char-lt/brakepad",
    version: denoJson.version,
    description: "Minimalist tracing for TypeScript"
  },
  async postBuild() {
    await Deno.copyFile("./README.md", "./npm/README.md")
  }
})
