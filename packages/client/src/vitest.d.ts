import '@testing-library/jest-dom';
import type { AxeMatchers } from 'vitest-axe/matchers';

// vitest-axe 0.1.0 only augments the legacy global `Vi` namespace, which Vitest 2
// no longer reads, so the matcher types are registered here instead. Declaration
// merging requires the empty interfaces and the unconstrained type parameter.
/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
declare module 'vitest' {
  interface Assertion<T = any> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
