// Variáveis globais para armazenar os dados e o estado da ordenação
let dadosAtuais = [];
let sortConfig = { key: 'Precisa Comprar', direction: 'descending' };

// Função de processamento principal, sem alterações na lógica de chamada da API
async function processar() {
    const fileInput = document.getElementById('fileInput');
    const statusDiv = document.getElementById('status');
    const resultDiv = document.getElementById('result');
    const exportBtn = document.getElementById('exportBtn');

    if (fileInput.files.length === 0) {
        statusDiv.innerText = "Atenção: Selecione uma planilha para processar.";
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    statusDiv.innerText = "Processando... O sistema está analisando os dados.";
    resultDiv.innerHTML = "";
    exportBtn.style.display = 'none'; // Esconde o botão durante o processamento

    try {
        const response = await fetch('/api/calculate', { method: 'POST', body: formData });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'A API retornou um erro inesperado.');
        }

        dadosAtuais = await response.json();
        ordenarDados(); // Ordena os dados antes de exibir
        mostrarTabela();
        statusDiv.innerText = "Análise concluída com sucesso!";
        if(dadosAtuais.length > 0) exportBtn.style.display = 'inline-block'; // Mostra o botão se houver dados

    } catch (error) {
        statusDiv.innerText = `Erro: ${error.message}`;
        console.error(error);
    }
}

// Função para renderizar a tabela, agora com destaques e totalizador
function mostrarTabela() {
    const resultDiv = document.getElementById('result');
    if (dadosAtuais.length === 0) {
        resultDiv.innerHTML = "<p>Nenhum dado válido para cálculo foi encontrado na planilha.</p>";
        return;
    }
    
    let tableHTML = '<table>';
    tableHTML += `
        <tr>
            <th class="sortable" onclick="definirOrdenacao('Descricao')">Descrição</th>
            <th class="sortable" onclick="definirOrdenacao('Qtd')">Vendas da Semana</th>
            <th class="sortable" onclick="definirOrdenacao('Estoque')">Estoque Atual</th>
            <th class="sortable" onclick="definirOrdenacao('EstoqueMin')">Estoque Mínimo</th>
            <th class="sortable" onclick="definirOrdenacao('Precisa Comprar')">Precisa Comprar</th>
        </tr>`;

    let itensParaComprar = 0;
    dadosAtuais.forEach(item => {
        const classeCritica = item.QtdRecomendada > 0 ? 'item-critico' : '';
        if (item.QtdRecomendada > 0) itensParaComprar++;

        tableHTML += `
            <tr class="${classeCritica}">
                <td>${item.Descricao}</td>
                <td>${item.Qtd}</td>
                <td>${item.Estoque}</td>
                <td>${item.EstoqueMin}</td>
                <td><b>${item.QtdRecomendada}</b></td>
            </tr>`;
    });

    tableHTML += '</table>';
    // Adiciona o totalizador no final
    tableHTML += `<div class="totalizador">Total de itens distintos a comprar: ${itensParaComprar}</div>`;
    resultDiv.innerHTML = tableHTML;
}

// Nova função para definir a ordenação ao clicar no cabeçalho
function definirOrdenacao(key) {
    if (sortConfig.key === key && sortConfig.direction === 'descending') {
        sortConfig.direction = 'ascending';
    } else {
        sortConfig.key = key;
        sortConfig.direction = 'descending';
    }
    ordenarDados();
    mostrarTabela();
}

// Nova função para ordenar os dados armazenados
function ordenarDados() {
    dadosAtuais.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Mapeia os nomes das colunas da tabela para os nomes das chaves nos dados
        const keyMap = {
            'Descricao': 'Descricao',
            'Vendas da Semana': 'Qtd',
            'Estoque Atual': 'Estoque',
            'Estoque Mínimo': 'EstoqueMin',
            'Precisa Comprar': 'QtdRecomendada'
        };
        const dataKey = keyMap[sortConfig.key] || sortConfig.key;
        
        valA = a[dataKey];
        valB = b[dataKey];

        // Lógica de ordenação
        if (typeof valA === 'string') {
            return sortConfig.direction === 'ascending' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
        }
    });
}


// Nova função para exportar os resultados para um arquivo Excel
function exportarParaExcel() {
    if (dadosAtuais.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }
    // Renomeia as colunas para um formato amigável no Excel
    const dadosFormatados = dadosAtuais.map(item => ({
        'Descrição': item.Descricao,
        'Vendas da Semana': item.Qtd,
        'Estoque Atual': item.Estoque,
        'Estoque Mínimo': item.EstoqueMin,
        'Precisa Comprar': item.QtdRecomendada
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosFormatados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resultado Estoque");
    // Gera o arquivo para download
    XLSX.writeFile(workbook, "Relatorio_Estoque_Zero4.xlsx");
}
