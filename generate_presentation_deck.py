import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt

ROOT = Path(__file__).parent
DOCS = ROOT / "docs"
ASSETS = DOCS / "presentation_assets"
ASSETS.mkdir(parents=True, exist_ok=True)
OUT_PPTX_1 = DOCS / "Meditalk_Presentation.pptx"
OUT_PPTX_2 = DOCS / "Meditalk_Product_Presentation.pptx"

# Dimensions for 16:9 Widescreen Presentation
SLIDE_W, SLIDE_H = 13.333, 7.5

# High-Contrast Healthcare Palette
C_DARK_BG = "071E22"       # Deep Slate Teal
C_DARK_CARD = "0E343A"     # Dark Card Container
C_DARK_BORDER = "1B5058"   # Dark Card Border
C_LIGHT_BG = "F6FAF9"      # Crisp Ice Light Background
C_WHITE = "FFFFFF"
C_INK = "0F172A"           # Deep Ink Slate
C_MUTED = "475569"         # Muted Slate
C_LINE = "E2E8F0"          # Light Border
C_TEAL = "0D9488"          # Primary Medical Teal
C_TEAL_LIGHT = "CCFBF1"    # Soft Mint Accent
C_TEAL_DARK = "115E59"     # Deep Forest Teal
C_BLUE = "2563EB"          # Tech Accent Blue
C_BLUE_LIGHT = "DBEAFE"    # Soft Blue
C_GREEN = "10B981"         # Adherence Success Green
C_GREEN_LIGHT = "D1FAE5"   # Soft Green
C_RED = "EF4444"           # Alert Red
C_RED_LIGHT = "FEE2E2"     # Soft Red
C_AMBER = "F59E0B"         # Warning Amber
C_AMBER_LIGHT = "FEF3C7"   # Soft Amber
C_PURPLE = "8B5CF6"        # Accent Purple
C_PURPLE_LIGHT = "EDE9FE"  # Soft Purple


# Phone Mockup Generator Constants
W, H = 768, 1365


def get_font(size, bold=False):
    candidates = [
        "C:/Windows/Fonts/segoeui.ttf" if not bold else "C:/Windows/Fonts/segouib.ttf",
        "C:/Windows/Fonts/Arial.ttf" if not bold else "C:/Windows/Fonts/Arialbd.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip("#")
    return RGBColor(int(hex_str[0:2], 16), int(hex_str[2:4], 16), int(hex_str[4:6], 16))


def draw_rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_text(draw, xy, val, size, fill=C_INK, bold=False, anchor=None):
    draw.text(xy, val, font=get_font(size, bold), fill=fill, anchor=anchor)


def draw_phone_shell(draw, x=70, y=35, width=628, height=1295):
    draw_rounded(draw, (x, y, x + width, y + height), 48, "#FFFFFF", "#CBD5E1", 4)
    # Notch / Dynamic Island
    draw_rounded(draw, (x + 214, y + 14, x + width - 214, y + 38), 16, "#0F172A")
    return x + 28, y + 64, width - 56, height - 95


def make_dashboard_screen():
    im = Image.new("RGB", (W, H), "#F8FAFC")
    d = ImageDraw.Draw(im)
    x, y, sw, sh = draw_phone_shell(d)
    
    # Top Header
    draw_text(d, (x, y + 6), "Hello, Shakib 👋", 28, "#0F172A", True)
    draw_text(d, (x, y + 42), "Monday, September 2026", 16, "#64748B", True)
    
    # Next Medication Banner
    draw_rounded(d, (x + 8, y + 84, x + sw - 8, y + 172), 22, "#F0FDFA", "#99F6E4", 2)
    draw_text(d, (x + 24, y + 104), "UPCOMING MEDICATION", 13, "#0D9488", True)
    draw_text(d, (x + 24, y + 130), "Napa 500mg • 02:00 PM", 21, "#0F172A", True)
    
    # Adherence Ring Card
    draw_rounded(d, (x + 8, y + 194, x + sw - 8, y + 394), 26, "#FFFFFF", "#E2E8F0", 2)
    draw_text(d, (x + 24, y + 218), "Daily Adherence", 22, "#0F172A", True)
    
    # Circle Ring Simulation
    d.ellipse((x + 36, y + 258, x + 168, y + 370), outline="#0D9488", width=14)
    draw_text(d, (x + 102, y + 304), "100%", 26, "#0F172A", True, anchor="mm")
    draw_text(d, (x + 102, y + 330), "TODAY", 12, "#64748B", True, anchor="mm")
    
    stats = [("Taken", "2 Doses", "#10B981"), ("Missed", "0 Doses", "#EF4444"), ("Skipped", "0 Doses", "#F59E0B")]
    for idx, (label, count, color) in enumerate(stats):
        yy = y + 266 + idx * 38
        d.ellipse((x + 200, yy + 3, x + 214, yy + 17), fill=color)
        draw_text(d, (x + 226, yy), label, 16, "#64748B")
        draw_text(d, (x + sw - 32, yy), count, 16, "#0F172A", True, anchor="ra")
        
    # Quick Actions
    draw_text(d, (x + 8, y + 420), "Quick Actions", 20, "#0F172A", True)
    actions = [("+ Add Med", "#0D9488", "#CCFBF1"), ("📷 Scan Rx", "#2563EB", "#DBEAFE"), ("📄 Add Report", "#10B981", "#D1FAE5")]
    for idx, (label, col, bg_col) in enumerate(actions):
        xx = x + 8 + idx * 180
        draw_rounded(d, (xx, y + 458, xx + 168, y + 540), 20, bg_col, col, 2)
        draw_text(d, (xx + 84, y + 499), label, 16, col, True, anchor="mm")
        
    # Dose Log Card
    draw_text(d, (x + 8, y + 570), "Today's Medication Schedule", 20, "#0F172A", True)
    draw_rounded(d, (x + 8, y + 608, x + sw - 8, y + 800), 24, "#FFFFFF", "#E2E8F0", 2)
    draw_text(d, (x + 24, y + 628), "⏰ 02:00 PM • AFTER LUNCH", 14, "#0D9488", True)
    draw_text(d, (x + 24, y + 660), "Napa 500mg (Paracetamol)", 22, "#0F172A", True)
    draw_text(d, (x + 24, y + 694), "Dose: 1 Tablet • For fever & body pain", 15, "#64748B")
    
    # Action Buttons
    draw_rounded(d, (x + 24, y + 734, x + 240, y + 780), 16, "#F1F5F9", "#CBD5E1", 1)
    draw_text(d, (x + 132, y + 757), "Skip Dose", 15, "#475569", True, anchor="mm")
    draw_rounded(d, (x + 256, y + 734, x + sw - 24, y + 780), 16, "#0D9488")
    draw_text(d, (x + 390, y + 757), "✓ Take Medicine", 15, "#FFFFFF", True, anchor="mm")
    
    return im


def make_ocr_screen():
    im = Image.new("RGB", (W, H), "#F8FAFC")
    d = ImageDraw.Draw(im)
    x, y, sw, sh = draw_phone_shell(d)
    
    draw_text(d, (x, y + 6), "Prescription OCR", 28, "#0F172A", True)
    draw_text(d, (x, y + 42), "Capture & Auto-Extract Medicine Schedule", 15, "#64748B")
    
    # Camera / Upload Buttons
    draw_rounded(d, (x + 8, y + 86, x + 260, y + 196), 20, "#F0FDFA", "#0D9488", 2)
    draw_text(d, (x + 134, y + 128), "📷 Camera", 20, "#0D9488", True, anchor="mm")
    draw_text(d, (x + 134, y + 158), "Snap Rx document", 14, "#64748B", anchor="mm")
    
    draw_rounded(d, (x + 276, y + 86, x + sw - 8, y + 196), 20, "#EFF6FF", "#2563EB", 2)
    draw_text(d, (x + 402, y + 128), "🖼 Gallery", 20, "#2563EB", True, anchor="mm")
    draw_text(d, (x + 402, y + 158), "Upload photo", 14, "#64748B", anchor="mm")
    
    # Review Card
    draw_rounded(d, (x + 8, y + 224, x + sw - 8, y + 640), 24, "#FFFFFF", "#E2E8F0", 2)
    draw_rounded(d, (x + 20, y + 242, x + 210, y + 274), 12, "#FEF3C7")
    draw_text(d, (x + 115, y + 258), "HUMAN REVIEW GATE", 12, "#B45309", True, anchor="mm")
    draw_text(d, (x + 20, y + 290), "Extracted Medications (Editable)", 20, "#0F172A", True)
    
    meds = [
        ("1. Napa 500mg", "Dosage: 500mg | Freq: 2x Daily", "After Meal", "#0D9488"),
        ("2. Omeprazole 20mg", "Dosage: 20mg | Freq: 1x Daily", "Before Breakfast", "#2563EB"),
        ("3. Rosuvastatin 10mg", "Dosage: 10mg | Freq: Nightly", "At Bedtime", "#8B5CF6"),
    ]
    for idx, (title, sub, instruction, col) in enumerate(meds):
        yy = y + 334 + idx * 90
        draw_rounded(d, (x + 20, yy, x + sw - 20, yy + 78), 16, "#F8FAFC", "#E2E8F0", 1)
        draw_text(d, (x + 36, yy + 16), title, 17, "#0F172A", True)
        draw_text(d, (x + 36, yy + 44), sub, 13, "#64748B")
        draw_rounded(d, (x + sw - 170, yy + 22, x + sw - 36, yy + 56), 10, "#F1F5F9")
        draw_text(d, (x + sw - 103, yy + 39), instruction, 12, col, True, anchor="mm")
        
    # Confirmation Button
    draw_rounded(d, (x + 8, y + 668, x + sw - 8, y + 724), 20, "#0D9488")
    draw_text(d, (x + sw / 2, y + 696), "✓ Confirm & Create Reminders", 18, "#FFFFFF", True, anchor="mm")
    
    return im


def make_history_screen():
    im = Image.new("RGB", (W, H), "#F8FAFC")
    d = ImageDraw.Draw(im)
    x, y, sw, sh = draw_phone_shell(d)
    
    draw_text(d, (x, y + 6), "Medical Timeline", 28, "#0F172A", True)
    draw_text(d, (x, y + 42), "Complete Chronological Health Record", 15, "#64748B")
    
    # Filter Tabs
    tabs = [("All", True), ("Prescriptions", False), ("Lab Reports", False)]
    for idx, (tab, active) in enumerate(tabs):
        xx = x + 8 + idx * 175
        draw_rounded(d, (xx, y + 84, xx + 165, y + 124), 16, "#0D9488" if active else "#FFFFFF", "#0D9488" if active else "#E2E8F0", 1)
        draw_text(d, (xx + 82, y + 104), tab, 14, "#FFFFFF" if active else "#475569", True, anchor="mm")
        
    # Timeline line
    d.line((x + 36, y + 170, x + 36, y + 740), fill="#99F6E4", width=4)
    
    events = [
        ("Sep 2026", "Prescription Added", "Dr. Rahman (Cardiologist)", "3 medicines scheduled", "#0D9488"),
        ("Aug 2026", "Complete Blood Count", "National Diagnostic Lab", "All parameters normal", "#2563EB"),
        ("Jul 2026", "Chest X-Ray Digitalized", "City Hospital Chamber", "Clear lung fields verified", "#10B981"),
    ]
    for idx, (date, title, facility, notes, col) in enumerate(events):
        yy = y + 160 + idx * 180
        # Dot
        d.ellipse((x + 22, yy + 10, x + 50, yy + 38), fill="#FFFFFF", outline=col, width=4)
        # Card
        draw_rounded(d, (x + 68, yy, x + sw - 8, yy + 154), 20, "#FFFFFF", "#E2E8F0", 2)
        draw_text(d, (x + 88, yy + 18), date, 13, col, True)
        draw_text(d, (x + 88, yy + 44), title, 19, "#0F172A", True)
        draw_text(d, (x + 88, yy + 78), facility, 15, "#475569", True)
        draw_text(d, (x + 88, yy + 108), notes, 14, "#64748B")
        
    return im


def generate_mockup_assets():
    screens = {
        "dashboard": ASSETS / "dashboard.png",
        "ocr": ASSETS / "ocr.png",
        "history": ASSETS / "history.png",
    }
    make_dashboard_screen().save(screens["dashboard"])
    make_ocr_screen().save(screens["ocr"])
    make_history_screen().save(screens["history"])
    return screens


# ==========================================
# PPTX BUILDER UTILITIES
# ==========================================

def set_slide_background(slide, color_hex):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = hex_to_rgb(color_hex)


def add_shape_box(slide, shape_type, x, y, w, h, fill_hex, line_hex=None, line_width=1):
    shape = slide.shapes.add_shape(shape_type, Inches(x), Inches(y), Inches(w), Inches(h))
    shape.fill.solid()
    shape.fill.fore_color.rgb = hex_to_rgb(fill_hex)
    if line_hex:
        shape.line.color.rgb = hex_to_rgb(line_hex)
        shape.line.width = Pt(line_width)
    else:
        shape.line.fill.background()
    return shape


def add_header(slide, title, category=None, dark_mode=False):
    if category:
        tb_cat = slide.shapes.add_textbox(Inches(0.8), Inches(0.42), Inches(11.5), Inches(0.35))
        tf_cat = tb_cat.text_frame
        tf_cat.word_wrap = True
        tf_cat.margin_left = tf_cat.margin_top = tf_cat.margin_right = tf_cat.margin_bottom = 0
        p_cat = tf_cat.paragraphs[0]
        run_cat = p_cat.add_run()
        run_cat.text = category.upper()
        run_cat.font.name = "Segoe UI"
        run_cat.font.size = Pt(11)
        run_cat.font.bold = True
        run_cat.font.color.rgb = hex_to_rgb(C_TEAL_LIGHT if dark_mode else C_TEAL)
        
    tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.75 if category else 0.5), Inches(11.5), Inches(0.7))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    run = p.add_run()
    run.text = title
    run.font.name = "Segoe UI"
    run.font.size = Pt(24)
    run.font.bold = True
    run.font.color.rgb = hex_to_rgb(C_WHITE if dark_mode else C_INK)


def add_card(slide, x, y, w, h, title, items, badge=None, badge_color=C_TEAL, card_bg=C_WHITE, card_border=C_LINE, dark_mode=False):
    # Container box
    add_shape_box(slide, MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h, card_bg, card_border, 1.5)
    
    # Title & Badge
    tb = slide.shapes.add_textbox(Inches(x + 0.25), Inches(y + 0.22), Inches(w - 0.5), Inches(0.45))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    run = p.add_run()
    run.text = title
    run.font.name = "Segoe UI"
    run.font.size = Pt(17)
    run.font.bold = True
    run.font.color.rgb = hex_to_rgb(C_WHITE if dark_mode else C_INK)
    
    if badge:
        # Badge shape top right
        b_w, b_h = len(badge) * 0.11 + 0.35, 0.32
        bx = x + w - b_w - 0.25
        by = y + 0.22
        add_shape_box(slide, MSO_SHAPE.ROUNDED_RECTANGLE, bx, by, b_w, b_h, badge_color)
        tb_b = slide.shapes.add_textbox(Inches(bx), Inches(by + 0.04), Inches(b_w), Inches(0.24))
        tf_b = tb_b.text_frame
        tf_b.margin_left = tf_b.margin_top = tf_b.margin_right = tf_b.margin_bottom = 0
        pb = tf_b.paragraphs[0]
        pb.alignment = PP_ALIGN.CENTER
        rb = pb.add_run()
        rb.text = badge
        rb.font.name = "Segoe UI"
        rb.font.size = Pt(9.5)
        rb.font.bold = True
        rb.font.color.rgb = hex_to_rgb(C_WHITE)

    # Bullet items
    if items:
        tb_items = slide.shapes.add_textbox(Inches(x + 0.25), Inches(y + 0.72), Inches(w - 0.5), Inches(h - 0.85))
        tf_items = tb_items.text_frame
        tf_items.word_wrap = True
        tf_items.margin_left = tf_items.margin_top = tf_items.margin_right = tf_items.margin_bottom = 0
        
        for idx, item in enumerate(items):
            p_item = tf_items.paragraphs[0] if idx == 0 else tf_items.add_paragraph()
            p_item.space_before = Pt(4)
            p_item.space_after = Pt(2)
            
            # Dot or bold prefix
            if ":" in item:
                parts = item.split(":", 1)
                r_prefix = p_item.add_run()
                r_prefix.text = f"• {parts[0]}: "
                r_prefix.font.name = "Segoe UI"
                r_prefix.font.size = Pt(13)
                r_prefix.font.bold = True
                r_prefix.font.color.rgb = hex_to_rgb(C_TEAL_LIGHT if dark_mode else C_TEAL_DARK)
                
                r_rest = p_item.add_run()
                r_rest.text = parts[1].strip()
                r_rest.font.name = "Segoe UI"
                r_rest.font.size = Pt(12.5)
                r_rest.font.color.rgb = hex_to_rgb("D1D5DB" if dark_mode else C_MUTED)
            else:
                r = p_item.add_run()
                r.text = f"• {item}"
                r.font.name = "Segoe UI"
                r.font.size = Pt(12.5)
                r.font.color.rgb = hex_to_rgb("D1D5DB" if dark_mode else C_MUTED)


def build_full_presentation():
    screens = generate_mockup_assets()
    
    prs = Presentation()
    prs.slide_width = Inches(SLIDE_W)
    prs.slide_height = Inches(SLIDE_H)
    blank = prs.slide_layouts[6]
    
    # ==========================================
    # SLIDE 1: COVER & TITLE SLIDE
    # ==========================================
    s1 = prs.slides.add_slide(blank)
    set_slide_background(s1, C_DARK_BG)
    
    # Background glowing accents
    add_shape_box(s1, MSO_SHAPE.OVAL, 9.2, -1.0, 5.0, 5.0, "0A383F")
    add_shape_box(s1, MSO_SHAPE.OVAL, 10.5, 4.2, 3.8, 3.8, "082B30")
    
    # App Category Badge
    add_shape_box(s1, MSO_SHAPE.ROUNDED_RECTANGLE, 0.8, 0.7, 3.2, 0.38, C_TEAL)
    tb_c = s1.shapes.add_textbox(Inches(0.8), Inches(0.76), Inches(3.2), Inches(0.3))
    tf_c = tb_c.text_frame
    p_c = tf_c.paragraphs[0]
    p_c.alignment = PP_ALIGN.CENTER
    r_c = p_c.add_run()
    r_c.text = "HEALTHCARE RECORD PLATFORM"
    r_c.font.name = "Segoe UI"
    r_c.font.size = Pt(10)
    r_c.font.bold = True
    r_c.font.color.rgb = hex_to_rgb(C_WHITE)
    
    # Main Title
    tb_title = s1.shapes.add_textbox(Inches(0.8), Inches(1.35), Inches(8.5), Inches(1.5))
    tf_title = tb_title.text_frame
    tf_title.word_wrap = True
    p_t = tf_title.paragraphs[0]
    r_t = p_t.add_run()
    r_t.text = "Meditalk"
    r_t.font.name = "Segoe UI"
    r_t.font.size = Pt(44)
    r_t.font.bold = True
    r_t.font.color.rgb = hex_to_rgb(C_WHITE)
    
    p_sub = tf_title.add_paragraph()
    p_sub.space_before = Pt(4)
    r_sub = p_sub.add_run()
    r_sub.text = "Smart Medication Schedules, Prescription OCR & Clinical History"
    r_sub.font.name = "Segoe UI"
    r_sub.font.size = Pt(18)
    r_sub.font.color.rgb = hex_to_rgb(C_TEAL_LIGHT)
    
    # Feature Pill Highlights
    pillars = [
        ("Real-Time Dose Alarms", C_TEAL),
        ("Prescription OCR Scanner", C_BLUE),
        ("Doctor-Ready PDF Export", C_GREEN),
        ("Human Verification Gate", C_PURPLE),
    ]
    for idx, (pill_txt, pill_col) in enumerate(pillars):
        px = 0.8 + idx * 2.85
        add_shape_box(s1, MSO_SHAPE.ROUNDED_RECTANGLE, px, 3.4, 2.65, 0.45, C_DARK_CARD, pill_col, 1)
        tb_p = s1.shapes.add_textbox(Inches(px), Inches(3.48), Inches(2.65), Inches(0.3))
        tf_p = tb_p.text_frame
        pp = tf_p.paragraphs[0]
        pp.alignment = PP_ALIGN.CENTER
        rp = pp.add_run()
        rp.text = f"✓  {pill_txt}"
        rp.font.name = "Segoe UI"
        rp.font.size = Pt(11)
        rp.font.bold = True
        rp.font.color.rgb = hex_to_rgb(C_WHITE)
        
    # Team Box
    add_shape_box(s1, MSO_SHAPE.ROUNDED_RECTANGLE, 0.8, 4.35, 11.7, 2.4, C_DARK_CARD, C_DARK_BORDER, 1.5)
    
    tb_th = s1.shapes.add_textbox(Inches(1.1), Inches(4.55), Inches(11.0), Inches(0.35))
    tf_th = tb_th.text_frame
    pth = tf_th.paragraphs[0]
    rth = pth.add_run()
    rth.text = "PROJECT TEAM MEMBERS & PRESENTERS"
    rth.font.name = "Segoe UI"
    rth.font.size = Pt(12)
    rth.font.bold = True
    rth.font.color.rgb = hex_to_rgb(C_TEAL_LIGHT)
    
    team_members = [
        ("MD Shakib Ahmed", "ID: 0112230862", "Full-Stack Architecture & Lead Dev", C_TEAL),
        ("Tarek Rahman", "ID: 01111111111111", "Backend Security & PDF Engine", C_BLUE),
        ("Mayesha Islam", "ID: 0122222222222", "Mobile UI/UX & OCR Integration", C_GREEN),
    ]
    for idx, (name, mem_id, role, dot_col) in enumerate(team_members):
        tx = 1.1 + idx * 3.85
        add_shape_box(s1, MSO_SHAPE.ROUNDED_RECTANGLE, tx, 5.0, 3.6, 1.45, "07252A", C_DARK_BORDER, 1)
        add_shape_box(s1, MSO_SHAPE.OVAL, tx + 0.2, 5.2, 0.35, 0.35, dot_col)
        
        tb_m = s1.shapes.add_textbox(Inches(tx + 0.65), Inches(5.15), Inches(2.75), Inches(1.1))
        tf_m = tb_m.text_frame
        tf_m.word_wrap = True
        tf_m.margin_left = tf_m.margin_top = tf_m.margin_right = tf_m.margin_bottom = 0
        
        pm1 = tf_m.paragraphs[0]
        rm1 = pm1.add_run()
        rm1.text = name
        rm1.font.name = "Segoe UI"
        rm1.font.size = Pt(14)
        rm1.font.bold = True
        rm1.font.color.rgb = hex_to_rgb(C_WHITE)
        
        pm2 = tf_m.add_paragraph()
        pm2.space_before = Pt(2)
        rm2 = pm2.add_run()
        rm2.text = mem_id
        rm2.font.name = "Segoe UI"
        rm2.font.size = Pt(12)
        rm2.font.bold = True
        rm2.font.color.rgb = hex_to_rgb(C_TEAL_LIGHT)
        
        pm3 = tf_m.add_paragraph()
        pm3.space_before = Pt(2)
        rm3 = pm3.add_run()
        rm3.text = role
        rm3.font.name = "Segoe UI"
        rm3.font.size = Pt(10.5)
        rm3.font.color.rgb = hex_to_rgb("94A3B8")

    # ==========================================
    # SLIDE 2: THE PROBLEM & MEDITALK SOLUTION
    # ==========================================
    s2 = prs.slides.add_slide(blank)
    set_slide_background(s2, C_LIGHT_BG)
    add_header(s2, "Bridging the Everyday Healthcare Adherence Gap", "Problem & Solution")
    
    # Left Card: Problem
    add_card(
        s2, 0.8, 1.6, 5.65, 5.2,
        "The Healthcare Challenge",
        [
            "High Medication Non-Adherence: Over 50% of patients forget prescribed doses or take them with incorrect meal timing.",
            "Lost Paper Prescriptions: Physical prescription slips get misplaced, damaged, or become unreadable over time.",
            "Scattered Medical Records: Lab reports, diagnostic tests, and doctor notes remain disconnected across physical folders.",
            "Rushed Consultations: Doctors lack a structured, comprehensive medical history during acute consultations.",
        ],
        badge="THE PROBLEM", badge_color=C_RED, card_bg="#FFF5F5", card_border=C_RED_LIGHT
    )
    
    # Right Card: Solution
    add_card(
        s2, 6.85, 1.6, 5.65, 5.2,
        "The Meditalk Solution",
        [
            "Smart Daily Schedule: Automated alarm slots with clear Before/After meal dietary guidance.",
            "AI-Assisted OCR Digitization: Instant camera capture converts prescriptions into structured schedules in seconds.",
            "Human Verification Gate: Mandatory patient review ensures 100% accuracy before committing to the database.",
            "Doctor-Ready PDF Export: One-click standardized clinical summary ready for doctor appointments.",
        ],
        badge="MEDITALK SOLUTION", badge_color=C_TEAL, card_bg="#F0FDFA", card_border=C_TEAL_LIGHT
    )

    # ==========================================
    # SLIDE 3: SYSTEM ARCHITECTURE
    # ==========================================
    s3 = prs.slides.add_slide(blank)
    set_slide_background(s3, C_LIGHT_BG)
    add_header(s3, "Decoupled 3-Tier Client-Server Architecture", "System Architecture")
    
    tiers = [
        (
            "1. Client Layer",
            "Cross-Platform Mobile & Web",
            [
                "Engine: React Native (Expo SDK 57)",
                "Language: TypeScript & JSX",
                "Navigation: Expo Router (File-based)",
                "State Management: Zustand reactive store",
                "Networking: Axios with dynamic LAN interceptor",
            ],
            C_TEAL, "#F0FDFA", C_TEAL_LIGHT
        ),
        (
            "2. Service & Gateway Layer",
            "Enterprise Spring Boot API",
            [
                "Framework: Spring Boot 3.3.5 / Java 26",
                "Security: Spring Security 6 + JJWT Tokens",
                "OCR Engine: Rule-based regex NLP parser",
                "Document Engine: OpenPDF 2.0.3 clinical compiler",
                "File Storage: Multipart local document manager",
            ],
            C_BLUE, "#EFF6FF", C_BLUE_LIGHT
        ),
        (
            "3. Persistence Layer",
            "Relational Database Schema",
            [
                "Database: MySQL 8.0 / MariaDB (XAMPP)",
                "ORM: Spring Data JPA / Hibernate 6.5",
                "Connection Pool: HikariCP high-throughput",
                "Entities: Users, Doctors, Prescriptions, Medicines, Schedules, Logs, Reports",
            ],
            C_GREEN, "#F0FDF4", C_GREEN_LIGHT
        ),
    ]
    
    for idx, (title, sub, items, col, bg_col, bdr_col) in enumerate(tiers):
        tx = 0.8 + idx * 3.98
        add_card(s3, tx, 1.6, 3.75, 4.4, f"{title}\n{sub}", items, card_bg=bg_col, card_border=bdr_col)
        
    # Bottom Security Callout Banner
    add_shape_box(s3, MSO_SHAPE.ROUNDED_RECTANGLE, 0.8, 6.2, 11.7, 0.75, C_DARK_BG, C_TEAL, 1)
    tb_sec = s3.shapes.add_textbox(Inches(1.0), Inches(6.36), Inches(11.3), Inches(0.45))
    tf_sec = tb_sec.text_frame
    psec = tf_sec.paragraphs[0]
    psec.alignment = PP_ALIGN.CENTER
    rsec = psec.add_run()
    rsec.text = "🔒  Security Protocol: Stateless JWT Bearer Authentication • BCrypt 12-Round Hashing • Strict User Isolation"
    rsec.font.name = "Segoe UI"
    rsec.font.size = Pt(13)
    rsec.font.bold = True
    rsec.font.color.rgb = hex_to_rgb(C_WHITE)

    # ==========================================
    # SLIDE 4: CORE FEATURES OVERVIEW (SHOW FEATURES)
    # ==========================================
    s4 = prs.slides.add_slide(blank)
    set_slide_background(s4, C_LIGHT_BG)
    add_header(s4, "6 Pillars of the Meditalk Healthcare Platform", "Core Features")
    
    feature_matrix = [
        ("Smart Dashboard", ["Real-time daily adherence ring (Taken / Missed / Skipped)", "Prominent upcoming medication alert banner", "1-tap dose action controls (Take / Skip)"], C_TEAL),
        ("Prescription OCR", ["Camera capture and photo gallery upload", "NLP regex tokenization for medicines, dosages & frequencies", "Human verification gate before saving"], C_BLUE),
        ("Medicine Catalog", ["Multi-time daily schedule reminders (e.g. 08:00 AM, 02:00 PM)", "Food guidance tags (Before Meal, After Meal, With Food)", "Status toggle (Active / Completed) and safe deletion"], C_GREEN),
        ("Medical Timeline", ["Unified chronological stream of all patient healthcare events", "Diagnostic lab report archival with findings & doctor notes", "Multi-category filtering (Prescriptions, Reports, Meds)"], C_PURPLE),
        ("Clinical PDF Export", ["Standardized doctor-ready medical summary compiled via OpenPDF", "Customizable export sections (Profile, Meds, Rx, Reports)", "Instant browser streaming & native document sharing"], C_AMBER),
        ("Security & Profiles", ["Stateless JWT authentication with 24-hour token validity", "Demographics, blood group, allergies & chronic condition tracking", "One-click demo credentials and automatic data seeding"], C_TEAL_DARK),
    ]
    
    for idx, (ft_title, ft_items, ft_col) in enumerate(feature_matrix):
        row = idx // 3
        col = idx % 3
        fx = 0.8 + col * 3.98
        fy = 1.55 + row * 2.7
        add_card(s4, fx, fy, 3.75, 2.5, ft_title, ft_items, badge=f"0{idx+1}", badge_color=ft_col)

    # ==========================================
    # SLIDE 5: FEATURE DEEP-DIVE 1 - DASHBOARD & ADHERENCE
    # ==========================================
    s5 = prs.slides.add_slide(blank)
    set_slide_background(s5, C_LIGHT_BG)
    add_header(s5, "Smart Dashboard & Daily Adherence Engine", "Feature Implementation")
    
    # Phone mockup on left
    s5.shapes.add_picture(str(screens["dashboard"]), Inches(0.8), Inches(1.5), width=Inches(3.1))
    
    # Feature explanation cards on right
    add_card(
        s5, 4.25, 1.5, 8.25, 1.7,
        "Dynamic Adherence Percentage Engine",
        [
            "Real-Time Formula: Calculated on-demand as (Taken Doses / Total Scheduled Doses) * 100.",
            "Visual Status Ring: Dynamic circular progress chart providing immediate visual reinforcement.",
            "Categorized Breakdown: Tracks Taken (Green), Missed (Red), and Skipped (Amber) dose metrics.",
        ],
        badge="CALCULATION ENGINE", badge_color=C_TEAL
    )
    
    add_card(
        s5, 4.25, 3.35, 8.25, 1.7,
        "Interactive Dose Intake Cards",
        [
            "1-Tap Action Controls: Users log dose status via [Take Medicine] or [Skip Dose] in 1 touch.",
            "Optimistic UI Updates: Immediate local state response via Zustand with background REST synchronization.",
            "Meal-Timing Context: Displays dietary tags (e.g. 'After Lunch', 'Before Breakfast') directly on the card.",
        ],
        badge="ACTION LOGGING", badge_color=C_BLUE
    )
    
    add_card(
        s5, 4.25, 5.2, 8.25, 1.6,
        "Quick Action Workflow Bar",
        [
            "Add Med: Manual entry dialog for custom prescription creation.",
            "Scan Rx: 1-click launcher for the OCR camera digitization pipeline.",
            "Add Report: Instant upload interface for diagnostic test files and doctor findings.",
        ],
        badge="1-TOUCH ACCESS", badge_color=C_GREEN
    )

    # ==========================================
    # SLIDE 6: FEATURE DEEP-DIVE 2 - OCR PRESCRIPTION PIPELINE
    # ==========================================
    s6 = prs.slides.add_slide(blank)
    set_slide_background(s6, C_LIGHT_BG)
    add_header(s6, "Prescription OCR Pipeline & Verification Gate", "Feature Implementation")
    
    # Phone mockup on left
    s6.shapes.add_picture(str(screens["ocr"]), Inches(0.8), Inches(1.5), width=Inches(3.1))
    
    # 4-Step Pipeline on Right
    pipeline_steps = [
        ("Step 1: Document Capture", "Patient captures physical prescription via Camera or selects image from Gallery using expo-image-picker.", C_TEAL),
        ("Step 2: NLP Tokenization", "Server-side regex parser extracts drug brand names, dosages (500mg), frequency patterns (1+0+1, 2x daily), and durations.", C_BLUE),
        ("Step 3: Human Verification Gate", "Crucial Safety Layer: Extracted items are displayed on an interactive review screen where the patient can edit/correct every field.", C_AMBER),
        ("Step 4: Schedule Generation", "Upon confirmation, automatically creates database entities for Medicine and daily MedicineSchedule alarm slots.", C_GREEN),
    ]
    
    for idx, (step_title, step_desc, step_col) in enumerate(pipeline_steps):
        sy = 1.5 + idx * 1.35
        add_shape_box(s6, MSO_SHAPE.ROUNDED_RECTANGLE, 4.25, sy, 8.25, 1.22, C_WHITE, C_LINE, 1.5)
        add_shape_box(s6, MSO_SHAPE.OVAL, 4.45, sy + 0.25, 0.65, 0.65, step_col)
        
        # Step Number Text
        tb_num = s6.shapes.add_textbox(Inches(4.45), Inches(sy + 0.35), Inches(0.65), Inches(0.4))
        tf_num = tb_num.text_frame
        pnum = tf_num.paragraphs[0]
        pnum.alignment = PP_ALIGN.CENTER
        rnum = pnum.add_run()
        rnum.text = str(idx + 1)
        rnum.font.name = "Segoe UI"
        rnum.font.size = Pt(14)
        rnum.font.bold = True
        rnum.font.color.rgb = hex_to_rgb(C_WHITE)
        
        # Step text
        tb_st = s6.shapes.add_textbox(Inches(5.25), Inches(sy + 0.14), Inches(7.1), Inches(0.95))
        tf_st = tb_st.text_frame
        tf_st.word_wrap = True
        tf_st.margin_left = tf_st.margin_top = tf_st.margin_right = tf_st.margin_bottom = 0
        
        pst = tf_st.paragraphs[0]
        rst1 = pst.add_run()
        rst1.text = step_title
        rst1.font.name = "Segoe UI"
        rst1.font.size = Pt(14.5)
        rst1.font.bold = True
        rst1.font.color.rgb = hex_to_rgb(C_INK)
        
        pst2 = tf_st.add_paragraph()
        pst2.space_before = Pt(2)
        rst2 = pst2.add_run()
        rst2.text = step_desc
        rst2.font.name = "Segoe UI"
        rst2.font.size = Pt(12)
        rst2.font.color.rgb = hex_to_rgb(C_MUTED)

    # ==========================================
    # SLIDE 7: FEATURE DEEP-DIVE 3 - MEDICAL HISTORY & TIMELINE
    # ==========================================
    s7 = prs.slides.add_slide(blank)
    set_slide_background(s7, C_LIGHT_BG)
    add_header(s7, "Medical History & Chronological Timeline", "Feature Implementation")
    
    # Phone mockup on left
    s7.shapes.add_picture(str(screens["history"]), Inches(0.8), Inches(1.5), width=Inches(3.1))
    
    add_card(
        s7, 4.25, 1.5, 8.25, 2.5,
        "Unified Chronological Health Stream",
        [
            "All Healthcare Records in One Stream: Integrates doctor prescriptions, diagnostic lab reports, clinical consultations, and completed medication cycles.",
            "Visual Timeline Architecture: Grouped by date with color-coded category bullets and connecting vertical flow lines.",
            "Multi-Filter Tabs: Instant switching between [All Records], [Prescriptions], [Lab Reports], and [Medicines].",
            "Real-Time Search: Full-text search across doctor names, test titles, and medication names.",
        ],
        badge="CHRONOLOGICAL STREAM", badge_color=C_PURPLE
    )
    
    add_card(
        s7, 4.25, 4.2, 8.25, 2.6,
        "Diagnostic Lab Report Archival",
        [
            "Structured Metadata: Stores Report Title, Diagnostic Lab/Hospital, Ordering Physician, and Test Findings.",
            "Document Storage: Multipart file attachment support for PDF reports and high-resolution imaging scans (X-Rays, MRIs).",
            "Clinical Safety Boundary: Organizes patient-provided records; does not generate diagnostic conclusions without physician oversight.",
        ],
        badge="REPORT ARCHIVAL", badge_color=C_BLUE
    )

    # ==========================================
    # SLIDE 8: FEATURE DEEP-DIVE 4 - CLINICAL PDF GENERATION
    # ==========================================
    s8 = prs.slides.add_slide(blank)
    set_slide_background(s8, C_LIGHT_BG)
    add_header(s8, "Doctor-Ready Clinical PDF Generation", "Feature Implementation")
    
    pdf_cards = [
        (
            "1. Server-Side OpenPDF Engine",
            [
                "Engine: OpenPDF 2.0.3 Java document compiler.",
                "Vector Tables & Formatting: Clean clinical layout with customized header styling, zebra tables, and metadata bars.",
                "Zero Frontend Heavy Lifting: PDF binaries compiled securely on the server and streamed directly as byte arrays.",
            ],
            C_TEAL
        ),
        (
            "2. Modular Section Controls",
            [
                "Patient Demographics: Blood group, known allergies, chronic conditions, and contact details.",
                "Active Medications: Dosages, frequencies, schedules, and dietary instructions.",
                "Prescription History: Diagnoses, physician names, and original prescribe dates.",
                "Diagnostic Results: Lab reports and clinical impressions.",
            ],
            C_BLUE
        ),
        (
            "3. Date Range Filtering",
            [
                "All-Time History: Complete lifelong record for new primary care physicians.",
                "Last 30 Days: Focused view for recent acute illness follow-ups.",
                "Last 90 Days: Standard quarterly consultation summary.",
                "Past 1 Year: Annual physical checkup report.",
            ],
            C_GREEN
        ),
        (
            "4. Instant Sharing & Export",
            [
                "Web Browser: One-click direct blob download.",
                "Mobile (iOS & Android): Native document sharing intent via Expo Sharing API.",
                "Print-Ready Format: Standardized A4/Letter format ready for physical doctor review.",
            ],
            C_AMBER
        ),
    ]
    
    for idx, (title, items, col) in enumerate(pdf_cards):
        row = idx // 2
        col_idx = idx % 2
        px = 0.8 + col_idx * 5.95
        py = 1.55 + row * 2.7
        add_card(s8, px, py, 5.75, 2.5, title, items, badge="PDF EXPORT", badge_color=col)

    # ==========================================
    # SLIDE 9: TOOLS & TECHNOLOGIES USED (TECH STACK)
    # ==========================================
    s9 = prs.slides.add_slide(blank)
    set_slide_background(s9, C_LIGHT_BG)
    add_header(s9, "Tools & Technologies Specification", "Technology Stack")
    
    stacks = [
        (
            "Mobile & Web Frontend",
            [
                "React Native (0.86.3): Cross-platform UI engine",
                "Expo SDK (57.0.20): Native bridges & bundling",
                "TypeScript: Type safety across 100% of screens",
                "Expo Router (57.0.19): File-based navigation",
                "Zustand (5.0.15): Reactive lightweight state",
                "Axios (1.20.0): REST client with interceptors",
                "Lucide React Native: Vector medical icon pack",
            ],
            C_TEAL, "#F0FDFA", C_TEAL_LIGHT
        ),
        (
            "Backend & API Services",
            [
                "Java 26 / JDK: Modern JVM runtime",
                "Spring Boot 3.3.5: Enterprise microservices",
                "Spring Security 6: Stateless route security",
                "JJWT (0.12.6): JSON Web Token crypto sign/verify",
                "Spring Data JPA: Object-relational mapping",
                "OpenPDF 2.0.3: Server-side PDF rendering",
                "BCrypt: 12-round password encryption",
            ],
            C_BLUE, "#EFF6FF", C_BLUE_LIGHT
        ),
        (
            "Database & Persistence",
            [
                "MySQL 8.0: Relational data store",
                "XAMPP: Local development server environment",
                "Hibernate 6.5: Schema auto-migration & DDL",
                "HikariCP: High-performance connection pool",
                "Multipart Storage: Prescription & report files",
            ],
            C_GREEN, "#F0FDF4", C_GREEN_LIGHT
        ),
        (
            "Developer Tools & Build",
            [
                "Git & GitHub: Distributed version control",
                "Maven Wrapper (mvnw): Backend build pipeline",
                "npm & npx: Node package manager & Expo runner",
                "ReportLab & python-pptx: Document tooling",
            ],
            C_PURPLE, "#FAF5FF", C_PURPLE_LIGHT
        ),
    ]
    
    for idx, (title, items, col, bg_col, bdr_col) in enumerate(stacks):
        sx = 0.8 + idx * 2.98
        add_card(s9, sx, 1.55, 2.85, 5.25, title, items, card_bg=bg_col, card_border=bdr_col)

    # ==========================================
    # SLIDE 10: GIT WORKFLOW & VERSION CONTROL (GIT WORK)
    # ==========================================
    s10 = prs.slides.add_slide(blank)
    set_slide_background(s10, C_LIGHT_BG)
    add_header(s10, "Git Workflow, Repository Structure & Commit Milestones", "Git Work")
    
    # Left Box: Repo & Monorepo Structure
    add_card(
        s10, 0.8, 1.55, 5.65, 5.25,
        "Repository Architecture & Organization",
        [
            "GitHub Repository: https://github.com/shakibthe69/meditalk-app",
            "Decoupled Monorepo Structure: Cleanly separates frontend and backend codebases for independent deployment.",
            "Directory: /mobile — React Native Expo application with app routes, components, hooks, and stores.",
            "Directory: /backend — Spring Boot API with controllers, services, repositories, and entities.",
            "Directory: /docs — Technical documentation, presentation decks, and visual assets.",
            "Environment Isolation: Independent dependency management via pom.xml and package.json.",
        ],
        badge="MONOREPO REPO", badge_color=C_TEAL
    )
    
    # Right Box: Git Commit Milestones & Practices
    add_card(
        s10, 6.85, 1.55, 5.65, 5.25,
        "Milestone Commits & Version Control",
        [
            "Commit a512466: First commit — Initial repository setup and baseline configurations.",
            "Commit 335111d: Initial Meditalk project — Database entity models and architectural scaffolding.",
            "Commit c2022e4: Add backend & mobile applications — Complete REST endpoints, JWT security, and React Native UI.",
            "Commit 6176ecb: Documentation & Presentation — Technical architecture specifications and presentation deck.",
            "Branch Strategy: Production-stable main branch with clean milestone-driven commit hygiene.",
        ],
        badge="GIT HISTORY", badge_color=C_BLUE
    )

    # ==========================================
    # SLIDE 11: PROJECT TEAM & CONTRIBUTIONS
    # ==========================================
    s11 = prs.slides.add_slide(blank)
    set_slide_background(s11, C_DARK_BG)
    add_header(s11, "Meditalk Development Team & Contributions", "Project Team", dark_mode=True)
    
    team_cards = [
        (
            "MD Shakib Ahmed",
            "ID: 0112230862",
            "Lead Full-Stack Architect",
            [
                "Spring Boot REST API architecture & entity modeling.",
                "React Native dashboard & adherence ring UI implementation.",
                "Zustand state store & dynamic Axios client configuration.",
                "System integration, database schemas & project leadership.",
            ],
            C_TEAL
        ),
        (
            "Tarek Rahman",
            "ID: 01111111111111",
            "Backend Security & Services",
            [
                "Spring Security 6 configuration & JWT token filters.",
                "OpenPDF clinical medical summary generation service.",
                "BCrypt password hashing & authentication endpoints.",
                "Backend test verification & database health checks.",
            ],
            C_BLUE
        ),
        (
            "Mayesha Islam",
            "ID: 0122222222222",
            "Mobile UI/UX & OCR Engineer",
            [
                "Prescription OCR capture UI & human review modal.",
                "Medical history timeline screens & category filters.",
                "Diagnostic lab report upload interface & styling.",
                "Responsive mobile components & cross-platform UX.",
            ],
            C_GREEN
        ),
    ]
    
    for idx, (name, mem_id, role, resp, col) in enumerate(team_cards):
        tx = 0.8 + idx * 3.98
        add_card(
            s11, tx, 1.6, 3.75, 5.2,
            f"{name}\n{mem_id}\n{role}",
            resp,
            badge="TEAM MEMBER",
            badge_color=col,
            card_bg=C_DARK_CARD,
            card_border=C_DARK_BORDER,
            dark_mode=True
        )

    # ==========================================
    # SLIDE 12: CONCLUSION & LIVE DEMO
    # ==========================================
    s12 = prs.slides.add_slide(blank)
    set_slide_background(s12, C_DARK_BG)
    
    # Glowing accent
    add_shape_box(s12, MSO_SHAPE.OVAL, 4.0, 1.0, 5.3, 5.3, "083238")
    
    tb_c_tag = s12.shapes.add_textbox(Inches(0.8), Inches(1.2), Inches(11.7), Inches(0.4))
    tf_c_tag = tb_c_tag.text_frame
    pc_tag = tf_c_tag.paragraphs[0]
    pc_tag.alignment = PP_ALIGN.CENTER
    rc_tag = pc_tag.add_run()
    rc_tag.text = "PRODUCTION READY HEALTHCARE PLATFORM"
    rc_tag.font.name = "Segoe UI"
    rc_tag.font.size = Pt(13)
    rc_tag.font.bold = True
    rc_tag.font.color.rgb = hex_to_rgb(C_TEAL_LIGHT)
    
    tb_c_title = s12.shapes.add_textbox(Inches(0.8), Inches(1.75), Inches(11.7), Inches(1.2))
    tf_c_title = tb_c_title.text_frame
    pc_title = tf_c_title.paragraphs[0]
    pc_title.alignment = PP_ALIGN.CENTER
    rc_title = pc_title.add_run()
    rc_title.text = "Better Medication Adherence.\nOrganized Health Records."
    rc_title.font.name = "Segoe UI"
    rc_title.font.size = Pt(38)
    rc_title.font.bold = True
    rc_title.font.color.rgb = hex_to_rgb(C_WHITE)
    
    tb_c_sub = s12.shapes.add_textbox(Inches(1.5), Inches(3.3), Inches(10.3), Inches(0.8))
    tf_c_sub = tb_c_sub.text_frame
    tf_c_sub.word_wrap = True
    pc_sub = tf_c_sub.paragraphs[0]
    pc_sub.alignment = PP_ALIGN.CENTER
    rc_sub = pc_sub.add_run()
    rc_sub.text = "Meditalk transforms physical prescriptions and scattered lab tests into one calm daily routine and doctor-ready summary."
    rc_sub.font.name = "Segoe UI"
    rc_sub.font.size = Pt(16)
    rc_sub.font.color.rgb = hex_to_rgb("CBD5E1")
    
    # Live Demo Button Badge
    add_shape_box(s12, MSO_SHAPE.ROUNDED_RECTANGLE, 4.65, 4.5, 4.0, 0.7, C_TEAL)
    tb_btn = s12.shapes.add_textbox(Inches(4.65), Inches(4.68), Inches(4.0), Inches(0.35))
    tf_btn = tb_btn.text_frame
    pbtn = tf_btn.paragraphs[0]
    pbtn.alignment = PP_ALIGN.CENTER
    rbtn = pbtn.add_run()
    rbtn.text = "▶  START LIVE DEMO"
    rbtn.font.name = "Segoe UI"
    rbtn.font.size = Pt(16)
    rbtn.font.bold = True
    rbtn.font.color.rgb = hex_to_rgb(C_WHITE)
    
    tb_qa = s12.shapes.add_textbox(Inches(0.8), Inches(5.8), Inches(11.7), Inches(0.6))
    tf_qa = tb_qa.text_frame
    pqa = tf_qa.paragraphs[0]
    pqa.alignment = PP_ALIGN.CENTER
    rqa = pqa.add_run()
    rqa.text = "Thank You! Questions & Answers (Q&A)"
    rqa.font.name = "Segoe UI"
    rqa.font.size = Pt(20)
    rqa.font.bold = True
    rqa.font.color.rgb = hex_to_rgb(C_TEAL_LIGHT)

    # Save to both file names
    prs.save(str(OUT_PPTX_1))
    prs.save(str(OUT_PPTX_2))
    print(f"SUCCESS: Generated presentation at:\n  - {OUT_PPTX_1}\n  - {OUT_PPTX_2}")


if __name__ == "__main__":
    build_full_presentation()
