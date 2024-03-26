import * as tracing from "./mod.ts"
import { ConsoleTracer } from "./console-tracer.ts"

// TODO: actually have a mock tracer and assert some things

tracing.init({
  currentSpan: undefined,
  tracer: new ConsoleTracer(),
  currentNameStack: []
})

Deno.test("250ms wait", async () => {
  tracing.enter("hello", { what: "world" })
  await new Promise(r => setTimeout(r, 250))
  tracing.exit()
})

Deno.test("multi-layer", () => {
  tracing.enter("parent")
  tracing.enter("child", { hello: "world" })
  tracing.replace("second child", { hello: "again" })
  tracing.exit()
  tracing.exit()
})
