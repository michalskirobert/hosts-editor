# Zakończenie merge'a — obowiązkowa procedura

Użytkownik ustalił stałą zasadę: końcowa akceptacja zmian i merge obejmuje push/PR/merge, przejście na cel, bezpieczną synchronizację i automatyczne usunięcie gałęzi zadania lokalnie/zdalnie. Obowiązuje feat/fix/hotfix. Nie pytaj osobno o cleanup ani rutynowo o zachowanie gałęzi. Zabezpieczenia przed utratą nowych lub niezmergowanych zmian pozostają obowiązkowe.

Po potwierdzeniu nie pytaj ponownie o każdy techniczny krok tego samego planu. Zweryfikuj na serwerze, że PR został rzeczywiście zmergowany do właściwego celu i że jego source head jest zatwierdzonym SHA. Nie kasuj gałęzi po PR zamkniętym bez merge'a. Po błędzie/timeout sprawdź stan zamiast powtarzać merge lub kasowanie w ciemno.

Przed przełączeniem sprawdź staged/unstaged/untracked i użycie gałęzi w worktrees. Nie rób automatycznego stash/reset/clean. Zachowaj zmiany użytkownika; jeśli przeszkadzają, zatrzymaj cleanup i podaj konkretny powód. Nie przełączaj innego checkoutu używanego przez człowieka/agenta. Przy izolowanym worktree postępuj zgodnie z jego własnym cyklem życia i nie kasuj zajętej gałęzi.

Synchronizuj wyłącznie zatwierdzony cel; fetch dozwolonych refs i fast-forward do potwierdzonego wyniku nie uprawnia do nieplanowanego merge'a rozbieżnych historii. Jeśli zdalny cel przesunął się po zgodzie, przedstaw zmianę zakresu zamiast wprowadzać dodatkowe commity bez wiedzy użytkownika. Nie wchodź do drugiego środowiska.

Usuń źródło wyłącznie jeśli to gałąź tego zadania, nie dev/master, nie jest zajęta i nie ma nowych commitów po zatwierdzonym SHA. Lokalnie używaj bezpiecznego git branch -d; nie używaj -D jako fallback. Po squash/rebase ancestry może nie potwierdzić lokalnego usunięcia: sprawdź zgodność zmian z potwierdzonym PR; jeśli -d nadal odmawia, zachowaj gałąź i zgłoś powód, bez force-delete. Zdalne usunięcie musi warunkowo dotyczyć zatwierdzonego source SHA — sprawdź możliwość atomowego warunku w wybranym narzędziu. Jeśli nie można wykluczyć wyścigu z nowymi commitami, nie kasuj automatycznie. Nie stosuj force-push do zmiany istniejącej gałęzi i nie włączaj globalnego auto-delete na całym repo przy okazji zadania.

Zaraportuj wynik każdego kroku: PR/merge SHA, aktywna gałąź, stan synchronizacji, źródło lokalnie i zdalnie (usunięte/zachowane/niezweryfikowane), przeszkody. Sama obecność origin/... lokalnie może być nieaktualną referencją; nie dowodzi istnienia gałęzi na GitHub.

To instrukcja procesu agentów, nie samodzielnie działający skrypt ani zgoda na merge bez końcowej akceptacji. Nie zmienia uprawnień, hooków ani kontroli sekretów.
