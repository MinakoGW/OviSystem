// Tela do lote aberto: lista as ovelhas, cadastra novas e abre o carrossel de fotos.
// O Flocks.js cuida da lista de lotes e só chama abrirOvelhasDoLote() ao abrir um deles.

import SheepsService from "../../_common/SheepsService.js";
import { criarToast } from "../../_common/Toast.js";
import { abrirGaleria } from "./SheepGallery.js";
import { pedirNovaOvelha } from "./SheepModal.js";

const sheepsService = new SheepsService();
const toast = criarToast();

// Elementos HTML
const ovelhasSection = document.querySelector("#ovelhasSection");
const ovelhasGrid = document.querySelector("#ovelhasGrid");
const loteTitulo = document.querySelector("#loteTitulo");
const btnVoltar = document.querySelector("#btnVoltar");
const btnAddOvelha = document.querySelector("#btnAddOvelha");

// Estado da tela
let ovelhas = [];
let loteAtual = null;
let obterLotes = () => [];
let aoVoltar = () => {};

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

// Resumo curto para o cartão: sexo, raça e brinco (o que estiver preenchido)
function descreverOvelha(o) {
    const partes = [];
    if (o.sex !== null && o.sex !== undefined && o.sex !== "") partes.push(Number(o.sex) === 1 ? "Fêmea" : "Macho");
    if (o.breed) partes.push(o.breed);
    if (o.eartag) partes.push(`Brinco ${o.eartag}`);
    return partes.length ? `${partes.join(" · ")} · Ver fotos` : "Ver fotos";
}

async function carregarOvelhas(flockId) {
    ovelhasGrid.innerHTML = "<p>Carregando ovelhas...</p>";

    try {
        ovelhas = await sheepsService.listByFlock(flockId);

        if (ovelhas.length === 0) {
            ovelhasGrid.innerHTML = `<div class="empty-state"><p>Nenhuma ovelha neste lote.</p></div>`;
            return;
        }

        ovelhasGrid.innerHTML = ovelhas.map(o => `
            <article class="ovelha-card" data-sheep-id="${o.id}" tabindex="0" role="button"
                     aria-label="Ver fotos da ovelha ${escapeHTML(o.number)}">
                <div class="ovelha-card__avatar">🐑</div>
                <div class="ovelha-card__info">
                    <span class="ovelha-card__codigo">Ovelha ${escapeHTML(o.number)}</span>
                    <span class="ovelha-card__sub">${escapeHTML(descreverOvelha(o))}</span>
                </div>
            </article>
        `).join("");
    } catch (error) {
        console.error("Erro ao carregar ovelhas:", error);
        ovelhasGrid.innerHTML = "<p>Não foi possível carregar as ovelhas.</p>";
    }
}

// Clique (ou Enter/Espaço) numa ovelha: abre o carrossel de fotos
function abrirGaleriaDoCard(event) {
    const card = event.target.closest("[data-sheep-id]");
    if (!card) return;

    if (event.type === "keydown") {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
    }

    const ovelha = ovelhas.find(item => Number(item.id) === Number(card.dataset.sheepId));
    if (ovelha) abrirGaleria(ovelha);
}

async function adicionarOvelha() {
    // O botão só aparece com um lote aberto; confere mesmo assim
    if (!loteAtual) return;

    const lotes = obterLotes();

    // Mãe/pai podem estar em qualquer lote: busca as ovelhas de todos os lotes
    let parentes = [];
    try {
        const listas = await Promise.all(lotes.map(l => sheepsService.listByFlock(l.id)));
        parentes = listas.flatMap((lista, i) => lista.map(o => ({ ...o, lote: lotes[i].name })));
    } catch (error) {
        console.error("Erro ao carregar possíveis pais:", error);
    }

    const dados = await pedirNovaOvelha(loteAtual, parentes);

    if (dados === null) return;

    try {
        await sheepsService.create(dados);
        toast.show("success", "Ovelha cadastrada com sucesso!");

        await carregarOvelhas(loteAtual.id);
    } catch (error) {
        console.error("Erro ao cadastrar ovelha:", error);
        toast.show("error", error.message);
    }
}

// Mostra a tela do lote (chamado pelo Flocks.js)
export function abrirOvelhasDoLote(lote) {
    loteAtual = lote;
    loteTitulo.textContent = lote.name;
    ovelhasSection.classList.remove("ovelhas-section--hidden");
    btnAddOvelha.hidden = false; // adicionar ovelha só com o lote aberto

    carregarOvelhas(lote.id);
}

function voltar() {
    loteAtual = null;
    ovelhas = [];
    ovelhasSection.classList.add("ovelhas-section--hidden");
    btnAddOvelha.hidden = true;

    aoVoltar();
}

// Liga os eventos da tela. `obterLotes` devolve a lista atual de lotes (para o modal
// de nova ovelha) e `aoVoltar` é chamado quando o usuário volta para a lista de lotes.
export function configurarOvelhas({ obterLotes: lotesFn, aoVoltar: voltarFn } = {}) {
    if (lotesFn) obterLotes = lotesFn;
    if (voltarFn) aoVoltar = voltarFn;
}

ovelhasGrid.addEventListener("click", abrirGaleriaDoCard);
ovelhasGrid.addEventListener("keydown", abrirGaleriaDoCard);
btnAddOvelha.addEventListener("click", adicionarOvelha);
btnVoltar.addEventListener("click", voltar);