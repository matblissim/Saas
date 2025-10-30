# Winamax Tracker

Un SaaS pour analyser vos historiques de mains Winamax et suivre vos performances au poker.

## Fonctionnalités

- Upload de fichiers d'historiques Winamax
- Analyse automatique des parties jouées
- Suivi des statistiques :
  - Nombre de parties jouées
  - Buy-in et rake total
  - Gains totaux
  - Profit / ROI
  - Multiplicateurs (pour les Expresso)
- Affichage détaillé de chaque partie

## Technologies

- **Next.js 14** avec App Router
- **TypeScript** pour le typage
- **Tailwind CSS** pour le design
- **Prisma** pour la base de données (SQLite)

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Utilisation

1. Accédez à l'interface web
2. Uploadez votre fichier d'historique Winamax (fichier .txt)
3. Consultez vos statistiques et l'historique détaillé de vos parties

## Format des fichiers

Le parser supporte les fichiers d'historiques Winamax standard avec :
- Tournois classiques
- Expresso (avec détection des multiplicateurs)
- Sit & Go

## Prochaines étapes

- [ ] Intégration complète de la base de données
- [ ] Authentification des utilisateurs
- [ ] Graphiques de progression
- [ ] Export des données
- [ ] Filtres et recherche avancée
