from __future__ import annotations

import base64
import csv
import io
import json
import math
import mimetypes
import os
import re
import secrets
import uuid
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable

import requests
from flask import Flask, Response, abort, jsonify, render_template, request, send_from_directory, url_for
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "outputs"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
CANVAS_SIZE = 1024
DEFAULT_MODEL = "gpt-image-2"
PROMPT_SYSTEM_VERSION = "adforge-tw-ecommerce-v1.0"
FILE_SLUGS = {
    "01": "hero-image",
    "02": "usage-scene",
    "03": "material-details",
    "04": "selling-points",
    "05": "size-guide",
    "06": "comparison",
    "07": "gift-feel",
    "08": "brand-feel",
    "09": "ad-creative",
    "10": "threads-style",
}


@dataclass(frozen=True)
class StylePreset:
    key: str
    name: str
    description: str
    prompt: str
    accent: tuple[int, int, int]


@dataclass(frozen=True)
class VisualTemplate:
    key: str
    name: str
    category: str
    headline: str
    subtitle: str
    bottom: str
    chips: tuple[str, ...]
    scene_prompt: str
    layout: str
    accent: tuple[int, int, int]


@dataclass(frozen=True)
class GeneratedAsset:
    filename: str
    title: str
    url: str


STYLE_PRESETS: dict[str, StylePreset] = {
    "korean": StylePreset(
        "korean",
        "韓國感",
        "柔和乾淨、奶油光、韓系電商商品頁",
        "Korean ecommerce visual style: soft daylight, clean cream background, gentle shadows, airy composition, elegant lifestyle props, subtle warm beige and light gray tones.",
        (64, 96, 150),
    ),
    "muji": StylePreset(
        "muji",
        "MUJI感",
        "自然、留白、無印生活用品感",
        "MUJI-inspired minimalist lifestyle style: natural materials, warm white space, wood/paper/cotton textures, quiet composition, honest product photography, no clutter.",
        (92, 88, 80),
    ),
    "apple": StylePreset(
        "apple",
        "Apple感",
        "高留白、精準、科技精品感",
        "Apple-like premium product photography: pure white or soft gray studio, precise composition, high-end lighting, clean reflections, understated luxury, strong product clarity.",
        (24, 24, 27),
    ),
    "outdoor": StylePreset(
        "outdoor",
        "戶外露營感",
        "自然光、機能、露營生活場景",
        "Outdoor camping lifestyle style: natural light, canvas, wood, gravel, mountain or campsite atmosphere, functional details, rugged but clean ecommerce composition.",
        (64, 93, 70),
    ),
    "luxury": StylePreset(
        "luxury",
        "精品感",
        "深色、高質感、精品廣告氛圍",
        "Luxury boutique campaign style: premium lighting, deep neutral tones, refined props, elegant shadows, upscale editorial ecommerce composition, not flashy.",
        (30, 30, 38),
    ),
    "threads": StylePreset(
        "threads",
        "Threads感",
        "像社群貼文，短句、有觀點、適合轉發",
        "Threads social post style: clean black-white-gray layout, editorial spacing, conversational product storytelling, screenshot-ready square composition, clear short-form social feeling.",
        (20, 20, 20),
    ),
    "xiaohongshu": StylePreset(
        "xiaohongshu",
        "小紅書感",
        "筆記感、生活化、收藏感強",
        "Xiaohongshu note style: bright lifestyle scene, clean annotations, shopping-note feeling, warm daily-life props, practical benefit emphasis, visually saveable.",
        (220, 70, 90),
    ),
}


def get_style_preset(form) -> StylePreset:
    key = (form.get("style_preset") or "korean").strip()
    return STYLE_PRESETS.get(key, STYLE_PRESETS["korean"])


def load_dotenv() -> None:
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_dotenv()

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def wants_json_response() -> bool:
    if request.args.get("response_format", "").strip().lower() == "json":
        return True
    if request.args.get("fmt", "").strip().lower() == "json":
        return True
    if request.form.get("response_format", "").strip().lower() == "json":
        return True
    if request.form.get("fmt", "").strip().lower() == "json":
        return True
    return "application/json" in request.headers.get("Accept", "").lower()


def add_cors_headers(response: Response) -> Response:
    if request.path == "/generate" or request.path.startswith("/outputs/"):
        response.headers.setdefault("Access-Control-Allow-Origin", "*")
        response.headers.setdefault(
            "Access-Control-Allow-Headers",
            "Content-Type, Accept, Origin, Authorization, X-Requested-With",
        )
        response.headers.setdefault("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    return response


@app.after_request
def _apply_cors_headers(response: Response) -> Response:
    return add_cors_headers(response)


@app.route("/generate", methods=["OPTIONS"])
def generate_options():
    response = Response(status=204)
    return add_cors_headers(response)


@app.before_request
def require_basic_auth():
    if request.method == "OPTIONS":
        return None

    password = os.getenv("APP_PASSWORD", "").strip()
    if not password:
        return None

    auth = request.authorization
    valid = bool(auth and secrets.compare_digest(auth.password or "", password))
    if valid:
        return None

    return Response(
        "Authentication required",
        401,
        {"WWW-Authenticate": 'Basic realm="ADFORGE Image Generator"'},
    )


def safe_slug(value: str, fallback: str = "product") -> str:
    cleaned = re.sub(r"[^\w\u4e00-\u9fff-]+", "-", value.strip(), flags=re.UNICODE)
    cleaned = re.sub(r"-+", "-", cleaned).strip("-")
    return cleaned[:48] or fallback


def split_lines(value: str, fallback: Iterable[str], limit: int = 6) -> list[str]:
    parts = re.split(r"[\n,，、/｜|]+", value or "")
    cleaned = [part.strip() for part in parts if part.strip()]
    if not cleaned:
        cleaned = list(fallback)
    while len(cleaned) < limit:
        cleaned.extend(cleaned)
    return cleaned[:limit]


def build_templates(form) -> list[VisualTemplate]:
    product_name = (form.get("product_name") or "灰藍短版拉鍊衫").strip()
    category = (form.get("category") or "服飾 / 生活用品").strip()
    audience = (form.get("audience") or "蝦皮賣家、IG品牌、小電商").strip()
    platform = (form.get("platform") or "蝦皮 / IG / Threads").strip()
    dimensions = (form.get("dimensions") or "尺寸、版型與比例清楚呈現").strip()
    material = (form.get("material") or "材質紋理、細節與質感清楚看見").strip()
    comparison = (form.get("comparison") or "升級前後差異、使用前後或情境對比").strip()
    forbidden = (form.get("forbidden") or "不可改變商品外觀、不可加入不存在功能、不可生成假Logo或假認證").strip()
    tone = (form.get("tone") or "極簡、高級、乾淨、台灣電商可上架").strip()
    style = get_style_preset(form)
    accent = style.accent
    feature_lines = split_lines(
        form.get("features", ""),
        ["商品主體清楚", "材質細節", "使用情境", "尺寸比例", "品牌質感", "促銷亮點", "社群封面", "可直接上架"],
        limit=8,
    )
    note_lines = split_lines(
        form.get("notes", ""),
        ["請以實際商品為主", "不誇大功效", "文案可後續人工校稿"],
        limit=3,
    )
    bottom_default = (form.get("bottom_slogan") or "一張圖，整理成一套可上架素材").strip()

    shared_scene = (
        f"Prompt pack: {PROMPT_SYSTEM_VERSION}. Product: {product_name}. Category: {category}. "
        f"Target buyer: {audience}. Primary platform: {platform}. Visual tone: {tone}. Style preset: {style.name}. "
        "Use the uploaded photo as the strict product identity reference. Recreate only the main product as the hero item, "
        "removing unrelated surrounding objects from the source photo. Preserve the real product silhouette, colors, material, "
        "face/expression, pattern, proportions, and distinctive details. Create a polished square 1024x1024 commercial ecommerce "
        f"image for Taiwan ecommerce sellers. Apply this style adapter: {style.prompt}. "
        "The result must feel like a professional ecommerce material factory output, not a generic AI image demo. "
        "Important: the generated image must be text-free. Do not add typography, labels, watermarks, QR codes, fake brand marks, "
        "speech bubbles, UI panels, unreadable pseudo-text, medical claims, fake certifications, or invented product functions. "
        f"Forbidden requirements: {forbidden}. Leave clean safe space for Traditional Chinese overlay copy."
    )

    return [
        VisualTemplate(
            "01",
            "首圖",
            "click",
            product_name,
            f"{category} | {platform} 首圖",
            bottom_default,
            (feature_lines[0], feature_lines[1], "白底升級"),
            shared_scene
            + " T01 hero image: product large and centered, clean studio ecommerce cover, high click clarity, strongest first image for Shopee/IG listing.",
            "hero",
            accent,
        ),
        VisualTemplate(
            "02",
            "使用情境",
            "desire",
            "放進真實使用場景",
            f"{audience} 一看就知道怎麼用",
            "讓買家想像擁有後的畫面",
            ("生活情境", "使用畫面", "購買想像"),
            shared_scene
            + " T02 usage scene: show a realistic daily-use context. The product remains the clear subject while the surrounding scene helps buyers imagine usage.",
            "left_chips",
            accent,
        ),
        VisualTemplate(
            "03",
            "材質細節",
            "trust",
            "材質細節看得見",
            material,
            "把看不清楚的質感放大說明",
            ("材質紋理", "細節特寫", "品質信任"),
            shared_scene
            + f" T03 material detail: close-up commercial photography that highlights texture, finish, stitching, surface quality, and important small details. Emphasize: {material}.",
            "details",
            accent,
        ),
        VisualTemplate(
            "04",
            "賣點圖",
            "understand",
            "賣點一次看清楚",
            "把商品特色整理成買家看得懂的理由",
            "少講空話，多講能下單的重點",
            tuple(feature_lines[:4]),
            shared_scene
            + f" T04 selling points: product placed with clean blank space for benefit callouts. Prioritize these benefits: {', '.join(feature_lines[:4])}.",
            "notice",
            accent,
        ),
        VisualTemplate(
            "05",
            "尺寸圖",
            "understand",
            "尺寸比例一眼看懂",
            dimensions,
            "買前先理解大小與比例",
            ("尺寸比例", "版型輪廓", "購買前確認"),
            shared_scene
            + f" T05 size guide: product must be full and easy to inspect, with clean negative space for size annotations. Emphasize: {dimensions}.",
            "right_chips",
            accent,
        ),
        VisualTemplate(
            "06",
            "對比圖",
            "trust",
            "前後差異更清楚",
            comparison,
            "讓買家理解為什麼值得升級",
            ("升級前後", "重點差異", "購買理由"),
            shared_scene
            + f" T06 comparison image: create a clean before-after or feature comparison composition without fake text. Emphasize: {comparison}.",
            "grid",
            accent,
        ),
        VisualTemplate(
            "07",
            "禮物感",
            "desire",
            "送禮也有質感",
            "把商品包裝成更像禮物的購買理由",
            "適合節日、團購、活動檔期",
            ("送禮情境", "活動檔期", "開箱感"),
            shared_scene
            + " T07 gift feel: tasteful gift or unboxing scene, refined packaging mood, not childish, suitable for holiday campaign or group-buy promotion.",
            "stacked_chips",
            accent,
        ),
        VisualTemplate(
            "08",
            "品牌感",
            "trust",
            "品牌視覺更一致",
            "讓商品看起來不是隨手拍",
            "提升信任感與頁面質感",
            ("品牌調性", "一致視覺", "信任提升"),
            shared_scene
            + " T08 brand feel: cohesive brand image with premium composition, consistent color palette, polished studio/lifestyle hybrid, suitable for product page brand section.",
            "minimal",
            accent,
        ),
        VisualTemplate(
            "09",
            "廣告感",
            "convert",
            "廣告圖可以直接測",
            f"適合 {platform} 的促銷素材方向",
            "讓商品更容易被點擊",
            ("點擊吸引", "促銷活動", "素材測試"),
            shared_scene
            + f" T09 ad creative: bold but clean paid-social ad composition, strong product visibility, room for CTA and promotion copy, platform: {platform}.",
            "right_chips",
            accent,
        ),
        VisualTemplate(
            "10",
            "Threads風格圖",
            "share",
            "像社群貼文一樣被看見",
            "適合 Threads、小紅書、IG 貼文測試",
            "把商品變成一則可分享內容",
            ("社群觀點", "貼文封面", "內容測試"),
            shared_scene
            + " T10 Threads style: black-white-gray social post visual, conversational editorial composition, screenshot-ready, clear product focus, no generated text.",
            "bundle",
            accent,
        ),
    ]


def font_path() -> str | None:
    candidates = [
        "/System/Library/Fonts/STHeiti Medium.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/Apple Symbols.ttf",
    ]
    return next((path for path in candidates if Path(path).exists()), None)


FONT_PATH = font_path()


def load_font(size: int) -> ImageFont.ImageFont:
    if FONT_PATH:
        return ImageFont.truetype(FONT_PATH, size=size)
    return ImageFont.load_default(size=size)


def text_size(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, stroke: int = 0) -> tuple[int, int]:
    bbox = draw.textbbox((0, 0), text, font=font, stroke_width=stroke)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def fit_font(draw: ImageDraw.ImageDraw, text: str, max_width: int, start_size: int, min_size: int = 26) -> ImageFont.ImageFont:
    for size in range(start_size, min_size - 1, -2):
        font = load_font(size)
        width, _ = text_size(draw, text, font, stroke=7)
        if width <= max_width:
            return font
    return load_font(min_size)


def wrap_cjk(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_width: int) -> list[str]:
    lines: list[str] = []
    current = ""
    for char in text:
        candidate = current + char
        width, _ = text_size(draw, candidate, font)
        if current and width > max_width:
            lines.append(current)
            current = char.strip()
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def draw_centered_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    center_x: int,
    y: int,
    font: ImageFont.ImageFont,
    fill: tuple[int, int, int],
    stroke_fill: tuple[int, int, int] = (255, 255, 255),
    stroke_width: int = 0,
) -> int:
    width, height = text_size(draw, text, font, stroke_width)
    draw.text(
        (center_x - width / 2, y),
        text,
        font=font,
        fill=fill,
        stroke_width=stroke_width,
        stroke_fill=stroke_fill,
    )
    return y + height


def draw_wrapped_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    xy: tuple[int, int],
    max_width: int,
    font: ImageFont.ImageFont,
    fill: tuple[int, int, int],
    line_gap: int = 8,
    stroke_width: int = 0,
    stroke_fill: tuple[int, int, int] = (255, 255, 255),
) -> int:
    x, y = xy
    for line in wrap_cjk(draw, text, font, max_width):
        draw.text((x, y), line, font=font, fill=fill, stroke_width=stroke_width, stroke_fill=stroke_fill)
        _, height = text_size(draw, line, font, stroke_width)
        y += height + line_gap
    return y


def draw_glow_text(draw: ImageDraw.ImageDraw, text: str, y: int, accent: tuple[int, int, int]) -> int:
    headline_font = fit_font(draw, text, 870, 84, 46)
    draw_centered_text(draw, text, CANVAS_SIZE // 2 + 3, y + 4, headline_font, (210, 150, 55), (255, 255, 255), 11)
    return draw_centered_text(draw, text, CANVAS_SIZE // 2, y, headline_font, (112, 62, 24), (255, 255, 255), 8)


def rounded_overlay(
    image: Image.Image,
    box: tuple[int, int, int, int],
    fill: tuple[int, int, int, int],
    outline: tuple[int, int, int, int] | None = None,
    width: int = 2,
    radius: int = 28,
) -> None:
    layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    layer_draw = ImageDraw.Draw(layer)
    layer_draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)
    image.alpha_composite(layer)


def draw_heart(draw: ImageDraw.ImageDraw, cx: int, cy: int, size: int, fill: tuple[int, int, int]) -> None:
    points = []
    for degree in range(0, 360, 10):
        t = degree * math.pi / 180
        x = 16 * (math.sin(t) ** 3)
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        points.append((cx + x * size / 18, cy - y * size / 18))
    draw.polygon(points, fill=fill)


def draw_sparkle(draw: ImageDraw.ImageDraw, cx: int, cy: int, size: int, fill: tuple[int, int, int]) -> None:
    points = [
        (cx, cy - size),
        (cx + size * 0.26, cy - size * 0.26),
        (cx + size, cy),
        (cx + size * 0.26, cy + size * 0.26),
        (cx, cy + size),
        (cx - size * 0.26, cy + size * 0.26),
        (cx - size, cy),
        (cx - size * 0.26, cy - size * 0.26),
    ]
    draw.polygon(points, fill=fill)


def draw_chip(draw: ImageDraw.ImageDraw, text: str, x: int, y: int, w: int, h: int, accent: tuple[int, int, int]) -> None:
    fill = (255, 252, 239)
    outline = (*accent, 255)
    draw.rounded_rectangle((x, y, x + w, y + h), radius=h // 2, fill=fill, outline=outline, width=3)
    draw.rounded_rectangle((x + 8, y + 8, x + w - 8, y + h - 8), radius=h // 2, outline=(255, 212, 116), width=2)
    label_font = fit_font(draw, text, w - 92, 35, 24)
    draw_heart(draw, x + 43, y + h // 2 + 2, 18, (255, 120, 128))
    draw_wrapped_text(draw, text, (x + 82, y + 22), w - 106, label_font, (92, 58, 36), line_gap=0)


def add_common_frame(image: Image.Image, template: VisualTemplate) -> Image.Image:
    img = image.convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    accent = template.accent

    draw.rounded_rectangle((24, 24, 1000, 1000), radius=56, outline=(*accent, 180), width=4)
    draw.arc((-130, 760, 1154, 1220), 184, 356, fill=(255, 255, 255, 240), width=10)
    draw.arc((-120, 778, 1144, 1206), 184, 356, fill=(255, 230, 159, 210), width=5)
    draw_heart(draw, 94, 94, 18, (255, 103, 120))
    draw_heart(draw, 916, 92, 18, (255, 183, 47))
    draw_sparkle(draw, 80, 875, 20, (255, 255, 255))
    draw_sparkle(draw, 944, 856, 17, (255, 255, 255))
    img.alpha_composite(overlay)
    return img


def add_title(draw: ImageDraw.ImageDraw, template: VisualTemplate) -> None:
    next_y = draw_glow_text(draw, template.headline, 72, template.accent)
    subtitle_font = fit_font(draw, template.subtitle, 790, 36, 24)
    draw_centered_text(draw, template.subtitle, CANVAS_SIZE // 2, next_y + 24, subtitle_font, (92, 58, 36), (255, 255, 255), 3)


def add_bottom(draw: ImageDraw.ImageDraw, template: VisualTemplate) -> None:
    font = fit_font(draw, template.bottom, 720, 48, 30)
    y = 906
    width, height = text_size(draw, template.bottom, font, 5)
    text_x = int((CANVAS_SIZE - width) / 2)
    draw_heart(draw, max(70, text_x - 40), y + height // 2 + 5, 18, (255, 103, 120))
    draw.text((text_x, y), template.bottom, font=font, fill=(108, 69, 38), stroke_width=5, stroke_fill=(255, 255, 255))
    draw_heart(draw, min(954, text_x + width + 40), y + height // 2 + 5, 18, (255, 103, 120))


def apply_layout(image: Image.Image, template: VisualTemplate) -> Image.Image:
    img = add_common_frame(image, template)
    draw = ImageDraw.Draw(img)
    add_title(draw, template)
    accent = template.accent

    if template.layout == "left_chips":
        y = 330
        for chip in template.chips[:3]:
            draw_chip(draw, chip, 72, y, 345, 78, accent)
            y += 118
    elif template.layout == "hero":
        y = 340
        for chip in template.chips[:3]:
            draw_chip(draw, chip, 72, y, 330, 76, accent)
            y += 108
    elif template.layout == "right_chips":
        y = 360
        for chip in template.chips[:3]:
            draw_chip(draw, chip, 720, y, 246, 92, accent)
            y += 132
    elif template.layout == "stacked_chips":
        y = 320
        for chip in template.chips[:4]:
            draw_chip(draw, chip, 78, y, 330, 76, accent)
            y += 106
    elif template.layout == "details":
        detail_boxes = [
            ((64, 260, 256, 452), "圓潤外型"),
            ((770, 260, 962, 452), "可愛表情"),
            ((64, 642, 256, 834), "柔和配色"),
            ((770, 642, 962, 834), "質感外觀"),
        ]
        for box, label in detail_boxes:
            crop = img.crop((310, 250, 714, 720)).resize((box[2] - box[0], box[3] - box[1]))
            mask = Image.new("L", crop.size, 0)
            ImageDraw.Draw(mask).ellipse((0, 0, crop.size[0] - 1, crop.size[1] - 1), fill=255)
            img.paste(crop, box[:2], mask)
            draw.ellipse(box, outline=(255, 255, 255), width=10)
            draw.ellipse((box[0] - 8, box[1] - 8, box[2] + 8, box[3] + 8), outline=(*accent, 255), width=4)
            draw_chip(draw, label, box[0] - 6, box[3] + 12, box[2] - box[0] + 12, 58, accent)
    elif template.layout == "grid":
        labels = list(template.chips[:4])
        boxes = [(82, 276), (548, 276), (82, 586), (548, 586)]
        for (x, y), label in zip(boxes, labels):
            draw.rounded_rectangle((x, y, x + 390, y + 254), radius=22, outline=(*accent, 210), width=5)
            draw_chip(draw, label, x + 22, y + 18, 236, 58, accent)
    elif template.layout == "notice":
        rounded_overlay(img, (78, 290, 604, 785), (255, 255, 255, 205), (*accent, 220), 3, 36)
        notice_font = load_font(38)
        detail_font = load_font(25)
        y = 344
        for chip in template.chips[:3]:
            draw.text((140, y), chip, font=notice_font, fill=(92, 58, 36), stroke_width=2, stroke_fill=(255, 255, 255))
            draw.text((140, y + 52), "上架前重點整理", font=detail_font, fill=(96, 91, 84))
            draw.line((120, y + 116, 560, y + 116), fill=(244, 210, 137), width=2)
            y += 148
    elif template.layout == "minimal":
        draw_chip(draw, template.chips[0], 84, 340, 290, 78, accent)
        draw_chip(draw, template.chips[1], 650, 340, 290, 78, accent)
        draw_chip(draw, template.chips[2], 367, 755, 290, 78, accent)
    elif template.layout == "bundle":
        positions = [(70, 314), (684, 314), (70, 505), (684, 505), (366, 708)]
        for chip, (x, y) in zip(template.chips[:5], positions):
            draw_chip(draw, chip, x, y, 270, 72, accent)

    add_bottom(draw, template)
    return img.convert("RGB")


def normalize_source_image(source_path: Path) -> Image.Image:
    with Image.open(source_path) as raw:
        img = ImageOps.exif_transpose(raw).convert("RGB")
    return ImageOps.fit(img, (CANVAS_SIZE, CANVAS_SIZE), method=Image.Resampling.LANCZOS)


def demo_base_image(source_path: Path, template: VisualTemplate) -> Image.Image:
    source = normalize_source_image(source_path)
    bg = source.filter(ImageFilter.GaussianBlur(28)).resize((CANVAS_SIZE, CANVAS_SIZE))
    wash = Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE), (255, 237, 196))
    bg = Image.blend(bg, wash, 0.45)

    card = ImageOps.contain(source, (470, 540), method=Image.Resampling.LANCZOS)
    shadow = Image.new("RGBA", (card.width + 60, card.height + 60), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle((30, 30, shadow.width - 30, shadow.height - 30), radius=28, fill=(100, 66, 35, 80))
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    composed = bg.convert("RGBA")
    x = 520 - card.width // 2 if template.layout in {"left_chips", "stacked_chips", "notice"} else 512 - card.width // 2
    y = 320 if template.layout != "grid" else 390
    composed.alpha_composite(shadow, (x - 30, y - 20))
    mask = Image.new("L", card.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, card.width, card.height), radius=24, fill=255)
    composed.paste(card.convert("RGBA"), (x, y), mask)
    return composed.convert("RGB")


def generate_base_with_openai(
    source_path: Path,
    template: VisualTemplate,
    *,
    api_key: str,
    model: str,
    size: str,
    quality: str,
) -> Image.Image:
    url = "https://api.openai.com/v1/images/edits"
    mime = mimetypes.guess_type(source_path.name)[0] or "image/png"
    payload = {
        "model": model,
        "prompt": template.scene_prompt,
        "size": size,
        "quality": quality,
        "output_format": "png",
    }
    headers = {"Authorization": f"Bearer {api_key}"}
    with source_path.open("rb") as file_obj:
        files = [("image[]", (source_path.name, file_obj, mime))]
        response = requests.post(url, headers=headers, data=payload, files=files, timeout=240)

    if response.status_code >= 400:
        raise RuntimeError(response.text[:1200])

    data = response.json()
    b64_image = data["data"][0]["b64_json"]
    return Image.open(io.BytesIO(base64.b64decode(b64_image))).convert("RGB")


def save_uploaded_file(upload, run_dir: Path) -> Path:
    ext = Path(upload.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError("請上傳 JPG、PNG 或 WebP 商品照片。")
    target = run_dir / f"source{ext}"
    upload.save(target)
    return target


def create_zip(run_dir: Path, files: list[Path]) -> Path:
    zip_path = run_dir / "ecommerce-images.zip"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for file_path in files:
            archive.write(file_path, arcname=file_path.name)
    return zip_path


def build_run_metadata(
    form,
    *,
    run_id: str,
    order_id: str,
    source_path: Path,
    mode: str,
    model: str,
    quality: str,
    style: StylePreset,
) -> dict:
    return {
        "prompt_system_version": PROMPT_SYSTEM_VERSION,
        "run_id": run_id,
        "order_id": order_id,
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "mode": mode,
        "model": model,
        "quality": quality,
        "style_preset": {
            "key": style.key,
            "name": style.name,
            "description": style.description,
        },
        "source_image_filename": source_path.name,
        "customer": {
            "name": (form.get("customer_name") or "").strip(),
            "line": (form.get("customer_line") or "").strip(),
            "email": (form.get("contact_email") or "").strip(),
        },
        "order": {
            "status": (form.get("order_status") or "新詢問").strip(),
            "package": (form.get("package_name") or "NT$399 體驗包").strip(),
            "platform": (form.get("platform") or "蝦皮 / IG / Threads").strip(),
            "delivery_note": (form.get("delivery_note") or "").strip(),
        },
        "brief": {
            "product_name": (form.get("product_name") or "").strip(),
            "category": (form.get("category") or "").strip(),
            "audience": (form.get("audience") or "").strip(),
            "features": (form.get("features") or "").strip(),
            "dimensions": (form.get("dimensions") or "").strip(),
            "material": (form.get("material") or "").strip(),
            "comparison": (form.get("comparison") or "").strip(),
            "tone": (form.get("tone") or "").strip(),
            "forbidden": (form.get("forbidden") or "").strip(),
            "notes": (form.get("notes") or "").strip(),
        },
        "future_ready": {
            "member_system": "reserved",
            "credits": "reserved",
            "stripe_ecpay": "reserved",
            "ai_video": "reserved",
            "product_short_drama": "reserved",
            "api": "reserved",
            "supabase": "reserved",
            "fastapi": "reserved",
            "gradio": "reserved",
        },
    }


def write_prompt_artifacts(
    run_dir: Path,
    templates: list[VisualTemplate],
    metadata: dict,
    generated_files: list[Path],
) -> list[Path]:
    prompt_path = run_dir / "prompts-used.txt"
    lines = [
        "ADFORGE Taiwan Ecommerce Material Factory",
        f"Prompt System Version: {metadata['prompt_system_version']}",
        f"Order ID: {metadata['order_id']}",
        f"Run ID: {metadata['run_id']}",
        f"Style Preset: {metadata['style_preset']['name']} ({metadata['style_preset']['key']})",
        f"Mode: {metadata['mode']}",
        f"Model: {metadata['model']}",
        "Demo mode only previews layout. AI mode uses these prompts for the background/product scene.",
        "",
    ]
    manifest_templates = []
    for template, file_path in zip(templates, generated_files):
        template_version = f"{PROMPT_SYSTEM_VERSION}.{template.key}"
        lines.extend(
            [
                f"{template.key}. {template.name}",
                f"Prompt Category: {template.category}",
                f"Template Version: {template_version}",
                f"Headline: {template.headline}",
                f"Subtitle: {template.subtitle}",
                f"Bottom: {template.bottom}",
                f"Generated File: {file_path.name}",
                f"Prompt: {template.scene_prompt}",
                "",
            ]
        )
        manifest_templates.append(
            {
                "template_key": template.key,
                "template_name": template.name,
                "prompt_category": template.category,
                "template_version": template_version,
                "layout": template.layout,
                "accent": template.accent,
                "headline": template.headline,
                "subtitle": template.subtitle,
                "bottom": template.bottom,
                "chips": list(template.chips),
                "generated_file": file_path.name,
                "final_prompt": template.scene_prompt,
            }
        )
    prompt_path.write_text("\n".join(lines), encoding="utf-8")

    manifest_path = run_dir / "prompt-manifest.json"
    manifest = {**metadata, "templates": manifest_templates}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    brief_path = run_dir / "order-brief.json"
    brief_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")

    effects_path = run_dir / "prompt-effects.csv"
    headers = [
        "created_at",
        "order_id",
        "run_id",
        "customer_name",
        "customer_line",
        "contact_email",
        "platform",
        "package",
        "order_status",
        "prompt_system_version",
        "style_preset",
        "template_key",
        "template_name",
        "prompt_category",
        "model",
        "quality",
        "mode",
        "generated_file",
        "qa_status",
        "product_deformed",
        "text_correct",
        "claim_risk",
        "platform_ready",
        "score",
        "revision_note",
    ]
    with effects_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        for template, file_path in zip(templates, generated_files):
            writer.writerow(
                {
                    "created_at": metadata["created_at"],
                    "order_id": metadata["order_id"],
                    "run_id": metadata["run_id"],
                    "customer_name": metadata["customer"]["name"],
                    "customer_line": metadata["customer"]["line"],
                    "contact_email": metadata["customer"]["email"],
                    "platform": metadata["order"]["platform"],
                    "package": metadata["order"]["package"],
                    "order_status": metadata["order"]["status"],
                    "prompt_system_version": metadata["prompt_system_version"],
                    "style_preset": metadata["style_preset"]["name"],
                    "template_key": template.key,
                    "template_name": template.name,
                    "prompt_category": template.category,
                    "model": metadata["model"],
                    "quality": metadata["quality"],
                    "mode": metadata["mode"],
                    "generated_file": file_path.name,
                    "qa_status": "pending",
                    "product_deformed": "",
                    "text_correct": "",
                    "claim_risk": "",
                    "platform_ready": "",
                    "score": "",
                    "revision_note": "",
                }
            )

    return [prompt_path, manifest_path, brief_path, effects_path]


def generate_one(
    source_path: Path,
    run_dir: Path,
    template: VisualTemplate,
    *,
    use_ai: bool,
    api_key: str,
    model: str,
    size: str,
    quality: str,
) -> tuple[Path, str | None]:
    error = None
    if use_ai:
        try:
            base = generate_base_with_openai(
                source_path,
                template,
                api_key=api_key,
                model=model,
                size=size,
                quality=quality,
            )
        except Exception as exc:  # Keep the batch usable even if one API call fails.
            error = f"{template.key} {template.name}: {exc}"
            base = demo_base_image(source_path, template)
    else:
        base = demo_base_image(source_path, template)

    final = apply_layout(base, template)
    filename = f"{template.key}-{FILE_SLUGS.get(template.key, safe_slug(template.name, template.key))}.png"
    output_path = run_dir / filename
    final.save(output_path, "PNG", optimize=True)
    return output_path, error


def render_index(**context):
    base_context = {
        "has_api_key": bool(os.getenv("OPENAI_API_KEY")),
        "default_model": os.getenv("OPENAI_IMAGE_MODEL", DEFAULT_MODEL),
        "style_presets": STYLE_PRESETS.values(),
        "prompt_system_version": PROMPT_SYSTEM_VERSION,
    }
    base_context.update(context)
    return render_template("index.html", **base_context)


@app.get("/")
def index():
    return render_index()


@app.post("/generate")
def generate():
    upload = request.files.get("product_image")
    if not upload or not upload.filename:
        if wants_json_response():
            return jsonify({"ok": False, "message": "請先上傳一張商品照片。"}), 400
        return render_index(error="請先上傳一張商品照片。"), 400

    created_at = datetime.now()
    order_id = (request.form.get("order_id") or f"ADG-{created_at.strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:4].upper()}").strip()
    product_slug = safe_slug(request.form.get("product_name") or "product")
    run_id = f"{created_at.strftime('%Y%m%d-%H%M%S')}-{product_slug}-{uuid.uuid4().hex[:6]}"
    run_dir = OUTPUT_DIR / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    try:
        source_path = save_uploaded_file(upload, run_dir)
    except ValueError as exc:
        if wants_json_response():
            return jsonify({"ok": False, "message": str(exc)}), 400
        return render_index(error=str(exc)), 400

    templates = build_templates(request.form)
    style = get_style_preset(request.form)
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    mode = request.form.get("mode", "auto")
    use_ai = mode == "ai" or (mode == "auto" and bool(api_key))
    if mode == "demo":
        use_ai = False
    if use_ai and not api_key:
        if wants_json_response():
            return (
                jsonify({"ok": False, "message": "AI 模式需要先在 .env 設定 OPENAI_API_KEY。", "has_api_key": False}),
                400,
            )
        return render_index(error="AI 模式需要先在 .env 設定 OPENAI_API_KEY。", has_api_key=False), 400

    model = (request.form.get("model") or os.getenv("OPENAI_IMAGE_MODEL") or DEFAULT_MODEL).strip()
    size = (request.form.get("size") or os.getenv("OPENAI_IMAGE_SIZE") or "1024x1024").strip()
    quality = (request.form.get("quality") or os.getenv("OPENAI_IMAGE_QUALITY") or "low").strip()
    concurrency = max(1, min(int(request.form.get("concurrency", "2")), 4))

    files: list[Path] = []
    errors: list[str] = []
    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [
            executor.submit(
                generate_one,
                source_path,
                run_dir,
                template,
                use_ai=use_ai,
                api_key=api_key,
                model=model,
                size=size,
                quality=quality,
            )
            for template in templates
        ]
        for future in as_completed(futures):
            output_path, error = future.result()
            files.append(output_path)
            if error:
                errors.append(error)

    files.sort()
    run_metadata = build_run_metadata(
        request.form,
        run_id=run_id,
        order_id=order_id,
        source_path=source_path,
        mode="AI 正式生成" if use_ai else "Demo 排版預覽",
        model=model,
        quality=quality,
        style=style,
    )
    artifact_paths = write_prompt_artifacts(run_dir, templates, run_metadata, files)
    zip_path = create_zip(run_dir, [*files, *artifact_paths])
    assets = [
        GeneratedAsset(
            file_path.name,
            f"{template.key} {template.name}",
            url_for("output_file", run_id=run_id, filename=file_path.name, _external=True),
        )
        for file_path, template in zip(files, templates)
    ]
    zip_url = url_for("output_file", run_id=run_id, filename=zip_path.name, _external=True)
    mode_label = "AI 正式生成" if use_ai else "Demo 排版預覽（非 AI 圖）"
    response_payload = {
        "ok": True,
        "run_id": run_id,
        "order_id": order_id,
        "assets": [asset.__dict__ for asset in assets],
        "zip_url": zip_url,
        "mode": mode_label,
        "model": model,
        "style": style.name,
        "created_at": run_metadata["created_at"],
        "errors": errors,
    }

    if wants_json_response():
        return jsonify(response_payload)

    return render_index(
        result={
            "run_id": run_id,
            "order_id": order_id,
            "assets": assets,
            "zip_url": zip_url,
            "mode": mode_label,
            "model": model,
            "style": style.name,
            "errors": errors,
        },
        has_api_key=bool(api_key),
        default_model=model,
    )


@app.get("/outputs/<run_id>/<path:filename>")
def output_file(run_id: str, filename: str):
    run_dir = OUTPUT_DIR / run_id
    if not run_dir.exists():
        abort(404)
    return send_from_directory(run_dir, filename)


if __name__ == "__main__":
    debug = os.getenv("DEBUG", "0").lower() in {"1", "true", "yes", "on"}
    app.run(host=os.getenv("HOST", "0.0.0.0"), port=int(os.getenv("PORT", "7860")), debug=debug)
