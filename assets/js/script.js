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
