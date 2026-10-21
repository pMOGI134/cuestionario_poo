#!/usr/bin/env python3
"""Compila y ejecuta cada pregunta de código y muestra el resultado real junto a la opción marcada como correcta."""
import json, os, subprocess, sys, tempfile

SRC = sys.argv[1]
qs = json.load(open(SRC, encoding="utf-8"))
for q in qs:
    if q["tipo"] != "codigo":
        continue
    with tempfile.TemporaryDirectory() as d:
        open(os.path.join(d, "Main.java"), "w").write(q["codigo"])
        c = subprocess.run(["javac", "-d", d, os.path.join(d, "Main.java")], capture_output=True, text=True)
        correcta = next(o["texto"] for o in q["opciones"] if o["letra"] == q["respuestas_correctas"][0])
        if c.returncode != 0:
            err = [l for l in c.stderr.splitlines() if "error:" in l]
            real = "NO COMPILA -> " + (err[0].split("error:")[1].strip() if err else "?")
        else:
            r = subprocess.run(["java", "-cp", d, "Main"], capture_output=True, text=True)
            out = ", ".join(r.stdout.split("\n")[:-1]) if r.stdout else ""
            real = out
            if r.returncode != 0:
                exc = [l for l in r.stderr.splitlines() if "Exception" in l]
                real += (" | " if out else "") + "EXCEPCIÓN -> " + (exc[0] if exc else "?")
        print(f"#{q['id']:>3} REAL: {real}\n     MARCADA: {correcta}")
