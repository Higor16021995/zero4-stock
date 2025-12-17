import { formidable } from 'formidable';
import xlsx from 'xlsx';

export const config = {
    api: {
        bodyParser: false,
    },
};

// Função para encontrar os nomes das colunas de forma inteligente
function findColumnKeys(sampleItem) {
    const keys = Object.keys(sampleItem);
    const mapping = {};

    mapping.descKey = keys.find(k => k.toLowerCase().includes('desc')) || null;
    mapping.qtdKey = keys.find(k => k.toLowerCase().startsWith('qtd') || k.toLowerCase().includes('quant')) || null;
    mapping.estoqueKey = keys.find(k => k.toLowerCase().startsWith('estoque')) || null;
    
    return mapping;
}

// **A GRANDE CORREÇÃO ESTÁ AQUI**
// Esta função converte qualquer valor para um número, tratando células vazias ou com texto como 0.
function parseNumber(value) {
    // Se o valor for nulo, indefinido ou uma string vazia, retorna 0.
    if (value == null || value === "") {
        return 0;
    }
    const num = Number(value);
    // Se a conversão resultar em "Não é um Número" (NaN), retorna 0. Senão, retorna o número.
    return isNaN(num) ? 0 : num;
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
        // Adicionando a opção 'defval' para garantir que células vazias sejam lidas como null
        const data = xlsx.utils.sheet_to_json(worksheet, { defval: null });

        if (data.length === 0) {
            return res.status(400).json({ error: 'A planilha parece estar vazia.' });
        }
        
        const keys = findColumnKeys(data[0]);

        if (!keys.descKey || !keys.qtdKey || !keys.estoqueKey) {
             return res.status(400).json({ error: 'Não encontrei as colunas "Descrição", "Qtd" e "Estoque". Verifique os nomes na planilha.' });
        }

        const processedData = data.map(item => {
            // **APLICANDO A CORREÇÃO AQUI**
            const qtd = parseNumber(item[keys.qtdKey]);
            const estoque = parseNumber(item[keys.estoqueKey]);
            const descricao = item[keys.descKey];

            // Se não houver descrição, pula esta linha.
            if (!descricao) {
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
        }).filter(Boolean); // Filtra quaisquer linhas que retornaram 'null'

        res.status(200).json(processedData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Falha grave ao processar o arquivo. O formato pode estar incorreto.' });
    }
}
