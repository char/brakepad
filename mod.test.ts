import * as tracing from "./mod.ts"

// TODO: actually have a mock tracer and assert some things

const fullSpanName = (span: tracing.TraceSpan) => {
  let name = span.name

  let curr = span.parent
  while (curr !== undefined) {
    name = name = curr.name + "." + name
    curr = curr.parent
  }

  return name
}

tracing.init({
  currentSpan: undefined,
  tracer: {
    start(span) {
      console.log("start", fullSpanName(span), span.data)
    },
    finish(span) {
      console.log(
        "finish",
        fullSpanName(span),
        span.end ? span.end - span.start : "unknown",
        span.data
      )
    }
  }
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
