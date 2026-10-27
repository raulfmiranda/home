const QUESTIONS = [
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

const formEl = document.getElementById("exam-form");
const questionsEl = document.getElementById("exam-questions");
const warningEl = document.getElementById("exam-warning");
const submitBtn = document.getElementById("exam-submit");
const resetBtn = document.getElementById("exam-reset");
const resultEl = document.getElementById("exam-result");

const label = (v) => (v ? "Verdadeiro" : "Falso");

function renderQuestions() {
  questionsEl.innerHTML = "";
  QUESTIONS.forEach((q, i) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "question";
    fieldset.dataset.index = i;

    const legend = document.createElement("legend");
    legend.textContent = `${i + 1}. ${q.text}`;
    fieldset.appendChild(legend);

    if (q.steps) {
      const ul = document.createElement("ul");
      ul.className = "question-steps";
      q.steps.forEach((s) => {
        const li = document.createElement("li");
        li.textContent = s;
        ul.appendChild(li);
      });
      fieldset.appendChild(ul);
    }

    const options = document.createElement("div");
    options.className = "answer-options";
    [true, false].forEach((value) => {
      const lbl = document.createElement("label");
      lbl.className = "answer-option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q${i}`;
      input.value = String(value);
      lbl.appendChild(input);
      lbl.appendChild(document.createTextNode(label(value)));
      options.appendChild(lbl);
    });
    fieldset.appendChild(options);
    questionsEl.appendChild(fieldset);
  });
}

function getAnswer(i) {
  const checked = formEl.querySelector(`input[name="q${i}"]:checked`);
  return checked ? checked.value === "true" : null;
}

function gradeExam(e) {
  e.preventDefault();

  const unanswered = QUESTIONS.map((_, i) => i).filter((i) => getAnswer(i) === null);
  if (unanswered.length > 0) {
    const nums = unanswered.map((i) => i + 1).join(", ");
    warningEl.textContent = `Responda todas as questões antes de corrigir. Faltam: ${nums}.`;
    warningEl.classList.remove("hidden");
    questionsEl.children[unanswered[0]].scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  warningEl.classList.add("hidden");

  let score = 0;
  QUESTIONS.forEach((q, i) => {
    const fieldset = questionsEl.children[i];
    const given = getAnswer(i);
    const ok = given === q.answer;
    if (ok) score++;
    fieldset.classList.add(ok ? "correct" : "incorrect");

    const fb = document.createElement("p");
    fb.className = "question-feedback";
    fb.textContent = ok
      ? `✅ Correto: ${label(q.answer)}.`
      : `❌ Incorreto. Resposta certa: ${label(q.answer)}.`;
    fieldset.appendChild(fb);
    fieldset.querySelectorAll("input").forEach((inp) => (inp.disabled = true));
  });

  resultEl.textContent = `Você acertou ${score} de ${QUESTIONS.length} (${score * 10}%).`;
  resultEl.classList.remove("hidden");
  submitBtn.disabled = true;
  resetBtn.classList.remove("hidden");
  resultEl.scrollIntoView({ behavior: "smooth", block: "center" });
}

function resetExam() {
  renderQuestions();
  resultEl.classList.add("hidden");
  warningEl.classList.add("hidden");
  resetBtn.classList.add("hidden");
  submitBtn.disabled = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

formEl.addEventListener("submit", gradeExam);
resetBtn.addEventListener("click", resetExam);
renderQuestions();