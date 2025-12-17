import pandas as pd
from io import BytesIO

def handler(request):
    file_bytes = request.files["file"].read()
    df = pd.read_excel(BytesIO(file_bytes))

    df = df[["Descricao","Qtd","Estoque"]]
    df["ConsumoMedio"] = df["Qtd"] / 7
    df["ConsumoMax"] = df["ConsumoMedio"] * 1.4
    df["Safety"] = (df["ConsumoMax"] - df["ConsumoMedio"]) * 2
    df["Min"] = (df["ConsumoMedio"] * 2) + df["Safety"]
    df["Comprar"] = (df["Min"] - df["Estoque"]).clip(lower=0)

    return df.to_dict(orient="records")
