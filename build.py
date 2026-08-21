"""Arma index.html a partir de src/tpl.html + src/banco/m1..m6.js

    python build.py

index.html es un archivo generado: no lo edites a mano.
Para tocar preguntas, edita src/banco/mN.js. Para tocar la app, src/tpl.html.
"""
import pathlib
import sys

RAIZ = pathlib.Path(__file__).parent
MARCA = "/*__BANCO__*/"


def main() -> int:
    banco = "".join(
        (RAIZ / "src" / "banco" / f"m{i}.js").read_text(encoding="utf-8")
        for i in range(1, 7)
    )
    tpl = (RAIZ / "src" / "tpl.html").read_text(encoding="utf-8")
    if MARCA not in tpl:
        print(f"error: no encuentro la marca {MARCA} en src/tpl.html")
        return 1

    salida = tpl.replace(MARCA, banco)
    (RAIZ / "index.html").write_text(salida, encoding="utf-8")

    preguntas = banco.count('{id:"')
    print(f"index.html generado: {preguntas} preguntas, {len(salida.encode('utf-8')) // 1024} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
