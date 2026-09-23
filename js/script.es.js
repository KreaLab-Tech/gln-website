// ============================================================
// ESTA ES LA VERSIÓN EN ESPAÑOL DE script.js -- la carga /es/.
// El comportamiento por defecto del sitio ahora está en inglés
// (js/script.js, cargado desde la raíz "/"). Es el mismo
// comportamiento línea por línea; lo único que cambia son los
// textos que ve la persona que visita el sitio (locale del
// calendario, el mensaje que arma la cotización rápida, y el
// mensaje genérico del botón "Enviar mensaje"). Si el día de
// mañana cambiamos CÓMO funciona algo (no el texto, sino la
// lógica), hay que replicar el cambio también en js/script.js.
// ============================================================

// ============================================================
// MENÚ MÓVIL
// Cada vez que se hace click en el botón hamburguesa, se agrega
// o quita la clase "nav--open" del <nav>. Esa clase es la que en
// el CSS convierte el menú (oculto por defecto en celular) en un
// panel desplegable. classList.toggle() es un método nativo de
// JS: si la clase está, la saca; si no está, la pone.
// ============================================================
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');

navToggle.addEventListener('click', () => {
  nav.classList.toggle('nav--open');
});

// Cierra el menú al tocar un link (mejor experiencia en celular:
// si no hiciéramos esto, el menú se quedaría abierto tapando la
// sección a la que acabás de saltar).
nav.querySelectorAll('.nav__link').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('nav--open');
  });
});

// ============================================================
// AÑO AUTOMÁTICO EN EL FOOTER
// new Date().getFullYear() devuelve el año actual del sistema.
// Así el "© 2026" del footer nunca queda desactualizado, sin
// que nadie tenga que editar el HTML a mano cada enero.
// ============================================================
document.getElementById('year').textContent = new Date().getFullYear();

// ============================================================
// SOMBRA DEL HEADER AL HACER SCROLL
// Escuchamos el evento "scroll" de la ventana. Cuando bajaste
// más de 10px, le agregamos la clase "header--scrolled" (que en
// CSS dibuja una sombra sutil); si volvés arriba del todo, se la
// sacamos. window.scrollY es la cantidad de píxeles que se
// scrolleó desde arriba.
// ============================================================
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
  header.classList.toggle('header--scrolled', window.scrollY > 10);
});

// ============================================================
// ANIMACIÓN "REVEAL" AL HACER SCROLL
// Todos los elementos con clase .reveal arrancan invisibles
// (definido en el CSS). Acá usamos un IntersectionObserver: una
// herramienta del navegador que "observa" elementos y avisa
// cuando entran o salen de la pantalla, sin que tengamos que
// calcular posiciones a mano ni escuchar el scroll para esto
// (es mucho más eficiente que hacerlo con window.addEventListener).
//
// Por cada elemento que se hace visible, le agregamos la clase
// .reveal--visible (que en CSS dispara la transición de aparecer)
// y dejamos de observarlo con unobserve() -- una vez que ya
// apareció, no hace falta seguir chequeándolo.
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
    threshold: 0.15, // se activa cuando el 15% del elemento ya es visible
  }
);

document.querySelectorAll('.reveal').forEach((el) => {
  revealObserver.observe(el);
});

// ============================================================
// DETECCIÓN DE iOS (compartida)
// El esquema "sms:" para abrir la app de mensajes no se escribe
// igual en todos los celulares: iPhone espera un "&" antes de
// "body=", y Android (y el resto) esperan un "?". La usan tanto
// el menú "Enviar mensaje" del hero como el botón de SMS de la
// cotización rápida, así que la calculamos una sola vez acá arriba
// en vez de repetirla en cada sección.
// ============================================================
const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const separadorSms = esIOS ? '&' : '?';

// ============================================================
// COTIZACIÓN RÁPIDA: calendario visual + mensaje de WhatsApp
//
// La idea completa: el cliente toca un día en el calendario,
// elige tipo de limpieza y horario, y el botón "Enviar por
// WhatsApp" arma el mensaje solo y lleva directo al chat con
// todo ya escrito. No hay ningún backend ni base de datos detrás
// -- todo pasa en el navegador del cliente, con JavaScript puro.
//
// Envolvemos todo en una función que se ejecuta sola, (function
// () { ... })(), para que las variables de acá (today, viewDate,
// etc.) no choquen por accidente con nombres usados más arriba
// en este mismo archivo.
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

  // Si por algún motivo esta sección no está en la página, no seguimos
  // (evita errores en consola si algún día se saca del HTML).
  if (!calGrid) return;

  // "Hoy" sin horas/minutos/segundos, para poder comparar fechas
  // solo por día (si no, 3pm de hoy sería "distinto" de medianoche de hoy).
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let viewDate = new Date(today.getFullYear(), today.getMonth(), 1); // mes que se está mostrando
  let selectedDate = null;    // día que eligió el cliente
  let selectedHorario = null; // "la mañana" o "la tarde"

  // Intl.DateTimeFormat es una herramienta nativa del navegador para
  // mostrar fechas en el idioma y formato que uno le pida, sin tener
  // que armar arrays de nombres de meses/días a mano.
  const monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
  const dateFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  // Dibuja (o vuelve a dibujar) todo el calendario del mes actual en pantalla.
  function renderCalendar() {
    calLabel.textContent = monthFormatter.format(viewDate);

    // No dejamos ir "hacia atrás" del mes real en el que estamos.
    const isCurrentMonth =
      viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth();
    calPrev.disabled = isCurrentMonth;

    calGrid.innerHTML = ''; // limpiamos la grilla antes de redibujar

    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    // Truco para saber cuántos días tiene el mes: el "día 0" del mes
    // siguiente es, en realidad, el último día de este mes.
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

    // getDay() de JS da 0=Domingo, 1=Lunes... 6=Sábado. Como nuestra
    // grilla empieza en Lunes, corremos el número para que Lunes=0.
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

    // Casilleros vacíos antes del día 1 (para alinear el 1 con su
    // columna de día de semana correcta).
    for (let i = 0; i < startOffset; i++) {
      const empty = document.createElement('span');
      empty.className = 'calendar__day calendar__day--empty';
      calGrid.appendChild(empty);
    }

    // Un botón por cada día del mes.
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'calendar__day';
      btn.textContent = day;

      const isPast = cellDate < today;

      if (isPast) {
        // Los días que ya pasaron quedan deshabilitados: no se pueden tocar.
        btn.disabled = true;
      } else {
        btn.addEventListener('click', () => {
          selectedDate = cellDate;
          renderCalendar();      // vuelve a dibujar para resaltar el día elegido
          updateSubmitState();   // revisa si ya se puede armar el mensaje
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

  // Flechas para cambiar de mes.
  calPrev.addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    renderCalendar();
  });
  calNext.addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    renderCalendar();
  });

  // Botones de Mañana / Tarde: solo uno puede estar activo a la vez.
  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      toggleButtons.forEach((b) => b.classList.remove('quote__toggle-btn--active'));
      btn.classList.add('quote__toggle-btn--active');
      selectedHorario = btn.dataset.value; // "la mañana" o "la tarde"
      updateSubmitState();
    });
  });

  // Si cambia el tipo de limpieza después de ya haber elegido día y
  // horario, el mensaje se actualiza solo (sin esto, quedaría desactualizado).
  tipoSelect.addEventListener('change', updateSubmitState);

  // Revisa si ya hay día + horario elegidos. Si sí, arma el mensaje y
  // "enciende" los dos botones de envío. Si no, los deja apagados con
  // una pista de qué falta.
  function updateSubmitState() {
    const listo = selectedDate && selectedHorario;

    if (listo) {
      const fecha = dateFormatter.format(selectedDate);
      // tipo ya viene armado como frase completa desde el value del
      // <select> (ej: "una limpieza Residencial" o "un servicio de
      // organización de hogar"), así el mensaje queda natural sin
      // importar qué servicio se elija.
      const tipo = tipoSelect.value;
      const mensaje = `Hola! Quiero contratar ${tipo} para el ${fecha} en ${selectedHorario}. ¿Me pasas el estimado, por favor?`;

      // encodeURIComponent convierte espacios, signos de pregunta y
      // acentos al formato que necesita una URL para no romperse.
      const mensajeCodificado = encodeURIComponent(mensaje);

      quoteSubmit.href = `https://wa.me/17864941378?text=${mensajeCodificado}`;
      quoteSubmit.classList.add('quote__submit--enabled');

      quoteSubmitSms.href = `sms:+17864941378${separadorSms}body=${mensajeCodificado}`;
      quoteSubmitSms.classList.add('quote__submit--enabled');

      quoteHint.textContent = 'Listo, toca un botón para enviar tu mensaje.';
      quoteHint.classList.add('quote__hint--ready');
    } else {
      quoteSubmit.classList.remove('quote__submit--enabled');
      quoteSubmitSms.classList.remove('quote__submit--enabled');
      quoteHint.textContent = 'Elige un día y un horario para continuar.';
      quoteHint.classList.remove('quote__hint--ready');
    }
  }

  renderCalendar(); // dibuja el calendario apenas carga la página
})();

// ============================================================
// MENÚ DE MENSAJE: "Enviar mensaje" -> WhatsApp / SMS
//
// En vez de asumir que todos prefieren WhatsApp, este botón abre
// un mini menú con las dos opciones. Como el mismo componente se
// repite en el hero Y en Contacto, lo armamos como una función
// reutilizable en vez de copiar y pegar el mismo código dos veces
// -- si mañana hay que cambiar cómo se comporta, se edita en un
// solo lugar y afecta a los dos botones por igual.
//
// Parámetros:
//   wrapperId  -- id del <div> que envuelve botón + menú
//   toggleId   -- id del botón "Enviar mensaje"
//   menuId     -- id del menú desplegable
//   smsLinkId  -- id del link "Mensaje de texto" adentro del menú
//   textoMensaje -- el texto que va a llevar el mensaje de SMS
// ============================================================
function iniciarMenuMensaje(wrapperId, toggleId, menuId, smsLinkId, textoMensaje) {
  const wrapper = document.getElementById(wrapperId);
  const toggle = document.getElementById(toggleId);
  const menu = document.getElementById(menuId);
  const smsLink = document.getElementById(smsLinkId);

  if (!wrapper) return; // si este botón no está en la página, no hace nada

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
    // Sin esto, el click también dispararía el listener de "cerrar si
    // tocás afuera" de más abajo, y el menú se abriría y cerraría en
    // el mismo instante.
    event.stopPropagation();
    const estaAbierto = menu.classList.contains('msg-menu__list--open');
    estaAbierto ? cerrarMenu() : abrirMenu();
  });

  // Si el clic fue afuera de todo el "wrapper" (botón + menú), se cierra.
  document.addEventListener('click', (event) => {
    if (!wrapper.contains(event.target)) cerrarMenu();
  });

  // Cerrar con la tecla Escape, por accesibilidad.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') cerrarMenu();
  });
}

// Un mensaje genérico, ya que acá (a diferencia de la cotización) no
// hay día/tipo/horario elegidos todavía.
const MENSAJE_GENERICO = 'Hola, quiero cotizar un servicio de limpieza';

iniciarMenuMensaje('heroMessage', 'heroMsgToggle', 'heroMsgMenu', 'heroSmsLink', MENSAJE_GENERICO);
iniciarMenuMensaje('contactoMessage', 'contactoMsgToggle', 'contactoMsgMenu', 'contactoSmsLink', MENSAJE_GENERICO);
