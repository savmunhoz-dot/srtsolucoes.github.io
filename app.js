// app.js

let db = JSON.parse(localStorage.getItem("db")) || {
  categorias: [],
  lista: []
};

// ---------------- CORE ----------------
function salvar() {
  localStorage.setItem("db", JSON.stringify(db));
}

function render() {
  renderItens();
  renderLista();
}

// ---------------- LIMPAR LISTA ----------------
function limparLista() {
  if (!confirm("Deseja realmente limpar toda a lista?")) return;

  db.lista = [];
  salvar();
  renderLista();
}

// ---------------- HELPERS ----------------
function getAtual(catIndex, caminho) {
  let atual = db.categorias[catIndex];
  if (!atual) {
    console.error("Categoria principal não encontrada no índice:", catIndex);
    return null;
  }
  for (let i = 0; i < caminho.length; i++) {
    const subIndex = caminho[i];
    if (!atual || !atual.subcategorias || atual.subcategorias[subIndex] === undefined) {
      console.error("Caminho inválido ou subcategoria não encontrada:", catIndex, caminho, i, atual);
      return null;
    }
    atual = atual.subcategorias[subIndex];
  }
  return atual;
}

function getNomeCaminho(catIndex, caminho) {
  if (catIndex === undefined || !db.categorias[catIndex]) {
    return "Caminho Inválido";
  }

  let nomes = [db.categorias[catIndex].nome];
  let atual = db.categorias[catIndex];

  for (let i = 0; i < caminho.length; i++) {
    const subIndex = caminho[i];
    if (!atual || !atual.subcategorias || atual.subcategorias[subIndex] === undefined) {
      console.error("Caminho inválido para getNomeCaminho:", catIndex, caminho, i, atual);
      return "Caminho Inválido";
    }
    atual = atual.subcategorias[subIndex];
    nomes.push(atual.nome);
  }

  return nomes.join(" > ");
}

// ---------------- CATEGORIAS ----------------
function renderItens() {
  const div = document.getElementById("itens");
  div.innerHTML = "";

  if (db.categorias.length === 0) {
    div.innerHTML = "<p style='text-align: center; color: #94a3b8;'>Nenhuma categoria adicionada.</p>";
    return;
  }

  db.categorias.forEach((cat, i) => {
    div.innerHTML += `
      <div class="lista-item">
        <span onclick="abrirModal(${i}, [])">📁 ${cat.nome}</span>
        <div>
          <button onclick="editarCategoria(${i})">✏️</button>
          <button class="delete" onclick="excluirCategoria(${i})">🗑️</button>
        </div>
      </div>
    `;
  });
}

function addCategoria() {
  const input = document.getElementById("categoriaInput");
  const nome = input.value.trim();
  if (!nome) {
    alert("O nome da categoria não pode ser vazio.");
    return;
  }

  db.categorias.push({
    nome: nome,
    subcategorias: [],
    itens: []
  });

  input.value = "";
  salvar();
  render();
}

function editarCategoria(i) {
  const novo = prompt("Novo nome para a categoria:", db.categorias[i].nome);
  if (!novo || novo.trim() === "") {
    if (novo !== null) alert("O nome da categoria não pode ser vazio.");
    return;
  }

  db.categorias[i].nome = novo.trim();
  salvar();
  render();
}

function excluirCategoria(i) {
  if (!confirm("Excluir categoria? Isso removerá todas as subcategorias e itens dentro dela de forma irreversível.")) return;

  db.categorias.splice(i, 1);
  salvar();
  render();
}

// ---------------- MODAL (CATEGORIA/SUBCATEGORIA DETALHES) ----------------
function abrirModal(catIndex, caminho) {
  const modal = document.getElementById("modal");
  const conteudo = document.getElementById("modalConteudo");
  const modalTitulo = document.getElementById("modalTitulo");
  const modalFooter = document.getElementById("modalFooter"); // Novo footer para botões

  const atual = getAtual(catIndex, caminho);
  if (!atual) {
    fecharModal();
    return;
  }
  modalTitulo.textContent = getNomeCaminho(catIndex, caminho);

  let htmlConteudo = "";

  // Subcategorias
  if (atual.subcategorias.length > 0) {
    htmlConteudo += `<h3>Subcategorias:</h3>`;
    atual.subcategorias.forEach((sub, i) => {
      htmlConteudo += `<div class="lista-item">
        <span onclick='abrirModal(${catIndex}, ${JSON.stringify([...caminho, i])})'>📁 ${sub.nome}</span>
        <div>
          <button onclick="editarSubcategoria(${catIndex}, ${JSON.stringify([...caminho, i])})">✏️</button>
          <button class="delete" onclick="excluirSubcategoria(${catIndex}, ${JSON.stringify([...caminho, i])})">🗑️</button>
        </div>
      </div>`;
    });
  } else {
    htmlConteudo += `<p style='text-align: center; color: #94a3b8;'>Nenhuma subcategoria nesta pasta.</p>`;
  }

  htmlConteudo += `<hr style="border-color: #334155; margin: 15px 0;">`; // Separador

  // Itens
  if (atual.itens.length > 0) {
    htmlConteudo += `<h3>Itens:</h3>`;
    atual.itens.forEach(item => {
      // Alterado para não fechar o modal após adicionar à lista
      htmlConteudo += `<div class="lista-item">
        <span onclick='addLista(${catIndex}, ${JSON.stringify(caminho)}, ${JSON.stringify(item)})'>📌 ${item.nome} (${item.unidade})</span>
        <div>
          <button onclick="editarItem(${catIndex}, ${JSON.stringify(caminho)}, '${item.id}')">✏️</button>
          <button class="delete" onclick="excluirItem(${catIndex}, ${JSON.stringify(caminho)}, '${item.id}')">🗑️</button>
        </div>
      </div>`;
    });
  } else {
    htmlConteudo += `<p style='text-align: center; color: #94a3b8;'>Nenhum item nesta pasta.</p>`;
  }

  conteudo.innerHTML = htmlConteudo;

  // Botões do footer
  let htmlFooter = ``;
  if (caminho.length > 0) { // Se não é a categoria principal
    const parentCaminho = JSON.stringify(caminho.slice(0, -1));
    htmlFooter += `<button onclick='abrirModal(${catIndex}, ${parentCaminho})' class="btn-voltar">⬅ Voltar</button>`;
  } else { // Se é a categoria principal
    htmlFooter += `<button onclick='fecharModal()' class="btn-voltar">✕ Fechar</button>`;
  }
  htmlFooter += `<button onclick='addSubcategoria(${catIndex}, ${JSON.stringify(caminho)})'>+ Add Subcategoria</button>`;
  htmlFooter += `<button onclick='promptAddItem(${catIndex}, ${JSON.stringify(caminho)})'>+ Add Item</button>`; // Chamada para nova função
  
  modalFooter.innerHTML = htmlFooter; // Renderiza os botões no footer
  modal.style.display = "flex";
}

// Nova função para pedir nome e unidade do item
function promptAddItem(catIndex, caminho) {
    const nome = prompt("Nome do novo item:");
    if (!nome || nome.trim() === "") {
        if (nome !== null) alert("O nome do item não pode ser vazio.");
        return;
    }

    let unidade = prompt("Unidade (ex: m, pç, cx):", "pç");
    if (!unidade || unidade.trim() === "") {
        unidade = "pç"; // Valor padrão se vazio
    }

    addItem(catIndex, caminho, nome, unidade);
}


function fecharModal() {
  document.getElementById("modal").style.display = "none";
}

function addSubcategoria(catIndex, caminho) {
  const nome = prompt("Nome da nova subcategoria:");
  if (!nome || nome.trim() === "") {
    if (nome !== null) alert("O nome da subcategoria não pode ser vazio.");
    return;
  }

  const atual = getAtual(catIndex, caminho);
  if (atual) {
    atual.subcategorias.push({
      nome: nome.trim(),
      subcategorias: [],
      itens: []
    });
    salvar();
    abrirModal(catIndex, caminho); // Re-renderiza o modal para mostrar a nova subcategoria
  }
}

function editarSubcategoria(catIndex, caminho) {
  const subIndex = caminho[caminho.length - 1];
  const parentCaminho = caminho.slice(0, -1);
  const parent = getAtual(catIndex, parentCaminho);

  if (parent && parent.subcategorias[subIndex]) {
    const novo = prompt("Novo nome da subcategoria:", parent.subcategorias[subIndex].nome);
    if (!novo || novo.trim() === "") {
      if (novo !== null) alert("O nome da subcategoria não pode ser vazio.");
      return;
    }
    parent.subcategorias[subIndex].nome = novo.trim();
    salvar();
    abrirModal(catIndex, caminho); // Re-renderiza o modal para mostrar a subcategoria atualizada
  }
}

function excluirSubcategoria(catIndex, caminho) {
  if (!confirm("Excluir subcategoria? Isso removerá todas as subcategorias e itens dentro dela de forma irreversível.")) return;

  const subIndex = caminho[caminho.length - 1];
  const parentCaminho = caminho.slice(0, -1);
  const parent = getAtual(catIndex, parentCaminho);

  if (parent && parent.subcategorias[subIndex]) {
    parent.subcategorias.splice(subIndex, 1);
    salvar();
    abrirModal(catIndex, parentCaminho); // Re-renderiza o modal para mostrar o estado atual
  }
}

// Alterada a função addItem para receber nome e unidade
function addItem(catIndex, caminho, nome, unidade) {
  const atual = getAtual(catIndex, caminho);
  if (atual) {
    atual.itens.push({
      id: crypto.randomUUID(),
      nome: nome.trim(),
      unidade: unidade.trim()
    });
    salvar();
    abrirModal(catIndex, caminho); // Re-renderiza o modal para mostrar o novo item
  }
}

function editarItem(catIndex, caminho, itemId) {
  const atual = getAtual(catIndex, caminho);
  if (atual) {
    const item = atual.itens.find(i => i.id === itemId);
    if (item) {
      const novoNome = prompt("Novo nome do item:", item.nome);
      if (!novoNome || novoNome.trim() === "") {
        if (novoNome !== null) alert("O nome do item não pode ser vazio.");
        return;
      }
      
      let novaUnidade = prompt("Nova unidade (ex: m, pç, cx):", item.unidade);
      if (!novaUnidade || novaUnidade.trim() === "") {
        novaUnidade = "pç"; // Valor padrão se vazio
      }

      item.nome = novoNome.trim();
      item.unidade = novaUnidade.trim();
      salvar();
      abrirModal(catIndex, caminho); // Re-renderiza o modal para mostrar o item atualizado
    }
  }
}

function excluirItem(catIndex, caminho, itemId) {
  if (!confirm("Excluir item? Esta ação não pode ser desfeita.")) return;

  const atual = getAtual(catIndex, caminho);
  if (atual) {
    atual.itens = atual.itens.filter(i => i.id !== itemId);
    salvar();
    abrirModal(catIndex, caminho); // Re-renderiza o modal para mostrar o estado atual
  }
}

// ---------------- BUSCA GLOBAL ----------------
function coletarTodosItens() {
  let lista = [];

  function percorrer(catIndex, categoriaAtual, caminhoAtual) {
    if (!categoriaAtual) return;

    categoriaAtual.itens.forEach(item => {
      lista.push({
        ...item,
        catIndex: catIndex,
        caminhoIndex: caminhoAtual,
        caminhoNome: getNomeCaminho(catIndex, caminhoAtual)
      });
    });

    categoriaAtual.subcategorias.forEach((sub, i) => {
      percorrer(catIndex, sub, [...caminhoAtual, i]);
    });
  }

  db.categorias.forEach((cat, i) => {
    percorrer(i, cat, []);
  });

  return lista;
}

function abrirBuscaGlobal() {
  const inputBusca = document.getElementById("buscaInputGlobal");
  const termo = inputBusca.value.toLowerCase().trim();
  const divResultado = document.getElementById("resultadoBusca");

  divResultado.innerHTML = "";

  if (termo.length < 2) {
      divResultado.innerHTML = "<p style='text-align: center; color: #94a3b8;'>Digite pelo menos 2 caracteres para buscar.</p>";
      document.getElementById("modalBusca").style.display = "flex";
      return;
  }

  const resultados = coletarTodosItens()
    .filter(i => i.nome.toLowerCase().includes(termo));

  if (resultados.length === 0) {
      divResultado.innerHTML = "<p style='text-align: center; color: #94a3b8;'>Nenhum resultado encontrado para '" + termo + "'.</p>";
  } else {
      resultados.forEach(item => {
        divResultado.innerHTML += `
          <div class="lista-item">
            <span onclick='addLista(${item.catIndex}, ${JSON.stringify(item.caminhoIndex)}, ${JSON.stringify(item)});'>
              📌 ${item.nome} (${item.unidade})<br>
              <small>${item.caminhoNome}</small>
            </span>
          </div>
        `;
      });
  }

  document.getElementById("modalBusca").style.display = "flex";
}

function fecharBusca() {
  document.getElementById("modalBusca").style.display = "none";
  document.getElementById("buscaInputGlobal").value = "";
  document.getElementById("resultadoBusca").innerHTML = "";
}

// ---------------- MINHA LISTA AGRUPADA ----------------
function addLista(catIndex, caminho, item) {
  const caminhoNome = getNomeCaminho(catIndex, caminho);

  // Encontra um item existente na lista com o mesmo ID para incrementar a quantidade
  // ou com o mesmo nome e unidade se o ID ainda não existir para itens antigos
  let existente = db.lista.find(i => i.id === item.id);

  if (existente) {
      existente.qtd++;
  } else {
      // Para itens recém-adicionados que já possuem unidade
      db.lista.push({ ...item, caminho: caminhoNome, qtd: 1 });
  }

  salvar();
  renderLista();
}

function renderLista() {
  const div = document.getElementById("lista");
  div.innerHTML = "";

  const grupos = {};
  db.lista.forEach(item => {
    if (!grupos[item.caminho]) grupos[item.caminho] = [];
    grupos[item.caminho].push(item);
  });

  if (Object.keys(grupos).length === 0) {
      div.innerHTML = "<p style='text-align: center; color: #94a3b8;'>Sua lista de materiais está vazia.</p>";
      return;
  }

  Object.keys(grupos).sort().forEach(caminho => {
    const groupId = `grupo-${caminho.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
    const isHidden = localStorage.getItem(groupId) === 'true';
    const hiddenClass = isHidden ? 'hidden' : '';
    const toggleIconChar = isHidden ? '▶' : '▼';

    let grupoHtml = `
      <div class="grupo">
        <div class="grupo-titulo" onclick="toggleGrupo('${groupId}')">
          <span class="toggle-icon">${toggleIconChar}</span> ${caminho}
        </div>
        <div id="${groupId}" class="grupo-conteudo ${hiddenClass}">
    `;

    grupos[caminho].sort((a, b) => a.nome.localeCompare(b.nome)).forEach(item => {
      grupoHtml += `
        <div class="lista-item">
          <span>${item.nome} (${item.qtd} ${item.unidade})</span>
          <div>
            <button onclick="menos('${item.id}')">-</button>
            <button onclick="mais('${item.id}')">+</button>
            <button class="delete" onclick="remover('${item.id}')">🗑️</button>
          </div>
        </div>`;
    });

    grupoHtml += `</div></div>`;
    div.innerHTML += grupoHtml;
  });
}

function toggleGrupo(groupId) {
  const grupoConteudo = document.getElementById(groupId);
  if (!grupoConteudo) {
      console.error("Elemento grupoConteudo não encontrado para ID:", groupId);
      return;
  }
  const toggleIcon = grupoConteudo.previousElementSibling.querySelector('.toggle-icon');

  if (grupoConteudo.classList.contains('hidden')) {
    grupoConteudo.classList.remove('hidden');
    toggleIcon.textContent = '▼';
    localStorage.setItem(groupId, 'false');
  } else {
    grupoConteudo.classList.add('hidden');
    toggleIcon.textContent = '▶';
    localStorage.setItem(groupId, 'true');
  }
}

function mais(id) {
  const item = db.lista.find(i => i.id === id);
  if (item) {
      item.qtd++;
      salvar();
      renderLista();
  }
}

function menos(id) {
  const item = db.lista.find(i => i.id === id);
  if (item) {
      if (item.qtd > 1) {
          item.qtd--;
      } else {
          remover(id);
          return;
      }
      salvar();
      renderLista();
  }
}

function remover(id) {
  if (!confirm("Deseja remover este item da lista?")) return;
  db.lista = db.lista.filter(i => i.id !== id);
  salvar();
  renderLista();
}

// ---------------- PDF ----------------
function gerarPDF() {
  if (db.lista.length === 0) {
      alert("Sua lista de materiais está vazia. Adicione itens antes de gerar o PDF.");
      return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 15;
  const margin = 10;
  const lineHeight = 7;
  const maxPageHeight = doc.internal.pageSize.height - (2 * margin);
  const maxLineWidth = doc.internal.pageSize.width - (2 * margin);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Lista de Materiais SRT Soluções", margin, y, { align: "left" });
  y += 15;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");

  const grupos = {};
  db.lista.forEach(i => {
    if (!grupos[i.caminho]) grupos[i.caminho] = [];
    grupos[i.caminho].push(i);
  });

  Object.keys(grupos).sort().forEach(caminho => {
    if (y + lineHeight * (grupos[caminho].length + 1) + 5 > maxPageHeight) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.text(caminho, margin, y, { maxWidth: maxLineWidth });
    y += lineHeight;

    doc.setFont("helvetica", "normal");
    grupos[caminho].sort((a, b) => a.nome.localeCompare(b.nome)).forEach(item => {
      if (y + lineHeight > maxPageHeight) {
        doc.addPage();
        y = margin;
        doc.setFont("helvetica", "bold");
        doc.text(`(Continuação) ${caminho}`, margin, y, { maxWidth: maxLineWidth });
        y += lineHeight;
        doc.setFont("helvetica", "normal");
      }
      // Incluindo a unidade no PDF
      doc.text(`- ${item.nome} (${item.qtd} ${item.unidade})`, margin + 5, y, { maxWidth: maxLineWidth - 5 });
      y += lineHeight;
    });

    y += lineHeight / 2;
  });

  doc.save("lista-de-materiais.pdf");
}

// ---------------- Init ----------------
render();