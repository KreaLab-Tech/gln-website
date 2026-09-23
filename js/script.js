// ============================================================
// ESTE ES EL ARCHIVO POR DEFECTO (inglés) -- lo carga la página
// raíz "/". La versión en español es js/script.es.js, cargada
// por /es/. Es el mismo comportamiento línea por línea; lo único
// que cambia son los textos que ve la persona que visita el sitio
// (locale del calendario, el mensaje que arma la cotización
// rápida, y el mensaje genérico del botón "Send message"). Si el
// día de mañana cambiamos CÓMO funciona algo (no el texto, sino
// la lógica), hay que replicar el cambio también en script.es.js.
// ============================================================

// ============================================================
// MENÚ MÓVIL
// ============================================================
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');

navToggle.addEventListener('click', () => {
  nav.classList.toggle('nav--open');
});

nav.querySelectorAll('.nav__link').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('nav--open');
  });
});

// ============================================================
// AÑO AUTOMÁTICO EN EL FOOTER
// ============================================================
document.getElementById('year').textContent = new Date().getFullYear();

// ============================================================
// SOMBRA DEL HEADER AL HACER SCROLL
// ============================================================
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
  header.classList.toggle('header--scrolled', window.scrollY > 10);
});

// ============================================================
// ANIMACIÓN "REVEAL" AL HACER SCROLL
// ============================================================
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.15,
  }
);

document.querySelectorAll('.reveal').forEach((el) => {
  revealObserver.observe(el);
});

// ============================================================
// DETECCIÓN DE iOS (compartida)
// ============================================================
const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const separadorSms = esIOS ? '&' : '?';

// ============================================================
// COTIZACIÓN RÁPIDA: calendario visual + mensaje de WhatsApp
// Misma lógica que la versión en español -- la única diferencia
// real está más abajo: el locale del calendario ('en-US' en vez
// de 'es-ES') y la frase que arma el mensaje final.
// ============================================================
(function () {
  const calGrid = document.getElementById('calGrid');
  const calLabel = document.getElementById('calLabel');
  const calPrev = document.getElementById('calPrev');
  const calNext = document.getElementById('calNext');
  const tipoSelect = document.getElementById('tipoLimpieza');
  const toggleButtons = document.querySelectorAll('.quote__toggle-btn');
  const quoteHint = document.getElementById('quoteHint');
  const quoteSubmit = document.getElementById('quoteSubmit');
  const quoteSubmitSms = document.getElementById('quoteSubmitSms');

  if (!calGrid) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = null;
  let selectedHorario = null;

  // 'en-US' en vez de 'es-ES': así el calendario muestra "September 2026"
  // y "Wednesday, September 9" en vez de sus equivalentes en español.
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
  const dateFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  function renderCalendar() {
    calLabel.textContent = monthFormatter.format(viewDate);

    const isCurrentMonth =
      viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth();
    calPrev.disabled = isCurrentMonth;

    calGrid.innerHTML = '';

    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

    for (let i = 0; i < startOffset; i++) {
      const empty = document.createElement('span');
      empty.className = 'calendar__day calendar__day--empty';
      calGrid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'calendar__day';
      btn.textContent = day;

      const isPast = cellDate < today;

      if (isPast) {
        btn.disabled = true;
      } else {
        btn.addEventListener('click', () => {
          selectedDate = cellDate;
          renderCalendar();
          updateSubmitState();
        });
      }

      if (cellDate.getTime() === today.getTime()) {
        btn.classList.add('calendar__day--today');
      }
      if (selectedDate && cellDate.getTime() === selectedDate.getTime()) {
        btn.classList.add('calendar__day--selected');
      }

      calGrid.appendChild(btn);
    }
  }

  calPrev.addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    renderCalendar();
  });
  calNext.addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    renderCalendar();
  });

  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      toggleButtons.forEach((b) => b.classList.remove('quote__toggle-btn--active'));
      btn.classList.add('quote__toggle-btn--active');
      selectedHorario = btn.dataset.value; // "the morning" or "the afternoon"
      updateSubmitState();
    });
  });

  tipoSelect.addEventListener('change', updateSubmitState);

  function updateSubmitState() {
    const listo = selectedDate && selectedHorario;

    if (listo) {
      const fecha = dateFormatter.format(selectedDate);
      // El "value" de cada <option> en inglés ya viene armado como frase
      // completa (ej: "a Residential cleaning"), igual que en la versión
      // en español -- ver /index.html.
      const tipo = tipoSelect.value;
      const mensaje = `Hi! I'd like to book ${tipo} for ${fecha} in ${selectedHorario}. Could you send me an estimate, please?`;

      const mensajeCodificado = encodeURIComponent(mensaje);

      quoteSubmit.href = `https://wa.me/17864941378?text=${mensajeCodificado}`;
      quoteSubmit.classList.add('quote__submit--enabled');

      quoteSubmitSms.href = `sms:+17864941378${separadorSms}body=${mensajeCodificado}`;
      quoteSubmitSms.classList.add('quote__submit--enabled');

      quoteHint.textContent = "All set — tap a button to send your message.";
      quoteHint.classList.add('quote__hint--ready');
    } else {
      quoteSubmit.classList.remove('quote__submit--enabled');
      quoteSubmitSms.classList.remove('quote__submit--enabled');
      quoteHint.textContent = 'Choose a day and a time to continue.';
      quoteHint.classList.remove('quote__hint--ready');
    }
  }

  renderCalendar();
})();

// ============================================================
// MENÚ DE MENSAJE: "Send message" -> WhatsApp / SMS
// ============================================================
function iniciarMenuMensaje(wrapperId, toggleId, menuId, smsLinkId, textoMensaje) {
  const wrapper = document.getElementById(wrapperId);
  const toggle = document.getElementById(toggleId);
  const menu = document.getElementById(menuId);
  const smsLink = document.getElementById(smsLinkId);

  if (!wrapper) return;

  const mensaje = encodeURIComponent(textoMensaje);
  smsLink.href = `sms:+17864941378${separadorSms}body=${mensaje}`;

  function abrirMenu() {
    menu.classList.add('msg-menu__list--open');
    toggle.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
  }

  function cerrarMenu() {
    menu.classList.remove('msg-menu__list--open');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const estaAbierto = menu.classList.contains('msg-menu__list--open');
    estaAbierto ? cerrarMenu() : abrirMenu();
  });

  document.addEventListener('click', (event) => {
    if (!wrapper.contains(event.target)) cerrarMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') cerrarMenu();
  });
}

// Mensaje genérico en inglés para el botón "Send message" del hero y Contact.
const MENSAJE_GENERICO = "Hi, I would like a quote for a cleaning service";

iniciarMenuMensaje('heroMessage', 'heroMsgToggle', 'heroMsgMenu', 'heroSmsLink', MENSAJE_GENERICO);
iniciarMenuMensaje('contactoMessage', 'contactoMsgToggle', 'contactoMsgMenu', 'contactoSmsLink', MENSAJE_GENERICO);
