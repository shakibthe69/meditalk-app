import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Suppress headers/footers on cover page

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Header
        self.drawString(54, 750, "Meditalk — Healthcare Record & Medicine Reminder Platform")
        self.drawRightString(612 - 54, 750, "Technical Documentation v1.0.0")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 744, 612 - 54, 744)

        # Footer
        self.line(54, 45, 612 - 54, 45)
        self.drawString(54, 32, "CONFIDENTIAL & PROPRIETARY — MEDITALK ARCHITECTURE SPECIFICATION")
        self.drawRightString(612 - 54, 32, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def build_pdf(filename):
    os.makedirs(os.path.dirname(os.path.abspath(filename)), exist_ok=True)
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY_TEAL = colors.HexColor("#0D9488")
    DARK_TEAL = colors.HexColor("#115E59")
    LIGHT_TEAL = colors.HexColor("#F0FDFA")
    TEXT_DARK = colors.HexColor("#0F172A")
    TEXT_MUTED = colors.HexColor("#475569")
    BORDER_COLOR = colors.HexColor("#E2E8F0")
    ACCENT_BLUE = colors.HexColor("#2563EB")
    ACCENT_BG = colors.HexColor("#F8FAFC")

    # Typography Styles
    styles.add(ParagraphStyle(
        name='CoverTitle',
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=PRIMARY_TEAL,
        alignment=0,
    ))
    styles.add(ParagraphStyle(
        name='CoverSubtitle',
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=TEXT_MUTED,
        alignment=0,
    ))
    styles.add(ParagraphStyle(
        name='SectionHeader',
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=20,
        textColor=PRIMARY_TEAL,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True,
    ))
    styles.add(ParagraphStyle(
        name='SubSectionHeader',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=DARK_TEAL,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True,
    ))
    styles.add(ParagraphStyle(
        name='BodyDoc',
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=TEXT_DARK,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name='BulletDoc',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=TEXT_DARK,
        leftIndent=14,
        spaceAfter=3,
    ))
    styles.add(ParagraphStyle(
        name='CalloutText',
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=DARK_TEAL,
    ))
    styles.add(ParagraphStyle(
        name='TableCell',
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=TEXT_DARK,
    ))
    styles.add(ParagraphStyle(
        name='TableHeaderCell',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
    ))

    story = []

    # ==========================================
    # COVER PAGE
    # ==========================================
    story.append(Spacer(1, 40))
    story.append(Paragraph("MEDITALK HEALTHCARE PLATFORM", styles['CoverSubtitle']))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Complete Technical & Functional Documentation", styles['CoverTitle']))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=3, color=PRIMARY_TEAL, spaceBefore=4, spaceAfter=14))
    story.append(Paragraph("Production-Ready Mobile Healthcare Records, OCR Prescription Structuring, Daily Medication Reminders & Clinical PDF Export System", styles['CoverSubtitle']))
    
    story.append(Spacer(1, 30))

    meta_data = [
        [Paragraph("<b>Document Version:</b>", styles['TableCell']), Paragraph("1.0.0 (Production Release)", styles['TableCell'])],
        [Paragraph("<b>Release Date:</b>", styles['TableCell']), Paragraph("September 2026", styles['TableCell'])],
        [Paragraph("<b>Frontend Framework:</b>", styles['TableCell']), Paragraph("React Native / Expo SDK 57 / TypeScript / Expo Router / Zustand", styles['TableCell'])],
        [Paragraph("<b>Backend Stack:</b>", styles['TableCell']), Paragraph("Java 26 / Spring Boot 3.3.5 / Spring Security (JWT) / Spring Data JPA", styles['TableCell'])],
        [Paragraph("<b>Database Engine:</b>", styles['TableCell']), Paragraph("MySQL (XAMPP localhost:3306/meditalk)", styles['TableCell'])],
        [Paragraph("<b>Document Generator:</b>", styles['TableCell']), Paragraph("OpenPDF 2.0.3 (Standardized Clinical Format)", styles['TableCell'])],
        [Paragraph("<b>Target Platforms:</b>", styles['TableCell']), Paragraph("Android (Expo Go / APK), iOS (Expo Go / IPA), Web (PWA / Responsive)", styles['TableCell'])],
        [Paragraph("<b>Compliance / Safety:</b>", styles['TableCell']), Paragraph("Mandatory Patient Verification for AI/OCR Transcription", styles['TableCell'])],
    ]
    t_meta = Table(meta_data, colWidths=[150, 354])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_TEAL),
        ('BOX', (0, 0), (-1, -1), 1, PRIMARY_TEAL),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(t_meta)

    story.append(Spacer(1, 40))
    story.append(Paragraph("<b>CONFIDENTIALITY NOTICE:</b> The information contained in this document is proprietary to Meditalk. It details the full architectural implementation, data schemas, API specifications, and clinical safety constraints of the Meditalk platform.", styles['CalloutText']))
    story.append(PageBreak())

    # ==========================================
    # 1. EXECUTIVE SUMMARY & ARCHITECTURE
    # ==========================================
    story.append(Paragraph("1. Executive Summary & System Overview", styles['SectionHeader']))
    story.append(Paragraph(
        "<b>Meditalk</b> is a secure, clinical-grade mobile and web application designed to bridge the gap between patients, their active daily treatments, and medical practitioners. By offering real-time adherence tracking, smart OCR prescription digitization, lab report archival, and one-click doctor-ready PDF export, Meditalk ensures patients never miss a dose and can present a complete, verified medical history during doctor consultations.",
        styles['BodyDoc']
    ))
    story.append(Paragraph(
        "The system is built upon a <b>decoupled client-server architecture</b> with high availability, end-to-end token encryption, and strict medical safety boundaries. AI prescription processing utilizes a human-in-the-loop verification pipeline where no medication schedule is committed to the database without explicit patient confirmation.",
        styles['BodyDoc']
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("High-Level Architecture Layers", styles['SubSectionHeader']))

    arch_rows = [
        [Paragraph("Layer", styles['TableHeaderCell']), Paragraph("Components & Technologies", styles['TableHeaderCell']), Paragraph("Role & Capabilities", styles['TableHeaderCell'])],
        [
            Paragraph("<b>Client (Mobile & Web)</b>", styles['TableCell']),
            Paragraph("React Native (Expo SDK 57)<br/>TypeScript, Expo Router<br/>Zustand State, Axios Client<br/>Lucide React Native Icons", styles['TableCell']),
            Paragraph("Unified codebase for iOS, Android, and Web browsers. Manages local state, reminder alarms, camera OCR capture, dynamic LAN routing, and responsive dashboard UI.", styles['TableCell'])
        ],
        [
            Paragraph("<b>Security & Gateway</b>", styles['TableCell']),
            Paragraph("Spring Security 6<br/>JWT (JJWT 0.12.6)<br/>BCrypt Password Encoder<br/>CORS Filter", styles['TableCell']),
            Paragraph("Stateless token authentication, route authorization, cross-origin request handling for LAN/mobile devices, and cryptographic password hashing.", styles['TableCell'])
        ],
        [
            Paragraph("<b>Business Services</b>", styles['TableCell']),
            Paragraph("Spring Boot 3.3.5 Services<br/>OcrAiParserService<br/>PdfGeneratorService (OpenPDF)<br/>FileStorageService", styles['TableCell']),
            Paragraph("Encapsulates core business rules: daily adherence calculations, rule-based NLP prescription parsing, clinical PDF streaming, and multipart file management.", styles['TableCell'])
        ],
        [
            Paragraph("<b>Persistence & DB</b>", styles['TableCell']),
            Paragraph("MySQL 8.0 (XAMPP)<br/>Spring Data JPA / Hibernate<br/>HikariCP Connection Pool", styles['TableCell']),
            Paragraph("Relational schema managing users, doctors, prescriptions, medicines, multi-dose schedules, daily dose logs, and diagnostic reports.", styles['TableCell'])
        ],
    ]
    t_arch = Table(arch_rows, colWidths=[90, 150, 264])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_TEAL),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_arch)

    story.append(Spacer(1, 14))

    # ==========================================
    # 2. COMPLETE FEATURE BREAKDOWN & USAGE
    # ==========================================
    story.append(Paragraph("2. Comprehensive Feature Breakdown & Usage Guide", styles['SectionHeader']))

    features = [
        {
            "num": "2.1",
            "title": "Secure Patient Authentication & Onboarding",
            "desc": "Provides secure identity management with JWT bearer tokens, encrypted credentials, and automatic new-user sample data seeding.",
            "points": [
                "<b>BCrypt Hashing:</b> Passwords hashed with 12 rounds of BCrypt encryption.",
                "<b>JWT Stateless Sessions:</b> Returns signed tokens with 24-hour expiration stored in secure memory.",
                "<b>Automatic Sample Seeding:</b> On new registration, seeds initial doctor profile, prescription, active medicine schedules, and verified lab report for immediate testing.",
                "<b>Demographics & Vitals:</b> Captures full name, email, phone, blood group (A+, B+, O+, AB+), allergies, and chronic conditions.",
                "<b>Quick Demo Access:</b> One-click demo credentials button (<code>john.doe@meditalk.com</code> / <code>SecurePass123!</code>)."
            ]
        },
        {
            "num": "2.2",
            "title": "Smart Patient Dashboard & Adherence Tracking",
            "desc": "The primary operational screen providing an instant overview of daily health metrics and upcoming medication schedules.",
            "points": [
                "<b>Live Adherence Ring:</b> Circular SVG chart dynamically calculating medication adherence percentage: <code>(Taken Doses / Total Doses) * 100</code>.",
                "<b>Upcoming Dose Banner:</b> Prominently highlights the next imminent medication with dosage and scheduled time.",
                "<b>Interactive Dose Cards:</b> One-tap <b>[Take]</b> and <b>[Skip]</b> actions that log status changes to the backend in real time with optimistic UI updates.",
                "<b>Quick Action Bar:</b> One-touch buttons for <i>Add Med</i>, <i>Scan Rx</i>, and <i>Add Report</i>.",
                "<b>Recent Previews:</b> Instant snapshot cards of the latest digitalized prescription and lab report."
            ]
        },
        {
            "num": "2.3",
            "title": "OCR Prescription Scanner with Mandatory Clinical Verification",
            "desc": "Digitizes physical doctor prescriptions using optical character recognition and natural language pattern extraction.",
            "points": [
                "<b>Capture Flexibility:</b> Supports direct camera capture and gallery image selection via <code>expo-image-picker</code>.",
                "<b>NLP Tokenization:</b> Regex tokenizer extracts medicine brand names, dosages (e.g. 500mg, 20mg), frequency patterns (1+0+1, b.i.d., daily), food instructions (Before/After meal), and duration in days.",
                "<b>Mandatory Verification Screen:</b> In strict adherence to healthcare safety regulations, extracted data is displayed on an interactive review screen. Patients can edit any medicine name, dosage, or frequency before saving.",
                "<b>Automatic Schedule Generation:</b> On confirmation, auto-creates daily <code>MedicineSchedule</code> entities for morning, afternoon, and evening alarm reminders."
            ]
        },
        {
            "num": "2.4",
            "title": "Medicine Catalog & Multi-Schedule Reminders",
            "desc": "Full medication lifecycle management from initial prescription entry to course completion.",
            "points": [
                "<b>Live Search & Filtering:</b> Real-time search across brand and generic names with filter tabs (<i>All</i>, <i>Active</i>, <i>Completed</i>).",
                "<b>Multi-Time Schedules:</b> Assigns specific alarm times (e.g. 08:00 AM, 02:00 PM, 10:00 PM) for each medicine.",
                "<b>Food Instructions:</b> Dietary timing labels (<i>Before Meal</i>, <i>After Meal</i>, <i>With Meal</i>, <i>Empty Stomach</i>).",
                "<b>Status Toggling & Safe Deletion:</b> Toggle active status or delete with a confirmation modal."
            ]
        },
        {
            "num": "2.5",
            "title": "Medical History & Chronological Timeline",
            "desc": "A unified, searchable timeline integrating all healthcare events in the patient's lifecycle.",
            "points": [
                "<b>Integrated Event Stream:</b> Combines Prescriptions, Diagnostic Lab Reports, Doctor Consultations, and Completed Treatments.",
                "<b>Category Filtering:</b> Filter by <i>All Records</i>, <i>Prescriptions</i>, <i>Lab Reports</i>, <i>Doctor Visits</i>, or <i>Medicines</i>.",
                "<b>Visual Timeline Nodes:</b> Color-coded icon bullets with connecting vertical lines grouped by date."
            ]
        },
        {
            "num": "2.6",
            "title": "Doctor-Ready Clinical PDF Generation",
            "desc": "Generates a standardized clinical PDF summarizing the patient's complete health history for physical consultations.",
            "points": [
                "<b>Backend OpenPDF Engine:</b> Compiled on the server using OpenPDF with high-fidelity formatting, tables, and headers.",
                "<b>Customizable Export Sections:</b> Options to include/exclude Patient Profile, Active Medications, Prescriptions, and Lab Results.",
                "<b>Date Range Filter:</b> Generate reports for All Time, Last 30 Days, Last 90 Days, or Past Year.",
                "<b>One-Click Streaming:</b> Direct browser blob download on Web and native document sharing on Android/iOS."
            ]
        },
        {
            "num": "2.7",
            "title": "Healthcare Safety & Legal Disclaimer Framework",
            "desc": "Maintains strict clinical boundaries to ensure user safety and compliance with healthcare guidelines.",
            "points": [
                "<b>Non-Diagnostic Disclaimer:</b> Explicit disclaimers on every screen clarifying that Meditalk is a digital record organizer and does not provide medical diagnoses or independent dosage changes.",
                "<b>Emergency Protocol:</b> In-app safety modal guiding patients to nearest emergency services in case of acute symptoms.",
                "<b>Data Confidentiality:</b> Patient records are isolated to the authenticated user ID and protected via JWT Bearer security."
            ]
        }
    ]

    for f in features:
        story.append(Paragraph(f"{f['num']} {f['title']}", styles['SubSectionHeader']))
        story.append(Paragraph(f['desc'], styles['BodyDoc']))
        for pt in f['points']:
            story.append(Paragraph(f"• {pt}", styles['BulletDoc']))
        story.append(Spacer(1, 4))

    story.append(PageBreak())

    # ==========================================
    # 3. TOOLS, TECHNOLOGIES & LIBRARIES
    # ==========================================
    story.append(Paragraph("3. Tools, Technologies & Dependencies Specification", styles['SectionHeader']))
    story.append(Paragraph("The platform uses an industry-standard modern technology stack selected for performance, type safety, and scalability.", styles['BodyDoc']))

    tech_rows = [
        [Paragraph("Category", styles['TableHeaderCell']), Paragraph("Technology / Tool", styles['TableHeaderCell']), Paragraph("Version", styles['TableHeaderCell']), Paragraph("Role & Functional Purpose", styles['TableHeaderCell'])],
        [Paragraph("<b>Mobile Core</b>", styles['TableCell']), Paragraph("React Native", styles['TableCell']), Paragraph("0.86.3", styles['TableCell']), Paragraph("Cross-platform native mobile application engine.", styles['TableCell'])],
        [Paragraph("<b>Mobile Framework</b>", styles['TableCell']), Paragraph("Expo SDK", styles['TableCell']), Paragraph("57.0.20", styles['TableCell']), Paragraph("Tooling, bundling, asset management & native bridge.", styles['TableCell'])],
        [Paragraph("<b>Routing</b>", styles['TableCell']), Paragraph("Expo Router", styles['TableCell']), Paragraph("57.0.19", styles['TableCell']), Paragraph("File-based navigation with stack & tab hierarchies.", styles['TableCell'])],
        [Paragraph("<b>State Management</b>", styles['TableCell']), Paragraph("Zustand", styles['TableCell']), Paragraph("5.0.15", styles['TableCell']), Paragraph("Lightweight, reactive client state for auth & medicines.", styles['TableCell'])],
        [Paragraph("<b>HTTP Client</b>", styles['TableCell']), Paragraph("Axios", styles['TableCell']), Paragraph("1.20.0", styles['TableCell']), Paragraph("REST client with Bearer auth & dynamic LAN interceptors.", styles['TableCell'])],
        [Paragraph("<b>Icons</b>", styles['TableCell']), Paragraph("Lucide React Native", styles['TableCell']), Paragraph("1.42.0", styles['TableCell']), Paragraph("Vector medical and interface icons.", styles['TableCell'])],
        [Paragraph("<b>Camera / Media</b>", styles['TableCell']), Paragraph("Expo Image Picker", styles['TableCell']), Paragraph("57.0.16", styles['TableCell']), Paragraph("Camera capture & photo gallery file selector.", styles['TableCell'])],
        [Paragraph("<b>Backend Core</b>", styles['TableCell']), Paragraph("Spring Boot", styles['TableCell']), Paragraph("3.3.5", styles['TableCell']), Paragraph("Enterprise Java microframework for RESTful APIs.", styles['TableCell'])],
        [Paragraph("<b>JVM Runtime</b>", styles['TableCell']), Paragraph("Java (JDK)", styles['TableCell']), Paragraph("26.0.2", styles['TableCell']), Paragraph("Modern high-performance Java Virtual Machine.", styles['TableCell'])],
        [Paragraph("<b>Security</b>", styles['TableCell']), Paragraph("Spring Security + JJWT", styles['TableCell']), Paragraph("0.12.6", styles['TableCell']), Paragraph("Stateless JWT authentication and role authorization.", styles['TableCell'])],
        [Paragraph("<b>ORM / Data</b>", styles['TableCell']), Paragraph("Spring Data JPA / Hibernate", styles['TableCell']), Paragraph("6.5", styles['TableCell']), Paragraph("Object-relational mapping and schema management.", styles['TableCell'])],
        [Paragraph("<b>Database</b>", styles['TableCell']), Paragraph("MySQL (XAMPP)", styles['TableCell']), Paragraph("8.0 / MariaDB", styles['TableCell']), Paragraph("Relational persistence for healthcare records.", styles['TableCell'])],
        [Paragraph("<b>PDF Engine</b>", styles['TableCell']), Paragraph("OpenPDF", styles['TableCell']), Paragraph("2.0.3", styles['TableCell']), Paragraph("Server-side vector clinical PDF document compiler.", styles['TableCell'])],
    ]
    t_tech = Table(tech_rows, colWidths=[80, 110, 60, 254])
    t_tech.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_TEAL),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_tech)

    story.append(Spacer(1, 14))

    # ==========================================
    # 4. RESTFUL API ENDPOINT SPECIFICATION
    # ==========================================
    story.append(Paragraph("4. RESTful API Endpoint Specification", styles['SectionHeader']))
    story.append(Paragraph("All endpoints are rooted under <code>/api</code> and require <code>Authorization: Bearer &lt;JWT&gt;</code> unless marked Public.", styles['BodyDoc']))

    api_rows = [
        [Paragraph("Method", styles['TableHeaderCell']), Paragraph("Endpoint Path", styles['TableHeaderCell']), Paragraph("Auth", styles['TableHeaderCell']), Paragraph("Description & Function", styles['TableHeaderCell'])],
        [Paragraph("<b>GET</b>", styles['TableCell']), Paragraph("/api/health", styles['TableCell']), Paragraph("Public", styles['TableCell']), Paragraph("Service health check & database status.", styles['TableCell'])],
        [Paragraph("<b>POST</b>", styles['TableCell']), Paragraph("/api/auth/register", styles['TableCell']), Paragraph("Public", styles['TableCell']), Paragraph("Register patient, hash password & seed demo data.", styles['TableCell'])],
        [Paragraph("<b>POST</b>", styles['TableCell']), Paragraph("/api/auth/login", styles['TableCell']), Paragraph("Public", styles['TableCell']), Paragraph("Authenticate credentials & return JWT token.", styles['TableCell'])],
        [Paragraph("<b>GET</b>", styles['TableCell']), Paragraph("/api/users/profile", styles['TableCell']), Paragraph("Bearer", styles['TableCell']), Paragraph("Retrieve current user's profile and medical details.", styles['TableCell'])],
        [Paragraph("<b>PUT</b>", styles['TableCell']), Paragraph("/api/users/profile", styles['TableCell']), Paragraph("Bearer", styles['TableCell']), Paragraph("Update demographics, allergies & chronic conditions.", styles['TableCell'])],
        [Paragraph("<b>GET</b>", styles['TableCell']), Paragraph("/api/medicines", styles['TableCell']), Paragraph("Bearer", styles['TableCell']), Paragraph("Fetch all medications with schedules for current user.", styles['TableCell'])],
        [Paragraph("<b>POST</b>", styles['TableCell']), Paragraph("/api/medicines", styles['TableCell']), Paragraph("Bearer", styles['TableCell']), Paragraph("Create new medication with multi-time schedules.", styles['TableCell'])],
        [Paragraph("<b>PATCH</b>", styles['TableCell']), Paragraph("/api/medicines/{id}/toggle-status", styles['TableCell']), Paragraph("Bearer", styles['TableCell']), Paragraph("Toggle active/inactive status of a medication.", styles['TableCell'])],
        [Paragraph("<b>DELETE</b>", styles['TableCell']), Paragraph("/api/medicines/{id}", styles['TableCell']), Paragraph("Bearer", styles['TableCell']), Paragraph("Delete medication record and attached schedules.", styles['TableCell'])],
        [Paragraph("<b>GET</b>", styles['TableCell']), Paragraph("/api/medicine-logs/today", styles['TableCell']), Paragraph("Bearer", styles['TableCell']), Paragraph("Fetch scheduled dose cards for current calendar day.", styles['TableCell'])],
        [Paragraph("<b>POST</b>", styles['TableCell']), Paragraph("/api/medicine-logs", styles['TableCell']), Paragraph("Bearer", styles['TableCell']), Paragraph("Log dose status (TAKEN, SKIPPED, MISSED).", styles['TableCell'])],
        [Paragraph("<b>GET</b>", styles['TableCell']), Paragraph("/api/medicine-logs/adherence", styles['TableCell']), Paragraph("Bearer", styles['TableCell']), Paragraph("Calculate adherence rate (Taken/Total percentage).", styles['TableCell'])],
        [Paragraph("<b>GET</b>", styles['TableCell']), Paragraph("/api/prescriptions", styles['TableCell']), Paragraph("Bearer", styles['TableCell']), Paragraph("List all saved prescriptions with medicines.", styles['TableCell'])],
        [Paragraph("<b>POST</b>", styles['TableCell']), Paragraph("/api/prescriptions", styles['TableCell']), Paragraph("Bearer", styles['TableCell']), Paragraph("Save confirmed prescription and sync medicine schedules.", styles['TableCell'])],
        [Paragraph("<b>POST</b>", styles['TableCell']), Paragraph("/api/ocr/parse", styles['TableCell']), Paragraph("Bearer", styles['TableCell']), Paragraph("Parse raw OCR text into structured prescription draft.", styles['TableCell'])],
        [Paragraph("<b>GET</b>", styles['TableCell']), Paragraph("/api/medical-reports", styles['TableCell']), Paragraph("Bearer", styles['TableCell']), Paragraph("List all patient diagnostic lab reports.", styles['TableCell'])],
        [Paragraph("<b>POST</b>", styles['TableCell']), Paragraph("/api/medical-reports", styles['TableCell']), Paragraph("Bearer", styles['TableCell']), Paragraph("Create and categorize lab test report.", styles['TableCell'])],
        [Paragraph("<b>POST</b>", styles['TableCell']), Paragraph("/api/medical-history/pdf", styles['TableCell']), Paragraph("Bearer", styles['TableCell']), Paragraph("Generate and stream clinical medical history PDF.", styles['TableCell'])],
        [Paragraph("<b>POST</b>", styles['TableCell']), Paragraph("/api/upload/file", styles['TableCell']), Paragraph("Bearer", styles['TableCell']), Paragraph("Multipart upload for prescription and report scans.", styles['TableCell'])],
    ]
    t_api = Table(api_rows, colWidths=[55, 160, 45, 244])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_TEAL),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
    ]))
    story.append(t_api)

    story.append(PageBreak())

    # ==========================================
    # 5. DATABASE SCHEMA & ER MODEL
    # ==========================================
    story.append(Paragraph("5. Database Schema & Data Models", styles['SectionHeader']))
    story.append(Paragraph("The relational database schema is deployed under MySQL (<code>meditalk</code>) with foreign-key referential integrity.", styles['BodyDoc']))

    schema_tables = [
        {
            "name": "users",
            "desc": "Primary patient identity and demographic table.",
            "cols": [
                ("id", "BIGINT (PK, Auto)", "Unique patient identifier"),
                ("email", "VARCHAR(255) (Unique)", "Login email address"),
                ("password", "VARCHAR(255)", "BCrypt hashed credential"),
                ("full_name", "VARCHAR(255)", "Patient's legal name"),
                ("phone_number", "VARCHAR(50)", "Contact mobile number"),
                ("date_of_birth", "VARCHAR(50)", "Birth date (YYYY-MM-DD)"),
                ("blood_group", "VARCHAR(10)", "Blood type (e.g. O+, A+, B-)"),
                ("allergies", "VARCHAR(500)", "Comma-separated known drug allergies"),
                ("chronic_conditions", "VARCHAR(500)", "Comma-separated diagnosed conditions"),
            ]
        },
        {
            "name": "prescriptions",
            "desc": "Digitalized doctor prescriptions and diagnosis records.",
            "cols": [
                ("id", "BIGINT (PK, Auto)", "Unique prescription ID"),
                ("user_id", "BIGINT (FK -> users.id)", "Patient owner reference"),
                ("doctor_name", "VARCHAR(255)", "Prescribing physician name"),
                ("hospital_or_clinic", "VARCHAR(255)", "Medical facility / chamber"),
                ("prescription_date", "DATE", "Date prescribed"),
                ("diagnosis", "TEXT", "Clinical diagnosis & doctor impressions"),
                ("raw_ocr_text", "LONGTEXT", "Extracted OCR text before verification"),
                ("image_url", "VARCHAR(500)", "Uploaded scan image URL"),
            ]
        },
        {
            "name": "medicines",
            "desc": "Catalog of active and completed medications.",
            "cols": [
                ("id", "BIGINT (PK, Auto)", "Unique medicine ID"),
                ("user_id", "BIGINT (FK -> users.id)", "Patient owner reference"),
                ("prescription_id", "BIGINT (FK -> prescriptions.id, Nullable)", "Originating prescription"),
                ("name", "VARCHAR(255)", "Brand or trade name (e.g. Napa)"),
                ("generic_name", "VARCHAR(255)", "Active pharmacological agent"),
                ("dose", "VARCHAR(100)", "Dosage strength (e.g. 500mg)"),
                ("frequency", "VARCHAR(50)", "Frequency code (e.g. TWICE_DAILY)"),
                ("food_instruction", "VARCHAR(50)", "Timing (BEFORE_MEAL, AFTER_MEAL)"),
                ("is_active", "BOOLEAN", "Active treatment flag"),
            ]
        },
        {
            "name": "medicine_schedules & medicine_logs",
            "desc": "Individual alarm timings and daily dose intake verification records.",
            "cols": [
                ("schedule.time", "VARCHAR(50)", "Time of day (e.g. 08:00 AM, 10:00 PM)"),
                ("schedule.label", "VARCHAR(50)", "Slot (MORNING, AFTERNOON, NIGHT)"),
                ("log.log_date", "DATE", "Calendar date of scheduled dose"),
                ("log.status", "VARCHAR(50)", "Status (PENDING, TAKEN, SKIPPED, MISSED)"),
                ("log.taken_at", "DATETIME", "Actual timestamp when user pressed Take"),
            ]
        },
        {
            "name": "medical_reports",
            "desc": "Diagnostic lab test results and imaging reports.",
            "cols": [
                ("id", "BIGINT (PK, Auto)", "Unique report ID"),
                ("user_id", "BIGINT (FK -> users.id)", "Patient owner reference"),
                ("title", "VARCHAR(255)", "Report title (e.g. Complete Blood Count)"),
                ("type", "VARCHAR(50)", "Category (BLOOD_TEST, X_RAY, MRI, ECG, etc.)"),
                ("hospital_or_lab", "VARCHAR(255)", "Diagnostic center name"),
                ("notes", "TEXT", "Doctor summary & test impressions"),
                ("file_url", "VARCHAR(500)", "Uploaded PDF/Image report path"),
            ]
        }
    ]

    for st in schema_tables:
        story.append(Paragraph(f"Table: <code>{st['name']}</code> — {st['desc']}", styles['SubSectionHeader']))
        table_data = [[Paragraph("Column Name", styles['TableHeaderCell']), Paragraph("Data Type & Key", styles['TableHeaderCell']), Paragraph("Description", styles['TableHeaderCell'])]]
        for col in st['cols']:
            table_data.append([
                Paragraph(f"<code>{col[0]}</code>", styles['TableCell']),
                Paragraph(col[1], styles['TableCell']),
                Paragraph(col[2], styles['TableCell'])
            ])
        t_s = Table(table_data, colWidths=[120, 160, 224])
        t_s.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), DARK_TEAL),
            ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(t_s)
        story.append(Spacer(1, 6))

    story.append(PageBreak())

    # ==========================================
    # 6. SETUP & EXECUTION GUIDE
    # ==========================================
    story.append(Paragraph("6. Deployment & Developer Run Guide", styles['SectionHeader']))
    story.append(Paragraph("Follow these instructions to run the Meditalk backend and frontend across Desktop Web and Mobile devices.", styles['BodyDoc']))

    story.append(Paragraph("Step 1: Database Initialization", styles['SubSectionHeader']))
    story.append(Paragraph("1. Start Apache & MySQL in <b>XAMPP Control Panel</b>.", styles['BulletDoc']))
    story.append(Paragraph("2. Create database named <code>meditalk</code> (default user: <code>root</code>, password: <code>1234</code>).", styles['BulletDoc']))
    story.append(Paragraph("3. Hibernate auto-creates all 7 tables on backend launch.", styles['BulletDoc']))

    story.append(Paragraph("Step 2: Start Spring Boot Backend", styles['SubSectionHeader']))
    story.append(Paragraph("Open terminal in <code>d:\\Meditalk\\backend</code> and execute:", styles['BulletDoc']))
    
    cmd_backend = [[Paragraph("<code>.\\mvnw.cmd spring-boot:run</code>", styles['TableCell'])]]
    t_cb = Table(cmd_backend, colWidths=[504])
    t_cb.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#1E293B")),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#334155")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(t_cb)
    story.append(Paragraph("• Verifies at: <code>http://localhost:8080/api/health</code>", styles['BulletDoc']))

    story.append(Spacer(1, 6))
    story.append(Paragraph("Step 3: Start Mobile & Web Frontend", styles['SubSectionHeader']))
    story.append(Paragraph("Open terminal in <code>d:\\Meditalk\\mobile</code> and execute:", styles['BulletDoc']))
    
    cmd_frontend = [[Paragraph("<code>npx expo start --web</code>", styles['TableCell'])]]
    t_cf = Table(cmd_frontend, colWidths=[504])
    t_cf.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#1E293B")),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#334155")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(t_cf)
    story.append(Paragraph("• <b>Web Access:</b> Navigate to <code>http://localhost:8081</code> or <code>http://192.168.0.4:8081</code>.", styles['BulletDoc']))
    story.append(Paragraph("• <b>Phone Access (Expo Go):</b> Connect phone to same Wi-Fi and open <code>exp://192.168.0.4:8081</code>.", styles['BulletDoc']))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Pre-Seeded Demo Credentials", styles['SubSectionHeader']))
    creds = [
        [Paragraph("Email", styles['TableHeaderCell']), Paragraph("Password", styles['TableHeaderCell']), Paragraph("Account Profile", styles['TableHeaderCell'])],
        [Paragraph("<code>john.doe@meditalk.com</code>", styles['TableCell']), Paragraph("<code>SecurePass123!</code>", styles['TableCell']), Paragraph("Preloaded with 3 active medicines, 1 doctor, 1 prescription, 1 lab report", styles['TableCell'])],
    ]
    t_cr = Table(creds, colWidths=[160, 120, 224])
    t_cr.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_TEAL),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_cr)

    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY_TEAL, spaceBefore=10, spaceAfter=10))
    story.append(Paragraph("End of Meditalk Platform Technical Documentation — Generated by System Architecture Team.", styles['CalloutText']))

    # Build PDF with Page Numbers
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"SUCCESS: PDF generated successfully at: {filename}")

if __name__ == "__main__":
    out_pdf = "d:/Meditalk/docs/Meditalk_Complete_Documentation.pdf"
    build_pdf(out_pdf)
