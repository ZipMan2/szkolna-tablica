const mod = (name: string) => document.querySelector<HTMLElement>(`[data-module="${name}"]`)

function fillList(name: string, items: Record<string, string>[]) {
  const box = mod(name)
  const tpl = box?.querySelector('template')
  if (!box || !tpl) return 

  box.querySelectorAll('[data-item]').forEach(n => n.remove())

  for (const item of items) {
    const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement
    node.dataset.item = ''
    for (const [k, v] of Object.entries(item)) {
      node.querySelector<HTMLElement>(`[data-f="${k}"]`)?.replaceChildren(v)
    }
    box.append(node)
  }
}

export const renderTitle = (t = '') => {
  const el = mod('title')
  if (el) el.textContent = t
}

export const renderSubstitutions = (rows: Record<string, string>[] = []) => fillList('substitutions', rows)

export const renderAnnouncements = (items: string[] = []) =>
  fillList(
    'announcements',
    items.map(text => ({ text })),
  )

let galleryInterval: number | undefined

export function renderGallery(urls: string[] = []) {
  if (galleryInterval !== undefined) {
    clearInterval(galleryInterval)
    galleryInterval = undefined
  }

  const img = mod('gallery') as HTMLImageElement | null
  if (!img) return

  if (!urls.length) {
    img.src = ''
    return
  }

  let i = 0
  img.src = urls[0]

  if (urls.length > 1) {
    galleryInterval = window.setInterval(() => {
      i = (i + 1) % urls.length
      img.src = urls[i]
    }, 8000)
  }
}
