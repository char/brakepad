# brakepad

Minimalist tracing for TypeScript

## Design Goals

- Spans are batched and shipped over the network on an interval
  - In-progress spans are shipped, but future shipments can finalize them with an execution time
- Libraries should be able to emit traces without span shipping apparatus
