// Versioned Lighthouse audit configuration (CHALLENGE.md section 10).
// Mobile uses Lighthouse's default mobile emulation (Moto G Power, slow 4G, 4x CPU slowdown);
// desktop uses Lighthouse's desktop preset (1350x940, no CPU slowdown, 10 Mbps).
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

export const PAGES = [
  { id: 'home', path: '/' },
  { id: 'detail', path: '/nft/nft-0042' },
]

export const RUNS = 3

export const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']

export const TARGETS = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 }

const settings = { onlyCategories: CATEGORIES }

export const PROFILES = {
  mobile: { extends: 'lighthouse:default', settings: { ...settings, formFactor: 'mobile' } },
  desktop: { ...desktopConfig, settings: { ...desktopConfig.settings, ...settings } },
}
