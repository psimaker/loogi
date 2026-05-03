# Informativa sulla privacy

LOOGI è un metamotore di ricerca. Non registriamo le query, gli
indirizzi IP né i clic sui risultati.

## Operatore

Questa istanza è gestita come progetto personale da Umut Erdem
(Svizzera).
Contatto: <umut.erdem@protonmail.com>

## Cosa non facciamo

- Nessun log delle query di ricerca
- Nessun log degli indirizzi IP a fini analitici
- Nessun cookie, eccetto le preferenze che imposti esplicitamente
  (lingua dell'interfaccia, tema, scelta dei motori, ...)
- Nessun tracker di terze parti, nessuna analytics, nessuna pubblicità
- Nessuna profilazione, nessun fingerprinting del browser

## Cosa facciamo

- **Inoltrare la tua query** ai motori di ricerca a monte (Google,
  Brave, DuckDuckGo, Wikipedia, arXiv, ...). Ognuno ha la propria
  politica di privacy e può registrare la query. Rimuoviamo le
  intestazioni identificative prima dell'inoltro.
- Eseguire un **rate limiter in memoria** (Valkey) che memorizza
  brevemente hash di IP client per bloccare il traffico automatizzato.
  Le voci scadono automaticamente in pochi minuti.
- Servire **risorse statiche** (CSS, JavaScript, icone) che il tuo
  browser memorizza in cache tramite intestazioni HTTP standard.

## Web font

LOOGI carica "Inter Tight" e "JetBrains Mono" da
[fonts.bunny.net](https://fonts.bunny.net/about), un fornitore di
font che rispetta la privacy, non registra le richieste e non imposta
cookie.

## Log del server

Il server web mantiene log diagnostici a breve termine (codici HTTP,
tempi di risposta, errori) senza memorizzare indirizzi IP né il
contenuto delle query. I log vengono ruotati automaticamente.

## I tuoi diritti

LOOGI non raccoglie dati personali, quindi non c'è alcun profilo da
consultare, correggere o cancellare. Per qualsiasi domanda, scrivi
all'operatore.

## Modifiche

Questa informativa può essere aggiornata. La versione corrente è
sempre disponibile su `/info/<la-tua-lingua>/privacy`.

Ultimo aggiornamento: 2026-05-03
