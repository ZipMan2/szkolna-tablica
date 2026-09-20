Etap 1: Szkielet projektu

1. Zainicjuj repo, foldery: /backend, /admin, /display
2. Backend: Fastify + PostgreSQL, jedna tabela zastepstwa (data, klasa, przedmiot, zastępca)
3. Endpoint GET /api/zastepstwa zwracający JSON

Etap 2: Display (najprostszy widok) 4. /display – czysty HTML + HTMX, hx-get co 60s pobiera i pokazuje listę zastępstw 5. Uruchom to na jednym ekranie, sprawdź czy działa i odświeża się

Etap 3: Admin – auth 6. Tabela users, hasła przez bcrypt 7. Sesje (@fastify/session + @fastify/cookie) 8. Prosty formularz logowania w React

Etap 4: Admin – CMS zastępstw 9. Formularz dodawania/edycji zastępstwa (React Hook Form + Zod) 10. Tabela z listą (TanStack Table) – edycja/usuwanie

Etap 5: Ogłoszenia 11. Nowa tabela ogloszenia (tytuł, treść, data ważności, zdjęcie) 12. CRUD analogicznie jak zastępstwa 13. Dodaj sekcję ogłoszeń na /display

Etap 6: Bezpieczeństwo sieci 14. Nginx reverse proxy, allowlist IP na /admin 15. Podman compose – całość w kontenerach

Etap 7: Layout builder (dopiero teraz) 16. Config JSON w bazie (layout: kolejność modułów) 17. dnd-kit w adminie do zarządzania kolejnością/widocznością 18. /display renderuje moduły dynamicznie wg configu

Etap 8: Rozbudowa (na później) 19. Kolejne moduły: pogoda, zegar, jadłospis 20. Import zastępstw z pliku/CSV 21. Multi-szkoła (jeśli chcesz sprzedawać jako SaaS)

Uzasadnienie ważniejszych pakietów
fastify + type-provider-zod: szybki, schematy Zod dają walidację i typy z jednego źródła.
@fastify/websocket: oficjalny wrapper na ws, działa w tej samej instancji co REST.
drizzle-orm + postgres.js: lekki, SQL-owy, bez generatora klienta ani binarek (w przeciwieństwie do Prisma).
@node-rs/argon2: hashowanie haseł z prebuilt binarkami, więc działa na Windows i Linux bez kompilacji (zwykły argon2 bywa uciążliwy).
@fastify/rate-limit: limit prób logowania per IP i per konto.
@fastify/helmet: nagłówki bezpieczeństwa (CSP, itp.) jedną linijką.
@fastify/cookie: sesje httpOnly. Sesje trzymaj w tabeli Postgresa, bez JWT (łatwe unieważnianie, brak problemów z przechowywaniem tokenu).
@fastify/multipart + sharp + file-type: upload, resize/miniatury/usunięcie EXIF, weryfikacja typu po magic bytes zamiast po rozszerzeniu.
tsx / tsup: dev z watch bez konfiguracji, produkcyjny build jednym plikiem.
@tanstack/react-query: cache i invalidacja w adminie. Po zdarzeniu WS możesz wywołać invalidateQueries.
react-hook-form + zod: formularze bez re-renderów, ta sama walidacja co na serwerze.
@dnd-kit: zmiana kolejności ogłoszeń i zdjęć.
zustand (display): mikro-store na stan modułów z WS.
Tailwind 4 + @tailwindcss/vite: bez postcss.config i tailwind.config.

Bezpieczeństwo

Logowanie: przy nieistniejącym użytkowniku i tak wykonaj weryfikację argon2 na atrapie hasha, żeby nie było różnicy czasu (timing).
Identyczny komunikat i kod dla złego loginu i hasła (brak user enumeration).
Rate-limit /login, np. 5 prób na minutę na IP, plus blokada czasowa per konto.
Cookie: httpOnly, sameSite=strict, secure tylko gdy jest HTTPS (na czystym HTTP w LAN secure zablokuje sesję).
CSRF: sameSite=strict plus sprawdzanie nagłówka Origin na mutacjach.
Ustawienia bezpiecznego startu: hasło admina z env lub kreator pierwszego uruchomienia, bez domyślnego admin/admin.
WS: /ws/display tylko do odczytu i bez uwierzytelniania (LAN), /ws/admin wymaga sesji. Sprawdzaj Origin przy upgrade.
Kolejność zdarzeń w sql.identifier() i .as() (patrz CVE wyżej): nie przekazuj tam wejścia użytkownika.
Ochrona dostępu do tego samego wewnętrznego serwera: nginx allow 192.168.1.0/24; deny all; na /admin i /api.

WebSocket

Przy połączeniu serwer wysyła pełny snapshot z numerem revision. Kolejne zdarzenia to małe patche.
Heartbeat ping/pong co 20–30 s i własny reconnect z exponential backoff (własne 30 linii wystarczy, bez biblioteki).
Po reconnect kiosk pobiera snapshot od nowa, więc nigdy nie zostaje ze starymi danymi.
Nginx: proxy_http_version 1.1, nagłówki Upgrade/Connection, proxy_read_timeout 1h.
Walidacja komunikatów WS tymi samymi schematami Zod z shared.
Rozważ okresowy pełny reload strony kiosku (np. raz na noc) jako zabezpieczenie przed wyciekami pamięci.

Wydajność

Miniatury i wersje WebP zdjęć generowane przy uploadzie przez sharp (kiosk nigdy nie ładuje oryginału 12 MP).
Nginx: cache i Cache-Control: immutable dla plików o hashowanych nazwach.
Indeksy w Postgresie na kolejność i moduł, postgres.js z niewielką pulą (np. max: 5).
Pliki uploadu na dysku, w bazie tylko metadane.

Upload zdjęć

Limit rozmiaru i liczby plików, losowa nazwa (uuid), nigdy nazwa od użytkownika.
Weryfikacja file-type, dozwolone tylko jpeg/png/webp.
Uploady poza katalogiem statycznym aplikacji, serwowane osobno przez nginx.

DX

pnpm workspaces, Biome (lint + format zamiast ESLint + Prettier), Vitest, GitHub Actions (typecheck + test + build).
docker-compose.yml tylko dla Postgresa w dev, .env.example, walidacja env przez Zod przy starcie.
W dev proxy Vite /api i /ws na :3000, żeby cookies i CORS nie sprawiały kłopotów.
Licencja od początku: MIT lub AGPL. Jeśli chcesz zarabiać na wdrożeniach i nie chcesz, żeby ktoś zamknął Twój kod, AGPL warta rozważenia.

Czego unikać
Prisma: silnik z binarkami, cięższy klient, uciążliwy na Windows i w mniejszych wdrożeniach.
Ant Design / MUI: ciężkie, a i tak trzeba nadpisywać styl. Zamiast tego shadcn/ui (kopiowane komponenty na Radix) albo czysty Tailwind.
Redux, Next.js, NestJS, GraphQL, Socket.IO: nadmiar dla tego zakresu. Surowy WebSocket wystarczy.
JWT w localStorage: gorsze niż sesje w httpOnly cookie.
Redis: niepotrzebny przy jednej instancji serwera.
Osobny mikroserwis do WS: WS zostaje w tym samym procesie Fastify.
Chromium --kiosk z pełnym profilem użytkownika: użyj osobnego profilu (--user-data-dir) i flag --noerrdialogs --disable-infobars --disable-session-crashed-bubble, żeby po awarii nie wyskakiwał komunikat.
