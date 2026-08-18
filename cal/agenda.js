// ==========================================================
// CONFIGURACAO
// ==========================================================
// Cole aqui a URL /exec gerada pelo seu Google Apps Script (proxy do iCal).
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyA1WRqg2FFlSSDaFgVVp5zJPlbojTj8E0Hra8PAnZWAYMZEjCHcn_-FARTXqLvYk21/exec";

const WEEKDAY_LABELS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
const MONTH_LABELS = [
  "janeiro", "fevereiro", "marco", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

const statusEl = document.getElementById("status");
const containerEl = document.getElementById("calendars-container");
const modalEl = document.getElementById("event-modal");
const modalTitleEl = document.getElementById("modal-title");
const modalDateEl = document.getElementById("modal-date");
const modalLocationEl = document.getElementById("modal-location");
const modalDescriptionEl = document.getElementById("modal-description");
const modalCloseBtn = document.getElementById("modal-close");

document.addEventListener("DOMContentLoaded", init);
modalCloseBtn.addEventListener("click", closeModal);
modalEl.addEventListener("click", (e) => {
  if (e.target === modalEl) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

async function init() {
  try {
    const icsText = await fetchIcal();
    const events = parseIcalEvents(icsText);
    renderCalendars(events);
    statusEl.textContent = `${events.length} evento(s) carregado(s).`;
    statusEl.classList.remove("error");
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Erro ao carregar a agenda: " + err.message;
    statusEl.classList.add("error");
  }
}

// ==========================================================
// 1. BUSCA O ARQUIVO .ICS VIA O PROXY DO APPS SCRIPT
// ==========================================================
async function fetchIcal() {
  const response = await fetch(APPS_SCRIPT_URL);
  if (!response.ok) {
    throw new Error(`Falha na requisicao (status ${response.status})`);
  }
  return await response.text();
}

// ==========================================================
// 2. PARSING DO ICAL, EXPANDINDO EVENTOS RECORRENTES (RRULE)
//    dentro da janela do mes atual + mes seguinte
// ==========================================================
function parseIcalEvents(icsText) {
  const jcalData = ICAL.parse(icsText);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents("vevent");

  const { rangeStart, rangeEnd } = getVisibleRange();
  const rangeStartICAL = ICAL.Time.fromJSDate(rangeStart, false);
  const rangeEndICAL = ICAL.Time.fromJSDate(rangeEnd, false);

  const events = [];

  vevents.forEach((veventComp) => {
    const event = new ICAL.Event(veventComp);

    if (event.isRecurring()) {
      const duration = event.duration;
      const expand = new ICAL.RecurExpansion({
        component: veventComp,
        dtstart: veventComp.getFirstPropertyValue("dtstart")
      });

      let next;
      let safetyCounter = 0;
      // limite de seguranca para nao criar loop infinito com regras sem UNTIL/COUNT
      while ((next = expand.next()) && safetyCounter < 2000) {
        safetyCounter++;
        if (next.compare(rangeEndICAL) > 0) break;
        if (next.compare(rangeStartICAL) < 0) continue;

        const occStart = next.clone();
        const occEnd = occStart.clone();
        occEnd.addDuration(duration);

        events.push(buildEventObject(event, occStart, occEnd));
      }
    } else {
      const start = event.startDate;
      const end = event.endDate;
      if (start.compare(rangeEndICAL) <= 0 && end.compare(rangeStartICAL) >= 0) {
        events.push(buildEventObject(event, start, end));
      }
    }
  });

  events.sort((a, b) => a.start - b.start);
  return events;
}

function buildEventObject(event, startICAL, endICAL) {
  return {
    uid: event.uid,
    summary: event.summary || "(Sem titulo)",
    description: event.description || "",
    location: event.location || "",
    isAllDay: startICAL.isDate,
    start: startICAL.toJSDate(),
    end: endICAL.toJSDate()
  };
}

function getVisibleRange() {
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
  return { rangeStart, rangeEnd };
}

// ==========================================================
// 3. RENDERIZACAO DO CALENDARIO (mes atual + mes seguinte)
// ==========================================================
function renderCalendars(events) {
  containerEl.innerHTML = "";
  const now = new Date();

  const monthsToShow = [
    { year: now.getFullYear(), month: now.getMonth() },
    { year: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(), month: (now.getMonth() + 1) % 12 }
  ];

  monthsToShow.forEach(({ year, month }) => {
    const monthBlock = renderMonth(year, month, events, now);
    containerEl.appendChild(monthBlock);
  });
}

function renderMonth(year, month, events, today) {
  const monthBlock = document.createElement("section");
  monthBlock.className = "month-block";

  const title = document.createElement("h2");
  title.className = "month-title";
  title.textContent = `${MONTH_LABELS[month]} de ${year}`;
  monthBlock.appendChild(title);

  const weekdaysRow = document.createElement("div");
  weekdaysRow.className = "weekdays";
  WEEKDAY_LABELS.forEach((label) => {
    const span = document.createElement("span");
    span.textContent = label;
    weekdaysRow.appendChild(span);
  });
  monthBlock.appendChild(weekdaysRow);

  const daysGrid = document.createElement("div");
  daysGrid.className = "days-grid";

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDayOfMonth.getDay();

  for (let i = 0; i < startWeekday; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "day-cell empty";
    daysGrid.appendChild(emptyCell);
  }

  const eventsByDay = groupEventsByDay(events, year, month);

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.className = "day-cell";

    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;
    if (isToday) cell.classList.add("today");

    const dayNumber = document.createElement("div");
    dayNumber.className = "day-number";
    dayNumber.textContent = day;
    cell.appendChild(dayNumber);

    const dayEvents = eventsByDay[day] || [];
    const maxVisible = 3;
    dayEvents.slice(0, maxVisible).forEach((ev) => {
      cell.appendChild(buildEventPill(ev));
    });

    if (dayEvents.length > maxVisible) {
      const moreBtn = document.createElement("button");
      moreBtn.className = "more-events";
      moreBtn.textContent = `+${dayEvents.length - maxVisible} mais`;
      moreBtn.addEventListener("click", () => openModal(dayEvents[maxVisible]));
      cell.appendChild(moreBtn);
    }

    daysGrid.appendChild(cell);
  }

  monthBlock.appendChild(daysGrid);
  return monthBlock;
}

function groupEventsByDay(events, year, month) {
  const map = {};
  events.forEach((ev) => {
    if (ev.start.getFullYear() === year && ev.start.getMonth() === month) {
      const day = ev.start.getDate();
      if (!map[day]) map[day] = [];
      map[day].push(ev);
    }
  });
  return map;
}

function buildEventPill(ev) {
  const btn = document.createElement("button");
  btn.className = "event-pill" + (ev.isAllDay ? " all-day" : "");
  btn.textContent = ev.isAllDay
    ? ev.summary
    : `${formatTime(ev.start)} ${ev.summary}`;
  btn.addEventListener("click", () => openModal(ev));
  return btn;
}

// ==========================================================
// 4. MODAL DE DETALHES DO EVENTO
// ==========================================================
function openModal(ev) {
  modalTitleEl.textContent = ev.summary;
  modalDateEl.textContent = formatEventDateRange(ev);
  modalLocationEl.textContent = ev.location ? `Local: ${ev.location}` : "";
  modalDescriptionEl.textContent = ev.description || "";
  modalEl.classList.remove("hidden");
}

function closeModal() {
  modalEl.classList.add("hidden");
}

// ==========================================================
// UTILITARIOS DE FORMATACAO
// ==========================================================
function formatTime(date) {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatEventDateRange(ev) {
  const dateOptions = { day: "2-digit", month: "long", year: "numeric" };
  const startDateStr = ev.start.toLocaleDateString("pt-BR", dateOptions);

  if (ev.isAllDay) {
    return `${startDateStr} (dia inteiro)`;
  }

  const endDateStr = ev.end.toLocaleDateString("pt-BR", dateOptions);
  const startTimeStr = formatTime(ev.start);
  const endTimeStr = formatTime(ev.end);

  if (startDateStr === endDateStr) {
    return `${startDateStr}, ${startTimeStr} - ${endTimeStr}`;
  }
  return `${startDateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}`;
}
