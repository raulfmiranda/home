"use strict";

const STICKERS = {
  verde: "Adesivo verde",
  bebeBranco: "Adesivo bebê branco",
  bebeVerde: "Adesivo bebê verde",
  vermelho: "Adesivo vermelho"
};

const TIMES = {
  final: "Final do dia",
  qualquer: "Qualquer hora do dia",
  naoAplicavel: "Não se aplica"
};

const FIELD_LABELS = {
  ans: "Verdadeiro ou falso",
  fert: "Fértil ou infértil",
  sticker: "Adesivo",
  yes: "Sim ou não",
  time: "Horário"
};

const FIELD_ORDER = ["ans", "fert", "sticker", "yes", "time"];

const label = (value) => (value ? "Verdadeiro" : "Falso");
const letter = (index) => String.fromCharCode(65 + index);

const c = (
  fertile,
  sticker,
  yes,
  time = null,
  alt = []
) => ({
  fertile,
  sticker,
  yes,
  time,
  alt
});

const TF_QUESTIONS = [
  {
    text:
      "A melhor maneira de observar o muco é de trás para frente, porque é mais natural.",
    answer: false
  },
  {
    text:
      "Exames internos só são necessários no final do dia se não tiver sido observado muco durante esse dia.",
    answer: false
  },
  {
    text: 'Os "Três Passos" para observar o muco são:',
    steps: [
      "Passo 1: Limpar da uretra sobre o corpo perineal, prestando atenção à sensação que isso produz.",
      "Passo 2: Observar o papel para determinar a presença ou ausência de muco.",
      "Passo 3: Se houver muco no papel, examiná-lo segurando entre os dedos indicador e polegar."
    ],
    answer: true
  },
  {
    text:
      "A lubrificação pode ser vista como uma área brilhante no papel e não é necessário tocá-la para examinar com os dedos.",
    answer: false
  },
  {
    text:
      "É possível observar a umidade com ou sem lubrificação.",
    answer: true
  },
  {
    text:
      "Só é necessário fazer força no final do dia se a mulher não tiver tido uma evacuação durante esse dia.",
    answer: false
  },
  {
    text:
      "Quando se utiliza o Sistema FertilityCare™ do Modelo Creighton para alcançar a gravidez, não é necessário realizar 100% das observações, como quando se está utilizando para evitar a gravidez.",
    answer: false
  },
  {
    text:
      "Se uma mulher perde uma das observações antes de urinar, pode assumir que ela é igual ao que observa depois de urinar.",
    answer: false
  },
  {
    text:
      "Para que o casal conheça completamente sua fertilidade, é necessário que a mulher observe 100% das vezes.",
    answer: true
  },
  {
    text:
      "Se ocorrer um fluxo no dia seguinte a uma relação íntima genital, ele deve ser registrado no gráfico de acordo com suas características.",
    answer: true
  }
];

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
  c(false, "verde", false),                         // A
  c(true, "bebeVerde", true),                       // B
  c(true, "bebeBranco", true),                      // C
  c(true, "bebeVerde", true),                       // D
  c(false, "verde", false),                        // E
  c(true, "vermelho", true),                       // F
  c(false, "verde", false),                        // G
  c(true, "bebeVerde", true),                       // H
  c(true, "bebeVerde", true),                       // I
  c(true, "bebeBranco", true, null, ["vermelho"]),   // J
  c(true, "bebeBranco", true),                      // K
  c(true, "bebeBranco", true)                       // L
];

const EXAMS = [
  {
    id: "vf",
    code: "OR",
    menu: "Revisão das Observações — OR",
    title: "Revisão das Observações",
    subtitle: "Dez questões conceituais de verdadeiro ou falso.",
    type: "tf",
    hasTime: false,
    penalty: 10,
    minScore: 0,
    maxScore: 100,
    items: TF_QUESTIONS
  },
  {
    id: "ciclos",
    code: "CR",
    menu: "CR — Ciclos regulares",
    title: "Revisão de Ciclos — Ciclos regulares",
    subtitle:
      "Observe o gráfico e responda aos itens A a L. " +
      "O horário só pontua quando é aplicável no gabarito.",
    type: "chart",
    hasTime: true,
    penalty: 2,
    minScore: 0,
    maxScore: 100,
    image: "cicloregular.jpg",
    imageAlt: "Gráfico de ciclos regulares com os itens A a L",
    answersImage: "respostascicloregular.jpg",
    answersAlt: "Gabarito de ciclos regulares",
    items: REGULAR_ITEMS
  },
  {
    id: "infertilidade",
    code: "CR",
    menu: "CR — Infertilidade",
    title: "Revisão de Ciclos — Infertilidade",
    subtitle:
      "Observe o gráfico e responda aos itens A a L. " +
      "Este exame não avalia horários.",
    type: "chart",
    hasTime: false,
    penalty: 2.8,
    minScore: 0,
    maxScore: 100,
    image: "infertilidade.jpg",
    imageAlt: "Gráfico de infertilidade com os itens A a L",
    answersImage: "respostasinfertilidade.jpg",
    answersAlt: "Gabarito de infertilidade",
    items: INFERTILITY_ITEMS
  }
];

function el(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  return element;
}

function formatNumber(number, decimals = 2) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
}

function selectedValue(root, name) {
  const checked = root.querySelector(
    `input[name="${name}"]:checked`
  );

  return checked ? checked.value : null;
}

function itemName(exam, index) {
  return exam.type === "tf"
    ? `Questão ${index + 1}`
    : `Item ${letter(index)}`;
}

function radioGroup(name, title, options, field) {
  const fieldset = el("fieldset", "sub-question");
  fieldset.dataset.field = field;

  fieldset.appendChild(el("legend", null, title));

  const wrap = el("div", "answer-options");

  options.forEach(([value, text]) => {
    const option = el("label", "answer-option");
    const input = document.createElement("input");

    input.type = "radio";
    input.name = name;
    input.value = String(value);

    option.append(input, document.createTextNode(text));
    wrap.appendChild(option);
  });

  fieldset.appendChild(wrap);

  return fieldset;
}

function describe(exam, item) {
  const stickers = [item.sticker, ...item.alt]
    .map((key) => STICKERS[key])
    .join(" ou ");

  const parts = [
    item.fertile ? "Fértil" : "Infértil",
    stickers,
    item.yes ? "Sim" : "Não"
  ];

  if (exam.hasTime) {
    parts.push(item.time ? TIMES[item.time] : TIMES.naoAplicavel);
  }

  return parts.join(" · ");
}

function answerRef(exam, item, index) {
  const details = el("details", "answer-ref");

  details.appendChild(el("summary", null, "Ver resposta"));
  details.appendChild(
    el(
      "p",
      "answer-text",
      `${letter(index)}: ${describe(exam, item)}`
    )
  );

  const image = el("img");
  image.src = exam.answersImage;
  image.alt = exam.answersAlt;
  image.loading = "lazy";

  details.appendChild(image);

  return details;
}

function tfItem(exam, question, index) {
  const fieldset = el("fieldset", "question");

  fieldset.appendChild(
    el("legend", null, `${index + 1}. ${question.text}`)
  );

  if (question.steps) {
    const list = el("ul", "question-steps");

    question.steps.forEach((step) => {
      list.appendChild(el("li", null, step));
    });

    fieldset.appendChild(list);
  }

  fieldset.appendChild(
    radioGroup(
      `${exam.id}-q${index}`,
      "Sua resposta",
      [
        [true, "Verdadeiro"],
        [false, "Falso"]
      ],
      "ans"
    )
  );

  return fieldset;
}

function chartItem(exam, item, index) {
  const prefix = `${exam.id}-q${index}`;
  const fieldset = el("fieldset", "question");

  fieldset.appendChild(
    el("legend", null, `Item ${letter(index)}`)
  );

  fieldset.append(
    radioGroup(
      `${prefix}-fert`,
      "1) Fértil ou infértil",
      [
        [true, "Fértil"],
        [false, "Infértil"]
      ],
      "fert"
    ),
    radioGroup(
      `${prefix}-sticker`,
      "2) Adesivo",
      Object.entries(STICKERS),
      "sticker"
    ),
    radioGroup(
      `${prefix}-yes`,
      "3) Sim ou não",
      [
        [true, "Sim"],
        [false, "Não"]
      ],
      "yes"
    )
  );

  if (exam.hasTime) {
    fieldset.appendChild(
      radioGroup(
        `${prefix}-time`,
        "4) Quando?",
        Object.entries(TIMES),
        "time"
      )
    );
  }

  fieldset.appendChild(answerRef(exam, item, index));

  return fieldset;
}

function readGiven(exam, index, node) {
  const prefix = `${exam.id}-q${index}`;

  if (exam.type === "tf") {
    const answer = selectedValue(node, prefix);

    return answer === null
      ? null
      : { ans: answer === "true" };
  }

  const fertile = selectedValue(node, `${prefix}-fert`);
  const sticker = selectedValue(node, `${prefix}-sticker`);
  const yes = selectedValue(node, `${prefix}-yes`);
  const time = exam.hasTime
    ? selectedValue(node, `${prefix}-time`)
    : null;

  // Todos os grupos apresentados devem ser respondidos.
  if (
    fertile === null ||
    sticker === null ||
    yes === null ||
    (exam.hasTime && time === null)
  ) {
    return null;
  }

  return {
    fert: fertile === "true",
    sticker,
    yes: yes === "true",
    time
  };
}

function evaluateItem(exam, item, given, index) {
  const fields = [];

  function addField(key, actual, expected, correct) {
    fields.push({
      key,
      label: FIELD_LABELS[key],
      actual,
      expected,
      correct
    });
  }

  if (exam.type === "tf") {
    addField(
      "ans",
      label(given.ans),
      label(item.answer),
      given.ans === item.answer
    );
  } else {
    addField(
      "fert",
      given.fert ? "Fértil" : "Infértil",
      item.fertile ? "Fértil" : "Infértil",
      given.fert === item.fertile
    );

    const acceptedStickers = [item.sticker, ...item.alt];

    addField(
      "sticker",
      STICKERS[given.sticker],
      acceptedStickers
        .map((key) => STICKERS[key])
        .join(" ou "),
      acceptedStickers.includes(given.sticker)
    );

    addField(
      "yes",
      given.yes ? "Sim" : "Não",
      item.yes ? "Sim" : "Não",
      given.yes === item.yes
    );

    // A aplicabilidade depende do gabarito, não da resposta.
    if (exam.hasTime && item.time !== null) {
      addField(
        "time",
        TIMES[given.time],
        TIMES[item.time],
        given.time === item.time
      );
    }
  }

  const errors = fields.filter((field) => !field.correct).length;

  return {
    index,
    name: itemName(exam, index),
    fields,
    errors,
    correct: fields.length - errors,
    total: fields.length,
    allCorrect: errors === 0,
    ignoredTime:
      exam.hasTime && item.time === null
        ? TIMES[given.time]
        : null
  };
}

function calculateStats(exam, evaluations) {
  const total = evaluations.reduce(
    (sum, item) => sum + item.total,
    0
  );

  const errors = evaluations.reduce(
    (sum, item) => sum + item.errors,
    0
  );

  const correct = total - errors;
  const deduction = errors * exam.penalty;
  const rawScore = 100 - deduction;

  const finalScore = Math.min(
    exam.maxScore,
    Math.max(exam.minScore, rawScore)
  );

  const proportionalScore = (correct / total) * 100;
  const errorRate = (errors / total) * 100;
  const fullyCorrectItems = evaluations.filter(
    (item) => item.allCorrect
  ).length;

  const totalItems = evaluations.length;
  const itemAccuracy = (fullyCorrectItems / totalItems) * 100;

  const byField = FIELD_ORDER
    .map((key) => {
      const fields = evaluations.flatMap((item) =>
        item.fields.filter((field) => field.key === key)
      );

      if (fields.length === 0) return null;

      const fieldErrors = fields.filter(
        (field) => !field.correct
      ).length;

      return {
        key,
        label: FIELD_LABELS[key],
        total: fields.length,
        errors: fieldErrors,
        correct: fields.length - fieldErrors,
        deduction: fieldErrors * exam.penalty,
        accuracy:
          ((fields.length - fieldErrors) / fields.length) * 100
      };
    })
    .filter(Boolean);

  return {
    total,
    errors,
    correct,
    deduction,
    rawScore,
    finalScore,
    proportionalScore,
    errorRate,
    fullyCorrectItems,
    totalItems,
    itemAccuracy,
    byField,
    exactProportionalPenalty: 100 / total,
    minimumRawScore: 100 - total * exam.penalty,
    difference: finalScore - proportionalScore,
    ignoredTimes: evaluations.filter(
      (item) => item.ignoredTime !== null
    ).length
  };
}

function buildReport(exam, evaluations, stats) {
  const n = formatNumber;
  const lines = [];

  lines.push(
    "RELATÓRIO DE CORREÇÃO",
    exam.title,
    `Identificação: ${exam.code}`,
    `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
    "",
    "1. RESUMO",
    `Nota por penalidades: ${n(stats.finalScore)} pontos de 100.`,
    `Nota bruta, antes dos limites: ${n(stats.rawScore)}.`,
    `Respostas avaliáveis: ${stats.total}.`,
    `Respostas corretas: ${stats.correct}.`,
    `Respostas incorretas: ${stats.errors}.`,
    `Percentual proporcional de acertos: ${n(stats.proportionalScore)}%.`,
    `Percentual de erros: ${n(stats.errorRate)}%.`,
    `Itens integralmente corretos: ${stats.fullyCorrectItems} de ${stats.totalItems}.`,
    `Percentual de itens integralmente corretos: ${n(stats.itemAccuracy)}%.`,
    "",
    "2. CÁLCULO DA NOTA POR PENALIDADES",
    "Fórmula: nota bruta = 100 - (erros × penalidade).",
    `Penalidade por erro: ${n(exam.penalty)} pontos.`,
    `Desconto total = ${stats.errors} × ${n(exam.penalty)} = ${n(stats.deduction)} pontos.`,
    `Nota bruta = 100 - ${n(stats.deduction)} = ${n(stats.rawScore)}.`,
    `Limites configurados: ${exam.minScore} a ${exam.maxScore}.`,
    `Nota final = mínimo(${exam.maxScore}; máximo(${exam.minScore}; ${n(stats.rawScore)})) = ${n(stats.finalScore)}.`,
    stats.rawScore !== stats.finalScore
      ? "Foi aplicado um limite à nota bruta."
      : "Não foi necessário ajustar a nota pelos limites.",
    "",
    "3. CÁLCULO PROPORCIONAL, PARA COMPARAÇÃO",
    "Fórmula: percentual de acertos = (acertos ÷ respostas avaliáveis) × 100.",
    `Cálculo: (${stats.correct} ÷ ${stats.total}) × 100 = ${n(stats.proportionalScore)}%.`,
    "Fórmula equivalente: 100 - (erros × 100 ÷ respostas avaliáveis).",
    `Cálculo: 100 - (${stats.errors} × 100 ÷ ${stats.total}) = ${n(stats.proportionalScore)}%.`,
    `Desconto proporcional equivalente por erro: 100 ÷ ${stats.total} = ${n(stats.exactProportionalPenalty, 6)} pontos, aproximadamente.`,
    "Esse desconto proporcional é apenas informativo: ele não substitui a penalidade configurada.",
    `Diferença numérica entre a nota final e o percentual de acertos: ${n(stats.difference)}.`,
    "A nota por penalidades e o percentual proporcional são indicadores diferentes.",
    "",
    "4. OUTROS INDICADORES",
    `Taxa de erros = (${stats.errors} ÷ ${stats.total}) × 100 = ${n(stats.errorRate)}%.`,
    `Itens integralmente corretos = (${stats.fullyCorrectItems} ÷ ${stats.totalItems}) × 100 = ${n(stats.itemAccuracy)}%.`,
    "O indicador por item é informativo e não determina a nota.",
    `Se todos os campos avaliáveis fossem errados, a nota bruta seria:`,
    `100 - (${stats.total} × ${n(exam.penalty)}) = ${n(stats.minimumRawScore)}.`,
    `Após os limites, seria ${n(Math.min(exam.maxScore, Math.max(exam.minScore, stats.minimumRawScore)))}.`,
    "",
    "5. COMPOSIÇÃO DA AVALIAÇÃO"
  );

  if (exam.type === "tf") {
    lines.push(
      `${stats.totalItems} questões × 1 resposta = ${stats.total} respostas avaliáveis.`,
      "Cada questão incorreta gera um erro."
    );
  } else {
    const applicableTimes =
      stats.byField.find((field) => field.key === "time")?.total ?? 0;

    lines.push(
      `${stats.totalItems} itens × 3 campos básicos = ${stats.totalItems * 3} respostas.`
    );

    if (exam.hasTime) {
      lines.push(
        `Horários aplicáveis no gabarito: ${applicableTimes}.`,
        `Total: ${stats.totalItems * 3} + ${applicableTimes} = ${stats.total} respostas avaliáveis.`,
        `Horários não aplicáveis e excluídos da pontuação: ${stats.ignoredTimes}.`,
        "O horário é mostrado em todos os itens, mas só pontua quando há horário esperado no gabarito.",
        "Uma seleção de horário em campo não aplicável não gera acerto nem erro.",
        "Nos campos aplicáveis, o horário é avaliado independentemente de “Sim ou não”."
      );
    } else {
      lines.push(
        "A coluna de horário não integra este exame.",
        `Total: ${stats.total} respostas avaliáveis.`
      );
    }

    lines.push(
      "Cada campo incorreto gera um erro.",
      "Um mesmo item pode ter vários erros.",
      "Campos corretos continuam contando como acertos mesmo quando outro campo do item está errado."
    );
  }

  lines.push(
    "",
    "6. RESULTADOS POR CAMPO"
  );

  stats.byField.forEach((field) => {
    lines.push(
      `${field.label}:`,
      `  Avaliados: ${field.total}; acertos: ${field.correct}; erros: ${field.errors}.`,
      `  Acertos percentuais: (${field.correct} ÷ ${field.total}) × 100 = ${n(field.accuracy)}%.`,
      `  Desconto: ${field.errors} × ${n(exam.penalty)} = ${n(field.deduction)} pontos.`
    );
  });

  lines.push(
    "",
    "7. CORREÇÃO DETALHADA"
  );

  evaluations.forEach((item) => {
    lines.push(
      "",
      `${item.name} — ${item.correct}/${item.total} campos corretos; ${item.errors} erro(s).`
    );

    if (exam.type === "tf") {
      lines.push(`Enunciado: ${exam.items[item.index].text}`);
    }

    item.fields.forEach((field) => {
      lines.push(
        `  [${field.correct ? "CERTO" : "ERRADO"}] ${field.label}`,
        `    Respondido: ${field.actual}.`,
        `    Esperado: ${field.expected}.`
      );
    });

    if (item.ignoredTime !== null) {
      lines.push(
        `  [NÃO PONTUÁVEL] Horário informado: ${item.ignoredTime}.`,
        "    Não há horário aplicável no gabarito deste item."
      );
    }

    lines.push(
      `  Desconto do item: ${item.errors} × ${n(exam.penalty)} = ${n(item.errors * exam.penalty)} pontos.`
    );
  });

  lines.push(
    "",
    "8. REGRAS E LIMITAÇÕES",
    "Os descontos utilizados são os definidos na configuração deste sistema.",
    "Este relatório não comprova conformidade com um regulamento externo.",
    "Nenhuma resposta adicional foi criada para presumir um total de cinquenta.",
    "As alternativas aceitas no gabarito são consideradas corretas.",
    "O envio é bloqueado enquanto algum grupo apresentado estiver sem resposta.",
    "Os cálculos usam os valores sem arredondamento intermediário.",
    "Os resultados são apresentados com duas casas decimais, salvo indicação diferente.",
    "A nota final e o percentual proporcional de acertos não devem ser confundidos."
  );

  return lines.join("\n");
}

async function copyReport(textarea, status) {
  const text = textarea.value;

  if (!text) return;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      textarea.focus();
      textarea.select();

      const copied = document.execCommand("copy");

      if (!copied) throw new Error("Cópia indisponível.");
    }

    status.textContent = "Relatório copiado.";
  } catch {
    textarea.focus();
    textarea.select();
    status.textContent =
      "Não foi possível copiar automaticamente. " +
      "O texto foi selecionado para cópia manual.";
  }
}

function buildExam(exam) {
  const panel = el("section", "exam-panel");
  panel.id = `panel-${exam.id}`;
  panel.hidden = true;

  panel.setAttribute("role", "tabpanel");
  panel.setAttribute("aria-labelledby", `tab-${exam.id}`);

  panel.append(
    el("h2", "exam-title", exam.title),
    el("p", "exam-subtitle", exam.subtitle),
    el(
      "p",
      "scoring-note",
      `Correção por campo. Desconto de ${formatNumber(exam.penalty)} ` +
      "pontos por erro. O relatório também mostra o percentual de acertos."
    )
  );

  if (exam.image) {
    const link = el("a", "exam-figure");
    link.href = exam.image;
    link.target = "_blank";
    link.rel = "noopener";

    const image = el("img");
    image.src = exam.image;
    image.alt = exam.imageAlt;

    link.appendChild(image);
    panel.appendChild(link);
  }

  const form = el("form");
  form.noValidate = true;

  const list = el("div", "question-list");
  const warning = el("p", "exam-warning");
  warning.hidden = true;
  warning.setAttribute("role", "alert");

  const actions = el("div", "exam-actions");

  const submit = el("button", "primary-button", "Corrigir exame");
  submit.type = "submit";

  const reset = el("button", "secondary-button", "Refazer");
  reset.type = "button";
  reset.hidden = true;

  actions.append(submit, reset);
  form.append(list, warning, actions);

  const result = el("section", "exam-result");
  result.hidden = true;
  result.tabIndex = -1;
  result.setAttribute("aria-label", "Resultado e relatório");

  const summary = el("p", "result-summary");
  summary.setAttribute("role", "status");
  summary.setAttribute("aria-live", "polite");

  const reportLabel = el(
    "label",
    "report-label",
    "Relatório completo — selecione ou copie o texto"
  );

  const textarea = el("textarea", "report-textbox");
  textarea.id = `report-${exam.id}`;
  textarea.readOnly = true;
  textarea.rows = 24;
  textarea.spellcheck = false;
  reportLabel.htmlFor = textarea.id;

  const reportActions = el("div", "report-actions");

  const copy = el(
    "button",
    "primary-button",
    "Copiar relatório"
  );
  copy.type = "button";

  const select = el(
    "button",
    "secondary-button",
    "Selecionar texto"
  );
  select.type = "button";

  const copyStatus = el("p", "copy-status");
  copyStatus.setAttribute("role", "status");
  copyStatus.setAttribute("aria-live", "polite");

  reportActions.append(copy, select);

  result.append(
    summary,
    reportLabel,
    textarea,
    reportActions,
    copyStatus
  );

  panel.append(form, result);

  let graded = false;

  function render() {
    list.replaceChildren();

    exam.items.forEach((item, index) => {
      list.appendChild(
        exam.type === "tf"
          ? tfItem(exam, item, index)
          : chartItem(exam, item, index)
      );
    });
  }

  function grade(event) {
    event.preventDefault();

    if (graded) return;

    const givens = exam.items.map((_, index) =>
      readGiven(exam, index, list.children[index])
    );

    const missing = givens
      .map((given, index) => (given === null ? index : -1))
      .filter((index) => index >= 0);

    if (missing.length > 0) {
      warning.textContent =
        "Responda todos os grupos apresentados antes de corrigir. " +
        `Faltam: ${missing.map((index) => itemName(exam, index)).join(", ")}.`;

      warning.hidden = false;

      const firstMissing = list.children[missing[0]];

      firstMissing.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      firstMissing
        .querySelector("input:not(:disabled)")
        ?.focus({ preventScroll: true });

      return;
    }

    warning.hidden = true;

    const evaluations = exam.items.map((item, index) =>
      evaluateItem(exam, item, givens[index], index)
    );

    const stats = calculateStats(exam, evaluations);

    evaluations.forEach((evaluation, index) => {
      const node = list.children[index];

      node.classList.add(
        evaluation.allCorrect ? "correct" : "incorrect"
      );

      evaluation.fields.forEach((field) => {
        const group = node.querySelector(
          `[data-field="${field.key}"]`
        );

        group?.classList.add(
          field.correct ? "field-correct" : "wrong"
        );
      });

      const feedback = el("div", "question-feedback");

      feedback.appendChild(
        el(
          "p",
          "feedback-summary",
          `${evaluation.allCorrect ? "✅" : "❌"} ` +
          `${evaluation.correct} de ${evaluation.total} campos corretos. ` +
          `${evaluation.errors} erro(s). ` +
          `Desconto: ${formatNumber(evaluation.errors * exam.penalty)} pontos.`
        )
      );

      const details = el("ul", "feedback-fields");

      evaluation.fields.forEach((field) => {
        details.appendChild(
          el(
            "li",
            field.correct ? "feedback-ok" : "feedback-error",
            `${field.correct ? "Correto" : "Incorreto"} — ${field.label}: ` +
            `respondido "${field.actual}"; esperado "${field.expected}".`
          )
        );
      });

      if (evaluation.ignoredTime !== null) {
        details.appendChild(
          el(
            "li",
            "feedback-neutral",
            "Horário não aplicável neste item: excluído da pontuação."
          )
        );
      }

      feedback.appendChild(details);

      node.insertBefore(
        feedback,
        node.querySelector(".answer-ref")
      );

      node.querySelectorAll("input").forEach((input) => {
        input.disabled = true;
      });
    });

    textarea.value = buildReport(exam, evaluations, stats);

    summary.textContent =
      `Nota: ${formatNumber(stats.finalScore)} / 100 pontos. ` +
      `${stats.errors} erro(s) em ${stats.total} respostas avaliáveis. ` +
      `Percentual de acertos: ${formatNumber(stats.proportionalScore)}%.`;

    graded = true;
    submit.disabled = true;
    reset.hidden = false;
    result.hidden = false;
    copyStatus.textContent = "";

    result.focus({ preventScroll: true });
    result.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function resetExam() {
    graded = false;
    render();

    result.hidden = true;
    warning.hidden = true;
    reset.hidden = true;
    submit.disabled = false;

    textarea.value = "";
    summary.textContent = "";
    copyStatus.textContent = "";

    panel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    list.querySelector("input")?.focus({
      preventScroll: true
    });
  }

  form.addEventListener("submit", grade);
  reset.addEventListener("click", resetExam);

  copy.addEventListener("click", () => {
    copyReport(textarea, copyStatus);
  });

  select.addEventListener("click", () => {
    textarea.focus();
    textarea.select();
    copyStatus.textContent = "Texto selecionado.";
  });

  render();

  return panel;
}

const menuElement = document.getElementById("exam-menu");
const panelsElement = document.getElementById("exam-panels");

const tabs = {};
const panels = {};

function showExam(id, focusTab = false) {
  EXAMS.forEach((exam) => {
    const active = exam.id === id;

    panels[exam.id].hidden = !active;
    tabs[exam.id].setAttribute(
      "aria-selected",
      String(active)
    );
    tabs[exam.id].tabIndex = active ? 0 : -1;
  });

  if (focusTab) tabs[id].focus();
}

EXAMS.forEach((exam, index) => {
  const tab = el("button", "exam-tab", exam.menu);

  tab.id = `tab-${exam.id}`;
  tab.type = "button";
  tab.setAttribute("role", "tab");
  tab.setAttribute("aria-controls", `panel-${exam.id}`);

  tab.addEventListener("click", () => {
    showExam(exam.id);
  });

  tab.addEventListener("keydown", (event) => {
    let targetIndex = index;

    if (event.key === "ArrowRight") {
      targetIndex = (index + 1) % EXAMS.length;
    } else if (event.key === "ArrowLeft") {
      targetIndex = (index - 1 + EXAMS.length) % EXAMS.length;
    } else if (event.key === "Home") {
      targetIndex = 0;
    } else if (event.key === "End") {
      targetIndex = EXAMS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    showExam(EXAMS[targetIndex].id, true);
  });

  tabs[exam.id] = tab;
  panels[exam.id] = buildExam(exam);

  menuElement.appendChild(tab);
  panelsElement.appendChild(panels[exam.id]);
});

showExam(EXAMS[0].id);