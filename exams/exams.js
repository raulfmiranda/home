const STICKERS = {
  verde: "Adesivo verde",
  bebeBranco: "Adesivo bebê branco",
  bebeVerde: "Adesivo bebê verde",
  vermelho: "Adesivo vermelho"
};
const TIMES = { final: "Final do dia", qualquer: "Qualquer hora do dia" };

const label = (v) => (v ? "Verdadeiro" : "Falso");
const letter = (i) => String.fromCharCode(65 + i);

const c = (fertile, sticker, yes, time = null, alt = []) => ({ fertile, sticker, yes, time, alt });

const TF_QUESTIONS = [
  { text: "A melhor maneira de observar o muco é de trás para frente, porque é mais natural.", answer: false },
  { text: "Exames internos só são necessários no final do dia se não tiver sido observado muco durante esse dia.", answer: false },
  {
    text: "Os \"Três Passos\" para observar o muco são:",
    steps: [
      "Passo 1: Limpar da uretra sobre o corpo perineal, prestando atenção à sensação que isso produz.",
      "Passo 2: Observar o papel para determinar a presença ou ausência de muco.",
      "Passo 3: Se houver muco no papel, examiná-lo segurando entre os dedos indicador e polegar."
    ],
    answer: true
  },
  { text: "A lubrificação pode ser vista como uma área brilhante no papel e não é necessário tocá-la para examinar com os dedos.", answer: false },
  { text: "É possível observar a umidade com ou sem lubrificação.", answer: true },
  { text: "Só é necessário fazer força no final do dia se a mulher não tiver tido uma evacuação durante esse dia.", answer: false },
  { text: "Quando se utiliza o Sistema FertilityCare™ do Modelo Creighton para alcançar a gravidez, não é necessário realizar 100% das observações, como quando se está utilizando para evitar a gravidez.", answer: false },
  { text: "Se uma mulher perde uma das observações antes de urinar, pode assumir que ela é igual ao que observa depois de urinar.", answer: false },
  { text: "Para que o casal conheça completamente sua fertilidade, é necessário que a mulher observe 100% das vezes.", answer: true },
  { text: "Se ocorrer um fluxo no dia seguinte a uma relação íntima genital, ele deve ser registrado no gráfico de acordo com suas características.", answer: true }
];

// c(fértil?, adesivo, sim?, quando, [adesivos alternativos aceitos])
const REGULAR_ITEMS = [
  c(false, "verde", true, "final"),      // A
  c(true, "bebeVerde", false),           // B
  c(true, "vermelho", false),            // C
  c(true, "bebeVerde", false),           // D
  c(false, "verde", true, "final"),      // E
  c(true, "bebeVerde", false),           // F
  c(false, "verde", true, "final"),      // G
  c(true, "bebeVerde", false),           // H
  c(true, "bebeVerde", false),           // I
  c(true, "bebeVerde", false),           // J
  c(false, "verde", true, "qualquer"),   // K
  c(true, "bebeBranco", false)           // L
];

const INFERTILITY_ITEMS = [
  c(false, "verde", false),                       // A
  c(true, "bebeVerde", true),                     // B
  c(true, "bebeBranco", true),                    // C
  c(true, "bebeVerde", true),                     // D
  c(false, "verde", false),                       // E
  c(true, "vermelho", true),                      // F
  c(false, "verde", false),                       // G
  c(true, "bebeVerde", true),                     // H
  c(true, "bebeVerde", true),                     // I
  c(true, "bebeBranco", true, null, ["vermelho"]),// J (bebê branco ou vermelho)
  c(true, "bebeBranco", true),                    // K
  c(true, "bebeBranco", true)                     // L
];

const EXAMS = [
  {
    id: "vf",
    menu: "Revisão V/F",
    title: "Revisão das Observações",
    subtitle: "Verdadeiro ou Falso",
    type: "tf",
    items: TF_QUESTIONS
  },
  {
    id: "ciclos",
    menu: "Ciclos regulares",
    title: "Ciclos regulares",
    subtitle: "Para cada letra, escolha as respostas observando o gráfico.",
    type: "chart",
    hasTime: true,
    image: "cicloregular.jpg",
    imageAlt: "Gráfico de ciclos regulares com os itens A a L",
    answersImage: "respostascicloregular.jpg",
    answersAlt: "Respostas do exame de ciclos regulares",
    items: REGULAR_ITEMS
  },
  {
    id: "infertilidade",
    menu: "Infertilidade",
    title: "Infertilidade",
    subtitle: "Para cada letra, escolha as respostas observando o gráfico.",
    type: "chart",
    hasTime: false,
    image: "infertilidade.jpg",
    imageAlt: "Gráfico de infertilidade com os itens A a L",
    answersImage: "respostasinfertilidade.jpeg",
    answersAlt: "Respostas do exame de infertilidade",
    items: INFERTILITY_ITEMS
  }
];

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function value(root, name) {
  const checked = root.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : null;
}

function radioGroup(name, title, options, field) {
  const fs = el("fieldset", "sub-question");
  fs.dataset.field = field;
  fs.appendChild(el("legend", null, title));
  const wrap = el("div", "answer-options");
  options.forEach(([val, text]) => {
    const lbl = el("label", "answer-option");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.value = String(val);
    lbl.append(input, document.createTextNode(text));
    wrap.appendChild(lbl);
  });
  fs.appendChild(wrap);
  return fs;
}

function describe(exam, item) {
  const stickers = [item.sticker, ...item.alt].map((s) => STICKERS[s]).join(" ou ");
  const parts = [item.fertile ? "Fértil" : "Infértil", stickers, item.yes ? "Sim" : "Não"];
  if (exam.hasTime && item.yes) parts.push(TIMES[item.time]);
  return parts.join(" · ");
}

function answerRef(exam, item, i) {
  const d = el("details", "answer-ref");
  d.appendChild(el("summary", null, "Ver resposta"));
  d.appendChild(el("p", "answer-text", `${letter(i)}: ${describe(exam, item)}`));
  const img = el("img");
  img.src = exam.answersImage;
  img.alt = exam.answersAlt;
  img.loading = "lazy";
  d.appendChild(img);
  return d;
}

function tfItem(exam, q, i) {
  const fieldset = el("fieldset", "question");
  fieldset.appendChild(el("legend", null, `${i + 1}. ${q.text}`));

  if (q.steps) {
    const ul = el("ul", "question-steps");
    q.steps.forEach((s) => ul.appendChild(el("li", null, s)));
    fieldset.appendChild(ul);
  }

  const options = el("div", "answer-options");
  [true, false].forEach((v) => {
    const lbl = el("label", "answer-option");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = `${exam.id}-q${i}`;
    input.value = String(v);
    lbl.append(input, document.createTextNode(label(v)));
    options.appendChild(lbl);
  });
  fieldset.appendChild(options);
  return fieldset;
}

function chartItem(exam, item, i) {
  const p = `${exam.id}-q${i}`;
  const fieldset = el("fieldset", "question");
  fieldset.appendChild(el("legend", null, `Item ${letter(i)}`));

  fieldset.append(
    radioGroup(`${p}-fert`, "1) Fértil ou infértil", [[true, "Fértil"], [false, "Infértil"]], "fert"),
    radioGroup(`${p}-sticker`, "2) Adesivo", Object.entries(STICKERS), "sticker"),
    radioGroup(`${p}-yes`, "3) Sim ou não", [[true, "Sim"], [false, "Não"]], "yes")
  );

  if (exam.hasTime) {
    const when = radioGroup(`${p}-time`, "4) Quando?", Object.entries(TIMES), "time");
    when.hidden = true;
    fieldset.appendChild(when);
    fieldset.addEventListener("change", () => {
      when.hidden = value(fieldset, `${p}-yes`) !== "true";
    });
  }

  fieldset.appendChild(answerRef(exam, item, i));
  return fieldset;
}

function readGiven(exam, i, node) {
  const p = `${exam.id}-q${i}`;
  if (exam.type === "tf") {
    const ans = value(node, p);
    return ans === null ? null : { ans: ans === "true" };
  }
  const fert = value(node, `${p}-fert`);
  const sticker = value(node, `${p}-sticker`);
  const yes = value(node, `${p}-yes`);
  const time = exam.hasTime && yes === "true" ? value(node, `${p}-time`) : null;
  const needsTime = exam.hasTime && yes === "true";
  if (fert === null || sticker === null || yes === null || (needsTime && time === null)) return null;
  return { fert: fert === "true", sticker, yes: yes === "true", time };
}

function checkChart(exam, item, given) {
  const wrong = [];
  if (given.fert !== item.fertile) wrong.push("fert");
  if (given.sticker !== item.sticker && !item.alt.includes(given.sticker)) wrong.push("sticker");
  if (given.yes !== item.yes) wrong.push("yes");
  else if (exam.hasTime && item.yes && given.time !== item.time) wrong.push("time");
  return wrong;
}

function buildExam(exam) {
  const panel = el("section", "exam-panel");
  panel.id = `panel-${exam.id}`;
  panel.setAttribute("role", "tabpanel");
  panel.hidden = true;

  panel.append(el("h3", "exam-title", exam.title), el("p", "exam-subtitle", exam.subtitle));

  if (exam.image) {
    const a = el("a", "exam-figure");
    a.href = exam.image;
    a.target = "_blank";
    a.rel = "noopener";
    const img = el("img");
    img.src = exam.image;
    img.alt = exam.imageAlt;
    a.appendChild(img);
    panel.appendChild(a);
  }

  const form = el("form");
  form.noValidate = true;
  const list = el("div");
  const warning = el("p", "exam-warning hidden");
  warning.setAttribute("role", "alert");
  const actions = el("div", "exam-actions");
  const submit = el("button", "copy-btn", "Corrigir prova");
  submit.type = "submit";
  const reset = el("button", "exam-reset hidden", "Refazer");
  reset.type = "button";
  actions.append(submit, reset);
  const result = el("div", "exam-result hidden");
  result.setAttribute("role", "status");
  result.setAttribute("aria-live", "polite");

  form.append(list, warning, actions);
  panel.append(form, result);

  const name = (i) => (exam.type === "tf" ? String(i + 1) : letter(i));

  function render() {
    list.innerHTML = "";
    exam.items.forEach((item, i) => {
      list.appendChild(exam.type === "tf" ? tfItem(exam, item, i) : chartItem(exam, item, i));
    });
  }

  function grade(e) {
    e.preventDefault();

    const givens = exam.items.map((_, i) => readGiven(exam, i, list.children[i]));
    const missing = givens.map((g, i) => (g === null ? i : -1)).filter((i) => i >= 0);
    if (missing.length > 0) {
      warning.textContent = `Responda todas as questões antes de corrigir. Faltam: ${missing.map(name).join(", ")}.`;
      warning.classList.remove("hidden");
      list.children[missing[0]].scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    warning.classList.add("hidden");

    let score = 0;
    exam.items.forEach((item, i) => {
      const node = list.children[i];
      const given = givens[i];
      let wrong = [];
      let ok;

      if (exam.type === "tf") {
        ok = given.ans === item.answer;
      } else {
        wrong = checkChart(exam, item, given);
        ok = wrong.length === 0;
      }

      if (ok) score++;
      node.classList.add(ok ? "correct" : "incorrect");
      wrong.forEach((f) => node.querySelector(`[data-field="${f}"]`).classList.add("wrong"));

      const expected = exam.type === "tf" ? label(item.answer) : describe(exam, item);
      const fb = el("p", "question-feedback", ok ? `✅ Correto: ${expected}.` : `❌ Incorreto. Resposta certa: ${expected}.`);
      node.insertBefore(fb, node.querySelector(".answer-ref"));
      node.querySelectorAll("input").forEach((inp) => (inp.disabled = true));
    });

    const pct = Math.round((score / exam.items.length) * 100);
    result.textContent = `Você acertou ${score} de ${exam.items.length} (${pct}%).`;
    result.classList.remove("hidden");
    submit.disabled = true;
    reset.classList.remove("hidden");
    result.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function resetExam() {
    render();
    result.classList.add("hidden");
    warning.classList.add("hidden");
    reset.classList.add("hidden");
    submit.disabled = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  form.addEventListener("submit", grade);
  reset.addEventListener("click", resetExam);
  render();
  return panel;
}

const menuEl = document.getElementById("exam-menu");
const panelsEl = document.getElementById("exam-panels");
const tabs = {};
const panels = {};

function showExam(id) {
  EXAMS.forEach((exam) => {
    const active = exam.id === id;
    panels[exam.id].hidden = !active;
    tabs[exam.id].setAttribute("aria-selected", String(active));
  });
}

EXAMS.forEach((exam) => {
  const tab = el("button", "exam-tab", exam.menu);
  tab.type = "button";
  tab.setAttribute("role", "tab");
  tab.setAttribute("aria-controls", `panel-${exam.id}`);
  tab.addEventListener("click", () => showExam(exam.id));
  menuEl.appendChild(tab);
  tabs[exam.id] = tab;

  panels[exam.id] = buildExam(exam);
  panelsEl.appendChild(panels[exam.id]);
});

showExam(EXAMS[0].id);