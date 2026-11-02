# GitHub i Vercel — konfiguracja razem z użytkownikiem

Stan początkowy: NIEZWERYFIKOWANE. Instalator nie zmienia ustawień zdalnych. Uzupełnij `.nurbyte/settings.json` wyłącznie danymi niesekretnymi. Repozytoria i owner są wstępnie wpisane z lokalnych origin; sprawdź ich poprawność. GitHub michalskirobert/Free i adresy środowisk podano w settings.json. Tożsamość narzędzia, plan i identyfikatory Vercel wymagają weryfikacji.

## 1. GitHub

W każdym repo: Settings → Rules → Rulesets lub Branches (zależnie od dostępnego interfejsu/planu). Przed zmianą zapisz obecne ustawienia. Utwórz reguły dla `dev` i `master`:
- zmiany przez PR, wymagane kontrole CI i rozwiązanie rozmów;
- brak force-push i usuwania gałęzi;
- brak obejścia przez konto/aplikację używaną przez agenta;
- wycofywanie akceptacji po nowych zmianach lub wymaganie akceptacji ostatniego pushu, stosownie do dostępnych ustawień.

Wybierz rzeczywiste nazwy kontroli dopiero po uruchomieniu CI, nie wpisuj wymyślonej nazwy PASS. Ochrona prywatnych repo zależy od planu. Sprawdź aktywność reguł, nie tylko zapis formularza.

UWAGA: jeśli Codex używa Twojej tożsamości GitHub, GitHub nie odróżnia Ciebie od agenta. Autor PR-a nie może sam zatwierdzić własnego PR-a. Wymagany reviewer może więc zablokować samotną pracę na jednym koncie. Dla niezależnej technicznej zgody potrzebne są różne tożsamości albo zewnętrzna bramka, której agent nie może zatwierdzić. Nie włączaj reguły reviewer bez ustalenia kto faktycznie będzie reviewował. Zgoda w rozmowie jest regułą działania agenta, nie automatyczną akceptacją GitHub review.

Każdy merge: pokaż repo, numer PR, źródło, cel dev/master, head SHA, wyniki testów, zmiany/migracje i wpływ wdrożeniowy. Nawet po poleceniu „Zmerguj do DEV” zapytaj ponownie „Czy na pewno? Tak/Nie”. Dopiero Tak pozwala wykonać konkretny merge. Sprawdź SHA przed wykonaniem i nie używaj bypass/--admin/auto-merge. Zmieniony SHA wymaga nowej zgody.

## 2. Vercel

Ustal trzy osobne projekty webowe: nurbyte, nurbyte-backoffice i docflow. Hosts Editor to osobny pipeline instalatorów Electron, nie aplikacja uruchamiana na Vercel.

W projekcie sprawdź Settings → Git/Environments i faktyczną Production Branch. Nie zakładaj jednego mapowania dla wszystkich aplikacji. Tylko DocFlow ma wskazane wdrożenie DEV; nurbyte ma lokalny DEV, BO ma wskazany adres lokalny, a Hosts Editor testuje buildy Electron. Relacje gałęzi z Vercel/Preview pozostają do sprawdzenia. Nie zmieniaj działającej konfiguracji bez przedstawienia skutków i zgody. Uzupełnij project/team i adresy w settings.json.

Oddziel bazy oraz zmienne DEV/Preview od produkcji. Preview nie może wysyłać rzeczywistych powiadomień, płatności ani modyfikować produkcyjnej bazy. DocFlow i BO mają wspólne kontrakty bazy — ustal zgodny plan migracji. Zweryfikuj prywatne PDF/storage, pdfinfo i istniejący cron. Nie wrzucaj lokalnych sekretów do Vercel; to odrębny eksport danych wymagający zgody.

Sprawdź wszystkie drogi produkcji: Git auto-deploy, CLI, API, deploy hooks, promocja, rollback, zmiana domen, środowiska i bazy. Deployment Protection ogranicza oglądanie strony, nie jest bramką zatwierdzania publikacji. Deployment Checks nie stanowią automatycznie ręcznej zgody. Mechanizm bramki i dostępne role zależą od planu. Jeśli jedna pełna tożsamość administracyjna jest dostępna agentowi, same instrukcje i hooki nie gwarantują nieomijalnej zgody.

## 3. Próba ochrony

W kontrolowanym środowisku i bez uruchamiania produkcyjnego skutku sprawdź odrzucenie operacji bez zgody, zmianę SHA po zgodzie, force-push, tag/release oraz próbę bezpośredniej promocji. Jeśli nie ma bezpiecznego dry-run dla danej operacji, nie testuj na żywej produkcji: użyj projektu testowego i sprawdź politykę uprawnień. Udokumentuj czego nie przetestowano. Dopiero po realnej konfiguracji i testach uzupełnij remote_guard_verified; sam wpis true nie tworzy zabezpieczenia.

## Źródła sprawdzone 2026-10-31

- https://learn.chatgpt.com/docs/agent-configuration/subagents
- https://learn.chatgpt.com/docs/agent-configuration/rules
- https://learn.chatgpt.com/docs/build-skills
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- https://vercel.com/docs/deployment-checks
- https://vercel.com/docs/rbac/access-roles

## Środowiska podane przez użytkownika — 2026-11-01

| Projekt | Produkcja | Wdrożony DEV | Lokalnie |
| --- | --- | --- | --- |
| Hosts Editor | Aplikacja desktopowa | Brak webowego DEV; gałąź dev i testy po buildzie | Electron |
| DocFlow | https://docflow.nurbyte.dev | https://docflow-dev.nurbyte.dev | http://localhost:3001 |
| nurbyte | https://www.nurbyte.dev | Brak | http://localhost:3000 |
| BO | https://panel.nurbyte.dev | Nie wskazano — nie utożsamiać z produkcją | http://localhost:3000 |

To dane od użytkownika, nie wynik sprawdzenia domen i Vercel. Dwa projekty używające localhost:3000 trzeba uruchamiać kolejno albo po uzgodnieniu zmienić port jednego z nich. Nie zmieniaj konfiguracji aplikacji automatycznie.

GitHub: michalskirobert, plan Free. Konto lokalnego narzędzia Codexa/gh pozostaje do weryfikacji. „michalskirobert’s projects” jest nazwą widoczną w panelu Vercel, nie nazwą trzech osobnych projektów. Istniejący wpis slug zespołu zachowano jako niezweryfikowany. Hobby pozostaje przypuszczeniem użytkownika.

Pole local_url to lokalny adres; dev_url dotyczy osobno wdrożonego DEV. null oznacza brak wskazanego środowiska, nie zgodę na używanie produkcji. Gałąź Git dev nie oznacza istnienia wdrożonego DEV. Nie twórz nowych środowisk ani nie zmieniaj mapowania gałęzi bez przydziału.

