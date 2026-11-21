import { defineConfig } from 'wxt'

// Build-time API of the verification core: prd by default, dev on request
// (WXT_API_URL=https://meritum-dev.gburek.app pnpm build).
const api = process.env['WXT_API_URL'] ?? 'https://meritum.gburek.app'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Meritum',
    short_name: 'Meritum',
    description: 'Obywatelski radar dezinformacji. Sprawdź post i zobacz werdykt ze źródłami.',
    minimum_chrome_version: '111',
    permissions: ['storage', 'activeTab'],
    host_permissions: [`${api}/*`],
  },
})
