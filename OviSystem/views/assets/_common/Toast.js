// Toast via protótipo (Object.create) — sem "class".
// Os métodos ficam em ToastProto e são compartilhados por todos os toasts.
export const ToastProto = {
  init(container = document.body) {
    this.container = container;
    return this;
  },

  show(type, message) {
    const el = document.createElement("div");
    el.className = `toast toast--${type}`; // success | warning | error
    el.textContent = message;
    this.container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
    return el;
  },

  // Aceita resposta com ou sem `data`; nunca exibe `data` como mensagem.
  fromResponse(response) {
    const tipos = ["success", "warning", "error"];
    if (!response || !tipos.includes(response.type) || typeof response.message !== "string") {
      console.error("Resposta inesperada da API:", response);
      this.show("error", "Resposta inesperada do servidor");
      return;
    }
    this.show(response.type, response.message);
  },
};

export const criarToast = (container) => Object.create(ToastProto).init(container);
