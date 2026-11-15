import ProfileService from "../../_common/ProfileService.js";
import { criarToast } from "../../_common/Toast.js";
import { atualizarAvatarNavbar } from "../../_common/Navbar.js";

// Validação só para melhorar a experiência; a validação final é do backend.
// Mantenha o tamanho igual ao limite da classe Upload (PHP).
const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO = 5 * 1024 * 1024;

const toast = criarToast();

const form = document.querySelector("#formFoto");
const input = document.querySelector("#fotoArquivo");
const preview = document.querySelector("#fotoPreview");
const resumoAvatar = document.querySelector("#resumoAvatar");
const status = document.querySelector("#fotoStatus");
const botao = document.querySelector("#btnFoto");

const textoPadrao = status.textContent;
const emojiPreview = preview.textContent;
const emojiResumo = resumoAvatar.textContent;

let service = null;
let fotoAtual = null; // URL da foto já salva
let blobUrl = null;   // URL temporária da prévia

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

function mostrarImagem(elemento, url, emoji) {
    elemento.replaceChildren();

    // blob: é a prévia gerada pelo próprio navegador a partir do arquivo escolhido
    const ehPrevia = typeof url === "string" && url.startsWith("blob:");

    if (!url || (!ehPrevia && !urlSegura(url))) {
        elemento.textContent = emoji;
        return;
    }

    const img = document.createElement("img");
    img.src = url;
    img.alt = "Foto do perfil";
    elemento.append(img);
}

function mostrarStatus(texto, tipo = "") {
    status.textContent = texto;
    status.classList.toggle("is-erro", tipo === "erro");
    status.classList.toggle("is-ok", tipo === "ok");
}

function descartarPrevia() {
    if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        blobUrl = null;
    }
}

function restaurarPreview() {
    descartarPrevia();
    mostrarImagem(preview, fotoAtual, emojiPreview);
    mostrarImagem(resumoAvatar, fotoAtual, emojiResumo);
    botao.disabled = true;
}

function aoSelecionarArquivo() {
    const file = input.files[0];

    if (!file) {
        restaurarPreview();
        mostrarStatus(textoPadrao);
        return;
    }

    if (!TIPOS_ACEITOS.includes(file.type)) {
        input.value = "";
        restaurarPreview();
        mostrarStatus("Formato não aceito. Use JPG, PNG ou WEBP.", "erro");
        return;
    }

    if (file.size > TAMANHO_MAXIMO) {
        input.value = "";
        restaurarPreview();
        mostrarStatus(`A imagem tem ${formatarTamanho(file.size)}. O máximo é 5 MB.`, "erro");
        return;
    }

    descartarPrevia();
    blobUrl = URL.createObjectURL(file);
    mostrarImagem(preview, blobUrl, emojiPreview);
    mostrarImagem(resumoAvatar, blobUrl, emojiResumo);
    botao.disabled = false;
    mostrarStatus(`Prévia de ${file.name} (${formatarTamanho(file.size)}). Clique em "Atualizar foto" para confirmar.`);
}

async function enviarFoto(event) {
    event.preventDefault();

    const file = input.files[0];

    if (!file) {
        mostrarStatus("Selecione uma imagem para enviar.", "erro");
        return;
    }

    botao.disabled = true;
    botao.textContent = "Enviando...";
    mostrarStatus("Enviando foto...");

    try {
        const url = await service.uploadPhoto(file);

        fotoAtual = url;
        localStorage.setItem("photo", url);

        input.value = "";
        descartarPrevia();
        mostrarImagem(preview, fotoAtual, emojiPreview);
        mostrarImagem(resumoAvatar, fotoAtual, emojiResumo);
        atualizarAvatarNavbar();

        mostrarStatus("Foto atualizada com sucesso.", "ok");
        toast.show("success", "Foto atualizada com sucesso!");
        botao.textContent = "Atualizar foto";
        // botão fica desabilitado até uma nova seleção

    } catch (error) {
        console.error("Erro ao enviar foto:", error);
        mostrarStatus(error.message, "erro");
        botao.disabled = false;
        botao.textContent = "Atualizar foto";
    }
}

// ── Dados pessoais e senha ───────────────────────────────────────────────

const formDados = document.querySelector("#formDados");
const formSenha = document.querySelector("#formSenha");
const dadosStatus = document.querySelector("#dadosStatus");
const senhaStatus = document.querySelector("#senhaStatus");
const btnDados = document.querySelector("#btnDados");
const btnSenha = document.querySelector("#btnSenha");
const tituloResumo = document.querySelector(".perfil-resumo h2");

function mostrarMensagem(elemento, texto, tipo = "") {
    elemento.textContent = texto;
    elemento.classList.toggle("is-erro", tipo === "erro");
    elemento.classList.toggle("is-ok", tipo === "ok");
}

function preencherDados(dados) {
    formDados.elements["nome"].value = dados.name ?? "";
    formDados.elements["email"].value = dados.email ?? "";
    formDados.elements["nome_fazenda"].value = dados.farm ?? "";
    if (dados.name) tituloResumo.textContent = dados.name;
}

async function carregarDados() {
    try {
        const dados = await service.getMe();
        preencherDados(dados);

        // A API é a fonte da foto: mantém navbar e perfil em dia mesmo sem novo login
        if (dados.photo) {
            localStorage.setItem("photo", dados.photo);
            fotoAtual = ProfileService.resolvePublicUrl(dados.photo);
            if (!blobUrl) mostrarImagem(preview, fotoAtual, emojiPreview);
            mostrarImagem(resumoAvatar, fotoAtual, emojiResumo);
            atualizarAvatarNavbar();
        }
    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        mostrarMensagem(dadosStatus, error.message, "erro");
    }
}

async function salvarDados(event) {
    event.preventDefault();

    const name = formDados.elements["nome"].value.trim();
    const email = formDados.elements["email"].value.trim();
    const farm = formDados.elements["nome_fazenda"].value.trim();

    if (!name || !email || !farm) {
        mostrarMensagem(dadosStatus, "Preencha nome, e-mail e fazenda.", "erro");
        return;
    }

    btnDados.disabled = true;
    btnDados.textContent = "Salvando...";
    mostrarMensagem(dadosStatus, "Salvando dados...");

    try {
        const dados = await service.updateData({ name, email, farm });
        preencherDados(dados);
        mostrarMensagem(dadosStatus, "Dados atualizados com sucesso.", "ok");
        toast.show("success", "Dados atualizados com sucesso!");
    } catch (error) {
        console.error("Erro ao salvar dados:", error);
        mostrarMensagem(dadosStatus, error.message, "erro");
    } finally {
        btnDados.disabled = false;
        btnDados.textContent = "Salvar dados";
    }
}

async function salvarSenha(event) {
    event.preventDefault();

    const atual = formSenha.elements["senha_atual"].value;
    const nova = formSenha.elements["nova_senha"].value;
    const confirmar = formSenha.elements["confirmar_senha"].value;

    if (!atual || !nova || !confirmar) {
        mostrarMensagem(senhaStatus, "Preencha os três campos.", "erro");
        return;
    }
    if (nova.length < 8) {
        mostrarMensagem(senhaStatus, "A nova senha deve ter pelo menos 8 caracteres.", "erro");
        return;
    }
    if (nova !== confirmar) {
        mostrarMensagem(senhaStatus, "A confirmação não é igual à nova senha.", "erro");
        return;
    }

    btnSenha.disabled = true;
    btnSenha.textContent = "Atualizando...";
    mostrarMensagem(senhaStatus, "Atualizando senha...");

    try {
        await service.changePassword(atual, nova);
        formSenha.reset();
        mostrarMensagem(senhaStatus, "Senha atualizada com sucesso.", "ok");
        toast.show("success", "Senha atualizada com sucesso!");
    } catch (error) {
        console.error("Erro ao atualizar senha:", error);
        mostrarMensagem(senhaStatus, error.message, "erro");
    } finally {
        btnSenha.disabled = false;
        btnSenha.textContent = "Atualizar senha";
    }
}

function iniciar() {
    try {
        service = new ProfileService();
    } catch {
        window.location.href = "login.html";
        return;
    }

    // Foto já salva (o login guarda o caminho em localStorage "photo")
    fotoAtual = ProfileService.resolvePublicUrl(localStorage.getItem("photo"));
    mostrarImagem(preview, fotoAtual, emojiPreview);
    mostrarImagem(resumoAvatar, fotoAtual, emojiResumo);

    input.addEventListener("change", aoSelecionarArquivo);
    form.addEventListener("submit", enviarFoto);
    formDados.addEventListener("submit", salvarDados);
    formSenha.addEventListener("submit", salvarSenha);
    carregarDados();
}

iniciar();