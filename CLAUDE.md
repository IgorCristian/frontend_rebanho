# Instruções para o Claude

- ⛔ **REGRA ABSOLUTA: NUNCA acessar os bancos de dados da VPS** (de nenhum sistema). Use só os bancos locais (`rebanho_local`, `rebanho_test`). Para produção, escreva os comandos e o usuário executa.
- Leia `../backend_rebanho/PROJETO.md` (e o `CLAUDE.md` de lá) antes de qualquer tarefa: objetivo, decisões e roteiro ficam no repo do backend.
- Siga os padrões do frontend do AleEdu (`../../app_do_consultor/consultor_aleedu`) para auth, `services/api.ts` e visual. Não há modo offline neste projeto por enquanto.
- O `dist/` é versionado: depois de mudanças, rode `npm run build` antes do commit.
