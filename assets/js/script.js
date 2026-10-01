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
  showToast('Informação recebida. Obrigado por ajudar a manter o Conheça Roraima atualizado.');
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
// CONTEÚDO JÁ ESCRITO NO HTML
// Agenda, municípios, depoimentos e galeria estão todos no index.html (dá
// para ver com Ctrl+U). O JavaScript não cria esses cards: só lê o que já
// está na página para ordenar, filtrar e preencher os modais.
// ==========================================================================

// cria um elemento já com classe e texto; textContent nunca interpreta HTML
function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

// ==========================================================================
// AGENDA CULTURAL
// As datas ficam em data-inicio e data-fim no formato "mês-dia" e se repetem
// todo ano. O JS descobre a próxima ocorrência de cada evento a partir de
// hoje, ordena a lista e escreve a contagem de dias.
// ==========================================================================
const DAY_MS = 24 * 60 * 60 * 1000;

function dateFromMonthDay(monthDay, year) {
  const [month, day] = monthDay.split('-').map(Number);
  return new Date(year, month - 1, day);   // mês no JS começa em 0
}

// testa o ano passado, o atual e o próximo: a primeira ocorrência que ainda
// não terminou é a que vale (o ano passado cobre eventos que atravessam a
// virada do ano, como dezembro a março)
function nextOccurrence(card, today) {
  const year = today.getFullYear();
  for (const y of [year - 1, year, year + 1]) {
    const start = dateFromMonthDay(card.dataset.inicio, y);
    let end = dateFromMonthDay(card.dataset.fim, y);
    if (end < start) end = dateFromMonthDay(card.dataset.fim, y + 1);
    if (end >= today) {
      const daysUntil = Math.round((start - today) / DAY_MS);
      return { card, start, daysUntil, status: daysUntil <= 0 ? 'now' : 'soon' };
    }
  }
  return null;
}

function countdownText(evento) {
  if (evento.status === 'now') return 'Acontecendo agora';
  if (evento.daysUntil === 1) return 'É amanhã';
  return `Faltam ${evento.daysUntil} dias`;
}

// montado à mão: toISOString() converte para UTC e poderia "voltar" um dia
function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const agendaList = document.querySelector('#agenda-list');
const agendaToggle = document.querySelector('#agenda-toggle');
const AGENDA_VISIBLE = 4;   // quantos eventos aparecem antes de "Ver agenda completa"

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());   // meia-noite de hoje

const upcomingEvents = [...(agendaList?.children ?? [])]
  .map((card) => nextOccurrence(card, today))
  .filter(Boolean)
  .sort((a, b) => a.start - b.start);

upcomingEvents.forEach((evento) => {
  const { card } = evento;
  card.classList.toggle('is-now', evento.status === 'now');
  // o HTML traz só mês-dia; aqui a data ganha o ano da próxima ocorrência
  card.querySelector('.agenda-date').dateTime = isoDate(evento.start);
  card.querySelector('.agenda-countdown').textContent = countdownText(evento);
});

// append move o elemento que já existe: é assim que a lista é reordenada
agendaList?.append(...upcomingEvents.map((evento) => evento.card));

function setAgendaExpanded(expanded) {
  // do 5º evento em diante, o card só aparece com a agenda expandida.
  // 'until-found' esconde da tela, mas o Ctrl+F ainda encontra o texto
  [...agendaList.children].forEach((card, index) => {
    card.hidden = !expanded && index >= AGENDA_VISIBLE ? 'until-found' : false;
  });
  agendaToggle.setAttribute('aria-expanded', String(expanded));
  agendaToggle.firstChild.textContent = expanded ? 'Mostrar menos ' : 'Ver agenda completa ';
  agendaToggle.classList.toggle('is-expanded', expanded);
}

// o botão só aparece se houver mais eventos do que os visíveis
if (agendaToggle && upcomingEvents.length > AGENDA_VISIBLE) {
  agendaToggle.hidden = false;
  setAgendaExpanded(false);
}

agendaToggle?.addEventListener('click', () => {
  setAgendaExpanded(agendaToggle.getAttribute('aria-expanded') !== 'true');
});

// o Ctrl+F achou um evento escondido: abre a agenda completa
agendaList?.addEventListener('beforematch', () => setAgendaExpanded(true));

// Card de destaque: aparece só na primeira visita (o navegador lembra via
// localStorage). Não é modal: não bloqueia a página nem tira o foco de quem
// está lendo, e só surge depois que a pessoa rola além do hero.
const welcomeCard = document.querySelector('#welcome-card');
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
    // sem armazenamento, o card volta na próxima visita — sem problema
  }
}

// troca o destaque padrão do HTML pelo próximo evento da agenda
function fillWelcomeWithEvent(evento) {
  const { card } = evento;
  const image = welcomeCard.querySelector('#welcome-image');
  image.src = card.dataset.imagem;
  image.alt = card.dataset.imagemAlt;
  const local = card.querySelector('.agenda-meta span:last-child').textContent;
  welcomeCard.querySelector('#welcome-place').textContent = `${local} · Roraima`;
  welcomeCard.querySelector('#welcome-kicker').textContent = evento.status === 'now'
    ? 'Acontecendo agora'
    : `Próximo evento · ${countdownText(evento).toLowerCase()}`;
  welcomeCard.querySelector('#welcome-title').textContent = card.querySelector('h3').textContent;
  welcomeCard.querySelector('#welcome-text').textContent = card.querySelector('.agenda-description').textContent;
  welcomeCard.querySelector('#welcome-cta').href = '#agenda';
  welcomeCard.querySelector('#welcome-cta-text').textContent = 'Ver a agenda';
}

function closeWelcome() {
  welcomeCard.hidden = true;
  markWelcomeSeen();
}

const hero = document.querySelector('.hero');

if (welcomeCard && hero && 'IntersectionObserver' in window && !welcomeAlreadySeen()) {
  if (upcomingEvents.length) fillWelcomeWithEvent(upcomingEvents[0]);

  // em vez de um temporizador, a rolagem decide: quando o hero sai da tela
  // por cima, a pessoa já começou a explorar e o card aparece no canto
  const heroObserver = new IntersectionObserver(([entry], observer) => {
    if (entry.isIntersecting || entry.boundingClientRect.top > 0) return;
    welcomeCard.hidden = false;
    observer.disconnect();
  });
  heroObserver.observe(hero);

  welcomeCard.querySelector('#welcome-close').addEventListener('click', closeWelcome);
  welcomeCard.querySelector('#welcome-cta').addEventListener('click', closeWelcome);
  // Esc fecha o card se o foco estiver nele
  welcomeCard.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeWelcome();
  });
}

// ==========================================================================
// MUNICÍPIOS
// Cada card traz, escondido (hidden), o conteúdo do modal "Saiba mais":
// distância, descrição e o que fazer. A tabela de distâncias também já está
// no HTML, em ordem alfabética.
// ==========================================================================
const municipalityGrid = document.querySelector('#municipality-grid');
const regionFilters = document.querySelector('#region-filters');
const search = document.querySelector('#municipality-search');
const searchStatus = document.querySelector('#municipality-status');
const municipalityModal = document.querySelector('#municipality-modal');
const slideButtons = document.querySelectorAll('[data-slide]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const municipalityCards = [...(municipalityGrid?.children ?? [])];
let activeRegion = 'Todas';

// tira acentos e maiúsculas: "uiramuta" encontra "Uiramutã"
const normalize = (text) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');

// busca + filtro de região trabalham juntos: o card aparece se passar nos dois
function applyMunicipalityFilters() {
  const term = normalize(search?.value.trim() ?? '');
  let found = 0;

  municipalityCards.forEach((card) => {
    // busca no que aparece no card: categoria, região, nome e resumo
    const visibleText = [...card.querySelectorAll('.municipality-tags > *, h3, article > p')]
      .map((element) => element.textContent)
      .join(' ');
    const match = (activeRegion === 'Todas' || card.dataset.region === activeRegion)
      && (!term || normalize(visibleText).includes(term));
    card.hidden = !match;
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

// copia para o <dialog> "Saiba mais" o conteúdo do card clicado
function fillMunicipalityModal(card) {
  const field = (name) => municipalityModal.querySelector(`#municipality-modal-${name}`);
  const [tag, region] = card.querySelectorAll('.municipality-tags > *');
  field('tag').textContent = tag.textContent;
  field('region').textContent = region.textContent;
  field('title').textContent = card.querySelector('h3').textContent;
  field('distance').textContent = card.querySelector('.municipality-distance').textContent;
  field('description').textContent = card.querySelector('.municipality-description').textContent;
  const activities = card.querySelectorAll('.municipality-activities li');
  field('activities').replaceChildren(...[...activities].map((item) => item.cloneNode(true)));
}

if (municipalityGrid) updateSlideButtons();

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

// delegação de evento: um único ouvinte na lista atende todos os botões "Saiba mais"
municipalityGrid?.addEventListener('click', (event) => {
  const card = event.target.closest('.municipality-more')?.closest('li');
  if (!card || !municipalityModal?.showModal) return;
  fillMunicipalityModal(card);
  municipalityModal.showModal();
});

// ==========================================================================
// DEPOIMENTOS
// Os cards estão no HTML; o JS só decide se giram ou ficam parados e
// troca as iniciais pelas fotos da API pública randomuser.me.
// ==========================================================================
const testimonialsTrack = document.querySelector('#testimonials-track');
const testimonialOriginals = [...(testimonialsTrack?.children ?? [])];

// O giro contínuo precisa de uma cópia dos cards para o laço não ter "pulo".
// Só que, se os cards não enchem a largura da tela, a cópia aparece ao lado
// do original e o mesmo depoimento é visto duas vezes. Nesse caso os cards
// ficam parados e centralizados; quando passam da largura, eles giram.
function layoutTestimonials() {
  testimonialsTrack.replaceChildren(...testimonialOriginals);
  testimonialsTrack.classList.remove('is-animated', 'is-static');

  const viewport = testimonialsTrack.parentElement;
  if (testimonialsTrack.offsetWidth <= viewport.clientWidth) {
    testimonialsTrack.classList.add('is-static');
    return;
  }

  // a cópia é só visual: aria-hidden esconde do leitor de tela e inert
  // tira do Tab, para ninguém ler ou navegar pelos depoimentos duas vezes
  testimonialOriginals.forEach((item) => {
    const clone = item.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.inert = true;
    testimonialsTrack.append(clone);
  });
  testimonialsTrack.classList.add('is-animated');
}

async function loadTestimonialAvatars(total) {
  const genders = testimonialOriginals.map((item) => item.querySelector('.testimonial-avatar').dataset.gender);
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

    photoByCard.forEach((src, index) => {
      if (!src) return;
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';           // decorativa: o nome já está escrito ao lado
      img.width = 48;
      img.height = 48;
      // aplica no card original e na cópia (card i e card i + total) que
      // estiverem na faixa quando a foto terminar de carregar
      img.addEventListener('load', () => {
        testimonialsTrack.querySelectorAll('.testimonial-avatar').forEach((avatar, position) => {
          if (position % total === index) avatar.replaceChildren(position === index ? img : img.cloneNode());
        });
      });
    });
  } catch {
    // sem internet ou API fora do ar: os avatares ficam com as iniciais
  }
}

if (testimonialsTrack) {
  layoutTestimonials();
  loadTestimonialAvatars(testimonialOriginals.length);

  // ao redimensionar, refaz a escolha entre parado e girando
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layoutTestimonials, 200);
  });
}

// ==========================================================================
// GALERIA
// Mosaico de miniaturas com filtro por tema. Cada <li> traz no HTML a
// descrição e o crédito (texto para leitor de tela e buscadores); o data-*
// guarda só endereços: a foto grande, a licença e a página original.
// Ao clicar, a foto abre no
// visualizador (<dialog>), que navega pelas setas, pelo teclado (← →) e
// pelo arrasto do dedo no celular.
// ==========================================================================
const galleryGrid = document.querySelector('#gallery-grid');
const galleryFilters = document.querySelector('#gallery-filters');
const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightbox-image');

const galleryItems = [...(galleryGrid?.children ?? [])];
let galleryView = galleryItems;   // fotos visíveis com o filtro atual
let galleryCategory = 'Todas';
let galleryIndex = 0;

function renderGallery() {
  galleryView = galleryCategory === 'Todas'
    ? galleryItems
    : galleryItems.filter((item) => item.dataset.category === galleryCategory);

  galleryView.forEach((item, index) => {
    item.style.setProperty('--i', index);   // atraso da animação de entrada
    item.querySelector('.gallery-item').dataset.index = index;
  });
  // reinserir os itens faz a animação de entrada tocar de novo a cada filtro
  galleryGrid.replaceChildren(...galleryView);
}

// crédito: "Foto: autor · licença · ver original" (as licenças CC pedem autor e link)
function renderCredit(item) {
  const autor = item.querySelector('.gallery-author')?.textContent;
  const licenca = item.querySelector('.gallery-license')?.textContent;
  const { licencaUrl, fonte } = item.dataset;
  const credit = document.querySelector('#lightbox-credit');
  if (!autor) {
    credit.replaceChildren();
    return;
  }
  const parts = [document.createTextNode(`Foto: ${autor}`)];
  const link = (text, href) => {
    const a = createElement('a', '', text);
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    return a;
  };
  if (licenca) parts.push(' · ', licencaUrl ? link(licenca, licencaUrl) : licenca);
  if (fonte) parts.push(' · ', link('ver original', fonte));
  credit.replaceChildren(...parts);
}

function showPhoto(index) {
  // o índice "dá a volta": depois da última vem a primeira
  galleryIndex = (index + galleryView.length) % galleryView.length;
  const item = galleryView[galleryIndex];
  const { imagem } = item.dataset;

  // esmaece durante a troca; se a foto já estiver carregada (mesmo arquivo
  // ou em cache), o evento load não dispara, então a classe sai na hora
  if (lightboxImage.getAttribute('src') !== imagem) {
    lightboxImage.classList.add('is-loading');
    lightboxImage.onload = () => lightboxImage.classList.remove('is-loading');
    lightboxImage.src = imagem;
  }
  if (lightboxImage.complete) lightboxImage.classList.remove('is-loading');
  lightboxImage.alt = item.querySelector('img').alt;

  document.querySelector('#lightbox-category').textContent = item.dataset.category;
  document.querySelector('#lightbox-local').textContent = item.querySelector('.gallery-caption small').textContent;
  document.querySelector('#lightbox-title').textContent = item.querySelector('.gallery-caption strong').textContent;
  document.querySelector('#lightbox-description').textContent = item.querySelector('.gallery-description').textContent;
  document.querySelector('#lightbox-counter').textContent = `${galleryIndex + 1} / ${galleryView.length}`;
  renderCredit(item);

  // pré-carrega as vizinhas: a troca de foto fica instantânea
  [galleryIndex - 1, galleryIndex + 1].forEach((i) => {
    new Image().src = galleryView[(i + galleryView.length) % galleryView.length].dataset.imagem;
  });
}

if (galleryGrid) renderGallery();

galleryFilters?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  galleryCategory = button.dataset.category;
  galleryFilters.querySelectorAll('[data-category]').forEach((filter) => {
    filter.setAttribute('aria-pressed', String(filter === button));
  });
  renderGallery();
});

galleryGrid?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-index]');
  if (!button || !lightbox?.showModal) return;
  showPhoto(Number(button.dataset.index));
  lightbox.showModal();
});

lightbox?.querySelectorAll('[data-step]').forEach((button) => {
  button.addEventListener('click', () => showPhoto(galleryIndex + Number(button.dataset.step)));
});

lightbox?.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') showPhoto(galleryIndex - 1);
  if (event.key === 'ArrowRight') showPhoto(galleryIndex + 1);
});

// arrastar o dedo para o lado troca de foto (mais de 50px conta como gesto)
let swipeStartX = null;
lightbox?.addEventListener('pointerdown', (event) => { swipeStartX = event.clientX; });
lightbox?.addEventListener('pointerup', (event) => {
  if (swipeStartX === null) return;
  const distance = event.clientX - swipeStartX;
  swipeStartX = null;
  if (Math.abs(distance) > 50 && event.pointerType !== 'mouse') showPhoto(galleryIndex + (distance < 0 ? 1 : -1));
});


// "Viu outro valor?": o link leva até #contato e, antes disso, deixa o
// formulário pré-preenchido com o destino do card.
const subjectSelect = document.querySelector('#assunto');
const destinationSelect = document.querySelector('#destino');

document.querySelectorAll('[data-destino]').forEach((link) => {
  link.addEventListener('click', () => {
    const destino = link.dataset.destino;

    if (subjectSelect) subjectSelect.value = 'valor';
    if (destinationSelect) destinationSelect.value = destino;

    showToast(`Destino "${destino}" selecionado. Conte quanto você pagou.`);

    // depois que a página rola até #contato, coloca o foco no primeiro campo
    setTimeout(() => document.querySelector('#nome')?.focus({ preventScroll: true }), 600);
  });
});

// Carro próprio ou alugado: os dois conjuntos de valores já estão no HTML
// (.cost-own e .cost-rental); o JS só alterna qual deles fica visível.
const carMode = document.querySelector('#car-mode');
const pricingGrid = document.querySelector('#pricing-grid');

function setCarMode(rented) {
  carMode.querySelectorAll('[data-car]').forEach((b) => {
    b.setAttribute('aria-pressed', String((b.dataset.car === 'alugado') === rented));
  });
  // 'until-found': o valor escondido continua encontrável pelo Ctrl+F
  pricingGrid.querySelectorAll('.cost-rental').forEach((el) => { el.hidden = rented ? false : 'until-found'; });
  pricingGrid.querySelectorAll('.cost-own').forEach((el) => { el.hidden = rented ? 'until-found' : false; });
}

if (carMode && pricingGrid) {
  carMode.hidden = false;
  carMode.addEventListener('click', (event) => {
    const button = event.target.closest('[data-car]');
    if (button) setCarMode(button.dataset.car === 'alugado');
  });

  // o Ctrl+F achou um valor do outro modo: troca para ele
  pricingGrid.addEventListener('beforematch', (event) => {
    setCarMode(Boolean(event.target.closest('.cost-rental')));
  });
}

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
