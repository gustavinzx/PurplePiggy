import os
import re
import json

def diagnose():
    with open('mascotes/manifest.json', encoding='utf-8') as f:
        manifest = json.load(f)
    manifest_poses = {p['id']: p for p in manifest.get('poses', [])}

    mascot_dir = 'public/assets/mascot'
    public_files = set(os.listdir(mascot_dir))

    src_files = []
    for root, _, files in os.walk('src'):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                src_files.append(os.path.join(root, file).replace('\\', '/'))

    print("=== 1. USOS DE <Mascot> ===")
    mascot_tag_pattern = re.compile(r'<Mascot\b([^>]*?)(?:/>|>(.*?)</Mascot>)', re.DOTALL)
    
    mascot_usages = []
    for fpath in sorted(src_files):
        content = open(fpath, encoding='utf-8').read()
        for match in mascot_tag_pattern.finditer(content):
            attrs = match.group(1)
            line_num = content[:match.start()].count('\n') + 1
            mascot_usages.append((fpath, line_num, attrs))

    for fpath, line, attrs in mascot_usages:
        print(f"{fpath}:{line} -> {attrs}")

    print("\n=== 2. USOS DIRETOS DE <img> COM ASSETS DE MASCOTE ===")
    img_pattern = re.compile(r'<img\b([^>]*?)(?:/>|>)', re.DOTALL)
    for fpath in sorted(src_files):
        if fpath == 'src/components/Mascot.tsx':
            continue
        content = open(fpath, encoding='utf-8').read()
        for match in img_pattern.finditer(content):
            attrs = match.group(1)
            if 'mascot' in attrs or 'pig-' in attrs:
                line_num = content[:match.start()].count('\n') + 1
                print(f"{fpath}:{line_num} -> {attrs}")

    print("\n=== 3. TELAS QUE NÃO POSSUEM NENHUM MASCOTE (NEM <Mascot> NEM <img>) ===")
    pages = [f for f in src_files if f.startswith('src/pages/') and not f.endswith('Page.tsx.bak')]
    for p in sorted(pages):
        content = open(p, encoding='utf-8').read()
        has_mascot = ('<Mascot' in content) or ('assets/mascot' in content)
        if not has_mascot:
            print(f"ALERTA: Tela SEM mascote -> {p}")

if __name__ == '__main__':
    diagnose()
