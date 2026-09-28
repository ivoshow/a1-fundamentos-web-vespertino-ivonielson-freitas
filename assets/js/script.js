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

document.querySelectorAll('.main-nav a').forEach((link) => {
  link.addEventListener('click', () => setMenu(false));
});

// Esc fecha o menu e devolve o foco ao botão que o abriu
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mainNav.classList.contains('open')) {
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
