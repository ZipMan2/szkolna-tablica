const files = import.meta.glob('./*.html', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
import.meta.glob('./*.css', { eager: true })

export function mountLayout(root: HTMLElement, name: string) {
  const key = `./${name}.html`
  const html = files[key] ?? files['./display1.html']
  root.className = `layout-${files[key] ? name : 'display1'}`
  root.innerHTML = html
}
