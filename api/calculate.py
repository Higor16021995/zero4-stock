import pandas as pd
from io import BytesIO

def handler(request):
    file_bytes = request.files["file"].read()
    df = pd.read_excel(BytesIO(file_bytes))

    df = df[["Descricao", "Qtd", "Estoque"]]
    consumo = df["Qtd"] / 7
    consumo_max = consumo * 1.4
    safety = (consumo_max - consumo) * 2
    minimo = (consumo * 2) + safety

    df["ConsumoMedio"] = consumo
    df["ConsumoMax"] = consumo_max
    df["Safety"] = safety
    df["EstoqueMin"] = minimo
    df["QtdRecomendada"] = (minimo - df["Estoque"]).clip(lower=0)

    return df.to_dict(orient="records")
