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
