declare global {
  // deno-lint-ignore no-var
  var __BRAKEPAD__: TracingContext | undefined
}

export interface TraceSpan {
  id: string
  parent: TraceSpan | undefined
  name: string
  fullName: string
  data: [string, unknown][]
  start: ReturnType<typeof performance.now>
  end: ReturnType<typeof performance.now> | undefined
}

export interface Tracer {
  start(span: TraceSpan): void
  finish(span: TraceSpan): void
}

// put the state inside a Context object so that when we import this module
// from multiple sources we can share the same mutable context between them
export interface TracingContext {
  tracer: Tracer
  currentSpan: TraceSpan | undefined
  currentNameStack: string[]
}

let ctx: TracingContext = globalThis.__BRAKEPAD__ ?? {
  tracer: {
    start(_span) {},
    finish(_span) {}
  },
  currentSpan: undefined,
  currentNameStack: []
}

/**
 * Initialize the tracing module with a global {@link TracingContext}.
 *
 * If you are importing the tracing module from different sources (e.g. disjoint esm.sh bundles)
 * you may need to ensure that init(..) is called for each instance.
 */
export const init = (context: TracingContext) => {
  ctx = context
  if (!globalThis.__BRAKEPAD__) globalThis.__BRAKEPAD__ = ctx
}

/**
 * Enters a new span. Spans represent periods of time spent processing an event.
 *
 * @param span The name of the span to enter
 * @param data Auxiliary structured data to include in the trace
 */
export const enter = (span: string, data: Record<string, unknown> = {}) => {
  const traceSpan: TraceSpan = {
    id: crypto.randomUUID(),
    parent: ctx.currentSpan,
    name: span,
    fullName: [...ctx.currentNameStack, span].join("."),
    data: Object.entries(data),
    start: performance.now(),
    end: undefined
  }
  ctx.currentSpan = traceSpan
  ctx.currentNameStack.push(span)
  ctx.tracer.start(traceSpan)
}

/**
 * Exits the current tracing span.
 */
export const exit = () => {
  const span = ctx.currentSpan
  if (span === undefined) return

  span.end = performance.now()
  ctx.currentSpan = span.parent
  ctx.currentNameStack.pop()
  ctx.tracer.finish(span)
}

/**
 * Exits the previous trace span and enters a new one.
 * This is the same as enter() and then exit().
 *
 * @param span The name of the span to enter
 * @param data Auxiliary structured data to include in the trace
 */
export const replace = (span: string, data: Record<string, unknown> = {}) => {
  const oldSpan = ctx.currentSpan
  if (oldSpan) {
    oldSpan.end = performance.now()
    ctx.currentSpan = oldSpan.parent
    ctx.currentNameStack.pop()
    ctx.tracer.finish(oldSpan)
  }

  const traceSpan: TraceSpan = {
    id: crypto.randomUUID(),
    parent: ctx.currentSpan,
    name: span,
    fullName: [...ctx.currentNameStack, span].join("."),
    data: Object.entries(data),
    start: performance.now(),
    end: undefined
  }
  ctx.currentSpan = traceSpan
  ctx.currentNameStack.push(span)
  ctx.tracer.start(traceSpan)
}

/**
 * Include extra auxiliary data in the current trace
 *
 * @param data Auxiliary structured data to include in the trace
 */
export const details = (data: Record<string, unknown>) => {
  const span = ctx.currentSpan
  if (span === undefined) return

  span.data.push(...Object.entries(data))
}

const spanHandle = {
  [Symbol.dispose]() {
    exit()
  }
}

/**
 * Enters a new tracing span like {@link enter} but returns a handle that will automatically
 * call {@link exit} upon dispose. This means you can use explicit resource management.
 *
 * @example
 * ```
 * const myFunc = (a: number, b: number) => {
 *   using _span = tracing.span("my function", { a, b })
 *   return a + b
 * }
 * ```
 */
export const span = (name: string, data: Record<string, unknown> = {}): typeof spanHandle => {
  enter(name, data)
  return spanHandle
}
