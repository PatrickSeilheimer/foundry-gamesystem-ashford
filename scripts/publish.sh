#!/usr/bin/env bash
#
# Committet den aktuellen Stand von foundry-gamesystem-ashford und pusht ihn
# nach GitHub. Legt beim ersten Aufruf das Repo an (falls `gh` verfügbar und
# eingeloggt ist) bzw. das lokale Git-Repository, falls noch keines existiert.
#
# Usage: ./scripts/publish.sh ["Commit-Nachricht"]
#
# Optional per Umgebungsvariable überschreibbar:
#   REPO_OWNER   GitHub-Konto/Org (Standard: PatrickSeilheimer)
#   REPO_NAME    Repo-Name (Standard: foundry-gamesystem-ashford)
#   REPO_BRANCH  Branch, der gepusht wird (Standard: main)
#   REPO_VISIBILITY  public|private, nur relevant wenn das Repo neu angelegt wird (Standard: public)

set -euo pipefail

REPO_OWNER="${REPO_OWNER:-PatrickSeilheimer}"
REPO_NAME="${REPO_NAME:-foundry-gamesystem-ashford}"
REPO_BRANCH="${REPO_BRANCH:-main}"
REPO_VISIBILITY="${REPO_VISIBILITY:-public}"
COMMIT_MESSAGE="${1:-Update Ashford Adventures system}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

if [[ ! -d .git ]]; then
  echo "Kein Git-Repository gefunden, initialisiere..."
  git init -b "${REPO_BRANCH}"
fi

git add -A

if git diff --cached --quiet; then
  echo "Keine Änderungen zum Committen."
else
  git commit -m "${COMMIT_MESSAGE}"
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "Kein 'origin'-Remote konfiguriert."
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    echo "Lege GitHub-Repo ${REPO_OWNER}/${REPO_NAME} (${REPO_VISIBILITY}) an und verknüpfe es..."
    gh repo create "${REPO_OWNER}/${REPO_NAME}" "--${REPO_VISIBILITY}" --source=. --remote=origin
  else
    echo "Fehler: 'gh' ist nicht installiert/eingeloggt (gh auth login) und es gibt kein origin-Remote." >&2
    echo "Lege das Repo entweder manuell auf GitHub an und setze das Remote:" >&2
    echo "  git remote add origin https://github.com/${REPO_OWNER}/${REPO_NAME}.git" >&2
    echo "...oder logge dich mit 'gh auth login' ein und starte dieses Script erneut." >&2
    exit 1
  fi
fi

echo "Push nach origin/${REPO_BRANCH}..."
git push -u origin "${REPO_BRANCH}"

echo "Fertig. Server-seitig aktualisieren mit scripts/update-ashford-system.sh."
