/**
 * Loaded before every test file (`pnpm test`): registers a happy-dom DOM on the
 * globals so React components render, and unmounts them after each test.
 *
 * @feature none (infrastructure)
 */
import { after, afterEach } from 'node:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'

GlobalRegistrator.register()

// Imported after register(): Testing Library reads `document` when it loads.
const { cleanup } = await import('@testing-library/react')

afterEach(cleanup)
after(() => GlobalRegistrator.unregister())
