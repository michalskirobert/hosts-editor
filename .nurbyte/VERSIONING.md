# Wersjonowanie NurByte

Każda aplikacja ma własny numer MAJOR.MINOR.PATCH i własną historię wydań. Numeru nie wylicza się z rozmiaru diffu ani z nazwy gałęzi. Punktem odniesienia jest ostatnia rzeczywiście opublikowana stabilna wersja danej aplikacji, a nie niezweryfikowana etykieta ZIP-a.

## Rodzaj zmiany

- PATCH, np. 2.3.3 → 2.3.4: poprawki błędów/bezpieczeństwa zgodne wstecz, bez nowej funkcjonalności ani zerwania kontraktu.
- MINOR, np. 2.3.3 → 2.4.0: nowe funkcje zgodne wstecz; patch jest zerowany.
- MAJOR, np. 2.3.3 → 3.0.0: zmiany łamiące zgodność, np. niekompatybilne API, format danych/profilu lub wymagające niekompatybilnej migracji. Minor i patch są zerowane. Duży redesign/refaktor sam w sobie nie oznacza MAJOR.
- Same dokumenty, testy, CI i konfiguracja agentów bez zmiany dostarczanego produktu nie wymuszają bumpa aplikacji.
- Dla istniejącego 0.x.y także opisujemy wpływ PATCH/MINOR/MAJOR; nie podnosimy do 1.0.0 bez jawnej decyzji o stabilnym wydaniu i zdefiniowaniu kontraktów.

Dla zbioru zmian liczy się najwyższy wymagany poziom od ostatniego stabilnego wydania. fix/feat i BREAKING CHANGE/! pomagają klasyfikować commity, ale agent weryfikuje faktyczne zachowanie i zgodność. Mała zmiana może być breaking, duża może być zgodna wstecz. Nie stosuj podwójnego bumpa do tej samej zmiany.

## Gałęzie i merge

1. Przed pracą ustal docelową wersję i środowisko. Przy niepewności architekt opisuje wpływ i kieruje decyzję do koordynatora/użytkownika. Wersja w nazwie task branch jest celem, nie źródłem prawdy ani uprawnieniem do publikacji.
2. Przed merge do dev przygotuj wersję testową, np. 2.3.4-beta.1. Kolejny kandydat tego samego wydania to beta.2, nie automatycznie 2.3.5. Przy nowej funkcji w tym samym niewydanym zbiorze cel może wzrosnąć do 2.4.0-beta.1. Numer kandydata musi być unikalny i rosnący dla danego celu; nie nadpisuj już udostępnionych plików.
3. Wersję przygotuj na gałęzi zadania/release PR PRZED końcowymi kontrolami, push i pytaniem o merge; nie dopisuj bumpa na dev/master już po zgodzie. Jedno wydanie może zawierać wiele commitów i PR-ów. Nie uruchamiaj automatycznego bump/merge na każdym pushu.
4. Przed master przygotuj stabilne 2.3.4 z tego samego celu, usuwając prerelease. To nie jest ponowny PATCH do 2.3.5. Zmiana wersji daje nowy commit/build: ponów potrzebne kontrole i pokaż nowy SHA/artifact przy potwierdzeniu. Stabilnego instalatora nie uzyskuje się samą zmianą nazwy pliku dev.
5. Hotfix od ostatniego master zwykle PATCH, ale rzeczywisty breaking change nie może być ukryty pod PATCH. Jeżeli w DEV przygotowywana jest już inna wersja, plan pogodzenia hotfixa jest osobnym przydziałem i osobną zgodą na merge. Nie wchodź sam do drugiego środowiska.
6. Wersje beta/rc nie trafiają do publicznego kanału stable Hosts Editor. Przed wykorzystaniem prerelease w instalatorach/updaterze sprawdź wsparcie platform i wybór kanału; brak wdrożonego DEV web nie oznacza potrzeby jego tworzenia.

## Etapy wydania

DEV: X.Y.Z-beta.1, beta.2 itd. Po domknięciu zakresu planowanej wersji: X.Y.Z-rc.1, rc.2. Stabilne: X.Y.Z. Numer kandydata rośnie w danym etapie, bez dodatkowego bumpa bazowego numeru. Przykład: 3.0.0-beta.2 → 3.0.0-rc.1 → 3.0.0. Nie zmieniaj bieżących manifestów tylko z powodu aktualizacji tej polityki.

## Spójność plików i publikacji

Źródłem wersji produktu jest wskazany manifest projektu, zwykle package.json; zsynchronizuj jego odbicia w lockfile, metadanych instalatora i etykietach UI tylko tam, gdzie rzeczywiście istnieją. Nie aktualizuj wszystkich zależności przy okazji bumpa. Nie edytuj plików generowanych ręcznie, jeśli projekt ma generator. Wersję i identyfikator SHA pokazuj osobno; +build metadata nie zastępuje rosnącej wersji dla updatera.

Changelog/release notes wynikają z rzeczywistych zmian od poprzedniego wydania. Tag vX.Y.Z, GitHub Release, instalatory, feed BO i strona /hosts-editor muszą wskazywać tę samą wydaną wersję, ale aktualizacja produkcyjnych feedów/strony odbywa się dopiero po osobnej zgodzie lub w jasno zatwierdzonym planie łącznym. Nie nadpisuj opublikowanych tagów ani artefaktów.

## Potwierdzenie merge i wydania

Pytanie MUSI zawierać: repo, PR, gałąź źródłową/docelową, SHA, starą i nową wersję, PATCH/MINOR/MAJOR i uzasadnienie, testy, migracje/zgodność oraz skutek wdrożenia.

Przykład: „Czy potwierdzasz merge PR #42 do dev, SHA ..., wersja 2.3.3 → 2.3.4-beta.1 (PATCH: naprawa aktualizacji, bez zmiany kontraktu)? Kontrole ...; skutek ... . Tak/Nie”.

Zgoda na merge nie jest zgodą na GitHub Release, tag lub produkcję, jeśli te działania nie zostały wyraźnie objęte zatwierdzeniem. Przy nowych commitach albo zmianie proponowanej wersji zapytaj ponownie. Powtórzenie procesu nie może tworzyć nowego numeru lub publikacji bez nowej zmiany/wydania.

## Stan wdrożenia

To obowiązkowa procedura agentów i skillsów, nie uruchomiony pipeline ani serwerowy check wersji. Nie zmienia bieżących wersji aplikacji. Skrypt bump i zdalną kontrolę CI można dobrać po sprawdzeniu każdego systemu build/lockfile/updatera; nie deklarować automatycznej blokady dopóki nie zostanie wdrożona i przetestowana.

Podstawa: https://semver.org/lang/pl/ (sprawdzono 2026-11-01). Sposób dev/master i potwierdzeń jest polityką NurByte.
