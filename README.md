# a1-fundamentos-web-vespertino-ivonielson-freitas

**Conheça Roraima** — portal sobre turismo, cultura, história e municípios de Roraima, com um formulário de contato para planejar a viagem.

Avaliação A1 da disciplina **Fundamentos de Desenvolvimento Web** (turno vespertino, turma 2026T1): estrutura semântica e formulário web acessível em HTML5.

## Etapas do projeto

- [x] **Etapa 1 — Estrutura HTML semântica**
- [x] **Etapa 2 — Estilização (CSS)**
- [x] **Etapa 3 — Interatividade (JavaScript)**

## Como executar

Os municípios, a agenda cultural e os depoimentos são carregados de arquivos JSON (`assets/data/`) com `fetch()`, que só funciona com o site servido por HTTP. Abrir o `index.html` direto (`file://`) não carrega esses dados.

Use a extensão **Live Server** do VS Code ou, na pasta do projeto:

```
python3 -m http.server 8000
```

e acesse `http://localhost:8000`.

## Autor

Desenvolvido por **Ivonielson Freitas**.
