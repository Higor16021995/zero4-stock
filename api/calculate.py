import formidable from "formidable";
import xlsx from "xlsx";

export const config = { api: { bodyParser: false } };

export default function handler(req, res) {
  const form = formidable({});

  form.parse(req, (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Erro no upload" });

    const wb = xlsx.readFile(files.file.filepath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws);

    const out = data.map(item => {
      const cm = item.Qtd / 7;
      const cmax = cm * 1.4;
      const ss = (cmax - cm) * 2;
      const min = cm * 2 + ss;
      const comprar = Math.max(0, min - item.Estoque);

      return {
        Descricao: item.Descricao,
        Qtd: item.Qtd,
        Estoque: item.Estoque,
        EstoqueMin: min.toFixed(1),
        QtdRecomendada: comprar.toFixed(1)
      };
    });

    return res.status(200).json(out);
  });
}
