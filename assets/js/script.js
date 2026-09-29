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

const search = document.querySelector('#municipality-search');
const searchStatus = document.querySelector('#municipality-status');
const cards = [...document.querySelectorAll('#municipality-grid article')];
search?.addEventListener('input', (event) => {
  const term = event.target.value.trim().toLocaleLowerCase('pt-BR');
  let found = 0;
  cards.forEach((card) => {
    // busca em todo o texto do card: nome, região, categoria e destaques
    const content = card.textContent.toLocaleLowerCase('pt-BR');
    const match = !term || content.includes(term);
    // esconde o <li> inteiro para não deixar um espaço vazio na grade
    card.parentElement.hidden = !match;
    if (match) found += 1;
  });
  // anuncia o resultado para quem usa leitor de tela
  searchStatus.textContent = found === 0
    ? 'Nenhum município encontrado.'
    : `${found} ${found === 1 ? 'município encontrado' : 'municípios encontrados'}.`;
});

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

if (welcomeModal?.showModal && !welcomeAlreadySeen()) {
  // pequeno atraso para a página "assentar" antes do modal surgir
  setTimeout(() => welcomeModal.showModal(), 600);

  // o evento close dispara em qualquer forma de fechar: botões, Esc ou clique fora
  welcomeModal.addEventListener('close', markWelcomeSeen);
}

// Slider dos municípios: a lista rola na horizontal (scroll-snap no CSS)
// e as setas avançam ou voltam uma "página" de cards por vez.
const slider = document.querySelector('#municipality-grid');
const slideButtons = document.querySelectorAll('[data-slide]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function updateSlideButtons() {
  const atStart = slider.scrollLeft <= 1;
  const atEnd = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 1;
  slideButtons.forEach((button) => {
    button.disabled = button.dataset.slide === '-1' ? atStart : atEnd;
  });
}

if (slider) {
  slideButtons.forEach((button) => {
    button.addEventListener('click', () => {
      slider.scrollBy({
        left: Number(button.dataset.slide) * slider.clientWidth,
        behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
      });
    });
  });
  slider.addEventListener('scroll', updateSlideButtons, { passive: true });
  window.addEventListener('resize', updateSlideButtons);
  // depois de filtrar pela busca, volta ao início e recalcula as setas
  search?.addEventListener('input', () => {
    slider.scrollLeft = 0;
    updateSlideButtons();
  });
  updateSlideButtons();
}

// Modal "Saiba mais": preenche um único <dialog> com os dados do município
// clicado (vindos de municipios.js). textContent evita injetar HTML.
const municipalityModal = document.querySelector('#municipality-modal');

function fillMunicipalityModal(info) {
  const field = (name) => municipalityModal.querySelector(`#municipality-modal-${name}`);
  field('tag').textContent = info.categoria;
  field('region').textContent = info.regiao;
  field('title').textContent = info.nome;
  field('distance').textContent = info.distancia;
  field('description').textContent = info.descricao;
  field('activities').replaceChildren(...info.atividades.map((atividade) => {
    const item = document.createElement('li');
    item.textContent = atividade;
    return item;
  }));
}

document.querySelectorAll('[data-municipio]').forEach((button) => {
  button.addEventListener('click', () => {
    const info = typeof MUNICIPIOS !== 'undefined' && MUNICIPIOS[button.dataset.municipio];
    if (!info || !municipalityModal?.showModal) return;
    fillMunicipalityModal(info);
    municipalityModal.showModal();
  });
});

// Depoimentos: duplica os cards para o giro contínuo e busca fotos
// aleatórias na API pública randomuser.me para os avatares.
const testimonialsTrack = document.querySelector('#testimonials-track');

if (testimonialsTrack) {
  const originals = [...testimonialsTrack.children];

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
