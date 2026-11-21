/**
 * Per-repo settings of the architecture tests; the other files in this folder are
 * the same in meritum-frontend, meritum-extension and meritum-mocks.
 *
 * @feature none (infrastructure)
 */
export const settings = {
  /** Folders whose code must carry JSDoc with `@feature` and keep constants in constants.ts. */
  sourceDirs: ['entrypoints/', 'utils/', 'tests/'],
  /** Never checked: generated files and copies owned by other repos (path prefixes). */
  excluded: [
    'entrypoints/popup/ui.css', // design-system copy
    'entrypoints/popup/popup.css', // design-system copy
    'design-system/', // pnpm sync copy, checked by tests/design-system-copy.test.ts
  ],
  /** Line limit of one file. */
  maxLines: 250,
}
