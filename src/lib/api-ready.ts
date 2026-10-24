let resolveReady: () => void = () => {}

export const apiReady = new Promise<void>((resolve) => {
  resolveReady = resolve
})

export function markApiReady(): void {
  resolveReady()
  document.documentElement.dataset.apiReady = 'true'
}
