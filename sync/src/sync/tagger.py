"""Extract article tags using Google Gemini."""

from __future__ import annotations

import json
import os
import re
from typing import Any

from bs4 import BeautifulSoup

MODEL = "gemini-3.1-flash-lite-preview"
MAX_TEXT_CHARS = 8000

TAGS_JSON_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "tags": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 0,
            "maxItems": 5,
            "description": (
                "2–5 concise Chinese tags, ordered by descending importance "
                "(most important first); not an exhaustive list of mentions; "
                "normalized for word cloud; include period/ruler and porcelain "
                "type when central to the article"
            ),
        }
    },
    "required": ["tags"],
}

_SYSTEM_INSTRUCTION = (
    "你是专业的瓷器与陶瓷史内容分析师；标签将用于词云统计，因此用词必须稳定、可合并，"
    "同一概念在全站应始终使用同一字符串。\n\n"
    "规则：\n"
    "1. 输出 2 到 5 个标签；短文或信息极少时可略少。"
    "只提炼全文主旨与论证重心，不要罗列文中出现过的所有朝代、人名、窑口或器物；"
    "仅一笔带过的内容不要单独成签。\n"
    "2. tags 数组必须按「对本文的重要性」从高到低排序：第 1 个是最核心的主题或结论焦点，"
    "其后依次减弱；不要按文中出现顺序或随意排列。\n"
    "3. 每个标签为中文名词短语，不加书名号、引号或句末标点；尽量 2-6 个字；"
    "一文内勿用同义词重复标注（例如不要同时出现 青花 与 青花瓷）。\n"
    "4. 【时代/统治者】——若时段或统治者是本文论述的核心或前提，再写入；"
    "否则可省略。优先用下列固定写法，勿换别称：\n"
    "   - 朝代总称只用单字：唐、宋、元、明、清（不用 唐代、明朝、清代 等带「朝代」后缀的形式）。\n"
    "   - 皇帝/年号只用二字年号：康熙、雍正、乾隆、嘉庆、道光、咸丰、同治、光绪、顺治、"
    "永乐、宣德、成化、弘治、正德、嘉靖、万历、天启 等（不用 康熙朝、乾隆帝、清圣祖）。\n"
    "   - 跨朝或时段：明清、清末民初、民国、先秦 等固定词组。\n"
    "   - 欧洲及外域：世纪一律用阿拉伯数字 +「世纪」，如 18世纪、19世纪"
    "（不用 十八世纪）；窑厂/风格用约定中文名：梅森、塞夫尔、德累斯顿、"
    "维也纳窑、洛可可、新古典 等，与正文一致但全书统一用此译名。\n"
    "5. 【瓷器类别/工艺】——若工艺/品类是本文重点，再从下列标准词中选最贴切的一两个，"
    "勿自造近义写法：青花、粉彩、五彩、斗彩、珐琅彩、广彩、单色釉、颜色釉、釉里红、"
    "青花釉里红、玲珑、刻花、划花、印花、贴花、雕塑瓷、素三彩、矾红、描金；"
    "欧洲器物可标 硬质瓷、釉陶、彩绘瓷、软质瓷。\n"
    "6. 若还有余量，只补充对理解主旨必不可少的标签（人物、窑口、地名、器型等），"
    "同样按重要性排序；避免「的」「与」凑成长句。\n"
    "7. 只通过结构化 JSON 回复，不要解释。"
)


# Longest keys first so multi-character aliases win over single-token rules.
_TAG_CANONICAL: tuple[tuple[str, str], ...] = (
    ("青花瓷", "青花"),
    ("青花瓷器", "青花"),
    ("粉彩瓷", "粉彩"),
    ("五彩瓷", "五彩"),
    ("斗彩瓷", "斗彩"),
    ("单色釉瓷", "单色釉"),
    ("颜色釉瓷", "颜色釉"),
    ("珐琅彩瓷", "珐琅彩"),
    ("广彩瓷", "广彩"),
    ("釉里红瓷", "釉里红"),
    ("玲珑瓷", "玲珑"),
    ("素三彩瓷", "素三彩"),
    ("硬质瓷器", "硬质瓷"),
    ("软质瓷器", "软质瓷"),
    ("十八世纪", "18世纪"),
    ("十七世纪", "17世纪"),
    ("十九世纪", "19世纪"),
    ("二十世纪", "20世纪"),
    ("十六世纪", "16世纪"),
    ("十五世纪", "15世纪"),
    ("唐代", "唐"),
    ("宋代", "宋"),
    ("元代", "元"),
    ("明代", "明"),
    ("清代", "清"),
    ("汉朝", "汉"),
    ("隋朝", "隋"),
    ("晋代", "晋"),
    ("康熙朝", "康熙"),
    ("雍正朝", "雍正"),
    ("乾隆朝", "乾隆"),
    ("嘉庆朝", "嘉庆"),
    ("道光朝", "道光"),
    ("咸丰朝", "咸丰"),
    ("同治朝", "同治"),
    ("光绪朝", "光绪"),
    ("顺治朝", "顺治"),
    ("永乐朝", "永乐"),
    ("宣德朝", "宣德"),
    ("成化朝", "成化"),
    ("弘治朝", "弘治"),
    ("正德朝", "正德"),
    ("嘉靖朝", "嘉靖"),
    ("万历朝", "万历"),
    ("天启朝", "天启"),
)


def _normalize_tag_for_cloud(s: str) -> str:
    """Map common aliases to canonical tags so word clouds aggregate cleanly."""
    t = s.strip()
    t = t.replace("\u3000", "")
    t = t.strip("《》「」『』\"' \t")
    for alias, canonical in _TAG_CANONICAL:
        if t == alias:
            t = canonical
            break
    return t


def _dedupe_preserve_order(tags: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for x in tags:
        if x and x not in seen:
            seen.add(x)
            out.append(x)
    return out


def html_to_plain_text(content_html: str) -> str:
    """Strip HTML to plain text (search index, tagger input)."""
    soup = BeautifulSoup(content_html, "html.parser")
    text = soup.get_text(separator="\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def generate_tags(content_html: str) -> list[str]:
    """Return normalized Chinese tags for word clouds, or []."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return []

    plain = html_to_plain_text(content_html)
    if not plain:
        return []

    if len(plain) > MAX_TEXT_CHARS:
        plain = plain[:MAX_TEXT_CHARS]

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    user_prompt = (
        "请为以下文章文本生成标签（遵守系统说明：抓重点、勿罗列；"
        "tags 由重要到次要排序）。\n\n文章正文：\n"
        + plain
    )

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=_SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_json_schema=TAGS_JSON_SCHEMA,
                temperature=0.25,
            ),
        )
    except Exception:
        return []

    raw = getattr(response, "text", None) or ""
    if not raw.strip():
        return []

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return []

    tags = data.get("tags") if isinstance(data, dict) else None
    if not isinstance(tags, list):
        return []

    normalized: list[str] = []
    for item in tags:
        if isinstance(item, str):
            s = _normalize_tag_for_cloud(item)
            if s:
                normalized.append(s)
    return _dedupe_preserve_order(normalized)[:5]
