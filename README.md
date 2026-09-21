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

---
W głównym katalogu:

npm run db:down -- -v      # zatrzymuje kontener i usuwa wolumen z danymi
npm run db:up
npm run db:migrate -w server
npm run dev:server        

przetestować:
podman exec -it schoolboard-db psql -U schoolboard -d schoolboard -c "TRUNCATE users CASCADE;"
---

Struktura
| Plik | Rola |
| --- | --- |
| `index.html` | Pusty szkielet — tylko `<div id="app">` + start `main.ts` |
| `src/main.ts` | Start aplikacji: wybiera layout, podłącza WS (lub mock), woła `render()` |
| `src/render.ts` | Logika wypełniania danych — tytuł, tabela, ogłoszenia, galeria |
| `src/layouts/index.ts` | Ładuje layout HTML + CSS po nazwie (`display1` itd.) |
| `src/layouts/display1.html` | Struktura HTML konkretnego layoutu (sloty `data-module`) |
| `src/layouts/display1.css` | Wygląd tego layoutu (siatka, kolory, fonty) |
| `src/styles/style.css` | Style wspólne dla wszystkich layoutów |
| `src/types/types.ts` | Typy danych z serwera |

## Auth & Users – API

**Prefix:** `/api/v1`

| Method | Path | Auth | Body | Response | Opis |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/auth/status` | – | – | `{ setupRequired: boolean }` | Czy trzeba utworzyć pierwszego admina |
| `POST` | `/auth/setup` | – | `"{ username, password, setupCode }"` | `201 { user } + cookie` | Kreator pierwszego uruchomienia (tylko gdy brak userów) |
| `POST` | `/auth/login` | – | `"{ username, password }"` | `{ user } + cookie` | Logowanie |
| `POST` | `/auth/logout` | – | – | `{ ok: true }` | Wylogowanie (usuwa sesję + cookie) |
| `GET` | `/auth/me` | sesja | – | `{ user }` | Aktualny zalogowany użytkownik |

Rate limit: setup i login → max 5/min.

Błędy:
- 401 – złe dane / brak sesji
- 403 – zły setup code / zła rola / bad origin
- 409 – setup już zrobiony

### Users (tylko admin)

| Method | Path | Body | Response | Opis |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/users` | – | `User[]` | Lista użytkowników |
| `POST` | `/users` | `{ username, password, role }` | `201 User` | Utworzenie |
| `PATCH` | `/users/:id` | `{ password?, role? }` | `User` | Edycja (wymusza re-login) |
| `DELETE` | `/users/:id` | – | `204` | Usunięcie |

**User shape:** `{ id, username, role, createdAt }` *(bez hasha hasła)*





