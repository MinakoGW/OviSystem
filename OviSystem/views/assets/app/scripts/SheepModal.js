// Modal de cadastro de ovelha (todos os campos), sempre dentro do lote aberto.
// Devolve o objeto pronto para a API (POST /Sheeps/) ou null se o usuário cancelar.
// `parentes` é a lista de ovelhas já carregadas (para escolher mãe/pai, opcional).

const CORES_BRINCO = ["Amarelo", "Azul", "Branco", "Laranja", "Rosa", "Roxo", "Verde", "Vermelho"];

export function pedirNovaOvelha(lote, parentes = []) {
    return new Promise(resolve => {
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        overlay.innerHTML = `
            <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="novaOvelhaTitulo">
                <header class="modal__head">
                    <h3 id="novaOvelhaTitulo">Adicionar ovelha</h3>
                    <button type="button" class="iconbtn modal-fechar" aria-label="Fechar">✕</button>
                </header>
                <div class="modal__body">
                    <div class="form__grid">
                        <label class="field">
                            <span>Lote</span>
                            <input type="text" data-el="lote" readonly />
                        </label>
                        <label class="field">
                            <span>Número da ovelha *</span>
                            <input type="number" data-el="numero" min="1" step="1" placeholder="Ex.: 101" />
                        </label>
                        <label class="field">
                            <span>Sexo</span>
                            <select data-el="sexo">
                                <option value="">Não informado</option>
                                <option value="1">Fêmea</option>
                                <option value="0">Macho</option>
                            </select>
                        </label>
                        <label class="field">
                            <span>Cor do brinco</span>
                            <select data-el="brinco"><option value="">Sem brinco</option></select>
                        </label>
                        <label class="field">
                            <span>Raça</span>
                            <input type="text" data-el="raca" maxlength="100" placeholder="Ex.: Texel" />
                        </label>
                        <label class="field">
                            <span>Data de nascimento</span>
                            <input type="date" data-el="nascimento" />
                        </label>
                    </div>

                    <label class="check">
                        <input type="checkbox" data-el="prenha" disabled />
                        <span>Prenha</span>
                        <small data-el="prenhaDica">(disponível só para fêmeas)</small>
                    </label>

                    <div class="form__divider">Rastreamento genético <span class="badge--opcional">opcional</span></div>
                    <div class="form__grid">
                        <label class="field">
                            <span>Mãe</span>
                            <select data-el="mae"><option value="">Não informada</option></select>
                        </label>
                        <label class="field">
                            <span>Pai</span>
                            <select data-el="pai"><option value="">Não informado</option></select>
                        </label>
                    </div>

                    <p class="galeria-status is-erro" data-el="erro" role="alert"></p>
                </div>
                <footer class="modal__foot">
                    <button type="button" class="btn btn--ghost" data-acao="cancelar">Cancelar</button>
                    <button type="button" class="btn btn--primary" data-acao="salvar">Adicionar</button>
                </footer>
            </div>
        `;

        const el = nome => overlay.querySelector(`[data-el="${nome}"]`);
        const select = el("lote");
        const input = el("numero");
        const sexo = el("sexo");
        const brinco = el("brinco");
        const raca = el("raca");
        const nascimento = el("nascimento");
        const prenhaDica = el("prenhaDica");
        const prenha = el("prenha");
        const mae = el("mae");
        const pai = el("pai");
        const erro = el("erro");

        // Tudo entra via textContent: nenhum HTML vindo da API é interpretado
        // A ovelha sempre entra no lote que está aberto
        select.value = lote.name;

        CORES_BRINCO.forEach(cor => {
            const option = document.createElement("option");
            option.value = cor;
            option.textContent = cor;
            brinco.append(option);
        });

        parentes.forEach(p => {
            const rotulo = p.lote ? `Ovelha ${p.number} (${p.lote})` : `Ovelha ${p.number}`;
            // sex: 1 = fêmea, 0 = macho (quando informado)
            if (p.sex === null || p.sex === undefined || Number(p.sex) === 1) {
                const o = document.createElement("option");
                o.value = p.Id;
                o.textContent = rotulo;
                mae.append(o);
            }
            if (p.sex === null || p.sex === undefined || Number(p.sex) === 0) {
                const o = document.createElement("option");
                o.value = p.Id;
                o.textContent = rotulo;
                pai.append(o);
            }
        });

        // Data de nascimento não pode ser futura
        nascimento.max = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
            .toISOString().slice(0, 10);

        // "Prenha" só pode ser marcada para fêmeas
        sexo.addEventListener("change", () => {
            const femea = sexo.value === "1";
            prenha.disabled = !femea;
            prenhaDica.hidden = femea;
            if (!femea) prenha.checked = false;
        });

        // A mesma ovelha não pode ser mãe e pai: a escolhida em um campo
        // fica indisponível no outro (mãe e pai continuam opcionais)
        function sincronizarPais(origem) {
            // Uma mesma ovelha não pode ocupar os dois papéis.
            // Se a seleção atual criar um conflito, limpa o outro campo.
            if (origem === "mae" && mae.value !== "" && mae.value === pai.value) {
                pai.value = "";
            } else if (origem === "pai" && pai.value !== "" && pai.value === mae.value) {
                mae.value = "";
            }

            // Mantém a opção escolhida em um campo indisponível no outro.
            for (const option of pai.options) {
                option.disabled = option.value !== "" && option.value === mae.value;
            }

            for (const option of mae.options) {
                option.disabled = option.value !== "" && option.value === pai.value;
            }
        }

        mae.addEventListener("change", () => sincronizarPais("mae"));
        pai.addEventListener("change", () => sincronizarPais("pai"));
        sincronizarPais();

        function fechar(valor) {
            overlay.remove();
            document.body.style.overflow = "";
            document.removeEventListener("keydown", onEsc);
            resolve(valor);
        }

        function onEsc(event) {
            if (event.key === "Escape") fechar(null);
        }

        function salvar() {
            const flocksId = Number(lote.id);
            const number = Number(input.value);

            if (!Number.isInteger(flocksId) || flocksId <= 0) {
                erro.textContent = "Lote inválido.";
                return;
            }

            if (input.value.trim() === "" || !Number.isInteger(number) || number <= 0) {
                erro.textContent = "Informe um número inteiro maior que zero.";
                input.focus();
                return;
            }

            if (nascimento.value && nascimento.value > nascimento.max) {
                erro.textContent = "A data de nascimento não pode ser futura.";
                nascimento.focus();
                return;
            }

            // Só envia o que foi preenchido; o backend valida tudo de novo
            const dados = { flocks_id: flocksId, number };
            if (sexo.value !== "") dados.sex = Number(sexo.value);
            if (sexo.value === "1") dados.pregnancy = prenha.checked ? 1 : 0;
            if (brinco.value) dados.eartag = brinco.value;
            if (raca.value.trim()) dados.breed = raca.value.trim();
            if (nascimento.value) dados.birth_date = nascimento.value;
            if (mae.value) dados.mother_id = Number(mae.value);
            if (pai.value) dados.father_id = Number(pai.value);

            fechar(dados);
        }

        overlay.addEventListener("click", event => {
            if (event.target === overlay) fechar(null);
        });
        overlay.querySelector(".modal-fechar").addEventListener("click", () => fechar(null));
        overlay.querySelector('[data-acao="cancelar"]').addEventListener("click", () => fechar(null));
        overlay.querySelector('[data-acao="salvar"]').addEventListener("click", salvar);
        input.addEventListener("keydown", event => {
            if (event.key === "Enter") salvar();
        });
        document.addEventListener("keydown", onEsc);

        document.body.appendChild(overlay);
        document.body.style.overflow = "hidden";
        input.focus();
    });
}