// ══════════════════════════════════════════════════════════════════════════════
// HISTÓRICO VETERINÁRIO — OviSystem
// ══════════════════════════════════════════════════════════════════════════════

// ── Dados da ovelha (opcionais — vêm do fluxo de lotes.js) ───────────────────
const ovelhaId = +sessionStorage.getItem("oviHistoricoId") || 0;
const OVELHAS  = JSON.parse(sessionStorage.getItem("oviOvelhas") || "[]");
const LOTES    = JSON.parse(sessionStorage.getItem("oviLotes")   || "[]");

// ── Persistência ──────────────────────────────────────────────────────────────
const CATEGORIAS = ["vacinas", "feridas", "doencas", "vermifugacoes", "tratamentos"];

function getRegistros(cat) {
  try { return JSON.parse(sessionStorage.getItem(`${cat}_${ovelhaId}`) || "[]"); }
  catch { return []; }
}
function salvarRegistros(cat, lista) {
  sessionStorage.setItem(`${cat}_${ovelhaId}`, JSON.stringify(lista));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

function val(id) {
  return (document.getElementById(id)?.value ?? "").trim();
}

function badgeGravidade(v) {
  const map = { leve: "Leve", moderado: "Moderada", grave: "Grave" };
  return v && map[v] ? `<span class="badge badge--${v}">${map[v]}</span>` : "—";
}
function badgeFerida(v) {
  const map = { aberta: "Aberta", cicatrizando: "Cicatrizando", curada: "Curada" };
  return v && map[v] ? `<span class="badge badge--${v}">${map[v]}</span>` : "—";
}
function badgeDoenca(v) {
  const map = { ativa: "Ativa", recuperado: "Recuperado", cronico: "Crônica" };
  return v && map[v] ? `<span class="badge badge--${v}">${map[v]}</span>` : "—";
}

// ── Preenche cabeçalho da ovelha se vier do fluxo normal ─────────────────────
function iniciarCabecalho() {
  const o = OVELHAS.find(x => x.id === ovelhaId);
  if (!o) return;

  document.getElementById("hv-header-generico").style.display = "none";
  document.getElementById("hv-header-ovelha").style.display  = "block";

  const nomeLote = LOTES.find(l => l.id === o.lote)?.nome ?? "—";
  document.getElementById("hv-avatar").textContent = (o.sexo === "Macho" ? "♂" : "♀") + (o.prenha ? " 🤰" : "");
  document.getElementById("hv-codigo").textContent = `#${o.codigo}`;
  document.getElementById("hv-sub").textContent    = `${o.raca} · ${o.sexo} · ${nomeLote}`;

  const paiNome = (() => { const p = OVELHAS.find(x => x.id === o.paiId); return p ? `#${p.codigo} (${p.raca})` : null; })();
  const maeNome = (() => { const m = OVELHAS.find(x => x.id === o.maeId); return m ? `#${m.codigo} (${m.raca})` : null; })();

  document.getElementById("hv-ficha").innerHTML = `
    <div class="hv-ficha__item">
      <span class="hv-ficha__label">Nascimento</span>
      <span class="hv-ficha__value">${o.nascimento ? fmtDate(o.nascimento) : "—"}</span>
    </div>
    <div class="hv-ficha__item">
      <span class="hv-ficha__label">🐏 Pai</span>
      <span class="hv-ficha__value">${paiNome ?? '<em class="muted">Não identificado</em>'}</span>
    </div>
    <div class="hv-ficha__item">
      <span class="hv-ficha__label">🐑 Mãe</span>
      <span class="hv-ficha__value">${maeNome ?? '<em class="muted">Não identificada</em>'}</span>
    </div>
    ${o.sexo === "Fêmea" ? `
    <div class="hv-ficha__item">
      <span class="hv-ficha__label">Situação</span>
      <span class="hv-ficha__value">${o.prenha
        ? '<span class="badge--prenha">🤰 Prenha</span>'
        : '<span class="muted">Não prenha</span>'}</span>
    </div>` : ""}
  `;
}

// ── Abas ──────────────────────────────────────────────────────────────────────
document.querySelectorAll(".hv-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".hv-tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".hv-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
  });
});

// ── Renderiza lista de uma categoria ─────────────────────────────────────────
function renderLista(cat) {
  const lista     = getRegistros(cat);
  const container = document.getElementById(`lista-${cat}`);
  const count     = document.getElementById(`count-${cat}`);
  if (count) count.textContent = lista.length;

  if (!lista.length) {
    const icones = { vacinas: "💉", feridas: "🩹", doencas: "🦠", vermifugacoes: "🧴", tratamentos: "💊" };
    const textos = {
      vacinas:       "Nenhuma vacinação registrada ainda.",
      feridas:       "Nenhuma ferida ou lesão registrada.",
      doencas:       "Nenhuma doença registrada.",
      vermifugacoes: "Nenhuma vermifugação registrada.",
      tratamentos:   "Nenhum tratamento registrado.",
    };
    container.innerHTML = `<div class="hv-vazio"><div class="hv-vazio__icon">${icones[cat]}</div><p>${textos[cat]}</p></div>`;
    return;
  }

  container.innerHTML = `
    <table class="hv-tabela">
      <thead>${cabecalho(cat)}</thead>
      <tbody>
        ${lista.map((r, i) => `
          <tr class="${r.concluido ? "hv-row--concluido" : ""}">
            ${linhas(cat, r)}
            <td class="hv-acoes">
              <button class="btn btn--concluido btn--sm ${r.concluido ? "btn--concluido--ativo" : ""}"
                      data-toggle="${cat}" data-index="${i}"
                      title="${r.concluido ? "Desfazer conclusão" : "Marcar como concluído"}">
                ${r.concluido ? "✓ Concluído" : "Concluir"}
              </button>
              <button class="btn btn--danger btn--sm" data-remover="${cat}" data-index="${i}">✕</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  // Toggle concluído
  container.querySelectorAll("[data-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const l = getRegistros(btn.dataset.toggle);
      l[+btn.dataset.index].concluido = !l[+btn.dataset.index].concluido;
      salvarRegistros(btn.dataset.toggle, l);
      renderLista(btn.dataset.toggle);
    });
  });

  // Remoção
  container.querySelectorAll("[data-remover]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!confirm("Remover este registro?")) return;
      const l = getRegistros(btn.dataset.remover);
      l.splice(+btn.dataset.index, 1);
      salvarRegistros(btn.dataset.remover, l);
      renderLista(btn.dataset.remover);
    });
  });
}

function cabecalho(cat) {
  const map = {
    vacinas:       "<tr><th>Vacina / Medicamento</th><th>Data</th><th>Dose</th><th>Aplicador</th><th>Observações</th><th></th></tr>",
    feridas:       "<tr><th>Descrição</th><th>Local</th><th>Data</th><th>Gravidade</th><th>Situação</th><th>Tratamento</th><th>Obs.</th><th></th></tr>",
    doencas:       "<tr><th>Doença / Diagnóstico</th><th>Início</th><th>Fim</th><th>Situação</th><th>Veterinário</th><th>Tratamento</th><th>Obs.</th><th></th></tr>",
    vermifugacoes: "<tr><th>Produto</th><th>Data</th><th>Dose</th><th>Via</th><th>Próxima</th><th>Aplicador</th><th>Obs.</th><th></th></tr>",
    tratamentos:   "<tr><th>Tratamento</th><th>Medicamento</th><th>Início</th><th>Fim</th><th>Dose / Freq.</th><th>Veterinário</th><th>Obs.</th><th></th></tr>",
  };
  return map[cat];
}

function trunc(txt) {
  return `<td class="hv-cell-trunc" title="${txt || ""}">${txt || "—"}</td>`;
}

function linhas(cat, r) {
  if (cat === "vacinas") return `
    <td><strong>${r.vacina}</strong></td>
    <td>${fmtDate(r.data)}</td>
    <td>${r.dose || "—"}</td>
    <td>${r.aplicador || "—"}</td>
    ${trunc(r.obs)}
  `;
  if (cat === "feridas") return `
    <td><strong>${r.descricao}</strong></td>
    <td>${r.local || "—"}</td>
    <td>${fmtDate(r.data)}</td>
    <td>${badgeGravidade(r.gravidade)}</td>
    <td>${badgeFerida(r.situacao)}</td>
    ${trunc(r.tratamento)}
    ${trunc(r.obs)}
  `;
  if (cat === "doencas") return `
    <td><strong>${r.doenca}</strong></td>
    <td>${fmtDate(r.dataInicio)}</td>
    <td>${fmtDate(r.dataFim)}</td>
    <td>${badgeDoenca(r.situacao)}</td>
    <td>${r.veterinario || "—"}</td>
    ${trunc(r.tratamento)}
    ${trunc(r.obs)}
  `;
  if (cat === "vermifugacoes") return `
    <td><strong>${r.produto}</strong></td>
    <td>${fmtDate(r.data)}</td>
    <td>${r.dose || "—"}</td>
    <td>${r.via || "—"}</td>
    <td>${fmtDate(r.proxima)}</td>
    <td>${r.aplicador || "—"}</td>
    ${trunc(r.obs)}
  `;
  if (cat === "tratamentos") return `
    <td><strong>${r.tratamento}</strong></td>
    <td>${r.medicamento || "—"}</td>
    <td>${fmtDate(r.dataInicio)}</td>
    <td>${fmtDate(r.dataFim)}</td>
    <td>${r.doseFreq || "—"}</td>
    <td>${r.veterinario || "—"}</td>
    ${trunc(r.obs)}
  `;
}

// ── Registro de cada categoria ────────────────────────────────────────────────
function bindRegistros() {

  document.getElementById("btn-registrar-vacinas").addEventListener("click", () => {
    const vacina = val("fVacina-vacinas"), data = val("fData-vacinas");
    if (!vacina || !data) { alert("Vacina/Medicamento e Data são obrigatórios."); return; }
    const l = getRegistros("vacinas");
    l.unshift({ vacina, data, dose: val("fDose-vacinas"), aplicador: val("fAplicador-vacinas"), obs: val("fObs-vacinas"), concluido: false });
    salvarRegistros("vacinas", l);
    limpar(["fVacina-vacinas","fData-vacinas","fDose-vacinas","fAplicador-vacinas","fObs-vacinas"]);
    renderLista("vacinas");
  });

  document.getElementById("btn-registrar-feridas").addEventListener("click", () => {
    const descricao = val("fDesc-feridas"), data = val("fData-feridas");
    if (!descricao || !data) { alert("Descrição e Data são obrigatórios."); return; }
    const l = getRegistros("feridas");
    l.unshift({ descricao, data, local: val("fLocal-feridas"), gravidade: val("fGravidade-feridas"), situacao: val("fSituacao-feridas"), tratamento: val("fTratamento-feridas"), obs: val("fObs-feridas"), concluido: false });
    salvarRegistros("feridas", l);
    limpar(["fDesc-feridas","fData-feridas","fLocal-feridas","fGravidade-feridas","fSituacao-feridas","fTratamento-feridas","fObs-feridas"]);
    renderLista("feridas");
  });

  document.getElementById("btn-registrar-doencas").addEventListener("click", () => {
    const doenca = val("fDoenca-doencas"), dataInicio = val("fDataInicio-doencas");
    if (!doenca || !dataInicio) { alert("Doença e Data de início são obrigatórios."); return; }
    const l = getRegistros("doencas");
    l.unshift({ doenca, dataInicio, dataFim: val("fDataFim-doencas"), situacao: val("fSituacao-doencas"), veterinario: val("fVet-doencas"), tratamento: val("fTratamento-doencas"), obs: val("fObs-doencas"), concluido: false });
    salvarRegistros("doencas", l);
    limpar(["fDoenca-doencas","fDataInicio-doencas","fDataFim-doencas","fSituacao-doencas","fVet-doencas","fTratamento-doencas","fObs-doencas"]);
    renderLista("doencas");
  });

  document.getElementById("btn-registrar-vermifugacoes").addEventListener("click", () => {
    const produto = val("fProduto-vermifugacoes"), data = val("fData-vermifugacoes");
    if (!produto || !data) { alert("Produto e Data são obrigatórios."); return; }
    const l = getRegistros("vermifugacoes");
    l.unshift({ produto, data, proxima: val("fProxima-vermifugacoes"), dose: val("fDose-vermifugacoes"), via: val("fVia-vermifugacoes"), aplicador: val("fAplicador-vermifugacoes"), obs: val("fObs-vermifugacoes"), concluido: false });
    salvarRegistros("vermifugacoes", l);
    limpar(["fProduto-vermifugacoes","fData-vermifugacoes","fProxima-vermifugacoes","fDose-vermifugacoes","fVia-vermifugacoes","fAplicador-vermifugacoes","fObs-vermifugacoes"]);
    renderLista("vermifugacoes");
  });

  document.getElementById("btn-registrar-tratamentos").addEventListener("click", () => {
    const tratamento = val("fTratamento-tratamentos"), dataInicio = val("fDataInicio-tratamentos");
    if (!tratamento || !dataInicio) { alert("Tipo de tratamento e Data de início são obrigatórios."); return; }
    const l = getRegistros("tratamentos");
    l.unshift({ tratamento, medicamento: val("fMed-tratamentos"), dataInicio, dataFim: val("fDataFim-tratamentos"), doseFreq: val("fDoseFreq-tratamentos"), veterinario: val("fVet-tratamentos"), obs: val("fObs-tratamentos"), concluido: false });
    salvarRegistros("tratamentos", l);
    limpar(["fTratamento-tratamentos","fMed-tratamentos","fDataInicio-tratamentos","fDataFim-tratamentos","fDoseFreq-tratamentos","fVet-tratamentos","fObs-tratamentos"]);
    renderLista("tratamentos");
  });
}

function limpar(ids) {
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
}

// ── Init ──────────────────────────────────────────────────────────────────────
iniciarCabecalho();
CATEGORIAS.forEach(cat => renderLista(cat));
bindRegistros();
