import SheepImageService from "../../_common/SheepImageService.js";
import { criarToast } from "../../_common/Toast.js";

// Validação só para melhorar a experiência; a validação final é do backend.
// Mantenha iguais aos limites da classe Upload e do controller SheepImages (MAX_FILES).
const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO = 5 * 1024 * 1024;
const MAX_ARQUIVOS = 10;

const toast = criarToast();

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatarTamanho(bytes) {
    return bytes >= 1024 * 1024
        ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// Só aceita http(s); evita javascript: e afins
function urlSegura(url) {
    try {
        const { protocol } = new URL(url, window.location.href);
        return protocol === "http:" || protocol === "https:";
    } catch {
        return false;
    }
}

// Abre o modal da ovelha: carrossel com as imagens já salvas, envio de novas
// (com prévia) e remoção da imagem que está sendo exibida.
export function abrirGaleria(ovelha) {
    let service;

    try {
        service = new SheepImageService();
    } catch (error) {
        toast.show("error", error.message);
        return;
    }

    let imagens = [];
    let indice = 0;
    let selecionados = []; // { file, url }
    let carregando = true;
    let erroLista = null;
    let enviando = false;
    let removendo = false;
    let temporizadorRemover = null;

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
        <div class="modal-card galeria-modal" role="dialog" aria-modal="true" aria-labelledby="galeriaTitulo">
            <header class="modal__head">
                <h3 id="galeriaTitulo">Fotos da ovelha ${escapeHTML(ovelha.number)}</h3>
                <button type="button" class="iconbtn modal-fechar" aria-label="Fechar">✕</button>
            </header>
            <div class="modal__body">
                <p class="galeria-vazio" data-el="mensagem" aria-live="polite"></p>

                <div class="carrossel" data-el="carrossel" hidden>
                    <div class="carrossel__palco">
                        <button type="button" class="carrossel__nav carrossel__nav--prev"
                                data-el="anterior" aria-label="Foto anterior">‹</button>
                        <figure class="carrossel__figura">
                            <img data-el="imagem" alt="" />
                            <figcaption data-el="legenda"></figcaption>
                        </figure>
                        <button type="button" class="carrossel__nav carrossel__nav--next"
                                data-el="proxima" aria-label="Próxima foto">›</button>
                    </div>
                    <div class="carrossel__barra">
                        <span class="carrossel__contador" data-el="contador" aria-live="polite"></span>
                        <button type="button" class="carrossel__remover" data-el="remover">Remover esta foto</button>
                    </div>
                    <div class="carrossel__miniaturas" data-el="miniaturas" role="tablist" aria-label="Fotos da ovelha"></div>
                </div>

                <form class="galeria-upload" data-el="form" novalidate>
                    <label class="field">
                        <span>Adicionar fotos</span>
                        <input type="file" data-el="arquivos" class="perfil-file"
                               accept="image/jpeg,image/png,image/webp" multiple />
                    </label>
                    <p class="galeria-hint">JPG, PNG ou WEBP, até 5 MB cada, no máximo ${MAX_ARQUIVOS} por envio.</p>
                    <div class="galeria-previas" data-el="previas"></div>
                    <label class="field">
                        <span>Texto alternativo (opcional)</span>
                        <input type="text" data-el="alt" maxlength="255"
                               placeholder="Ex.: Ovelha de frente, brinco azul" />
                    </label>
                    <p class="galeria-status" data-el="status" role="status" aria-live="polite"></p>
                    <button type="submit" class="btn btn--primary" data-el="enviar" disabled>Enviar fotos</button>
                </form>
            </div>
            <footer class="modal__foot">
                <button type="button" class="btn btn--ghost" data-acao="fechar">Fechar</button>
            </footer>
        </div>
    `;

    const el = nome => overlay.querySelector(`[data-el="${nome}"]`);
    const mensagemEl = el("mensagem");
    const carrossel = el("carrossel");
    const imagemEl = el("imagem");
    const legendaEl = el("legenda");
    const contadorEl = el("contador");
    const botaoAnterior = el("anterior");
    const botaoProxima = el("proxima");
    const botaoRemover = el("remover");
    const miniaturas = el("miniaturas");
    const form = el("form");
    const inputArquivos = el("arquivos");
    const previas = el("previas");
    const inputAlt = el("alt");
    const status = el("status");
    const botaoEnviar = el("enviar");

    // ── Estado e mensagens ────────────────────────────────────────────────

    function mostrarStatus(texto, tipo = "") {
        status.textContent = texto;
        status.classList.toggle("is-erro", tipo === "erro");
        status.classList.toggle("is-ok", tipo === "ok");
    }

    function atualizarBotao() {
        botaoEnviar.disabled = enviando || selecionados.length === 0;
        botaoEnviar.textContent = enviando
            ? "Enviando..."
            : selecionados.length > 1
                ? `Enviar ${selecionados.length} fotos`
                : "Enviar fotos";
    }

    // ── Carrossel (imagens já salvas) ─────────────────────────────────────

    function resetarBotaoRemover() {
        clearTimeout(temporizadorRemover);
        delete botaoRemover.dataset.confirmar;
        botaoRemover.textContent = "Remover esta foto";
        botaoRemover.disabled = removendo;
    }

    function irPara(novoIndice) {
        if (imagens.length === 0) return;
        indice = (novoIndice + imagens.length) % imagens.length; // dá a volta
        resetarBotaoRemover();
        renderCarrossel();
    }

    function renderMiniaturas() {
        miniaturas.replaceChildren();

        imagens.forEach((imagem, i) => {
            const botao = document.createElement("button");
            botao.type = "button";
            botao.className = "carrossel__mini" + (i === indice ? " is-ativa" : "");
            botao.setAttribute("role", "tab");
            botao.setAttribute("aria-selected", String(i === indice));
            botao.setAttribute("aria-label", `Ver foto ${i + 1}`);

            if (urlSegura(imagem.url)) {
                const img = document.createElement("img");
                img.src = imagem.url;
                img.alt = "";
                img.loading = "lazy";
                botao.append(img);
            }

            botao.addEventListener("click", () => irPara(i));
            miniaturas.append(botao);
        });
    }

    function renderCarrossel() {
        if (carregando) {
            carrossel.hidden = true;
            mensagemEl.hidden = false;
            mensagemEl.textContent = "Carregando imagens...";
            return;
        }

        if (erroLista) {
            carrossel.hidden = true;
            mensagemEl.hidden = false;
            mensagemEl.textContent = erroLista;
            return;
        }

        if (imagens.length === 0) {
            carrossel.hidden = true;
            mensagemEl.hidden = false;
            mensagemEl.textContent = "Nenhuma imagem para esta ovelha. Adicione a primeira abaixo.";
            return;
        }

        mensagemEl.hidden = true;
        carrossel.hidden = false;

        indice = Math.min(indice, imagens.length - 1);
        const atual = imagens[indice];

        if (urlSegura(atual.url)) {
            imagemEl.src = atual.url;
        } else {
            imagemEl.removeAttribute("src");
        }
        imagemEl.alt = atual.alt_text || `Foto ${indice + 1} da ovelha ${ovelha.number}`;
        legendaEl.textContent = atual.alt_text || "";
        contadorEl.textContent = `${indice + 1} / ${imagens.length}`;

        const varias = imagens.length > 1;
        botaoAnterior.hidden = !varias;
        botaoProxima.hidden = !varias;
        miniaturas.hidden = !varias;

        renderMiniaturas();
    }

    async function carregarImagens() {
        carregando = true;
        erroLista = null;
        renderCarrossel();

        try {
            imagens = await service.list(ovelha.id);
        } catch (error) {
            console.error("Erro ao carregar imagens:", error);
            erroLista = "Não foi possível carregar as imagens.";
        }

        carregando = false;
        renderCarrossel();
    }

    botaoAnterior.addEventListener("click", () => irPara(indice - 1));
    botaoProxima.addEventListener("click", () => irPara(indice + 1));

    // Primeiro clique pede confirmação; o segundo (em até 3 s) remove
    botaoRemover.addEventListener("click", async () => {
        const imagem = imagens[indice];
        if (!imagem || removendo) return;

        if (!botaoRemover.dataset.confirmar) {
            botaoRemover.dataset.confirmar = "1";
            botaoRemover.textContent = "Clique de novo para confirmar";
            temporizadorRemover = setTimeout(resetarBotaoRemover, 3000);
            return;
        }

        clearTimeout(temporizadorRemover);
        removendo = true;
        botaoRemover.disabled = true;
        botaoRemover.textContent = "Removendo...";

        try {
            await service.remove(ovelha.id, imagem.id);
            imagens = imagens.filter(item => item.id !== imagem.id);
            toast.show("success", "Imagem removida.");
        } catch (error) {
            console.error("Erro ao remover imagem:", error);
            toast.show("error", error.message);
        } finally {
            removendo = false;
            resetarBotaoRemover();
            renderCarrossel(); // o índice é ajustado para a foto seguinte/anterior
        }
    });

    // ── Seleção de novos arquivos (prévia antes do envio) ─────────────────

    function renderPrevias() {
        previas.replaceChildren();

        selecionados.forEach((item, i) => {
            const wrapper = document.createElement("div");
            wrapper.className = "galeria-previa";

            const img = document.createElement("img");
            img.src = item.url; // blob: gerado pelo próprio navegador
            img.alt = `Prévia de ${item.file.name}`;

            const remover = document.createElement("button");
            remover.type = "button";
            remover.className = "galeria-previa__remover";
            remover.textContent = "✕";
            remover.setAttribute("aria-label", `Descartar ${item.file.name}`);
            remover.addEventListener("click", () => {
                URL.revokeObjectURL(item.url);
                selecionados.splice(i, 1);
                renderPrevias();
                atualizarBotao();
            });

            wrapper.append(img, remover);
            previas.append(wrapper);
        });
    }

    function limparSelecao() {
        selecionados.forEach(item => URL.revokeObjectURL(item.url));
        selecionados = [];
        renderPrevias();
        atualizarBotao();
    }

    inputArquivos.addEventListener("change", () => {
        const erros = [];

        for (const file of inputArquivos.files) {
            if (selecionados.length >= MAX_ARQUIVOS) {
                erros.push(`Limite de ${MAX_ARQUIVOS} imagens por envio.`);
                break;
            }
            if (!TIPOS_ACEITOS.includes(file.type)) {
                erros.push(`${file.name}: formato não aceito.`);
                continue;
            }
            if (file.size > TAMANHO_MAXIMO) {
                erros.push(`${file.name}: tem ${formatarTamanho(file.size)} (máximo 5 MB).`);
                continue;
            }
            selecionados.push({ file, url: URL.createObjectURL(file) });
        }

        inputArquivos.value = ""; // permite escolher o mesmo arquivo de novo
        renderPrevias();
        atualizarBotao();
        mostrarStatus(erros.join(" "), erros.length ? "erro" : "");
    });

    // ── Envio ─────────────────────────────────────────────────────────────

    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (enviando || selecionados.length === 0) return;

        enviando = true;
        atualizarBotao();
        mostrarStatus("Enviando fotos...");

        try {
            const quantidadeAntes = imagens.length;

            await service.upload(
                ovelha.id,
                selecionados.map(item => item.file),
                inputAlt.value.trim()
            );

            limparSelecao();
            inputAlt.value = "";
            mostrarStatus("");
            toast.show("success", "Fotos enviadas com sucesso!");

            await carregarImagens();
            indice = Math.min(quantidadeAntes, Math.max(imagens.length - 1, 0)); // primeira foto nova
            renderCarrossel();

        } catch (error) {
            console.error("Erro ao enviar imagens:", error);
            mostrarStatus(error.message, "erro"); // mantém a seleção para tentar de novo
        } finally {
            enviando = false;
            atualizarBotao();
        }
    });

    // ── Abrir / fechar ────────────────────────────────────────────────────

    function fechar() {
        clearTimeout(temporizadorRemover);
        limparSelecao();
        overlay.remove();
        document.body.style.overflow = "";
        document.removeEventListener("keydown", onTecla);
    }

    function onTecla(event) {
        if (event.key === "Escape") {
            fechar();
            return;
        }

        // Setas navegam no carrossel (menos quando o usuário está digitando)
        if (event.target instanceof HTMLInputElement) return;

        if (event.key === "ArrowLeft") irPara(indice - 1);
        if (event.key === "ArrowRight") irPara(indice + 1);
    }

    overlay.addEventListener("click", event => {
        if (event.target === overlay) fechar();
    });
    overlay.querySelector(".modal-fechar").addEventListener("click", fechar);
    overlay.querySelector('[data-acao="fechar"]').addEventListener("click", fechar);
    document.addEventListener("keydown", onTecla);

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    renderCarrossel();
    carregarImagens();
}