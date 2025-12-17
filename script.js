async function processar() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) {
    alert("Selecione uma planilha primeiro.");
    return;
  }

  const form = new FormData();
  form.append("file", file);

  document.getElementById("status").innerHTML = "Processando...";

  try {
    const resp = await fetch("/api/calculate", {
      method: "POST",
      body: form
    });

    const dados = await resp.json();
    mostrar(dados);

  } catch (err) {
    document.getElementById("status").innerHTML = "Erro ao processar.";
  }
}
function mostrar(data) {
  let html = "<table><tr><th>Descrição</th><th>Vend.</th><th>Estoque</th><th>Mín.</th><th>Comprar</th></tr>";
  data.forEach(x => {
    html += `<tr>
      <td>${x.Descricao}</td>
      <td>${x.Qtd}</td>
      <td>${x.Estoque}</td>
      <td>${x.EstoqueMin}</td>
      <td>${x.QtdRecomendada}</td>
    </tr>`;
  });
  html += "</table>";
  document.getElementById("status").innerHTML = "";
  document.getElementById("result").innerHTML = html;
}
