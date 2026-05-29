// Set current year in all footer copyright spans
document.querySelectorAll('#year').forEach(el => el.textContent = new Date().getFullYear());

// Highlight active nav link based on scroll position (home page only)
(function () {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  if (!sections.length) return;

  function onScroll() {
    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 80) current = section.id;
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) link.classList.add('active');
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();

// Close mobile nav when a link is clicked
document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
  link.addEventListener('click', () => {
    const collapse = document.getElementById('mainNav');
    if (collapse && collapse.classList.contains('show')) {
      const bsCollapse = window.bootstrap?.Collapse.getInstance(collapse);
      if (bsCollapse) bsCollapse.hide();
    }
  });
});

// ===================== BUZZ GAME =====================
(function () {
  const arena = document.getElementById('buzzArena');
  if (!arena) return;

  const WORDS = [
    'Start small',
    'Stop starting — start finishing',
    'Less is more',
    'Keep it simple',
    'Wordset — mindset',
    'Just do it',
    'Sky is the limit',
    'Customer is always right',
    'Strike a pose',
    'Another one',
  ];

  const bubbles = [];

  function bubbleSize(word) {
    return Math.max(90, Math.min(155, 62 + word.replace(/\s/g, '').length * 3));
  }

  function makeBubble(word) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'buzz-bubble';
    el.textContent = word;

    const size = bubbleSize(word);
    el.style.width  = size + 'px';
    el.style.height = size + 'px';
    el.style.fontSize = Math.max(11, Math.min(14, size * 0.115)) + 'px';

    const W = arena.offsetWidth  || window.innerWidth;
    const H = arena.offsetHeight || 340;

    // Spread bubbles roughly in a grid so they start spread out
    const cols = Math.ceil(Math.sqrt(WORDS.length + 1));
    const idx  = bubbles.length;
    const col  = idx % cols;
    const row  = Math.floor(idx / cols);
    const cellW = W / cols;
    const cellH = H / Math.ceil((WORDS.length + 1) / cols);
    const x = Math.min(W - size, Math.max(0, cellW * col + (cellW - size) / 2 + (Math.random() - 0.5) * 40));
    const y = Math.min(H - size, Math.max(0, cellH * row + (cellH - size) / 2 + (Math.random() - 0.5) * 30));

    const speed = 20 + Math.random() * 22; // px / second
    const angle = Math.random() * Math.PI * 2;

    const b = {
      el, word, size,
      x, y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      paused: false,
    };

    el.style.left = b.x + 'px';
    el.style.top  = b.y + 'px';

    el.addEventListener('mouseenter', () => { b.paused = true; });
    el.addEventListener('mouseleave', () => { b.paused = false; });
    el.addEventListener('click',      () => openModal(b));

    arena.appendChild(el);
    bubbles.push(b);
  }

  WORDS.forEach(makeBubble);

  // Animation loop
  let lastTs = null;

  function tick(ts) {
    const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0;
    lastTs = ts;

    const W = arena.offsetWidth;
    const H = arena.offsetHeight;

    bubbles.forEach(b => {
      if (b.paused) return;
      b.x += b.dx * dt;
      b.y += b.dy * dt;

      if (b.x <= 0)          { b.x = 0;          b.dx =  Math.abs(b.dx); }
      if (b.x + b.size >= W) { b.x = W - b.size; b.dx = -Math.abs(b.dx); }
      if (b.y <= 0)          { b.y = 0;          b.dy =  Math.abs(b.dy); }
      if (b.y + b.size >= H) { b.y = H - b.size; b.dy = -Math.abs(b.dy); }

      b.el.style.left = b.x + 'px';
      b.el.style.top  = b.y + 'px';
    });

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  // Modal
  const overlay   = document.getElementById('buzzModalOverlay');
  const modalWord = document.getElementById('buzzModalWord');
  const modalText = document.getElementById('buzzModalText');
  const btnClose  = document.getElementById('buzzModalClose');
  const btnCancel = document.getElementById('buzzModalCancel');
  const btnSubmit = document.getElementById('buzzModalSubmit');

  function openModal(b) {
    bubbles.forEach(x => { x.el.classList.remove('selected'); x.paused = false; });
    b.el.classList.add('selected');
    b.paused = true;
    modalWord.textContent = b.word;
    modalText.value = '';
    modalText.style.borderColor = '';
    overlay.classList.add('visible');
    setTimeout(() => modalText.focus(), 320);
  }

  function closeModal() {
    overlay.classList.remove('visible');
    bubbles.forEach(b => { b.el.classList.remove('selected'); b.paused = false; });
  }

  btnClose.addEventListener('click', closeModal);
  btnCancel.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('visible')) closeModal();
  });

  btnSubmit.addEventListener('click', () => {
    if (!modalText.value.trim()) {
      modalText.style.borderColor = 'var(--color-primary)';
      modalText.focus();
      return;
    }
    window.location.href = 'about.html#contact';
  });

  // Add a custom buzz word
  const buzzInput  = document.getElementById('buzzInput');
  const buzzAddBtn = document.getElementById('buzzAddBtn');

  function addWord() {
    const w = buzzInput.value.trim();
    if (!w) return;
    makeBubble(w);
    buzzInput.value = '';
  }

  buzzAddBtn.addEventListener('click', addWord);
  buzzInput.addEventListener('keydown', e => { if (e.key === 'Enter') addWord(); });
})();

// Contact form: show success message after Formspree submission
(function () {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (!form || !success) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const data = new FormData(form);
    const action = form.getAttribute('action');

    // Don't submit if Formspree ID hasn't been configured yet
    if (action.includes('YOUR_FORMSPREE_ID')) {
      success.style.display = 'block';
      success.textContent = 'Form not yet configured. Please set up Formspree (see the comment in index.html).';
      success.style.background = '#fff3cd';
      success.style.color = '#856404';
      return;
    }

    try {
      const res = await fetch(action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (res.ok) {
        form.reset();
        form.style.display = 'none';
        success.style.display = 'block';
      }
    } catch {
      success.style.display = 'block';
      success.textContent = 'Something went wrong. Please email me directly.';
      success.style.background = '#f8d7da';
      success.style.color = '#721c24';
    }
  });
})();
