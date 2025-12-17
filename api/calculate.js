import { formidable } from 'formidable';
import xlsx from 'xlsx';

export const config = {
    api: {
        bodyParser: false,
    },
};

// Função mágica para encontrar os nomes certos das colunas
function findColumnKeys(sampleItem) {
    const keys = Object.keys(sampleItem);
    const mapping = {};

    mapping.descKey = keys.find(k => k.toLowerCase().includes('desc')) || null;
    mapping.qtdKey = keys.find(k => k.toLowerCase().startsWith('qtd') || k.toLowerCase().includes('quant')) || null;
    mapping.estoqueKey = keys.find(k => k.toLowerCase().startsWith('estoque')) || null;
    
    return mapping;
}


export default async function handler(req, res) {
    const form = formidable({});

    try {
        const [fields, files] = await form.parse(req);
        
        const file = files.file?.[0];
        if (!file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }

        const workbook = xlsx.readFile(file.filepath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ error: 'A planilha parece estar vazia.' });
        }
        
        // Usamos a função mágica aqui na primeira linha de dados
        const keys = findColumnKeys(data[0]);

        if (!keys.descKey || !keys.qtdKey || !keys.estoqueKey) {
             return res.status(400).json({ error: 'Não consegui encontrar as colunas "Descrição", "Qtd" e "Estoque" na sua planilha. Verifique os nomes!' });
        }

        const processedData = data.map(item => {
            const qtd = Number(item[keys.qtdKey]);
            const estoque = Number(item[keys.estoqueKey]);
            const descricao = item[keys.descKey];

            // Pula a linha se os valores não forem números válidos
            if (isNaN(qtd) || isNaN(estoque)) {
                return null;
            }

            const consumoMedio = qtd / 7;
            const consumoMax = consumoMedio * 1.4;
            const estoqueSeguranca = (consumoMax - consumoMedio) * 2;
            const estoqueMinimo = (consumoMedio * 2) + estoqueSeguranca;
            let qtdRecomendada = estoqueMinimo - estoque;
            if (qtdRecomendada < 0) {
                qtdRecomendada = 0;
            }

            return {
                Descricao: descricao,
                Qtd: qtd,
                Estoque: estoque,
                EstoqueMin: Math.ceil(estoqueMinimo),
                QtdRecomendada: Math.ceil(qtdRecomendada)
            };
        }).filter(Boolean); // Remove as linhas que foram puladas (com null)

        res.status(200).json(processedData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Falha grave ao processar o arquivo.' });
    }
}
