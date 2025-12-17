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

    // Procura por colunas que contenham "desc" (Descrição, DESCRIÇÃO, etc.)
    mapping.descKey = keys.find(k => k.toLowerCase().includes('desc')) || null;
    // Procura por "qtd" ou "quant" (Qtd, Quantidade, etc.)
    mapping.qtdKey = keys.find(k => k.toLowerCase().startsWith('qtd') || k.toLowerCase().includes('quant')) || null;
    // Procura por "estoque"
    mapping.estoqueKey = keys.find(k => k.toLowerCase().startsWith('estoque')) || null;
    
    return mapping;
}

// **A VERSÃO DEFINITIVA E CORRIGIDA DA FUNÇÃO**
// Limpa e converte qualquer formato numérico (incluindo R$ e vírgulas)
function parseNumber(value) {
    // 1. Se o valor for nulo ou vazio, é 0.
    if (value == null || value === "") {
        return 0;
    }
    // 2. Converte para string para poder limpar.
    let strValue = String(value);

    // 3. Remove tudo que NÃO é número, vírgula ou sinal de menos.
    // Isso limpa "R$", espaços, pontos de milhar, etc.
    strValue = strValue.replace(/[^0-9,-]/g, '');

    // 4. Troca a vírgula do decimal por um ponto. "50,25" -> "50.25"
    strValue = strValue.replace(',', '.');
    
    // 5. Converte a string limpa para um número.
    const num = parseFloat(strValue);
    
    // 6. Se o resultado ainda não for um número, retorna 0 por segurança.
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
        const data = xlsx.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ error: 'A planilha parece estar vazia.' });
        }
        
        const keys = findColumnKeys(data[0]);

        if (!keys.descKey || !keys.qtdKey || !keys.estoqueKey) {
             return res.status(400).json({ error: `ERRO: Não encontrei as colunas obrigatórias. Verifique se sua planilha tem colunas com nomes parecidos com "Descrição", "Qtd" e "Estoque".` });
        }

        const processedData = data.map(item => {
            const descricao = item[keys.descKey];

            // Se a linha não tiver uma descrição, ela é inválida e será pulada.
            if (!descricao) {
                return null;
            }

            // **APLICANDO A FUNÇÃO DE LIMPEZA INTELIGENTE AQUI**
            const qtd = parseNumber(item[keys.qtdKey]);
            const estoque = parseNumber(item[keys.estoqueKey]);

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
        }).filter(Boolean); // Filtra as linhas inválidas que retornaram 'null'

        res.status(200).json(processedData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Falha crítica ao processar o arquivo. O formato pode estar corrompido.' });
    }
}
