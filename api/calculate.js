import { formidable } from 'formidable';
import xlsx from 'xlsx';

export const config = {
    api: {
        bodyParser: false,
    },
};

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

        const processedData = data.map(item => {
            if (item.Qtd == null || item.Estoque == null || item.Descricao == null) {
                return null; // Ignora linhas com dados faltando
            }
            const qtd = Number(item.Qtd);
            const estoque = Number(item.Estoque);

            const consumoMedio = qtd / 7;
            const consumoMax = consumoMedio * 1.4;
            const estoqueSeguranca = (consumoMax - consumoMedio) * 2;
            const estoqueMinimo = (consumoMedio * 2) + estoqueSeguranca;
            let qtdRecomendada = estoqueMinimo - estoque;
            if (qtdRecomendada < 0) {
                qtdRecomendada = 0;
            }

            return {
                Descricao: item.Descricao,
                Qtd: qtd,
                Estoque: estoque,
                EstoqueMin: Math.ceil(estoqueMinimo),
                QtdRecomendada: Math.ceil(qtdRecomendada)
            };
        }).filter(Boolean); // Remove as linhas que foram ignoradas

        res.status(200).json(processedData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Falha ao processar o arquivo.' });
    }
}
