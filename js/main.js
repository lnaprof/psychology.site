/* ==========================================================================
   Лендинг психолога / коуча — интерактив
   1. Шапка + мобильное меню
   2. Плавные появления при скролле
   3. Анимация счетчиков
   4. Аккордеон FAQ
   5. Подстановка тарифа в форму
   6. Отправка формы: Telegram (API) -> fallback на email
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- НАСТРОЙКИ ----------
     ✏️ ЗАМЕНИТЕ значения ниже на реальные:
     - telegramBotToken: токен бота от @BotFather
     - telegramChatId:   ваш chat_id (узнать: https://t.me/userinfobot)
     - fallbackEmail:    на этот адрес уйдет письмо, если Telegram не настроен
  -------------------------------------------------------------------------- */
  var CONFIG = {
    telegramBotToken: 'PASTE_BOT_TOKEN_HERE',
    telegramChatId: 'PASTE_CHAT_ID_HERE',
    fallbackEmail: 'name@example.com'
  };

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ========================================================================
     1. Шапка и мобильное меню
     ======================================================================== */
  var header = $('.site-header');
  var navToggle = $('#nav-toggle');
  var siteNav = $('#site-nav');

  function onScroll() {
    if (window.scrollY > 24) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setNav(open) {
    siteNav.classList.toggle('is-open', open);
    navToggle.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('no-scroll', open);
  }

  navToggle.addEventListener('click', function () {
    setNav(!siteNav.classList.contains('is-open'));
  });

  siteNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setNav(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && siteNav.classList.contains('is-open')) setNav(false);
  });

  /* ========================================================================
     2. Появление блоков при скролле (IntersectionObserver)
     ======================================================================== */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          var delay = parseInt(entry.target.getAttribute('data-delay'), 10) || 0;
          if (delay) setTimeout(function () { entry.target.style.transitionDelay = ''; }, delay + 800);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) {
      var delay = parseInt(el.getAttribute('data-delay'), 10) || 0;
      if (delay) el.style.transitionDelay = delay + 'ms';
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ========================================================================
     3. Счетчики (4 700+ часов)
     ======================================================================== */
  function formatNumber(n) {
    var s = String(n);
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
  }

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
    var duration = 1400;
    var start = null;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) { el.textContent = formatNumber(target); return; }
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); /* easeOutCubic */
      el.textContent = formatNumber(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var counters = $$('.counter');
  if (counters.length) {
    if ('IntersectionObserver' in window) {
      var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { counterObserver.observe(el); });
    } else {
      counters.forEach(animateCounter);
    }
  }

  /* ========================================================================
     4. Аккордеон FAQ
     ======================================================================== */
  var faqItems = $$('.faq-item');
  faqItems.forEach(function (item) {
    var btn = $('.faq-q button', item);
    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');
      faqItems.forEach(function (other) {
        other.classList.remove('is-open');
        $('.faq-q button', other).setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ========================================================================
     5. Кнопки «Записаться» у тарифов -> подставляют формат в форму
     ======================================================================== */
  var planInput = $('#f-plan');
  var bookingForm = $('#booking-form');

  $$('[data-plan]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (planInput) planInput.value = btn.getAttribute('data-plan');
      var target = $('#contact');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(function () {
        var nameField = $('#f-name');
        if (nameField) nameField.focus({ preventScroll: true });
      }, 550);
    });
  });

  /* ========================================================================
     6. Отправка формы: Telegram -> fallback email
     ======================================================================== */
  var statusEl = $('#form-status');
  var submitBtn = $('#submit-btn');
  var telegramConfigured =
    CONFIG.telegramBotToken &&
    CONFIG.telegramBotToken.indexOf('PASTE_') !== 0 &&
    CONFIG.telegramChatId &&
    CONFIG.telegramChatId.indexOf('PASTE_') !== 0;

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function setStatus(msg, type) {
    statusEl.textContent = msg || '';
    statusEl.className = 'form-status' + (type ? ' is-' + type : '');
  }

  function sendToTelegram(payload) {
    var url = 'https://api.telegram.org/bot' + CONFIG.telegramBotToken + '/sendMessage';
    var text =
      '<b>\uD83D\uDD14 Новый запрос с лендинга</b>\n\n' +
      '<b>Имя:</b> ' + escapeHTML(payload.name) + '\n' +
      '<b>Telegram / телефон:</b> ' + escapeHTML(payload.contact) + '\n' +
      '<b>Запрос:</b> ' + escapeHTML(payload.message || '—') + '\n' +
      '<b>Формат:</b> ' + escapeHTML(payload.plan || 'подберу на диагностике') + '\n\n' +
      '<i>' + new Date().toLocaleString('ru-RU') + '</i>';
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CONFIG.telegramChatId, text: text, parse_mode: 'HTML' })
    }).then(function (res) {
      if (!res.ok) throw new Error('Telegram API error ' + res.status);
      return res.json();
    }).then(function (data) {
      if (!data.ok) throw new Error('Telegram API: ' + data.description);
    });
  }

  function fallbackToEmail(payload) {
    var subject = 'Запись на диагностику — ' + payload.name;
    var body =
      'Имя: ' + payload.name + '\n' +
      'Telegram / телефон: ' + payload.contact + '\n' +
      'Запрос: ' + (payload.message || '—') + '\n' +
      'Формат: ' + (payload.plan || 'подберу на диагностике');
    window.location.href =
      'mailto:' + CONFIG.fallbackEmail +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  }

  function onSuccess() {
    bookingForm.reset();
    if (planInput) planInput.value = '';
    setStatus('Заявка отправлена. Отвечу в течение 4 часов в рабочие дни (пн–пт, 10:00–19:00 МСК).', 'ok');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Записаться на диагностику';
  }

  if (bookingForm) bookingForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = ($('#f-name').value || '').trim();
    var contact = ($('#f-contact').value || '').trim();
    var message = ($('#f-message').value || '').trim();
    var plan = planInput ? planInput.value.trim() : '';
    var consent = $('input[name="consent"]', bookingForm).checked;

    if (!name || !contact) {
      setStatus('Пожалуйста, укажи имя и telegram или телефон.', 'error');
      return;
    }
    if (!consent) {
      setStatus('Нужно согласие на обработку персональных данных.', 'error');
      return;
    }

    setStatus('Отправляю...', 'sending');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляю...';

    var payload = { name: name, contact: contact, message: message, plan: plan };

    function resetButton() {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Записаться на диагностику';
    }

    if (telegramConfigured) {
      sendToTelegram(payload).then(function () {
        onSuccess();
      }).catch(function () {
        /* Telegram не ответил — переключаемся на email */
        fallbackToEmail(payload);
        resetButton();
        setStatus('Telegram временно недоступен — открыл почтовый клиент. Нажми «Отправить», и заявка придет на ' + CONFIG.fallbackEmail + '.', 'ok');
      });
    } else {
      fallbackToEmail(payload);
      resetButton();
      setTimeout(function () {
        setStatus('Открыл окно почтового клиента — нажми «Отправить», чтобы я получила заявку.', 'ok');
      }, 400);
    }
  });

  /* ========================================================================
     7. Мобильная CTA-плашка (после первого экрана)
     ======================================================================== */
  var mobileCta = $('#mobile-cta');
  var hero = $('.hero');
  var formSection = $('#contact');
  if (mobileCta && 'IntersectionObserver' in window) {
    var heroVisible = true;
    var formReached = false;

    function syncCta() {
      /* Плашка видна только после первого экрана и пока не начался блок с формой
         (как только форма на экране — кнопка пропадает и больше не возвращается) */
      mobileCta.classList.toggle('is-visible', !heroVisible && !formReached);
    }

    if (hero) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { heroVisible = entry.isIntersecting; syncCta(); });
      }, { threshold: 0.05 }).observe(hero);
    }

    if (formSection) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { formReached = true; syncCta(); }
        });
      }, { threshold: 0.05 }).observe(formSection);
    }
  }

  /* ========================================================================
     8. Год в подвале
     ======================================================================== */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();