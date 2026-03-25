# Creighton Tools 🌿

Ferramentas de apoio ao **Sistema Creighton** de monitoramento da fertilidade, hospedadas como página estática no **GitHub Pages**.

## 🌐 Link de Acesso

👉 **[https://raulfmiranda.github.io/home/](https://raulfmiranda.github.io/home/)**

---

## 📄 Páginas

### 🏠 Home (`index.html`)
Página inicial com visual inspirado em sistemas operacionais retrô (estilo Windows 95/98).
Funciona como um painel de ícones que dá acesso às ferramentas disponíveis no site.

### 🗓️ Calculadora ETC / ETA (`etc-eta.html`)
Ferramenta para calcular a **Estimativa do Tempo de Concepção (ETC)** e a **Estimativa do Tempo para o Parto (ETA)** com base no método Creighton.

**Como funciona:**
- O usuário informa o **Dia Pico** do ciclo
- Marca os dias em que ocorreram relações sexuais (de P−4 até P+3)
- A calculadora determina automaticamente o intervalo de concepção, o ETC (ponto médio do intervalo) e o ETA (ETC + 9 meses − 7 dias)
- Suporta múltiplos cálculos por ciclo e múltiplos ciclos por sessão
- Gera um **relatório exportável** em dois formatos de data: `DD/MM/AAAA` e `MM/DD`

**Regras do cálculo do ETC:**
- Relações apenas na fase pré-Pico: intervalo vai do primeiro ato até o **Dia Pico**
- Relações na fase pós-Pico ou cruzando o Pico: intervalo entre o primeiro e o último ato
- Intervalo com número ímpar de dias: ponto médio exato
- Intervalo com número par de dias: escolhe-se o candidato central cujo **número do dia no calendário seja par**

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| HTML5 + CSS3 | Estrutura e estilo de todas as páginas |
| JavaScript (vanilla) | Lógica de cálculo e interação |
| Google Fonts (VT323, Share Tech Mono) | Tipografia retrô |
| GitHub Pages | Hospedagem estática e gratuita |

---

## 📂 Estrutura do Repositório

