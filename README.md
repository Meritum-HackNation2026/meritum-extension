# meritum-extension

Wtyczka Chrome (Manifest V3) Meritum, drugi kanał w konkursie MSZ „Prawdowid”. Popup ma okienko do wklejenia tekstu albo linku, a pod postami na X, Facebooku, Instagramie, Reddicie i TikToku wtyczka dodaje przycisk „Sprawdź”. Oba wołają to samo API co formularz WWW ([meritum-backend](https://github.com/Meritum-HackNation2026/meritum-backend)), więc to samo pytanie daje ten sam wynik. Treść posta wysyłamy dopiero po kliknięciu.

Stos: [WXT](https://wxt.dev), React, TypeScript, Biome, pnpm. Specyfikacja wyglądu, makiety popupu i stary kod referencyjny są w `design-system/extension/` (część pochodzi jeszcze z porzuconego zakresu o scamie), a kontrakt selektorów DOM w `design-system/demo/platforms/SELECTORS.md`.

Stan bootstrapu:

| Plik                        | Co robi                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wxt.config.ts`             | manifest: nazwa, opis, `storage`, `activeTab`, `host_permissions` tylko dla API                                                                                                                                                                                                                                                                                                                                        |
| `entrypoints/content/`      | na prawdziwych serwisach i makietach `meritum-<platforma>[-dev].gburek.app` wstawia „Sprawdź” pod postami, każdy w swoim Shadow DOM (`<meritum-root>` ze stylami z `design-system/extension/widget.css` i skórką platformy); po zaufanym kliknięciu (`event.isTrusted`) czyta tekst i adres posta, wysyła je do background i pokazuje wynik pod postem (`ResultCard.tsx`). Motyw jasny albo ciemny bierze z tła strony |
| `entrypoints/background.ts` | odbiera post od content scriptu i woła API tym samym klientem co popup (`utils/post-check.ts`, `utils/check.ts`); content script sam nie woła API, bo obowiązują go CORS i CSP strony                                                                                                                                                                                                                                  |
| `entrypoints/popup/`        | popup ze stanem API (`/api/v1/health`), okienkiem do wklejenia tekstu albo linku (`CheckForm.tsx`, wynik w `CheckAnswer.tsx`) i usuwaniem sprawdzeń, w stylu z design systemu: `ui.css` i `popup.css` to kopie z `design-system/extension/` (bez importu Google Fonts), znak jak w makiecie popupu, kroje Archivo i Azeret Mono w paczce                                                                               |
| `utils/check.ts`            | walidacja wejścia jak w formularzu WWW i wysyłka do `POST /api/v1/checks` z nagłówkiem `X-Meritum-Session` i odpytywaniem stanu, z testami                                                                                                                                                                                                                                                                             |
| `utils/posts/`              | adaptery platform według `SELECTORS.md`: gdzie są posty, ich tekst i link, gdzie wstawić przycisk i wynik, z testami                                                                                                                                                                                                                                                                                                   |
| `utils/platform.ts`         | rozpoznanie platformy po hoście, z testami                                                                                                                                                                                                                                                                                                                                                                             |

Adres API wybiera się przy buildzie: domyślnie https://meritum.gburek.app, a `WXT_API_URL=https://meritum-dev.gburek.app pnpm build` buduje wersję dev.

## Praca lokalna

```bash
pnpm install
pnpm dev                   # Chrome z wtyczką i przeładowaniem na żywo
pnpm check && pnpm typecheck && pnpm test
pnpm depcruise && pnpm knip   # granice importów, martwy kod
pnpm zip                   # .output/meritum-extension-<wersja>-chrome.zip
```

Zasady architektury i to, co je sprawdza: [docs/architecture.md](docs/architecture.md).

Ręcznie: `pnpm build`, potem `chrome://extensions` → tryb dewelopera → „Załaduj rozpakowane” → `.output/chrome-mv3`. Do testów są makiety na https://meritum-x.gburek.app (i pozostałe platformy, wersje dev z `-dev`, ciemny motyw z `?theme=dark`). Sprawdzenie pod postem wymaga API z `POST /api/v1/checks`; dziś ma je dev, więc do ręcznego testu buduj z `WXT_API_URL=https://meritum-dev.gburek.app`.

## Testy komponentów

`pnpm test` to `node --test` z dwoma importami: `tsx` przekształca JSX, a `tests/setup-dom.ts` rejestruje DOM z [happy-dom](https://github.com/capricorn86/happy-dom) (`@happy-dom/global-registrator`) i po każdym teście odmontowuje to, co wyrenderowano. Skrypt podaje wzorzec `**/*.test.{ts,tsx}`, bo samo `node --test` pomija pliki `.tsx`; `node_modules` zostaje poza wzorcem.

Test komponentu leży w `tests/<domena>/<Komponent>.test.tsx`, renderuje przez `@testing-library/react` i szuka po roli i tekście, tak jak użytkownik. Sieć podmienia `t.mock.method(globalThis, 'fetch', …)`, które `node:test` cofa po teście. Wzór: `tests/popup/App.test.tsx`.

Teksty dla użytkownika pochodzą z `design-system/copy/pl.json`. Napisów popupu („API nie odpowiada”, „API: …”, „Łączę…”) jeszcze tam nie ma, więc `tests/popup/App.test.tsx` szuka ich jako literałów; gdy design system je doda, test i `App.tsx` biorą je z kopii. Kod czytający `import.meta.env` używa `?.`, bo pod `node --test` Vite go nie wypełnia. Testy e2e w przeglądarce zostają ręczne.

## Kopie z design systemu

Katalog `design-system/` to kopia plików z [meritum-design-system](https://github.com/Meritum-HackNation2026/meritum-design-system) (ADR-33): `contracts/meritum.ts`, `copy/pl.json`, `tokens/meritum.css`, `extension/widget.css` i `extension/popup/`. Nie edytujemy ich tutaj; poprawki idą do design systemu, a kopię odświeża:

```bash
pnpm sync          # z main design systemu
pnpm sync <ref>    # z innej gałęzi, tagu albo commitu
```

Skrypt `scripts/sync.sh` (wzorem `contracts/sync.sh` w design systemie) potrzebuje `gh` z dostępem do repo i zapisuje `design-system/SOURCE` (commit źródłowy) oraz `design-system/SHA256SUMS`. `pnpm test` (`tests/design-system-copy.test.ts`) sprawdza sumy bez sieci i przy ręcznej zmianie podaje nazwę pliku. Biome, knip i testy architektury pomijają ten katalog. `entrypoints/popup/ui.css` i `popup.css` to wcześniejsze kopie przerobione ręcznie (bez importu Google Fonts), więc zostają poza sync.

## CI

`.github/workflows/ci.yml` na runnerach GCP: Biome, typy, testy i zip na każdej gałęzi. Na `main` zip zbudowany z adresem API prd trafia do artefaktów przebiegu (`meritum-extension-prd`, 30 dni). Artefaktu `meritum-extension-dev` CI już nie buduje; wersję dev buduje się ręcznie z `WXT_API_URL`. Wtyczki nie publikujemy w Chrome Web Store, więc nie ma osobnego CD.

Repo ma tylko gałąź `main`: zmiany przez PR do `main`, bez bezpośrednich pushy, gałęzie funkcji usuwane ręcznie po merge'u.
