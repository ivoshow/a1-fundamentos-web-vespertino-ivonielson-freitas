const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('#main-nav');
const toast = document.querySelector('#toast');

// abre ou fecha o menu mobile mantendo os atributos ARIA em sincronia
function setMenu(open) {
  mainNav.classList.toggle('open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
}

menuToggle?.addEventListener('click', () => setMenu(!mainNav.classList.contains('open')));

// Submenus (Descubra, Cultura, Planeje): só um fica aberto por vez
const navGroups = [...document.querySelectorAll('.nav-group')];

function setGroup(group, open) {
  group.classList.toggle('open', open);
  group.querySelector('.nav-group-toggle').setAttribute('aria-expanded', String(open));
}

function closeGroups(except) {
  navGroups.forEach((group) => {
    if (group !== except) setGroup(group, false);
  });
}

// no desktop com mouse, o submenu também abre ao passar o cursor
const hoverMenu = window.matchMedia('(hover: hover) and (min-width: 53.1875em)');

navGroups.forEach((group) => {
  const toggle = group.querySelector('.nav-group-toggle');
  let closeTimer;

  toggle.addEventListener('click', () => {
    const open = !group.classList.contains('open');
    closeGroups(group);
    setGroup(group, open);
  });

  group.addEventListener('mouseenter', () => {
    if (!hoverMenu.matches) return;
    clearTimeout(closeTimer);
    closeGroups(group);
    setGroup(group, true);
  });

  // pequeno atraso: se o mouse escapar por um instante, o submenu não pisca
  group.addEventListener('mouseleave', () => {
    if (!hoverMenu.matches) return;
    closeTimer = setTimeout(() => setGroup(group, false), 200);
  });

  // ao sair com o Tab do grupo inteiro, o submenu fecha
  group.addEventListener('focusout', (event) => {
    if (!group.contains(event.relatedTarget)) setGroup(group, false);
  });
});

// clique fora do menu fecha qualquer submenu aberto
document.addEventListener('click', (event) => {
  if (!event.target.closest('.nav-group')) closeGroups();
});

document.querySelectorAll('.main-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    closeGroups();
    setMenu(false);
  });
});

// Esc fecha primeiro o submenu (foco volta ao botão do grupo);
// num segundo Esc, fecha o menu mobile
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const openGroup = navGroups.find((group) => group.classList.contains('open'));
  if (openGroup) {
    setGroup(openGroup, false);
    openGroup.querySelector('.nav-group-toggle').focus();
  } else if (mainNav.classList.contains('open')) {
    setMenu(false);
    menuToggle.focus();
  }
});

let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3600);
}

const form = document.querySelector('#contact-form');
const success = document.querySelector('#form-success');
form?.addEventListener('submit', (event) => {
  event.preventDefault();
  success.hidden = false;
  form.reset();
  showToast('Mensagem recebida. Obrigado por escrever para o Conheça Roraima.');
});


// Camada de polish: revela blocos conforme entram na viewport e dá contexto ao header.
document.body.classList.add('js-ready');

const observedSections = document.querySelectorAll('.section, .stats, footer');
observedSections.forEach((section) => section.classList.add('reveal-on-scroll'));

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  observedSections.forEach((section) => revealObserver.observe(section));
} else {
  observedSections.forEach((section) => section.classList.add('is-visible'));
}

const header = document.querySelector('.site-header');
const syncHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 18);
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

// Comportamento comum a todos os <dialog>: botões [data-close-modal] fecham,
// e um clique no fundo escurecido (fora do conteúdo) também.
document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.querySelectorAll('[data-close-modal]').forEach((control) => {
    control.addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});

// ==========================================================================
// DADOS EM JSON
// fetch() só funciona com o site servido por HTTP (Vercel, Live Server...);
// abrindo o arquivo direto (file://) o navegador bloqueia a leitura.
// ==========================================================================
async function loadJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Erro ${response.status} ao carregar ${path}`);
  return response.json();
}

// cria um elemento já com classe e texto; textContent nunca interpreta HTML
function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

// ==========================================================================
// AGENDA CULTURAL (assets/data/eventos.json)
// As datas do JSON são "mês-dia" e se repetem todo ano. O JS descobre a
// próxima ocorrência de cada evento a partir de hoje e ordena a lista.
// ==========================================================================
const DAY_MS = 24 * 60 * 60 * 1000;

function dateFromMonthDay(monthDay, year) {
  const [month, day] = monthDay.split('-').map(Number);
  return new Date(year, month - 1, day);   // mês no JS começa em 0
}

// testa o ano passado, o atual e o próximo: a primeira ocorrência que ainda
// não terminou é a que vale (o ano passado cobre eventos que atravessam a
// virada do ano, como dezembro a março)
function nextOccurrence(evento, today) {
  const year = today.getFullYear();
  for (const y of [year - 1, year, year + 1]) {
    const start = dateFromMonthDay(evento.inicio, y);
    let end = dateFromMonthDay(evento.fim, y);
    if (end < start) end = dateFromMonthDay(evento.fim, y + 1);
    if (end >= today) {
      const daysUntil = Math.round((start - today) / DAY_MS);
      return { ...evento, start, end, daysUntil, status: daysUntil <= 0 ? 'now' : 'soon' };
    }
  }
  return null;
}

function countdownText(evento) {
  if (evento.status === 'now') return 'Acontecendo agora';
  if (evento.daysUntil === 1) return 'É amanhã';
  return `Faltam ${evento.daysUntil} dias`;
}

const longDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' });

function periodText(evento) {
  const period = evento.start.getTime() === evento.end.getTime()
    ? longDate.format(evento.start)
    : `De ${longDate.format(evento.start)} a ${longDate.format(evento.end)}`;
  return evento.aproximada ? `${period} (data aproximada)` : period;
}

// uma única leitura do JSON, compartilhada pela agenda e pelo modal
const upcomingEvents = loadJSON('assets/data/eventos.json')
  .then((eventos) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());   // meia-noite de hoje
    return eventos
      .map((evento) => nextOccurrence(evento, today))
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);
  })
  .catch((error) => {
    console.error(error);
    return null;
  });

const shortDay = new Intl.DateTimeFormat('pt-BR', { day: '2-digit' });
const shortMonth = new Intl.DateTimeFormat('pt-BR', { month: 'short' });

function renderEventCard(evento) {
  const item = createElement('li', `agenda-card${evento.status === 'now' ? ' is-now' : ''}`);

  // <time datetime> deixa a data legível também para máquinas (buscadores, leitores)
  const date = createElement('time', 'agenda-date');
  const { start } = evento;
  // montado à mão: toISOString() converte para UTC e poderia "voltar" um dia
  date.dateTime = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  date.append(
    createElement('strong', '', shortDay.format(evento.start)),
    createElement('span', '', shortMonth.format(evento.start).replace('.', '')),
  );

  const body = createElement('div', 'agenda-body');
  const meta = createElement('p', 'agenda-meta');
  meta.append(createElement('span', 'agenda-tag', evento.categoria), createElement('span', '', evento.local));
  body.append(
    meta,
    createElement('h3', '', evento.nome),
    createElement('p', 'agenda-description', evento.descricao),
    createElement('p', 'agenda-period', periodText(evento)),
  );

  item.append(date, body, createElement('p', 'agenda-countdown', countdownText(evento)));
  return item;
}

const agendaList = document.querySelector('#agenda-list');

const agendaToggle = document.querySelector('#agenda-toggle');
const AGENDA_VISIBLE = 4;   // quantos eventos aparecem antes de "Ver agenda completa"

function setAgendaExpanded(expanded) {
  // do 5º evento em diante, o card só aparece com a agenda expandida
  [...agendaList.children].forEach((card, index) => {
    card.hidden = !expanded && index >= AGENDA_VISIBLE;
  });
  agendaToggle.setAttribute('aria-expanded', String(expanded));
  agendaToggle.firstChild.textContent = expanded ? 'Mostrar menos ' : 'Ver agenda completa ';
  agendaToggle.classList.toggle('is-expanded', expanded);
}

upcomingEvents.then((eventos) => {
  if (!agendaList) return;
  if (!eventos) {
    document.querySelector('#agenda-error').hidden = false;
    return;
  }
  agendaList.replaceChildren(...eventos.map(renderEventCard));

  // o botão só aparece se houver mais eventos do que os visíveis
  if (eventos.length > AGENDA_VISIBLE) {
    agendaToggle.hidden = false;
    setAgendaExpanded(false);
  }
});

agendaToggle?.addEventListener('click', () => {
  setAgendaExpanded(agendaToggle.getAttribute('aria-expanded') !== 'true');
});

// Modal de boas-vindas: aparece só na primeira visita (o navegador lembra via localStorage).
const welcomeModal = document.querySelector('#welcome-modal');
const WELCOME_KEY = 'conheca-roraima:welcome-visto';

function welcomeAlreadySeen() {
  try {
    return localStorage.getItem(WELCOME_KEY) === 'sim';
  } catch {
    return false; // localStorage bloqueado (aba anônima, por exemplo): mostra mesmo assim
  }
}

function markWelcomeSeen() {
  try {
    localStorage.setItem(WELCOME_KEY, 'sim');
  } catch {
    // sem armazenamento, o modal volta na próxima visita — sem problema
  }
}

// troca o destaque fixo do HTML pelo próximo evento da agenda
function fillWelcomeWithEvent(evento) {
  const image = welcomeModal.querySelector('#welcome-image');
  image.src = evento.imagem;
  image.alt = evento.imagemAlt;
  welcomeModal.querySelector('#welcome-place').textContent = `${evento.local} · Roraima`;
  welcomeModal.querySelector('#welcome-kicker').textContent = evento.status === 'now'
    ? 'Acontecendo agora'
    : `Próximo evento · ${countdownText(evento).toLowerCase()}`;

  const em = document.createElement('em');
  em.textContent = `${evento.nome}.`;
  welcomeModal.querySelector('#welcome-title').replaceChildren('Não perca:', document.createElement('br'), em);
  welcomeModal.querySelector('#welcome-text').textContent = `${evento.descricao} ${periodText(evento)}.`;

  welcomeModal.querySelector('#welcome-cta').href = '#agenda';
  welcomeModal.querySelector('#welcome-cta-text').textContent = 'Ver a agenda';
}

if (welcomeModal?.showModal && !welcomeAlreadySeen()) {
  // espera no mínimo 600ms (a página "assenta") e no máximo 2s pela agenda;
  // se o JSON demorar ou falhar, o modal abre com o destaque fixo do HTML
  const minimumDelay = new Promise((resolve) => setTimeout(resolve, 600));
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 2000));

  Promise.all([minimumDelay, Promise.race([upcomingEvents, timeout])]).then(([, eventos]) => {
    if (eventos?.length) fillWelcomeWithEvent(eventos[0]);
    welcomeModal.showModal();
  });

  // o evento close dispara em qualquer forma de fechar: botões, Esc ou clique fora
  welcomeModal.addEventListener('close', markWelcomeSeen);
}

// ==========================================================================
// MUNICÍPIOS (assets/data/municipios.json)
// Um único arquivo de dados gera os cards do slider, a tabela de distâncias
// e o conteúdo do modal "Saiba mais". Mudou um dado? Muda nos três lugares.
// ==========================================================================
const municipalityGrid = document.querySelector('#municipality-grid');
const municipalityTableBody = document.querySelector('.municipality-table tbody');
const regionFilters = document.querySelector('#region-filters');
const search = document.querySelector('#municipality-search');
const searchStatus = document.querySelector('#municipality-status');
const municipalityModal = document.querySelector('#municipality-modal');
const slideButtons = document.querySelectorAll('[data-slide]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let municipios = [];
let activeRegion = 'Todas';

// tira acentos e maiúsculas: "uiramuta" encontra "Uiramutã"
const normalize = (text) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');

function distanceText(municipio, style) {
  if (municipio.distanciaKm === null) return style === 'short' ? '—' : 'Capital do estado';
  return style === 'short' ? `≈ ${municipio.distanciaKm} km` : `≈ ${municipio.distanciaKm} km de Boa Vista`;
}

function renderMunicipalityCard(municipio) {
  const item = createElement('li');
  item.dataset.id = municipio.id;

  const tags = createElement('div', 'municipality-tags');
  tags.append(createElement('span', '', municipio.categoria), createElement('small', '', municipio.regiao));

  const button = createElement('button', 'municipality-more', 'Saiba mais');
  button.type = 'button';
  button.dataset.municipio = municipio.id;
  button.setAttribute('aria-haspopup', 'dialog');
  const arrow = createElement('span', '', '→');
  arrow.setAttribute('aria-hidden', 'true');
  // o espaço vai como texto solto: dentro do span inline-block ele seria ignorado
  button.append(createElement('span', 'sr-only', ` sobre ${municipio.nome}`), ' ', arrow);

  const article = createElement('article');
  article.append(tags, createElement('h3', '', municipio.nome), createElement('p', '', municipio.resumo), button);
  item.append(article);
  return item;
}

function renderMunicipalityRow(municipio) {
  const row = createElement('tr');
  const name = createElement('th', '', municipio.nome);
  name.scope = 'row';
  row.append(
    name,
    createElement('td', '', municipio.regiao),
    createElement('td', '', distanceText(municipio, 'short')),
    createElement('td', '', municipio.destaque),
  );
  return row;
}

function renderRegionFilters() {
  // new Set remove repetições: sobra uma entrada por região, na ordem do JSON
  const regions = ['Todas', ...new Set(municipios.map((municipio) => municipio.regiao))];
  regionFilters.replaceChildren(...regions.map((region) => {
    const total = region === 'Todas'
      ? municipios.length
      : municipios.filter((municipio) => municipio.regiao === region).length;
    const button = createElement('button', 'region-filter', region);
    button.type = 'button';
    button.dataset.region = region;
    // aria-pressed diz ao leitor de tela qual filtro está ativo
    button.setAttribute('aria-pressed', String(region === activeRegion));
    const count = createElement('span', 'region-count', String(total));
    count.setAttribute('aria-label', `${total} municípios`);
    button.append(count);
    return button;
  }));
}

// busca + filtro de região trabalham juntos: o card aparece se passar nos dois
function applyMunicipalityFilters() {
  const term = normalize(search?.value.trim() ?? '');
  let found = 0;

  municipios.forEach((municipio) => {
    const content = normalize(`${municipio.nome} ${municipio.regiao} ${municipio.categoria} ${municipio.resumo}`);
    const match = (activeRegion === 'Todas' || municipio.regiao === activeRegion) && (!term || content.includes(term));
    municipalityGrid.querySelector(`[data-id="${municipio.id}"]`).hidden = !match;
    if (match) found += 1;
  });

  // anuncia o resultado para quem usa leitor de tela
  searchStatus.textContent = found === 0
    ? 'Nenhum município encontrado.'
    : `${found} ${found === 1 ? 'município encontrado' : 'municípios encontrados'}.`;

  municipalityGrid.scrollLeft = 0;
  updateSlideButtons();
}

// Slider: a lista rola na horizontal (scroll-snap no CSS) e as setas
// avançam ou voltam uma "página" de cards por vez
function updateSlideButtons() {
  const atStart = municipalityGrid.scrollLeft <= 1;
  const atEnd = municipalityGrid.scrollLeft + municipalityGrid.clientWidth >= municipalityGrid.scrollWidth - 1;
  slideButtons.forEach((button) => {
    button.disabled = button.dataset.slide === '-1' ? atStart : atEnd;
  });
}

// preenche o <dialog> "Saiba mais" com os dados do município clicado
function fillMunicipalityModal(municipio) {
  const field = (name) => municipalityModal.querySelector(`#municipality-modal-${name}`);
  field('tag').textContent = municipio.categoria;
  field('region').textContent = municipio.regiao;
  field('title').textContent = municipio.nome;
  field('distance').textContent = distanceText(municipio, 'long');
  field('description').textContent = municipio.descricao;
  field('activities').replaceChildren(...municipio.atividades.map((atividade) => createElement('li', '', atividade)));
}

async function initMunicipios() {
  if (!municipalityGrid) return;

  try {
    municipios = await loadJSON('assets/data/municipios.json');
  } catch (error) {
    console.error(error);
    document.querySelector('#municipality-error').hidden = false;
    document.querySelector('.slider-controls').hidden = true;
    return;
  }

  municipalityGrid.replaceChildren(...municipios.map(renderMunicipalityCard));

  // a tabela usa uma cópia ordenada; localeCompare respeita acentos do português
  const alphabetical = [...municipios].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  municipalityTableBody?.replaceChildren(...alphabetical.map(renderMunicipalityRow));

  renderRegionFilters();
  updateSlideButtons();
}

slideButtons.forEach((button) => {
  button.addEventListener('click', () => {
    municipalityGrid.scrollBy({
      left: Number(button.dataset.slide) * municipalityGrid.clientWidth,
      behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
    });
  });
});
municipalityGrid?.addEventListener('scroll', updateSlideButtons, { passive: true });
window.addEventListener('resize', () => municipalityGrid && updateSlideButtons());

search?.addEventListener('input', applyMunicipalityFilters);

regionFilters?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-region]');
  if (!button) return;
  activeRegion = button.dataset.region;
  regionFilters.querySelectorAll('[data-region]').forEach((filter) => {
    filter.setAttribute('aria-pressed', String(filter === button));
  });
  applyMunicipalityFilters();
});

// delegação de evento: um único ouvinte na lista atende todos os botões
// "Saiba mais", inclusive os que foram criados depois pelo JavaScript
municipalityGrid?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-municipio]');
  const municipio = button && municipios.find((item) => item.id === button.dataset.municipio);
  if (!municipio || !municipalityModal?.showModal) return;
  fillMunicipalityModal(municipio);
  municipalityModal.showModal();
});

initMunicipios();

// ==========================================================================
// DEPOIMENTOS (assets/data/depoimentos.json)
// Os cards são criados a partir do JSON, depois duplicados para o giro
// contínuo; as fotos dos avatares vêm da API pública randomuser.me.
// ==========================================================================
const testimonialsTrack = document.querySelector('#testimonials-track');

// "Mariana Albuquerque" → "MA": primeira letra do primeiro e do último nome
function initials(name) {
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts.at(-1)[0] : '')).toUpperCase();
}

function renderTestimonial(depoimento) {
  const quote = createElement('blockquote');
  quote.append(createElement('p', '', depoimento.texto));

  const avatar = createElement('span', 'testimonial-avatar', initials(depoimento.nome));
  avatar.dataset.gender = depoimento.genero;
  avatar.setAttribute('aria-hidden', 'true');

  const who = createElement('span');
  who.append(createElement('strong', '', depoimento.nome), createElement('small', '', depoimento.origem));

  const caption = createElement('figcaption');
  caption.append(avatar, who);

  const figure = createElement('figure', 'testimonial-card');
  figure.append(quote, caption);

  const item = createElement('li');
  item.append(figure);
  return item;
}

async function initTestimonials() {
  if (!testimonialsTrack) return;

  let depoimentos;
  try {
    depoimentos = await loadJSON('assets/data/depoimentos.json');
  } catch (error) {
    console.error(error);
    document.querySelector('#testimonials-error').hidden = false;
    return;
  }

  const originals = depoimentos.map(renderTestimonial);
  testimonialsTrack.replaceChildren(...originals);

  // a cópia é só visual: aria-hidden esconde do leitor de tela e inert
  // tira do Tab, para ninguém ler ou navegar pelos depoimentos duas vezes
  originals.forEach((item) => {
    const clone = item.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.inert = true;
    testimonialsTrack.append(clone);
  });
  testimonialsTrack.classList.add('is-animated');

  loadTestimonialAvatars(originals.length);
}

initTestimonials();

async function loadTestimonialAvatars(total) {
  const avatars = [...testimonialsTrack.querySelectorAll('.testimonial-avatar')];
  const genders = avatars.slice(0, total).map((avatar) => avatar.dataset.gender);
  const count = (gender) => genders.filter((g) => g === gender).length;

  try {
    // uma requisição por gênero, para a foto combinar com o nome do card
    const [female, male] = await Promise.all(['female', 'male'].map(async (gender) => {
      const response = await fetch(`https://randomuser.me/api/?results=${count(gender)}&gender=${gender}&inc=picture&noinfo`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const { results } = await response.json();
      return results.map((person) => person.picture.large);
    }));

    const photos = { female, male };
    const used = { female: 0, male: 0 };
    const photoByCard = genders.map((gender) => photos[gender][used[gender]++]);

    // originais e cópias usam a mesma foto (card i e card i + total)
    avatars.forEach((avatar, index) => {
      const src = photoByCard[index % total];
      if (!src) return;
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';           // decorativa: o nome já está escrito ao lado
      img.width = 48;
      img.height = 48;
      img.addEventListener('load', () => avatar.replaceChildren(img));
    });
  } catch {
    // sem internet ou API fora do ar: os avatares ficam com as iniciais
  }
}

// "Pedir orçamento": o link leva até #contato e, antes disso, deixa o
// formulário pré-preenchido com o roteiro escolhido.
const subjectSelect = document.querySelector('#assunto');
const messageField = document.querySelector('#mensagem');
let lastBudgetMessage = '';

document.querySelectorAll('[data-roteiro]').forEach((link) => {
  link.addEventListener('click', () => {
    const roteiro = link.dataset.roteiro;

    if (subjectSelect) subjectSelect.value = 'roteiro';

    // marca os interesses do roteiro (ex.: "natureza cultura")
    link.dataset.interesses.split(' ').forEach((interesse) => {
      const checkbox = document.querySelector(`#interesse-${interesse}`);
      if (checkbox) checkbox.checked = true;
    });

    // só escreve a mensagem se o campo estiver vazio ou ainda tiver o texto
    // que nós mesmos colocamos: nunca apaga o que a pessoa digitou
    if (messageField && (!messageField.value.trim() || messageField.value === lastBudgetMessage)) {
      lastBudgetMessage = `Olá! Gostaria de um orçamento para o roteiro "${roteiro}". Podem me passar valores e datas disponíveis?`;
      messageField.value = lastBudgetMessage;
    }

    showToast(`Roteiro "${roteiro}" selecionado. Complete seus dados para pedir o orçamento.`);

    // depois que a página rola até #contato, coloca o foco no primeiro campo
    setTimeout(() => document.querySelector('#nome')?.focus({ preventScroll: true }), 600);
  });
});

// WhatsApp: no computador, o link vai direto para o WhatsApp Web;
// no celular continua no wa.me, que abre o aplicativo instalado.
const whatsappLink = document.querySelector('#whatsapp-float');
const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (whatsappLink && isDesktop) {
  const text = new URL(whatsappLink.href).searchParams.get('text') ?? '';
  const webUrl = new URL('https://web.whatsapp.com/send');
  webUrl.searchParams.set('phone', whatsappLink.dataset.phone);
  webUrl.searchParams.set('text', text);
  whatsappLink.href = webUrl.href;
}
