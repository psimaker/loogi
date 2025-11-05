# Politique de confidentialité

LOOGI est un méta-moteur de recherche. Nous ne consignons ni les
requêtes, ni les adresses IP, ni les clics sur les résultats.

## Opérateur

Cette instance est exploitée à titre personnel par Umut Erdem (Suisse).
Contact : <umut.erdem@protonmail.com>

## Ce que nous ne faisons pas

- Aucun journal des requêtes de recherche
- Aucun journal des adresses IP à des fins d'analyse
- Aucun cookie sauf pour les préférences que vous définissez vous-même
  (langue de l'interface, thème, choix des moteurs, ...)
- Aucun traceur tiers, aucune analyse, aucune publicité
- Aucun profilage, aucune empreinte numérique du navigateur

## Ce que nous faisons

- **Transmettre votre requête** à des moteurs de recherche en amont
  (Google, Brave, DuckDuckGo, Wikipedia, arXiv, ...). Chacun a sa
  propre politique de confidentialité et peut consigner la requête.
  Nous retirons les en-têtes identifiants avant la transmission.
- Exécuter un **limiteur de débit en mémoire** (Valkey) qui stocke
  brièvement des hachages d'adresses IP pour bloquer le trafic
  automatisé. Les entrées expirent après une courte durée.
- Servir des **ressources statiques** (CSS, JavaScript, icônes) que
  votre navigateur met en cache via les en-têtes HTTP standards.

## Polices web

LOOGI charge "Inter Tight" et "JetBrains Mono" depuis
[fonts.bunny.net](https://fonts.bunny.net/about), un fournisseur de
polices respectueux de la vie privée qui ne consigne aucune requête et
ne pose aucun cookie.

## Journaux serveur

Le serveur web conserve des journaux de diagnostic à courte durée de
vie (codes HTTP, temps de réponse, erreurs) sans stocker d'adresses IP
ni de contenu de requête. Les journaux sont rotés automatiquement.

## Vos droits

LOOGI ne collecte pas de données personnelles ; il n'y a donc aucun
profil à consulter, corriger ou supprimer. Pour toute question,
contactez l'opérateur.

## Modifications

Cette politique peut être mise à jour. La version courante est toujours
disponible sous `/info/<votre-langue>/privacy`.

Dernière mise à jour : 2026-05-03
