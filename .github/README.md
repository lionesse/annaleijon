# annaleijon.se

Källkoden till [annaleijon.se](https://annaleijon.se) – Anna Leijons sajt om frilans, egenföretagande och tech.

Sajten är statisk HTML som publiceras med GitHub Pages från grenen `master`. Allt som pushas till `master` syns på sajten inom några minuter.

> Den här filen ligger i `.github/` med flit. Där visas den på GitHub, men den publiceras inte som en sida på annaleijon.se.

## Struktur i korthet

| Var | Vad |
|---|---|
| `*.html` i roten | Sidorna (startsida, artiklar, konsultmäklarlistan, poddar m.m.) |
| `assets/css/`, `assets/js/` | Stilmallar och skript, bl.a. Bootstrap 3 (ligger lokalt), `template.js` (fast meny + live-räknaren) och `Toast.js` (nyhetsbrevsnotisen) |
| `assets/images/` | Bilder |
| `sitemap.xml`, `llms.txt`, `robots.txt` | För sökmotorer och AI-tjänster |
| `.github/workflows/indexnow.yml` | Anmäler ändrade sidor till IndexNow (Bing m.fl.) vid push till `master` |
| `.github/workflows/live-counter.yml` | Live-räknaren, se nedan |

## Live-räknaren

Nere i högra hörnet på alla sidor visas t.ex. *"16 personer har läst på annaleijon.se den senaste halvtimmen"*.

### Hur det fungerar

```
Google Analytics (realtid)
        │  läses var 5:e minut, bara läsbehörighet
        ▼
GitHub Actions: .github/workflows/live-counter.yml
        │  skriver {"active": 16, "updated": "…"}
        ▼
live.json på grenen live-data
        │  hämtas av besökarens webbläsare
        ▼
assets/js/template.js visar brickan
```

1. **Hämta siffran.** Arbetsflödet `live-counter.yml` frågar Google Analytics Data API (property 303570237) hur många som varit aktiva de senaste 30 minuterna (`activeUsers` i realtidsrapporten).
2. **Spara siffran.** Talet och en tidsstämpel skrivs till `live.json` på en egen gren, `live-data`. Grenen har alltid bara en commit (den skrivs över varje gång), så historiken växer inte. Den triggar varken GitHub Pages eller IndexNow.
3. **Visa siffran.** Längst ner i `assets/js/template.js` finns ett litet skript som hämtar `https://raw.githubusercontent.com/lionesse/annaleijon/live-data/live.json` och visar brickan. Inga HTML-sidor behöver ändras.

### När brickan visas

- Bara om antalet är **minst 5**.
- Bara om siffran är **högst 45 minuter gammal**.
- Om något går fel (filen saknas, för gammal, nätverksfel) visas ingenting, och sidan påverkas inte.

Ändra gränserna i `template.js`: `MIN` (antal) och `MAX_AGE_MS` (ålder). Texten och utseendet (CSS) finns i samma block.

Annas egna besök räknas med (filtret "Internal Traffic" i Analytics är avstängt med flit). IP-regeln "Annas hemnät" finns kvar om det ska ändras.

### Schemaläggning

GitHubs vanliga schemaläggning (`cron`) startade aldrig för det här repot. Därför kör jobbet i en loop:

- Det hämtar siffran **var 5:e minut i ca 5,5 timmar** och **startar sedan om sig självt** (via `workflow_dispatch`).
- Ett **reservschema** (`17 */6 * * *`) startar kedjan igen om den skulle stanna.
- Bara en körning åt gången (`concurrency: live-counter`).

GitHub Actions är gratis för publika repon. Obs: GitHub kan stänga av schemalagda arbetsflöden i publika repon efter 60 dagar utan aktivitet. Startas räknaren om manuellt (se nedan) fortsätter den som vanligt.

### Säkerhet

Det finns **ingen nyckel, inget lösenord och ingen hemlighet** i repot eller i GitHub.

- **Inloggning utan nyckel (Workload Identity Federation).** GitHub intygar vilket repo och vilket arbetsflöde som kör. Google byter intyget mot en åtkomsttoken som gäller i **5 minuter**.
- **Google godtar bara** det här arbetsflödet: repo-ID 103300539 (lionesse/annaleijon), filen `.github/workflows/live-counter.yml` på `master`, startat av schemat eller manuellt. Forkar, pull requests och andra arbetsflöden nekas.
- **Tjänstekontot** `ga-live-counter@annaleijon-live-counter.iam.gserviceaccount.com` har rollen **Läsare** i Analytics och **inga roller** i Google Cloud. Token begärs med behörigheten `analytics.readonly`.
- **Ingen tredjepartskod.** Inloggningen görs direkt mot GitHubs och Googles egna API:er i arbetsflödet.
- **Inga personuppgifter.** `live.json` innehåller bara ett tal och en tidsstämpel.

Google Cloud-uppsättning (projekt `annaleijon-live-counter`, nr 861089667681, ingen fakturering):

| Del | Inställning |
|---|---|
| API:er | Google Analytics Data, IAM, IAM Credentials, Security Token Service |
| Workload Identity-pool | `github` |
| Leverantör | `annaleijon-repo`, issuer `https://token.actions.githubusercontent.com` |
| Villkor | `assertion.repository_id == '103300539' && assertion.repository_owner_id == '31898254' && assertion.ref == 'refs/heads/master' && assertion.job_workflow_ref == 'lionesse/annaleijon/.github/workflows/live-counter.yml@refs/heads/master' && assertion.event_name in ['schedule', 'workflow_dispatch']` |
| Behörighet på tjänstekontot | Workload Identity User, bara för `principalSet://…/workloadIdentityPools/github/attribute.repository_id/103300539` |

### Kontrollera att kontot bara kan läsa

**Actions → Live-räknare → Run workflow**, kryssa i *"Kontrollera att kontot bara kan läsa"* och kör. Jobbet försöker då:

| Försök | Förväntat |
|---|---|
| Läsa realtidsdata i Analytics | Tillåtet (200) |
| Ändra i Analytics med läs-token | Nekat (403) |
| Ändra i Analytics med redigerings-token | Nekat (403), rollen Läsare stoppar |
| Läsa behörigheter i Google Cloud-projektet | Nekat (403) |
| Se tjänstekontots nycklar | Nekat (403) |

Ändringsförsöken sätter fastighetens namn till samma namn, så inget ändras ens om något skulle släppas igenom. Jobbet blir rött om något avviker. Senast kontrollerat 2026-11-24: allt OK.

### Vanliga åtgärder

| Behov | Gör så här |
|---|---|
| Starta räknaren igen | Actions → Live-räknare → Run workflow (utan kryss) |
| Se senaste siffran | [live.json](https://raw.githubusercontent.com/lionesse/annaleijon/live-data/live.json) (kan vara cachad ca 5 min) |
| Pausa räknaren | Actions → Live-räknare → ⋯ → Disable workflow. Brickan försvinner av sig själv efter 45 min |
| Ta bort brickan helt | Ta bort live-räknar-blocket längst ner i `assets/js/template.js` |
| Stänga av åtkomsten till Analytics | Ta bort `ga-live-counter@…` under Admin → Property access management i Analytics, eller ta bort Workload Identity-poolen i Google Cloud |
