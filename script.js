async function processar() {
    const fileInput = document.getElementById('fileInput');
    const statusDiv = document.getElementById('status');
    const resultDiv = document.getElementById('result');

    if (fileInput.files.length === 0) {
        statusDiv.innerText = "Ops! Você esqueceu de escolher a planilha.";
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    statusDiv.innerText = "Calculando, aguarde um pouquinho...";
    resultDiv.innerHTML = "";

    try {
        const response = await fetch('/api/calculate', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('A API retornou um erro. Será que a planilha está correta?');
        }

        const data = await response.json();
        mostrarTabela(data);
        statusDiv.innerText = "Prontinho! Aqui está seu resultado:";

    } catch (error) {
        statusDiv.innerText = "Xiii, deu um problema. Verifique sua planilha e a conexão.";
        console.error(error);
    }
}

function mostrarTabela(data) {
    const resultDiv = document.getElementById('result');
    if (data.length === 0) {
        resultDiv.innerHTML = "<p>Nenhum dado encontrado na planilha para calcular.</p>";
        return;
    }
    
    let tableHTML = '<table>';
    tableHTML += '<tr><th>Descrição</th><th>Vendas da Semana</th><th>Estoque Atual</th><th>Estoque Mínimo</th><th>Precisa Comprar</th></tr>';

    data.forEach(item => {
        tableHTML += `<tr>
            <td>${item.Descricao}</td>
            <td>${item.Qtd}</td>
            <td>${item.Estoque}</td>
            <td>${item.EstoqueMin}</td>
            <td><b>${item.QtdRecomendada}</b></td>
        </tr>`;
    });

    tableHTML += '</table>';
    resultDiv.innerHTML = tableHTML;
}
