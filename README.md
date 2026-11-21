# meritum-extension

Wtyczka Chrome (Manifest V3) Meritum, drugi kanał w konkursie MSZ „Prawdowid”. Docelowo dodaje przycisk „Sprawdź” pod postami na X, Facebooku, Instagramie, Reddicie i TikToku oraz okienko do wklejenia tekstu w popupie. Oba wołają to samo API co formularz WWW ([meritum-backend](https://github.com/Meritum-HackNation2026/meritum-backend)), więc to samo pytanie daje ten sam wynik. Treść posta wysyłamy dopiero po kliknięciu.

Stos: [WXT](https://wxt.dev), React, TypeScript, Biome, pnpm. Specyfikacja wyglądu, makiety popupu i stary kod referencyjny są w `design-system/extension/` (część pochodzi jeszcze z porzuconego zakresu o scamie), a kontrakt selektorów DOM w `design-system/demo/platforms/SELECTORS.md`.

Stan bootstrapu:

| Plik                     | Co robi                                                                                                                                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wxt.config.ts`          | manifest: nazwa, opis, `storage`, `activeTab`, `host_permissions` tylko dla API                                                                                                                                            |
| `entrypoints/content.ts` | na prawdziwych serwisach i makietach `meritum-<platforma>[-dev].gburek.app` oznacza stronę atrybutem `data-meritum-platform`                                                                                               |
| `entrypoints/popup/`     | popup ze stanem API (`/api/v1/health`) w stylu z design systemu: `ui.css` i `popup.css` to kopie z `design-system/extension/` (bez importu Google Fonts), znak jak w makiecie popupu, kroje Archivo i Azeret Mono w paczce |
| `utils/platform.ts`      | rozpoznanie platformy po hoście, z testami                                                                                                                                                                                 |

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

Ręcznie: `pnpm build`, potem `chrome://extensions` → tryb dewelopera → „Załaduj rozpakowane” → `.output/chrome-mv3`. Do testów są makiety na https://meritum-x.gburek.app (i pozostałe platformy).

## CI

`.github/workflows/ci.yml` na runnerach GCP: Biome, typy, testy i zip na każdej gałęzi. Na `main` zip zbudowany z adresem API prd trafia do artefaktów przebiegu (`meritum-extension-prd`, 30 dni). Artefaktu `meritum-extension-dev` CI już nie buduje; wersję dev buduje się ręcznie z `WXT_API_URL`. Wtyczki nie publikujemy w Chrome Web Store, więc nie ma osobnego CD.

Repo ma tylko gałąź `main`: zmiany przez PR do `main`, bez bezpośrednich pushy, gałęzie funkcji usuwane ręcznie po merge'u.
