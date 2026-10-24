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
