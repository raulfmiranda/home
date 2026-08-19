(function () {
  "use strict";

  var SENHA_CORRETA = "s";
  var PARAM_NOME = "s";
  var PARAM_VALOR = "s";

  function getQueryParam(nome) {
    var params = new URLSearchParams(window.location.search);
    return params.get(nome);
  }

  function liberarAcesso() {
    document.documentElement.style.visibility = "visible";
    var overlay = document.getElementById("auth-overlay");
    if (overlay) {
      overlay.remove();
    }
  }

  function bloquearAcesso() {
    document.documentElement.style.visibility = "hidden";

    var overlay = document.createElement("div");
    overlay.id = "auth-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "#1e1e2f";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "999999";
    overlay.style.fontFamily = "sans-serif";
    overlay.style.color = "#fff";
    overlay.style.visibility = "visible";

    overlay.innerHTML =
      '<div style="background:#2a2a3d;padding:32px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.4);text-align:center;min-width:280px;">' +
      '<h2 style="margin:0 0 16px;font-size:1.2rem;">Acesso restrito</h2>' +
      '<p style="margin:0 0 16px;font-size:0.9rem;color:#ccc;">Digite a senha para continuar</p>' +
      '<input type="password" id="auth-password-input" style="width:100%;padding:10px;border-radius:6px;border:1px solid #555;background:#1e1e2f;color:#fff;font-size:1rem;box-sizing:border-box;margin-bottom:12px;" autocomplete="off" />' +
      '<button id="auth-submit-btn" style="width:100%;padding:10px;border:none;border-radius:6px;background:#4c8bf5;color:#fff;font-size:1rem;cursor:pointer;">Entrar</button>' +
      '<p id="auth-error-msg" style="color:#ff6b6b;font-size:0.85rem;margin:12px 0 0;visibility:hidden;">Senha incorreta.</p>' +
      "</div>";

    document.documentElement.appendChild(overlay);

    var input = document.getElementById("auth-password-input");
    var btn = document.getElementById("auth-submit-btn");
    var errorMsg = document.getElementById("auth-error-msg");

    function tentarLogin() {
      if (input.value === SENHA_CORRETA) {
        liberarAcesso();
      } else {
        errorMsg.style.visibility = "visible";
        input.value = "";
        input.focus();
      }
    }

    btn.addEventListener("click", tentarLogin);
    input.addEventListener("keyup", function (e) {
      if (e.key === "Enter") {
        tentarLogin();
      }
    });

    input.focus();
  }

  function iniciarAutenticacao() {
    var valorParametro = getQueryParam(PARAM_NOME);

    if (valorParametro === PARAM_VALOR) {
      liberarAcesso();
      return;
    }

    bloquearAcesso();
  }

  document.documentElement.style.visibility = "hidden";

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarAutenticacao);
  } else {
    iniciarAutenticacao();
  }
})();
