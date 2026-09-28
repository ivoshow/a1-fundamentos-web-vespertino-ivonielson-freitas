# a1-fundamentos-web-vespertino-ivonielson-freitas

**Conheça Roraima** — portal sobre turismo, cultura, história e municípios de Roraima, com um formulário de contato para planejar a viagem.

Avaliação A1 da disciplina **Fundamentos de Desenvolvimento Web** (turno vespertino, turma 2026T1): estrutura semântica e formulário web acessível em HTML5.

## Etapas do projeto

- [x] **Etapa 1 — Estrutura HTML semântica**
- [ ] **Etapa 2 — Estilização (CSS)** — aguardando
- [ ] **Etapa 3 — Interatividade (JavaScript)** — aguardando

Nesta entrega o foco é só o HTML. Por isso a folha de estilo está desativada (comentada) no `<head>` do `index.html`.

## Etapa 1 — o que foi feito

### Estrutura e semântica
- Tags semânticas: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`, além de `<figure>`, `<hgroup>`, `<address>` e `<search>`.
- Um único `<main>` e um único `<h1>`, com a hierarquia `<h2>` → `<h3>` sem pular níveis.
- Menu `<nav>` com lista `<ul>` e links internos (âncoras `#`).
- Tabela semântica (`<table>`, `<caption>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`) com as distâncias entre os municípios e Boa Vista.
- `<div>` usada só para layout, onde nenhum elemento semântico se aplica.

### Formulário
- `<form action="#" method="POST">`, dividido em blocos com `<fieldset>` e `<legend>`.
- 8 tipos de campo: `text`, `email`, `tel`, `date`, `number`, `select`, `textarea` e `checkbox`.
- Botão de envio explícito: `<button type="submit">`.

### Acessibilidade e validações nativas
- Todos os campos têm `<label for="...">` ligado ao `id` do campo.
- `required` nos campos obrigatórios; limites com `minlength`, `maxlength`, `min` e `max`.
- Validação com expressão regular (`pattern`) e dica em `title` nos campos **Nome** e **Telefone**.
- Todas as imagens têm `alt` descritivo.

## Testes realizados

### Validador do W3C — <https://validator.w3.org/>
O `index.html` passou **sem erros e sem avisos**.

### Google Lighthouse (modo celular) — versão só com HTML, sem CSS

| Desempenho | Acessibilidade | Práticas recomendadas | SEO |
|:---:|:---:|:---:|:---:|
| 100 | 97 | 96 | 100 |

Os dois pontos que ficam abaixo de 100 dependem da estilização, prevista para a Etapa 2:
- **Acessibilidade:** sem CSS, os links do menu ficam menores que a área de toque mínima de 24×24 px.
- **Práticas recomendadas:** sem CSS, as imagens aparecem no tamanho natural, e o Lighthouse as considera em baixa resolução para a tela.

## Como abrir
Não precisa instalar nada: basta abrir o `index.html` no navegador.

## Estrutura de pastas
```
├── index.html
└── assets/
    ├── css/    folhas de estilo (Etapa 2)
    ├── js/     scripts (Etapa 3)
    ├── img/    imagens em WebP e favicon
    └── fonts/  fontes locais
```
