import Flock from "../../_common/classes/Flock.js";
import FlockService from "../../_common/FlockService.js";
import { criarToast } from "../../_common/Toast.js";

// As ovelhas de dentro do lote ficam em Sheeps.js
import { configurarOvelhas, abrirOvelhasDoLote } from "./Sheeps.js";

// Serviço responsável pela comunicação com a API
const flockService = new FlockService();
const toast = criarToast();

// Elementos HTML
const lotesContainer = document.querySelector("#lotes");
const btnCriarLote = document.querySelector("#btnCriarLote");

// Estado da tela
let lotes = [];
let loteSelecionado = null;

console.log(localStorage.getItem("usersId"))

// Escapa caracteres especiais para evitar inserir HTML vindo da API
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Modal que substitui o prompt():
// devolve o texto digitado ou null se o usuário cancelar (igual ao prompt)
function pedirNomeLote({ titulo = "Criar novo lote", valor = "", botao = "Criar Lote" } = {}) {
    return new Promise(resolve => {
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        overlay.innerHTML = `
            <div class="modal-card" role="dialog" aria-modal="true">
                <header class="modal__head">
                    <h3 data-el="titulo"></h3>
                    <button type="button" class="iconbtn modal-fechar" aria-label="Fechar">✕</button>
                </header>
                <div class="modal__body">
                    <label class="field">
                        <span>Nome do Lote</span>
                        <input id="inputNomeLote" placeholder="Ex.: Lote A — Matrizes" />
                    </label>
                </div>
                <footer class="modal__foot">
                    <button type="button" class="btn btn--ghost" data-acao="cancelar">Cancelar</button>
                    <button type="button" class="btn btn--primary" data-acao="salvar"></button>
                </footer>
            </div>
        `;

        const input = overlay.querySelector("#inputNomeLote");
        overlay.querySelector('[data-el="titulo"]').textContent = titulo;
        overlay.querySelector('[data-acao="salvar"]').textContent = botao;
        input.value = valor;

        function fechar(valor) {
            overlay.remove();
            document.body.style.overflow = "";
            document.removeEventListener("keydown", onEsc);
            resolve(valor);
        }

        function onEsc(event) {
            if (event.key === "Escape") fechar(null);
        }

        overlay.addEventListener("click", event => {
            if (event.target === overlay) fechar(null);
        });
        overlay.querySelector(".modal-fechar").addEventListener("click", () => fechar(null));
        overlay.querySelector('[data-acao="cancelar"]').addEventListener("click", () => fechar(null));
        overlay.querySelector('[data-acao="salvar"]').addEventListener("click", () => fechar(input.value));
        input.addEventListener("keydown", event => {
            if (event.key === "Enter") fechar(input.value);
        });
        document.addEventListener("keydown", onEsc);

        document.body.appendChild(overlay);
        document.body.style.overflow = "hidden";
        input.focus();
    });
}

// Busca os lotes na API
async function carregarLotes() {
    lotesContainer.innerHTML = "<p>Carregando lotes...</p>";

    try {
        lotes = await flockService.list();
        renderizarLotes();

    } catch (error) {
        console.error("Erro ao carregar lotes:", error);
        lotesContainer.innerHTML =
            "<p>Não foi possível carregar os lotes.</p>";
    }
}

// Cria os cartões dos lotes
function renderizarLotes() {
    if (lotes.length === 0) {
        lotesContainer.innerHTML =
            "<p>Nenhum lote cadastrado.</p>";
        return;
    }

    lotesContainer.innerHTML = lotes.map(lote => `
        <article
            class="lote-card"
            data-flock-id="${lote.id}"
            tabindex="0"
            role="button"
        >
            <h3>${escapeHTML(lote.name)}</h3>
            <p> Clique para visualizar as ovelhas </p>
            <div class="lote-card__actions">
                <button
                    type="button"
                    class="lote-card__rename"
                    data-acao="renomear"
                    aria-label="Renomear lote ${escapeHTML(lote.name)}"
                    title="Renomear lote"
                > Renomear</button>
                <button
                    type="button"
                    class="lote-card__delete"
                    data-acao="excluir"
                    aria-label="Excluir lote ${escapeHTML(lote.name)}"
                    title="Excluir lote"
                >🗑 Excluir</button>
            </div>
        </article>
    `).join("");
}

// Cadastra um novo lote
async function criarLote() {
    const nome = await pedirNomeLote();

    if (nome === null) return;

    try {
        const flock = new Flock({ users_id: localStorage.getItem("usersId"), name: nome });

        const response = await flockService.create(flock);

        if (response?.type === "error") {
            throw new Error(response.message || "Erro ao cadastrar lote.");
        }

        toast.show("success", "Lote cadastrado com sucesso!");

        await carregarLotes();

    } catch (error) {
        console.error("Erro ao cadastrar lote:", error);
        alert(error.message);
    }
}

// Renomeia um lote (PUT /Flocks/{id} com { name })
async function renomearLote(id) {
    const lote = lotes.find(item => item.id === id);
    if (!lote) return;

    const novoNome = await pedirNomeLote({
        titulo: "Renomear lote",
        valor: lote.name,
        botao: "Salvar nome"
    });

    if (novoNome === null) return;

    const nome = novoNome.trim();

    if (!nome) {
        toast.show("error", "O nome do lote não pode ficar vazio.");
        return;
    }
    if (nome.length > 100) {
        toast.show("error", "O nome do lote deve ter no máximo 100 caracteres.");
        return;
    }
    if (nome === lote.name) return;

    try {
        await flockService.rename(id, nome);
        toast.show("success", "Nome do lote atualizado!");
        await carregarLotes();
    } catch (error) {
        console.error("Erro ao renomear lote:", error);
        toast.show("error", error.message);
    }
}

// Modal de confirmação: devolve true se o usuário confirmar, false se cancelar
function confirmarExclusao(nome) {
    return new Promise(resolve => {
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        overlay.innerHTML = `
            <div class="modal-card" role="dialog" aria-modal="true">
                <header class="modal__head">
                    <h3>Excluir lote</h3>
                    <button type="button" class="iconbtn modal-fechar" aria-label="Fechar">✕</button>
                </header>
                <div class="modal__body">
                    <p>Deseja realmente excluir o lote "<strong></strong>"?</p>
                </div>
                <footer class="modal__foot">
                    <button type="button" class="btn btn--ghost" data-acao="cancelar">Cancelar</button>
                    <button type="button" class="btn btn--danger" data-acao="confirmar">Excluir</button>
                </footer>
            </div>
        `;
        overlay.querySelector("strong").textContent = nome;

        function fechar(valor) {
            overlay.remove();
            document.body.style.overflow = "";
            document.removeEventListener("keydown", onEsc);
            resolve(valor);
        }

        function onEsc(event) {
            if (event.key === "Escape") fechar(false);
        }

        overlay.addEventListener("click", event => {
            if (event.target === overlay) fechar(false);
        });
        overlay.querySelector(".modal-fechar").addEventListener("click", () => fechar(false));
        overlay.querySelector('[data-acao="cancelar"]').addEventListener("click", () => fechar(false));
        overlay.querySelector('[data-acao="confirmar"]').addEventListener("click", () => fechar(true));
        document.addEventListener("keydown", onEsc);

        document.body.appendChild(overlay);
        document.body.style.overflow = "hidden";
        overlay.querySelector('[data-acao="cancelar"]').focus();
    });
}

// Exclui (desativa) um lote
async function excluirLote(id) {
    const lote = lotes.find(item => item.id === id);

    if (!lote) return;
    if (!(await confirmarExclusao(lote.name))) return;

    try {
        const response = await flockService.remove(id);

        // Só considera sucesso se a API disse "success". A resposta de
        // "URL não encontrada" (rota inexistente) não tem `type`, então
        // antes ela passava como se tivesse dado certo.
        if (response?.type !== "success") {
            throw new Error(response?.message || "Erro ao excluir lote.");
        }

        toast.show("success", "Lote excluído com sucesso!");

        await carregarLotes();

    } catch (error) {
        console.error("Erro ao excluir lote:", error);
        toast.show("error", error.message);
    }
}

// Abre um lote: esconde a lista de lotes e entrega a tela do lote para Sheeps.js
function abrirLote(id) {
    loteSelecionado = lotes.find(lote => lote.id === id);
    if (!loteSelecionado) return;

    lotesContainer.hidden = true;
    btnCriarLote.hidden = true;

    abrirOvelhasDoLote(loteSelecionado);
}

// Chamado por Sheeps.js quando o usuário clica em "Voltar aos lotes"
function voltarAosLotes() {
    loteSelecionado = null;

    lotesContainer.hidden = false;
    btnCriarLote.hidden = false;
}

// Eventos
btnCriarLote.addEventListener("click", criarLote);

lotesContainer.addEventListener("click", event => {
    const card = event.target.closest("[data-flock-id]");

    if (!card) return;

    // Botão de renomear: não abre o lote
    if (event.target.closest('[data-acao="renomear"]')) {
        renomearLote(Number(card.dataset.flockId));
        return;
    }

    // Botão de excluir: não abre o lote
    if (event.target.closest('[data-acao="excluir"]')) {
        excluirLote(Number(card.dataset.flockId));
        return;
    }

    abrirLote(Number(card.dataset.flockId));
});

lotesContainer.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;

    // Enter/Espaço nos botões do card é tratado pelo próprio botão (click)
    if (event.target.closest('[data-acao="excluir"], [data-acao="renomear"]')) return;

    const card = event.target.closest("[data-flock-id]");

    if (!card) return;

    event.preventDefault();
    abrirLote(Number(card.dataset.flockId));
});

// Inicialização
configurarOvelhas({
    obterLotes: () => lotes,     // o modal de nova ovelha precisa da lista de lotes
    aoVoltar: voltarAosLotes
});

carregarLotes();