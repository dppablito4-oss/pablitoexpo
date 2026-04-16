#!/usr/bin/env python3
"""scripts/backup_supabase.py
Ejemplo sencillo para descargar tablas desde la REST API de Supabase y guardar en JSON.
Rellena SUPABASE_URL y SUPABASE_ANON_KEY antes de ejecutar o exporta como variables de entorno.
"""
import os
import json
import requests

SUPABASE_URL = os.getenv('SUPABASE_URL') or 'https://YOUR_SUPABASE_URL.supabase.co'
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY') or 'YOUR_SUPABASE_ANON_KEY'
HEADERS = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
}

# Ajusta la lista de tablas que quieras respaldar
TABLES = [
    # 'presentations', 'events'
]

OUT_FILE = 'supabase_backup.json'


def fetch_table(table_name):
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?select=*"
    r = requests.get(url, headers=HEADERS)
    r.raise_for_status()
    return r.json()


def main():
    if not TABLES:
        print('No hay tablas configuradas en TABLES. Edita el script y añade nombres de tablas.')
        return
    data = {}
    for t in TABLES:
        print(f'Fetching {t}...')
        data[t] = fetch_table(t)
    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'Backup saved to {OUT_FILE}')


if __name__ == '__main__':
    main()
