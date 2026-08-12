/* ==========================================================================
   ТОП СЕРВІС — shared site behaviour
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // reveal-on-scroll
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 60);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  reveals.forEach(r => observer.observe(r));

  // desktop nav phone number visibility
  const navPhone = document.getElementById('navPhone');
  if (navPhone) {
    const sync = () => { navPhone.style.display = window.innerWidth > 900 ? 'flex' : 'none'; };
    sync();
    window.addEventListener('resize', sync);
  }

  // scroll-to-top button
  const scrollBtn = document.getElementById('scrollTopBtn');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });
  }

  // close mobile menu with Escape key (keyboard accessibility)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const m = document.getElementById('mobileMenu');
      if (m && m.classList.contains('open')) closeMenu();
    }
  });
});

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

function toggleMenu() {
  const m = document.getElementById('mobileMenu');
  const h = document.getElementById('hamburger');
  const navEl = document.querySelector('nav[aria-label="Основна навігація"]');
  if (!m || !h) return;
  const isOpen = m.classList.contains('open');
  if (isOpen) {
    m.style.opacity = '0'; m.style.transform = 'translateY(-20px)';
    setTimeout(() => m.classList.remove('open'), 280);
  } else {
    if (navEl) m.style.top = navEl.getBoundingClientRect().bottom + 'px';
    m.classList.add('open');
    requestAnimationFrame(() => { m.style.opacity = '1'; m.style.transform = 'translateY(0)'; });
  }
  h.classList.toggle('open');
  h.setAttribute('aria-expanded', String(!isOpen));
}

function closeMenu() {
  const m = document.getElementById('mobileMenu');
  const h = document.getElementById('hamburger');
  if (!m || !h) return;
  m.style.opacity = '0'; m.style.transform = 'translateY(-20px)';
  setTimeout(() => m.classList.remove('open'), 280);
  h.classList.remove('open');
  h.setAttribute('aria-expanded', 'false');
}

function openTelegram() { window.open('https://t.me/TopService_Kamianske_bot', '_blank'); }

function toggleFaq(el) {
  const item = el.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  item.parentElement.querySelectorAll('.faq-item.open').forEach(i => { if (i !== item) i.classList.remove('open'); });
  item.classList.toggle('open', !isOpen);
  el.setAttribute('aria-expanded', String(!isOpen));
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/*
 * NOTE ON SECURITY:
 * The Telegram Bot Token must never live in this file or any other file the
 * browser downloads. This function posts the lead to a server-side endpoint
 * (e.g. a Vercel serverless function at /api/send-lead) which holds the real
 * token in an environment variable and forwards the message to Telegram.
 * Until that endpoint exists, this will fail — see the setup note handed
 * over with this delivery.
 */
async function submitForm() {
  const name = document.getElementById('fname').value.trim();
  const phone = document.getElementById('fphone').value.trim();
  const device = document.getElementById('fdevice').value;
  const problem = document.getElementById('fproblem').value;
  const comment = document.getElementById('fcomment').value.trim();

  if (!name) { alert("Будь ласка, введіть ваше ім'я"); document.getElementById('fname').focus(); return; }
  if (!phone || phone.replace(/\D/g, '').length < 9) { alert('Будь ласка, введіть коректний номер телефону'); document.getElementById('fphone').focus(); return; }
  if (!device) { alert('Будь ласка, оберіть тип пристрою'); document.getElementById('fdevice').focus(); return; }
  if (!problem) { alert('Будь ласка, оберіть тип несправності'); document.getElementById('fproblem').focus(); return; }

  const formInner = document.getElementById('orderFormInner');
  const formLoading = document.getElementById('formLoading');
  const submitBtn = document.getElementById('submitBtn');
  const honeypot = document.getElementById('fwebsite');
  if (honeypot && honeypot.value) return; // bot caught by honeypot, silently drop

  formInner.style.display = 'none';
  formLoading.classList.add('show');
  submitBtn.disabled = true;

  try {
    const response = await fetch('/api/send-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, phone, device, problem, comment,
        page: window.location.pathname,
        time: new Date().toLocaleString('uk-UA'),
      }),
    });
    const result = await response.json().catch(() => ({ ok: false }));

    if (response.ok && result.ok) {
      formLoading.classList.remove('show');
      document.getElementById('successName').textContent = name;
      document.getElementById('successPhone').textContent = phone;
      document.getElementById('formSuccess').style.display = 'block';
      setTimeout(() => {
        ['fname', 'fphone', 'fcomment'].forEach(id => document.getElementById(id).value = '');
        ['fdevice', 'fproblem'].forEach(id => document.getElementById(id).value = '');
        formInner.style.display = 'block';
        document.getElementById('formSuccess').style.display = 'none';
        submitBtn.disabled = false;
      }, 5000);
    } else {
      throw new Error('send-lead failed');
    }
  } catch (error) {
    console.error('Помилка надсилання заявки:', error);
    formLoading.classList.remove('show');
    formInner.style.display = 'block';
    submitBtn.disabled = false;
    alert('❌ Помилка. Спробуйте ще раз або телефонуйте: 066 005 2325');
  }
}
