(function () {
  "use strict";

  var SENHA_CORRETA = "s";
  var PARAM_NOME = "s";
  var PARAM_VALOR = "s";

  function getQueryParam(nome) {
    return new URLSearchParams(window.location.search).get(nome);
  }

  function liberarAcesso() {
    document.documentElement.style.visibility = "visible";
    var overlay = document.getElementById("auth-overlay");
    if (overlay) overlay.remove();
  }

  function bloquearAcesso() {
    document.documentElement.style.visibility = "hidden";

    var overlay = document.createElement("div");
    overlay.id = "auth-overlay";
    overlay.style.cssText = [
      "position:fixed", "inset:0", "z-index:999999", "display:flex",
      "align-items:center", "justify-content:center", "background:#1e1e2f",
      "font-family:sans-serif", "color:#fff", "visibility:visible"
    ].join(";");

    overlay.innerHTML =
      '<div style="background:#2a2a3d;padding:32px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.4);text-align:center;min-width:280px">' +
        '<h2 style="margin:0 0 16px;font-size:1.2rem">Acesso restrito</h2>' +
        '<p style="margin:0 0 16px;font-size:.9rem;color:#ccc">Digite a senha para continuar</p>' +
        '<input type="text" id="auth-password-input" inputmode="none" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Senha" style="width:100%;padding:10px;border-radius:6px;border:1px solid #555;background:#1e1e2f;color:transparent;font-size:1rem;box-sizing:border-box;margin-bottom:12px;caret-color:transparent;text-shadow:none;-webkit-text-security:none">' +
        '<p id="auth-field-status" role="status" aria-live="polite" style="margin:0 0 12px;font-size:.85rem;color:#ccc">Campo vazio</p>' +
        '<button id="auth-submit-btn" type="button" style="width:100%;padding:10px;border:0;border-radius:6px;background:#4c8bf5;color:#fff;font-size:1rem;cursor:pointer">Entrar</button>' +
        '<p id="auth-error-msg" role="alert" style="color:#ff6b6b;font-size:.85rem;margin:12px 0 0;visibility:hidden">Senha incorreta.</p>' +
      '</div>';

    document.documentElement.appendChild(overlay);

    var input = document.getElementById("auth-password-input");
    var button = document.getElementById("auth-submit-btn");
    var status = document.getElementById("auth-field-status");
    var error = document.getElementById("auth-error-msg");

    function atualizarStatus() {
      status.textContent = input.value.length ? "Campo preenchido" : "Campo vazio";
      error.style.visibility = "hidden";
    }

    function tentarLogin() {
      if (input.value === SENHA_CORRETA) {
        liberarAcesso();
      } else {
        input.value = "";
        atualizarStatus();
        error.style.visibility = "visible";
        input.focus();
      }
    }

    input.addEventListener("input", atualizarStatus);
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") tentarLogin();
    });
    button.addEventListener("click", tentarLogin);
    input.focus();
  }

  if (getQueryParam(PARAM_NOME) === PARAM_VALOR) {
    document.documentElement.style.visibility = "visible";
  } else if (document.readyState === "loading") {
    document.documentElement.style.visibility = "hidden";
    document.addEventListener("DOMContentLoaded", bloquearAcesso);
  } else {
    bloquearAcesso();
  }
})();
