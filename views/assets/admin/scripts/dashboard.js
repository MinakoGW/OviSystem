const USUARIOS = [
  { nome: "João da Silva",      email: "joao@fazendaboavista.com",  fazenda: "Fazenda Boa Vista",  ativo: true,  cadastro: "2024-08-12" },
  { nome: "Maria Oliveira",     email: "maria@estanciaarroio.com",  fazenda: "Estância do Arroio", ativo: true,  cadastro: "2024-09-03" },
  { nome: "Carlos Mendes",      email: "carlos@sitiosaoluis.com",   fazenda: "Sítio São Luís",     ativo: false, cadastro: "2024-11-21" },
  { nome: "Ana Beatriz Souza",  email: "ana@granjaserra.com.br",    fazenda: "Granja Serra",       ativo: true,  cadastro: "2025-01-15" },
  { nome: "Pedro Henrique",     email: "pedro@cabanhaalegre.com",   fazenda: "Cabanha Alegre",     ativo: true,  cadastro: "2025-02-28" },
  { nome: "Lúcia Ferreira",     email: "lucia@chacaravertentes.com",fazenda: "Chácara Vertentes",  ativo: true,  cadastro: "2025-04-09" },
  { nome: "Roberto Câmara",     email: "roberto@fazendacampoverde.com", fazenda: "Campo Verde",    ativo: false, cadastro: "2025-05-22" },
];
const $ = (s) => document.querySelector(s);
const fmtDate = (iso) => { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; };
function render(list) {
  $("#tbodyUsers").innerHTML = list
    .map(
      (u) => `
      <tr>
        <td><strong>${u.nome}</strong></td>
        <td>${u.email}</td>
        <td>${u.fazenda}</td>
        <td><span class="tag ${u.ativo ? "tag--ativo" : "tag--inativo"}">${u.ativo ? "Ativo" : "Inativo"}</span></td>
        <td>${fmtDate(u.cadastro)}</td>
      </tr>`,
    )
    .join("");
}
function renderStats() {
  $("#statUsers").textContent = USUARIOS.length;
  $("#statAtivos").textContent = USUARIOS.filter((u) => u.ativo).length;
  $("#statFazendas").textContent = new Set(USUARIOS.map((u) => u.fazenda)).size;
}
$("#busca").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  render(USUARIOS.filter((u) => u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)));
});
renderStats();
render(USUARIOS);