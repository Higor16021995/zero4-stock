async function processar(){
  const file = document.getElementById("fileInput").files[0];
  const form = new FormData();
  form.append("file", file);

  let resp = await fetch("/api/calculate", { method:"POST", body:form });
  let dados = await resp.json();
  mostrar(dados);
}
function mostrar(data){
  let html = "<table><tr><th>Descrição</th><th>Qtd</th><th>Estoque</th><th>Min</th><th>Comprar</th></tr>";
  data.forEach(x=>{
    html += `<tr><td>${x.Descricao}</td><td>${x.Qtd}</td><td>${x.Estoque}</td>
    <td>${x.EstoqueMin}</td><td>${x.QtdRecomendada}</td></tr>`;
  });
  html += "</table>";
  document.getElementById("result").innerHTML = html;
}
