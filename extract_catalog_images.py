#!/usr/bin/env python3
import os
import re
import pymupdf
from PIL import Image

PDF_DIR = '/Users/divyakodukula/Documents/yesfancy/catalog_images/yes_fancy'
OUT_DIRS = [
    '/Users/divyakodukula/Documents/yesfancy/public/images/catalog_extracted/high_res_300dpi_full_catalog',
    '/Users/divyakodukula/Documents/oorumart/public/images/catalog_extracted/high_res_300dpi_full_catalog'
]

for out_dir in OUT_DIRS:
    os.makedirs(out_dir, exist_ok=True)

CATALOG_FILES = [
    {"pdf": "CasseroleSeries - low - Mobile 2.pdf", "category_id": "casseroles"},
    {"pdf": "STEEL DRINKWARE CATALOGUE NEW MRP MAY 2026.pdf", "category_id": "drinkware"},
    {"pdf": "hasbro regular 042026.pdf", "category_id": "hasbro"},
    {"pdf": "HASBRO CARD.pdf", "category_id": "hasbro"},
    {"pdf": "NERF1805.pdf", "category_id": "nerf"},
    {"pdf": "LUNCHBOX - low - Mobile 1.pdf", "category_id": "lunchbox"}
]

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '_', text)
    return text.strip('_')[:40]

def extract_all():
    print("🚀 Extracting crisp 300 DPI high-res product photos from PDF catalogs...\n")
    total_extracted = 0

    for cat_spec in CATALOG_FILES:
        pdf_name = cat_spec["pdf"]
        cat_id = cat_spec["category_id"]
        pdf_path = os.path.join(PDF_DIR, pdf_name)

        if not os.path.exists(pdf_path):
            print(f"⚠️ Warning: {pdf_name} not found at {pdf_path}")
            continue

        doc = pymupdf.open(pdf_path)
        print(f"📦 Extracting [{pdf_name}] ({len(doc)} pages) -> Category [{cat_id}]")

        for page_idx in range(len(doc)):
            page_num = page_idx + 1
            page = doc[page_idx]

            # Render 300 DPI high-res canvas
            pix = page.get_pixmap(dpi=300)
            pil_img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            w_img, h_img = pil_img.size
            top_crop = int(0.08 * h_img)
            bottom_crop = int(0.92 * h_img)
            left_crop = int(0.04 * w_img)
            right_crop = int(0.96 * w_img)

            crop_img = pil_img.crop((left_crop, top_crop, right_crop, bottom_crop))

            seo_slug = slugify(f"{cat_id}_p{page_num}_{total_extracted+1}")
            out_filename = f"{seo_slug}.png"

            for out_dir in OUT_DIRS:
                out_filepath = os.path.join(out_dir, out_filename)
                crop_img.save(out_filepath, "PNG", optimize=True)

            total_extracted += 1

    print(f"\n🎉 Successfully extracted {total_extracted} crisp catalog images into public assets!")

if __name__ == '__main__':
    extract_all()
