import ProfileService from "./ProfileService.js";

// Navbar compartilhada das telas logadas:
//  - coloca a foto do usuário (link para perfil.html) antes do "Sair";
//  - "Sair" limpa a sessão guardada no navegador.

const EMOJI_PADRAO = "👤";

// Só aceita http(s); evita javascript: e afins
function urlSegura(url) {
    try {
        const { protocol } = new URL(url, window.location.href);
        return protocol === "http:" || protocol === "https:";
    } catch {
        return false;
    }
}

function preencherAvatar(elemento, url) {
    elemento.replaceChildren();

    if (url && urlSegura(url)) {
        const img = document.createElement("img");
        img.src = url;
        img.alt = "Meu perfil";
        img.addEventListener("error", () => { elemento.textContent = EMOJI_PADRAO; });
        elemento.append(img);
    } else {
        elemento.textContent = EMOJI_PADRAO;
    }
}

// Atualiza (ou cria) o avatar da navbar a partir da foto salva em localStorage.
// perfil.js chama esta função depois de um upload bem-sucedido.
export function atualizarAvatarNavbar() {
    const nav = document.querySelector(".topbar__nav");
    if (!nav || !localStorage.getItem("token")) return;

    let link = nav.querySelector(".topbar__avatar");

    if (!link) {
        link = document.createElement("a");
        link.href = "perfil.html";
        link.className = "topbar__avatar";
        link.title = "Meu perfil";
        link.setAttribute("aria-label", "Meu perfil");
        if (location.pathname.endsWith("/perfil.html")) {
            link.classList.add("topbar__avatar--ativo");
            link.setAttribute("aria-current", "page");
        }

        const sair = nav.querySelector('a[href="login.html"]');
        nav.insertBefore(link, sair);
    }

    preencherAvatar(link, ProfileService.resolvePublicUrl(localStorage.getItem("photo")));
}

function configurarSair() {
    const sair = document.querySelector('.topbar__nav a[href="login.html"]');
    if (!sair) return;

    sair.addEventListener("click", () => {
        ["token", "usersId", "photo"].forEach(chave => localStorage.removeItem(chave));
    });
}

atualizarAvatarNavbar();
configurarSair();
