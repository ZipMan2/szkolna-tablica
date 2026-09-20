# School Board

System tablicy szkolnej: zastępstwa, ogłoszenia i dynamiczny layout na ekranie w holu.

Monorepo z trzema aplikacjami:

- **server** – Fastify + PostgreSQL (API + WebSocket)
- **panel** – panel administracyjny (React)
- **display** – widok kiosku (HTML + HTMX / Vite)

## Struktura

.
├── biome.json
├── compose.yaml
├── display/ # widok na ekran
├── panel/ # panel admina
├── server/ # backend
├── package.json # root (workspaces)
├── Plan.md
└── tsconfig.base.json

## Development

### Wymagania

- Node.js ≥ 22
- Podman (lub Docker) – do bazy

### Pierwsze uruchomienie

```bash
# 1. Zainstaluj zależności
npm install

# 2. Skopiuj przykładowe env
cp server/.env.example server/.env
# uzupełnij DATABASE_URL itp.

# 3. Uruchom bazę
npm run db:up

# 4. Migracje (gdy będą)
npm run db:migrate -w server

# 5. Odpal wszystko naraz
npm run dev

Po starcie:

API:        http://localhost:3000
Panel:      http://localhost:5173
Display:    http://localhost:5174
```

## Komendy główne (root)

| **Komenda** | **Co robi** |
| `npm run dev` | Odpala `server` + `panel` + `display` jednocześnie |
| `npm run dev:server` | Uruchamia tylko backend (`tsx watch`) |
| `npm run dev:panel` | Uruchamia tylko panel admina |
| `npm run dev:display` | Uruchamia tylko widok kiosku |
| `npm run build` | Build wszystkich workspace'ów |
| `npm run typecheck` | Sprawdzenie typów TypeScript we wszystkich paczkach |
| `npm run lint` | Weryfikacja kodu za pomocą Biome (`biome check`) |
| `npm run format` | Formatowanie kodu za pomocą Biome (`biome format`) |
| `npm run db:up` | Podnosi bazę Postgres (`podman compose`) |
| `npm run db:down` | Zatrzymuje bazę Postgres |
| `npm run db:logs` | Podgląd logów bazy danych na żywo |

## Komendy serwera (`/server`)

| **Komenda** | **Co robi** |
| `npm run dev` | Tryb deweloperski z hot-reloadem (`tsx watch`) |
| `npm run build` | Build produkcyjny za pomocą `tsup` |
| `npm run start` | Uruchomienie zbudowanej wersji produkcyjnej |
| `npm run db:generate` | Generuje nowe migracje (Drizzle ORM) |
| `npm run db:migrate` | Wykonuje migracje na bazie danych |
| `npm run db:studio` | Otwiera GUI bazy danych (Drizzle Studio) |
| `npm run test` | Uruchamia testy jednostkowe/integracyjne (Vitest) |
| `npm run typecheck` | Sprawdzenie typów TypeScript tylko dla serwera |

## Przydatne opcje uruchamiania testów w /server

Uruchomienie tylko testów z "health" w nazwie pliku
npm run test -- health

Uruchomienie konkretnego testu po nazwie
npm run test -- -t "returns ok"

Tryb obserwacyjny testów (odpala testy powiązane ze zmienionymi plikami)
npm run test:watch

## Produkcja i Wdrożenie (Nginx)

server {
listen 80;
server*name *;

root /opt/school-board/display/dist; # display pod /
location / { try_files $uri /index.html; }

location /panel/ {
alias /opt/school-board/panel/dist/;
try_files $uri $uri/ /panel/index.html;
}

location /api/ {
proxy_pass http://127.0.0.1:3000;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
}

location /ws/ {
proxy_pass http://127.0.0.1:3000;
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_read_timeout 1h;
}
}

Kolejność prac
GET /health i /health/ready, tabele users, sessions, screens, blocks.
Kreator pierwszego uruchomienia i logowanie (register tylko przy pustej bazie, login z ochroną z pierwszej odpowiedzi).
Panel: ekran stanu połączenia, wybór layoutu, moduły.
WS: snapshot po połączeniu i po każdej zmianie w panelu.
GitHub Actions: build i wydanie .zip z dist/ i Compose.
