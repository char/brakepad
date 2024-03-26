import type { Tracer, TraceSpan } from "./mod.ts"

export class ConsoleTracer implements Tracer {
  constructor() {}

  start(span: TraceSpan) {
    const output = [
      "%c%s %c%s",
      "color: dimgray",
      new Date(performance.timeOrigin + span.start).toISOString(),
      "color: white; font-weight: bold; text-decoration: underline",
      span.fullName
    ]

    if (span.data.length > 0) {
      output[0] += "%c "
      output.push("")

      for (const [key, value] of span.data) {
        output[0] += "%c%s=%c%s"
        output.push("font-style: italic")
        output.push(key)
        output.push("")
        output.push(Deno.inspect(value, { colors: true, compact: true, breakLength: Infinity }))
      }
    }

    console.log(...output)
  }
  finish(_span: TraceSpan) {}
}
