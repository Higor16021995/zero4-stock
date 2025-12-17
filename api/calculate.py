import formidable from "formidable";
import xlsx from "xlsx";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const form = formidable({});
  form.parse(req, (err, fields, files) => {
    const wb = xlsx.readFile(files.file.filepath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws);

    const out = data.map(x => {
      const cm = x.Qtd / 7;
      const cmax = cm * 1.4;
      const ss = (cmax - cm) * 2;
      const min = (cm * 2) + ss;
      const comprar = Math.max(0, min - x.Estoque);

      return {
        Descricao: x.Descricao,
        Qtd: x.Qtd,
        Estoque: x.Estoque,
        EstoqueMin: min.toFixed(1),
        QtdRecomendada: comprar.toFixed(1)
      };
    });

    res.status(200).json(out);
  });
}
