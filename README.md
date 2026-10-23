# Rebanho Leiteiro – Frontend

App React (PWA) do sistema de gestão do rebanho leiteiro, publicado em `rebanho.aleedu.cloud`.

O objetivo, as decisões e o roteiro do projeto ficam no repositório do backend:
`../backend_rebanho/PROJETO.md`.

## Rodar localmente

```
npm install
npm run dev        # http://localhost:3100 (a 3000 fica para o AleEdu)
```

A API local precisa estar rodando em `http://127.0.0.1:5002` (ver `.env.development` e o PROJETO.md do backend).
Para ter dados de teste: `venv/bin/python scripts/seed_dev.py` no backend (logins no topo do script).

## Estrutura

Igual ao AleEdu (sem pasta `src`): `App.tsx` decide a tela pela sessão, `components/` tem as telas,
`components/ui.tsx` as peças visuais reaproveitadas e `services/api.ts` todas as chamadas à API.

## Deploy

O `dist/` compilado é versionado. Fluxo: `npm run build` → commit → push → `git pull` na VPS.
A URL da API de produção fica em `.env.production`.
