import pandas as pd
from io import BytesIO

def handler(request):
    file = request.files["file"].read()
    df = pd.read_excel(BytesIO(file))
    df = df[["Descricao","Qtd","Estoque"]]
      df["ConsumoMedio"] = df["Qtd"] / 7
    df["ConsumoMax"] = df["ConsumoMedio"] * 1.4
    df["Safety"] = (df["ConsumoMax"] - df["ConsumoMedio"]) * 2
    df["Min"] = (df["ConsumoMedio"] * 2) + df["Safety"]
    df["Comprar"] = (df["Min"] - df["Estoque"]).clip(lower=0)
    out = []
    for _, row in df.iterrows():
        out.append({
            "Descricao": row["Descricao"],
            "Qtd": int(row["Qtd"]),
            "Estoque": int(row["Estoque"]),
            "EstoqueMin": round(row["Min"],1),
            "QtdRecomendada": round(row["Comprar"],1)
        })
    return out
