async function processar(){
  const file = document.getElementById("fileInput").files[0];
  const form = new FormData();
  form.append("file", file);

  let resp = await fetch("/api/calculate", { method:"POST", body:form });
  let dados = await resp.json();
  mostrar(dados);
}
