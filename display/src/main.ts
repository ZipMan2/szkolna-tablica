import './styles/style.css'
import { mountLayout } from './layouts'
import { renderAnnouncements, renderGallery, renderSubstitutions, renderTitle } from './render'
import type { BoardData } from './types/types'

const params = new URLSearchParams(location.search)
const screen = params.get('screen') ?? 'display1'

const app = document.getElementById('app')
if (app) {
  mountLayout(app, screen)
}

function render(d: BoardData) {
  renderTitle(d.title)
  renderSubstitutions(d.substitutions)
  renderAnnouncements(d.announcements)
  renderGallery(d.gallery)
}

function connect() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  const ws = new WebSocket(`${proto}://${location.host}/ws/display?screen=${screen}`)

  ws.onmessage = e => {
    try {
      const data: BoardData = JSON.parse(e.data)
      render(data)
    } catch (err) {
      console.error('Failed to parse WS data:', err)
    }
  }

  ws.onclose = () => setTimeout(connect, 3000)
}

// connect()

render({
  title: 'Zespół Szkół Technicznych',
  substitutions: [
    { hour: '1', class: '3A', teacher: 'Jan Kowalski', room: '102' },
    { hour: '2', class: '2B', teacher: 'Anna Nowak', room: '205' },
  ],
  announcements: [
    'Zebranie z rodzicami odbędzie się w czwartek o 17:00.',
    'Turniej siatkówki na hali sportowej od godziny 10:00.',
  ],
  gallery: ['https://picsum.photos/800/600?random=1', 'https://picsum.photos/800/600?random=2'],
})
