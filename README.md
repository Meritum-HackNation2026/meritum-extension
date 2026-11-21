# meritum-extension

Wtyczka Chrome (Manifest V3) Meritum, drugi kanał w konkursie MSZ „Prawdowid”. Docelowo dodaje przycisk „Sprawdź” pod postami na X, Facebooku, Instagramie, Reddicie i TikToku oraz okienko do wklejenia tekstu w popupie. Oba wołają to samo API co formularz WWW ([meritum-backend](https://github.com/Meritum-HackNation2026/meritum-backend)), więc to samo pytanie daje ten sam wynik. Treść posta wysyłamy dopiero po kliknięciu.

Stos: [WXT](https://wxt.dev), React, TypeScript, Biome, pnpm. Specyfikacja wyglądu, makiety popupu i stary kod referencyjny są w `design-system/extension/` (część pochodzi jeszcze z porzuconego zakresu o scamie), a kontrakt selektorów DOM w `design-system/demo/platforms/SELECTORS.md`.

Stan bootstrapu:

| Plik                     | Co robi                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `wxt.config.ts`          | manifest: nazwa, opis, `storage`, `activeTab`, `host_permissions` tylko dla API                                              |
| `entrypoints/content.ts` | na prawdziwych serwisach i makietach `meritum-<platforma>[-dev].gburek.app` oznacza stronę atrybutem `data-meritum-platform` |
| `entrypoints/popup/`     | popup ze stanem API (`/api/v1/health`)                                                                                       |
| `utils/platform.ts`      | rozpoznanie platformy po hoście, z testami                                                                                   |

Adres API wybiera się przy buildzie: domyślnie https://meritum.gburek.app, a `WXT_API_URL=https://meritum-dev.gburek.app pnpm build` buduje wersję dev.

## Praca lokalna

```bash
pnpm install
pnpm dev                   # Chrome z wtyczką i przeładowaniem na żywo
pnpm check && pnpm typecheck && pnpm test
pnpm zip                   # .output/meritum-extension-<wersja>-chrome.zip
```

Ręcznie: `pnpm build`, potem `chrome://extensions` → tryb dewelopera → „Załaduj rozpakowane” → `.output/chrome-mv3`. Do testów są makiety na https://meritum-x.gburek.app (i pozostałe platformy, dev z sufiksem `-dev`).

## CI

`.github/workflows/ci.yml` na runnerach GCP: Biome, typy, testy i zip na każdej gałęzi. Na `develop` i `main` zip zbudowany z adresem API danego środowiska trafia do artefaktów przebiegu (`meritum-extension-dev`, `meritum-extension-prd`, 30 dni). Wtyczki nie publikujemy w Chrome Web Store, więc nie ma osobnego CD.

Zasady gałęzi jak w pozostałych repo: PR do `develop`, potem `develop` → `main`, bez bezpośrednich pushy, gałęzie funkcji usuwane ręcznie po merge'u.
