// Toast via protótipo: os métodos vivem em ToastProto e são compartilhados
// por todos os objetos criados com Object.create(ToastProto).
const TIPOS = new Set(["success", "warning", "error"]);
const PADRAO = {
  success: "Operação realizada com sucesso.",
  warning: "Atenção: verifique a operação.",
  error: "Ocorreu um erro.",
};

const ToastProto = {
  duration: 4000,

  _host() {
    let host = document.getElementById("toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "toast-host";
      host.className = "toast-host";
      host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }
    return host;
  },

  show(type, message, duration = this.duration) {
    if (!TIPOS.has(type)) {
      console.error("Toast: type inválido:", type);
      type = "error";
    }
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.setAttribute("role", type === "error" ? "alert" : "status");
    el.textContent = String(message);
    el.addEventListener("click", () => el.remove());
    this._host().appendChild(el);
    if (duration > 0) setTimeout(() => el.remove(), duration);
    return el;
  },

  success(message, duration) { return this.show("success", message, duration); },
  warning(message, duration) { return this.show("warning", message, duration); },
  error(message, duration)   { return this.show("error", message, duration); },

  /**
   * Aceita { type, message, data? }. Nunca exibe `data`.
   * Resposta fora do formato: registra no console e mostra erro (sem silenciar).
   */
  fromResponse(res) {
    if (res === null || typeof res !== "object" || !TIPOS.has(res.type)) {
      console.error("Resposta inesperada da API:", res);
      return this.show("error", "Resposta inesperada do servidor.");
    }
    const msg = typeof res.message === "string" && res.message.trim()
      ? res.message : PADRAO[res.type];
    return this.show(res.type, msg);
  },
};

export function createToast({ duration } = {}) {
  const t = Object.create(ToastProto);
  if (duration !== undefined) t.duration = duration; // propriedade só deste objeto
  return t;
}

export const toast = createToast();
