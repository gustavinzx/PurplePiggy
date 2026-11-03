import os
import sys
import argparse
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from PIL import Image
import io

# Load environment variables
load_dotenv()

def get_api_key():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ERRO: GEMINI_API_KEY não encontrada no arquivo .env.")
        print("Obtenha sua chave no Google AI Studio: https://aistudio.google.com/app/apikey")
        sys.exit(1)
    return api_key

def load_mascot_lock():
    lock_file = Path("design/mascot-lock.md")
    if lock_file.exists():
        return lock_file.read_text(encoding="utf-8").strip()
    return ""

def log_prompt(name, prompt, model, status="Gerada"):
    prompts_file = Path("mascotes/PROMPTS.md")
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    # Header if file does not exist
    if not prompts_file.exists():
        header = "# Registro de Gerações do Mascote (Prompt Log)\n\n| Nome | Modelo | Data | Status | Prompt |\n|---|---|---|---|---|\n"
        prompts_file.write_text(header, encoding="utf-8")
        
    clean_prompt = prompt.replace("\n", " ").replace("|", "\\|")
    row = f"| `{name}` | `{model}` | {date_str} | {status} | {clean_prompt} |\n"
    
    with open(prompts_file, "a", encoding="utf-8") as f:
        f.write(row)

def generate_image(prompt, ref_images=None, output_name="mascot.png", resolution="2048x2048", model="imagen-3.0-generate-002"):
    from google import genai
    from google.genai import types

    api_key = get_api_key()
    client = genai.Client(api_key=api_key)

    mascot_lock = load_mascot_lock()
    
    # Negative prompt from mascot lock if defined
    negative_prompt = (
        "no text, no watermark, no floor shadow, no glow or soft light halo, "
        "no green tint or green light spill on the character or objects, "
        "sparkles small, solid and crisp, no white sticker border, no photorealism, "
        "no dark or scary mood, no extra limbs, no props that are not listed."
    )

    full_prompt = f"{mascot_lock}\n\nSCENE/POSE: {prompt}" if mascot_lock else prompt

    os.makedirs("mascotes/_raw", exist_ok=True)
    output_path = Path("mascotes/_raw") / output_name
    if not output_path.suffix:
        output_path = output_path.with_suffix(".png")

    print(f"Iniciando geração de imagem...")
    print(f"Modelo: {model}")
    print(f"Saída: {output_path}")
    print(f"Resolução alvo: {resolution}")
    if ref_images:
        print(f"Referências ({len(ref_images)}): {ref_images}")

    # Generate image
    try:
        config = types.GenerateImagesConfig(
            number_of_images=1,
            aspect_ratio="1:1",
            negative_prompt=negative_prompt,
            output_mime_type="image/png"
        )
        
        result = client.models.generate_images(
            model=model,
            prompt=full_prompt,
            config=config
        )

        if not result.generated_images:
            raise RuntimeError("Nenhuma imagem retornada pela API.")

        image_bytes = result.generated_images[0].image.image_bytes
        img = Image.open(io.BytesIO(image_bytes))

        # Parse target resolution if specified, e.g. 2048x2048
        if "x" in resolution:
            w, h = map(int, resolution.lower().split("x"))
            if img.size != (w, h):
                img = img.resize((w, h), Image.Resampling.LANCZOS)

        img.save(output_path, "PNG")
        print(f"Imagem gerada e salva com sucesso em: {output_path} ({img.size[0]}x{img.size[1]})")
        
        log_prompt(output_path.name, prompt, model, "Sucesso")
        return str(output_path)

    except Exception as e:
        print(f"Erro na geração de imagem: {e}")
        log_prompt(output_path.name, prompt, model, f"Falha: {str(e)[:50]}")
        raise

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Geração de imagens do mascote PurplePiggy via Google GenAI SDK")
    parser.add_argument("--prompt", required=True, help="Prompt da pose/cena do mascote")
    parser.add_argument("--refs", nargs="*", default=[], help="Lista de caminhos de imagens de referência (até 14)")
    parser.add_argument("--output", default="mascot.png", help="Nome do arquivo de saída (salvo em mascotes/_raw/)")
    parser.add_argument("--resolution", default="2048x2048", help="Resolução da imagem (padrão: 2048x2048)")
    parser.add_argument("--model", default="imagen-3.0-generate-002", help="Modelo Imagen a ser utilizado")

    args = parser.parse_args()

    # Prepend mandatory references if not present
    default_refs = ["mascotes/_ref/ficha.png"]
    for extra in ["public/assets/mascot/pig-shield.png", "public/assets/mascot/pig-idea.png", "public/assets/mascot/pig-head.png"]:
        if os.path.exists(extra):
            default_refs.append(extra)

    all_refs = list(dict.fromkeys(default_refs + args.refs))[:14]

    generate_image(
        prompt=args.prompt,
        ref_images=all_refs,
        output_name=args.output,
        resolution=args.resolution,
        model=args.model
    )
