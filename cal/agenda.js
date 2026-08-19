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

// Nomes dos meses usados na formatacao de texto do lembrete (com acentuacao,
// igual ao Code.gs original) - mantidos separados dos rotulos do calendario.
const MONTHS_FULL = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];
const WEEKDAYS_FULL = [
  "domingo", "segunda-feira", "terça-feira", "quarta-feira",
  "quinta-feira", "sexta-feira", "sábado"
];

// Link do formulario de inscricao citado na instrucao da sessao SS1.
const SUBSCRIBE_FORM_LINK = "https://docs.google.com/forms/d/e/1FAIpQLScCJZckTJpowlCPlCNT74XNwXRSbGeNgZBiES9xEO0RvrItJg/viewform?usp=sharing&ouid=103560756861124673676";

// Regex para identificar eventos de sessao de acompanhamento (SS1..SS9) no titulo.
const SESSION_PATTERN = /SS[1-9]/i;

// ==========================================================
// FUNCIONALIDADE 3: parametros de sugestao de horarios vazios
// ==========================================================
// Dias da semana permitidos para sugestao: 1 = segunda, 3 = quarta, 5 = sexta
// (Date.getDay(): 0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sab)
const SUGGEST_ALLOWED_WEEKDAYS = [1, 3, 5];
// Horarios de inicio permitidos para a sugestao (hora cheia, 24h)
const SUGGEST_ALLOWED_START_HOURS = [10, 14, 16];
// Duracao minima exigida do slot livre, em horas
const SUGGEST_SLOT_DURATION_HOURS = 2;
// Quantidade de sugestoes a incluir no texto
const SUGGEST_COUNT = 3;
// Quantos dias para o futuro serao varridos em busca de slots livres
const SUGGEST_SEARCH_WINDOW_DAYS = 60;

const statusEl = document.getElementById("status");
const containerEl = document.getElementById("calendars-container");
const modalEl = document.getElementById("event-modal");
const modalTitleEl = document.getElementById("modal-title");
const modalDateEl = document.getElementById("modal-date");
const modalLocationEl = document.getElementById("modal-location");
const modalDescriptionEl = document.getElementById("modal-description");
const modalCloseBtn = document.getElementById("modal-close");

const welcomeWhatsappBtn = document.getElementById("welcome-whatsapp-btn");
const modalReminderSection = document.getElementById("modal-reminder-section");
const modalIsNewClientCheckbox = document.getElementById("modal-is-new-client");
const modalCopyReminderBtn = document.getElementById("modal-copy-reminder-btn");
const modalCopyFeedback = document.getElementById("modal-copy-feedback");

// Funcionalidade 3: botao de sugestao de horarios (topo da pagina)
const suggestSlotsBtn = document.getElementById("suggest-slots-btn");

let currentModalEvent = null;

// Guarda a ultima lista de eventos carregada, para ser usada pelo calculo
// de horarios livres (Funcionalidade 3) sem precisar refazer o fetch/parse.
let allLoadedEvents = [];

document.addEventListener("DOMContentLoaded", init);
modalCloseBtn.addEventListener("click", closeModal);
modalEl.addEventListener("click", (e) => {
  if (e.target === modalEl) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

welcomeWhatsappBtn.addEventListener("click", handleCopyWelcomeText);
modalCopyReminderBtn.addEventListener("click", handleCopyReminderText);
suggestSlotsBtn.addEventListener("click", handleCopySuggestedSlotsText);

async function init() {
  try {
    const icsText = await fetchIcal();
    const { events, skippedCount } = parseIcalEvents(icsText);
    allLoadedEvents = events;
    renderCalendars(events);
    statusEl.textContent = skippedCount > 0
      ? `${events.length} evento(s) carregado(s). ${skippedCount} evento(s) ignorado(s) por erro de formatação.`
      : `${events.length} evento(s) carregado(s).`;
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
// dentro da janela do mes atual + mes seguinte
//
// NOTA DE ROBUSTEZ: alguns eventos gerados pelo Google Calendar (em geral
// convites com DESCRIPTION/LOCATION contendo caracteres especiais, aspas ou
// ";"/"=" dentro do valor) expõem bugs de parsing de parametros na lib
// ical.js (ver kewisch/ical.js#612 e #702). Para evitar que um unico evento
// malformado quebre o carregamento de toda a agenda, cada VEVENT e processado
// dentro de um try/catch individual: se falhar, o evento e apenas ignorado
// (e reportado no console), e o restante continua sendo exibido normalmente.
//
// IMPORTANTE: esta funcao retorna SEMPRE um objeto { events, skippedCount }.
// Todo codigo que a chama deve desestruturar o retorno (nao usar mais
// "const events = parseIcalEvents(...)" diretamente).
// ==========================================================
function parseIcalEvents(icsText) {
  const jcalData = ICAL.parse(icsText);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents("vevent");

  const { rangeStart, rangeEnd } = getVisibleRange();
  const rangeStartICAL = ICAL.Time.fromJSDate(rangeStart, false);
  const rangeEndICAL = ICAL.Time.fromJSDate(rangeEnd, false);

  const events = [];
  let skippedCount = 0;

  vevents.forEach((veventComp) => {
    try {
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
    } catch (err) {
      skippedCount++;
      console.warn("Evento ignorado por erro de parsing (formatação inválida no iCal):", err, veventComp);
    }
  });

  events.sort((a, b) => a.start - b.start);
  return { events, skippedCount };

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
}

// ==========================================================
// 3. RENDERIZACAO DO CALENDARIO (mes atual + mes seguinte)
// Recebe SEMPRE o array de eventos ja resolvido (nunca o objeto
// { events, skippedCount } retornado por parseIcalEvents).
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
}

// ==========================================================
// 4. MODAL DE DETALHES DO EVENTO
// ==========================================================
function openModal(ev) {
  currentModalEvent = ev;

  modalTitleEl.textContent = ev.summary;
  modalDateEl.textContent = formatEventDateRange(ev);
  modalLocationEl.textContent = ev.location ? `Local: ${ev.location}` : "";
  modalDescriptionEl.textContent = ev.description || "";

  // Funcionalidade 2: só mostra a secao de lembrete se o titulo contiver SS1..SS9
  const isSessionEvent = SESSION_PATTERN.test(ev.summary || "");
  if (isSessionEvent) {
    modalIsNewClientCheckbox.checked = true;
    modalReminderSection.classList.remove("hidden");
  } else {
    modalReminderSection.classList.add("hidden");
  }

  hideCopyFeedback();
  modalEl.classList.remove("hidden");
}

function closeModal() {
  modalEl.classList.add("hidden");
  currentModalEvent = null;
}

// ==========================================================
// UTILITARIOS DE FORMATACAO (calendario)
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

// ==========================================================
// FUNCIONALIDADE 1: TEXTO DE BOAS-VINDAS PARA WHATSAPP
// (equivalente a sendWelcomeEmail / getWelcomeEmailAsText do Code.gs,
// porem sem enviar e-mail: apenas copia o texto para a area de transferencia)
// ==========================================================
function buildWelcomeWhatsappText() {
  return (
    "Olá! Agradeço pelo seu contato e pelo interesse em conhecer o *Creighton Model System (CrMS)*.\n\n" +
    "A seguir, envio as informações sobre como iniciar o aprendizado do método:\n\n" +
    "O *Creighton Model System (CrMS)* é um método de planejamento familiar natural baseado no autoconhecimento do corpo feminino, por meio da observação das secreções vaginais. Com ele, o casal pode identificar os dias férteis e inférteis, permitindo tanto o planejamento para alcançar quanto para adiar uma gravidez. Além disso, o método possibilita o acompanhamento da saúde procriativa da mulher e auxilia o médico especializado em *Naprotechnology* a indicar tratamentos adequados para a fertilidade.\n\n" +
    "O primeiro passo para aprender o CrMS é participar de um *Encontro Introdutório*, cujo valor é de *R$ 340,00*, em que explico detalhadamente o funcionamento do método e ensino as instruções básicas para começar. Após esse encontro, você poderá decidir se deseja seguir com o acompanhamento.\n\n" +
    "O material do CrMS *não é autoinstrucional* e não deve ser utilizado sem o acompanhamento de um instrutor credenciado. Por isso, o material somente é recebido após o *Encontro Introdutório* quando houver a decisão firme de realizar, no mínimo, os *5 primeiros Encontros de Acompanhamento*.\n\n" +
    "Caso ainda não esteja plenamente decidida, poderá aguardar até *3 meses* para iniciar os acompanhamentos. Se eles não forem iniciados dentro desse prazo e você desejar começar posteriormente, será necessário participar novamente do *Encontro Introdutório*.\n\n" +
    "Também é importante saber que a participante só é reconhecida formalmente como usuária do método quando inicia os *Encontros de Acompanhamento*. Se o material for recebido e houver desistência antes da realização dos 5 primeiros encontros, ele deverá ser devolvido integralmente.\n\n" +
    "O processo de aprendizado completo é individualizado e inclui pelo menos *8 Encontros de Acompanhamento ao longo de 12 meses*, com o valor de *R$ 230,00* por sessão.\n\n" +
    "A duração do *Encontro Introdutório* é de aproximadamente 1h40, e os *Encontros de Acompanhamento* duram, no mínimo, 1h. A participação do marido ou do noivo é altamente recomendada, especialmente no primeiro encontro.\n\n" +
    "Os pagamentos podem ser feitos por *PIX ou em dinheiro*, antes de cada encontro, para garantir a inscrição.\n\n" +
    "Os atendimentos são *virtuais (pelo Google Meet)*.\n\n" +
    "Fico à disposição para agendarmos o seu *Encontro Introdutório*!\n\n" +
    "Raul F. Miranda, FCPI"
  );
}

async function handleCopyWelcomeText() {
  const text = buildWelcomeWhatsappText();
  await copyTextToClipboard(text);
  flashButtonFeedback(welcomeWhatsappBtn, "✅ Copiado!");
}

// ==========================================================
// FUNCIONALIDADE 2: TEXTO DE LEMBRETE DE ENCONTRO PARA WHATSAPP
// (equivalente a sendReminderEmail / getReminderEmailAsText do Code.gs,
// porem sem enviar e-mail: apenas copia o texto para a area de transferencia)
// ==========================================================

// Extrai o codigo da sessao (SS1..SS9) a partir do titulo do evento.
function extractSessionCode(summary) {
  const match = (summary || "").match(SESSION_PATTERN);
  return match ? match[0].toUpperCase() : "";
}

// Reproduz a formatacao de data/hora em portugues usada no Code.gs original.
function formatDateTimePtBR(dateObj) {
  const day = dateObj.getDate();
  const month = MONTHS_FULL[dateObj.getMonth()];
  const weekday = WEEKDAYS_FULL[dateObj.getDay()];
  const formattedDate = `${day} de ${month} (${weekday})`;

  const hour = dateObj.getHours();
  const minute = dateObj.getMinutes();
  const formattedTime = `${hour}h${minute < 10 ? "0" : ""}${minute}`;

  let period = "";
  if (hour >= 5 && hour < 12) {
    period = " da manhã";
  } else if (hour >= 12 && hour < 18) {
    period = " da tarde";
  } else {
    period = " da noite";
  }

  return { formattedDate, finalFormattedTime: formattedTime + period };
}

// Instrucoes especificas por sessao, identicas as do Code.gs (apenas SS1 e SS2 tem texto extra).
function getSessionInstructionText(session) {
  if (session === "SS1") {
    return "- *Preencher o formulário antes do encontro*:\n " + SUBSCRIBE_FORM_LINK + "\n" +
      "- Preencher o *FORMULÁRIO DE INSCRIÇÃO* entregue no encontro anterior e levá-lo junto com o Gráfico e Adesivos.\n";
  }
  if (session === "SS2") {
    return "- Preencher o *formulário SPICE INDEX* que foi entregue junto com o restante do material no Encontro Introdutório e levar esse formulário preenchido no próximo encontro.\n";
  }
  return "";
}

function buildReminderWhatsappText(ev, isNewClient) {
  const session = extractSessionCode(ev.summary);
  const { formattedDate, finalFormattedTime } = formatDateTimePtBR(ev.start);
  const price = isNewClient ? "230,00" : "220,00";
  const instructionText = getSessionInstructionText(session);

  let text = `Olá *${extractRecipientName(ev)}*, tudo bem?\n\n`;
  text += "Gostaria de lembrar que o seu próximo encontro de acompanhamento do Método Creighton será:\n\n";
  text += `📅 Data: *${formattedDate}*\n`;
  text += `⏰ Horário: *${finalFormattedTime}*\n`;
  text += "📍 Local: Google Meet\n\n";
  text += "Para que o nosso encontro seja ainda mais proveitoso, peço a sua colaboração no(s) ponto(s) a seguir:\n\n";
  if (instructionText) {
    text += instructionText + "\n";
  }
  text += `- *Realizar o pagamento de R$ ${price} antes do encontro via PIX*\n`;
  text += " 🔑 Chave PIX: *crmsraul@gmail.com*\n\n";
  text += "Agradeço desde já a sua atenção e empenho no acompanhamento.\nSerá um prazer encontrá-la em breve!\n\n";
  text += "Atenciosamente,\nRaul F. Miranda, FCPI";

  return text;
}

// O iCal nao traz o nome do paciente separadamente; tenta extrair do titulo
// removendo o codigo da sessao (mesmo quando entre parenteses/colchetes/chaves),
// e mantem apenas os DOIS PRIMEIROS nomes do que restar.
// Ex.: "(SS3) Maria Patrícia dos Santos Pires de Oliveira" -> "Maria Patrícia"
function extractRecipientName(ev) {
  const withoutSession = (ev.summary || "")
    .replace(/[\(\[\{]\s*SS[1-9]\s*[\)\]\}]/gi, " ")
    .replace(SESSION_PATTERN, " ")
    .replace(/[-–—:()\[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!withoutSession) return "[NOME]";

  return withoutSession.split(" ").slice(0, 2).join(" ");
}

async function handleCopyReminderText() {
  if (!currentModalEvent) return;
  const isNewClient = modalIsNewClientCheckbox.checked;
  const text = buildReminderWhatsappText(currentModalEvent, isNewClient);
  await copyTextToClipboard(text);
  flashButtonFeedback(modalCopyReminderBtn, "✅ Copiado!");
  showCopyFeedback();
}

// ==========================================================
// FUNCIONALIDADE 3: SUGESTAO DE HORARIOS VAZIOS PARA WHATSAPP
//
// Regras de negocio:
// - So considera dias de segunda (1), quarta (3) ou sexta-feira (5).
// - So considera horarios de INICIO possiveis: 10h, 14h ou 16h.
// - O slot verificado tem sempre 2 horas de duracao (inicio -> inicio+2h).
// - O slot [inicio, inicio+2h) precisa estar livre, ou seja, nao pode
//   sobrepor NENHUM evento existente na agenda.
// - So sugere datas a partir de AMANHA (nunca no dia atual).
// - Gera as 3 primeiras sugestoes encontradas, na ordem cronologica.
// ==========================================================

// Verifica se o intervalo [slotStart, slotEnd) tem alguma sobreposicao com
// algum evento existente. Eventos de dia inteiro (isAllDay) tambem bloqueiam
// o dia inteiro, para evitar sugerir horarios em dias com compromissos ja
// marcados como "dia todo".
function isSlotFree(slotStart, slotEnd, events) {
  return !events.some((ev) => {
    if (ev.isAllDay) {
      // Bloqueia o dia inteiro do evento all-day se a data coincidir com o slot.
      return (
        ev.start.getFullYear() === slotStart.getFullYear() &&
        ev.start.getMonth() === slotStart.getMonth() &&
        ev.start.getDate() === slotStart.getDate()
      );
    }
    // Sobreposicao classica de intervalos: [a, b) x [c, d)
    return slotStart < ev.end && slotEnd > ev.start;
  });
}

// Percorre os proximos N dias (a partir de amanha) e retorna os slots livres
// que respeitam todas as regras (dia da semana permitido, horario de inicio
// permitido, duracao de 2h totalmente livre).
function findAvailableSlots(events, maxResults) {
  const results = [];
  const now = new Date();

  // Comeca a busca a partir de amanha (dia atual nunca e sugerido).
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  cursor.setDate(cursor.getDate() + 1);

  for (let dayOffset = 0; dayOffset < SUGGEST_SEARCH_WINDOW_DAYS && results.length < maxResults; dayOffset++) {
    const day = new Date(cursor);
    day.setDate(cursor.getDate() + dayOffset);

    if (!SUGGEST_ALLOWED_WEEKDAYS.includes(day.getDay())) continue;

    for (const startHour of SUGGEST_ALLOWED_START_HOURS) {
      if (results.length >= maxResults) break;

      const slotStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), startHour, 0, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(slotEnd.getHours() + SUGGEST_SLOT_DURATION_HOURS);

      if (isSlotFree(slotStart, slotEnd, events)) {
        results.push({ start: slotStart, end: slotEnd });
      }
    }
  }

  return results;
}

// Formata uma sugestao de horario no padrao "segunda-feira, 24 de agosto, das 10h às 12h".
function formatSlotSuggestion(slot) {
  const weekday = WEEKDAYS_FULL[slot.start.getDay()];
  const day = slot.start.getDate();
  const month = MONTHS_FULL[slot.start.getMonth()];
  const startHour = slot.start.getHours();
  const endHour = slot.end.getHours();
  return `*${weekday}*, ${day} de ${month}, das *${startHour}h* às *${endHour}h*`;
}

function buildSuggestedSlotsWhatsappText(events) {
  const slots = findAvailableSlots(events, SUGGEST_COUNT);

  let text = "Olá! Para agendarmos o seu próximo encontro, você teria alguma preferência de horário (manhã ou tarde) e de dia da semana? 😊\n\n";

  if (slots.length === 0) {
    text += "No momento não encontrei horários vazios de 2h disponíveis nas segundas, quartas ou sextas (10h, 14h ou 16h) dentro dos próximos dias. Posso verificar outras datas, se preferir.";
    return text;
  }

  text += "Enquanto isso, seguem algumas opções de horários que já estão livres na minha agenda:\n\n";
  slots.forEach((slot, index) => {
    text += `${index + 1}️⃣ ${formatSlotSuggestion(slot)}\n`;
  });
  text += "\nFico no aguardo do seu retorno!";

  return text;
}

async function handleCopySuggestedSlotsText() {
  const text = buildSuggestedSlotsWhatsappText(allLoadedEvents);
  await copyTextToClipboard(text);
  flashButtonFeedback(suggestSlotsBtn, "✅ Copiado!");
}

// ==========================================================
// UTILITARIOS DE CLIPBOARD E FEEDBACK VISUAL
// ==========================================================
async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // Fallback para navegadores/contextos sem suporte a Clipboard API (ex.: http nao seguro)
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

function flashButtonFeedback(button, tempLabel) {
  const originalLabel = button.textContent;
  button.textContent = tempLabel;
  button.disabled = true;
  setTimeout(() => {
    button.textContent = originalLabel;
    button.disabled = false;
  }, 1600);
}

function showCopyFeedback() {
  modalCopyFeedback.classList.remove("hidden");
  setTimeout(hideCopyFeedback, 1600);
}

function hideCopyFeedback() {
  modalCopyFeedback.classList.add("hidden");
}
