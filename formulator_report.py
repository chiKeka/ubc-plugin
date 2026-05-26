#!/usr/bin/env python3
"""Generate PDF report: Body Care Cosmetics Formulators for Edmonton, AB (Canadian + International)"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from datetime import date

OUTPUT = "/home/user/ubc-plugin/Formulator_Report_Edmonton.pdf"

DARK = HexColor("#1a1a2e")
ACCENT = HexColor("#16213e")
BLUE = HexColor("#0f3460")
HIGHLIGHT = HexColor("#e94560")
LIGHT_BG = HexColor("#f0f0f5")
WHITE = HexColor("#ffffff")
GREEN = HexColor("#2d6a4f")
GRAY = HexColor("#6c757d")

styles = getSampleStyleSheet()

title_style = ParagraphStyle("ReportTitle", parent=styles["Title"],
    fontSize=22, textColor=DARK, spaceAfter=4, leading=26)
subtitle_style = ParagraphStyle("Subtitle", parent=styles["Normal"],
    fontSize=11, textColor=GRAY, spaceAfter=20)
h1 = ParagraphStyle("H1", parent=styles["Heading1"],
    fontSize=16, textColor=DARK, spaceBefore=16, spaceAfter=8, leading=20)
h2 = ParagraphStyle("H2", parent=styles["Heading2"],
    fontSize=13, textColor=BLUE, spaceBefore=12, spaceAfter=6, leading=16)
h3 = ParagraphStyle("H3", parent=styles["Heading3"],
    fontSize=11, textColor=ACCENT, spaceBefore=8, spaceAfter=4, leading=14)
body = ParagraphStyle("Body", parent=styles["Normal"],
    fontSize=9.5, leading=13, spaceAfter=4)
body_small = ParagraphStyle("BodySmall", parent=styles["Normal"],
    fontSize=8.5, leading=11, spaceAfter=2)
contact_style = ParagraphStyle("Contact", parent=styles["Normal"],
    fontSize=9, leading=12, textColor=BLUE, spaceAfter=2)
score_style = ParagraphStyle("Score", parent=styles["Normal"],
    fontSize=14, textColor=HIGHLIGHT, spaceAfter=2, leading=18)
badge_style = ParagraphStyle("Badge", parent=styles["Normal"],
    fontSize=9, textColor=GREEN, spaceAfter=4, leading=12)
note_style = ParagraphStyle("Note", parent=styles["Normal"],
    fontSize=8.5, leading=11, textColor=GRAY, spaceAfter=6, leftIndent=12)
table_header_style = ParagraphStyle("TH", parent=styles["Normal"],
    fontSize=8.5, textColor=WHITE, leading=11)
table_cell_style = ParagraphStyle("TC", parent=styles["Normal"],
    fontSize=8.5, leading=11)

companies = [
    {
        "rank": 1, "name": "Delon Laboratories", "score": 87,
        "location": "Pointe-Claire, Quebec",
        "address": "75 Hymus Blvd, Pointe-Claire, QC H9R 1E2",
        "phone": "514-426-4381",
        "email": "labdelon.com/business-inquiry (contact form)",
        "website": "labdelon.com",
        "founded": "1942 (80+ years)",
        "certs": "ISO 22716 • FDA-Registered • Health Canada Establishment License • BOMA Best • GOTS",
        "body_care": "Body butters, body lotions, body washes, hand soaps",
        "moq": "Not publicly stated (large facility suggests moderate-to-high MOQs)",
        "highlights": "One of the largest and oldest cosmetic manufacturers in North America. Produces under strict USP guidelines. Member of Cosmetics Alliance Canada.",
        "best_for": "Established brands needing scale and regulatory bulletproofing.",
        "scores": [("Certifications", "25/25"), ("Track Record", "20/20"), ("Body Care", "15/15"),
                   ("Proximity", "10/15"), ("MOQ Flexibility", "5/10"), ("Client Portfolio", "9/10"), ("Reputation", "3/5")],
    },
    {
        "rank": 2, "name": "Swift Innovations", "score": 83,
        "location": "Edmonton / Ponoka, Alberta ★ LOCAL",
        "address": "5408 36 St NW, Edmonton, AB T6B 3P3 (Facility: Ponoka, AB)",
        "phone": "780-760-9299 / 780-761-9299",
        "email": "support@swiftinnovations.ca",
        "website": "swiftinnovations.ca",
        "founded": "2018 (~8 years; team has 50+ years combined experience)",
        "certs": "GMP • ISO • ECOCERT • NNHP GMP • Follows Health Canada Guidelines",
        "body_care": "Creams, lotions, butters, scrubs, sugaring solutions, toners, wipes, dry powders",
        "moq": "NO MOQ REQUIREMENT — very startup-friendly",
        "highlights": "Only Edmonton-based formulator found. Member of Edmonton Chamber of Commerce. 5/5 rating on Yellow Pages. Specializes in natural, organic, and customized bioactives.",
        "best_for": "Your #1 pick for local, no-MOQ, hands-on collaboration.",
        "scores": [("Certifications", "22/25"), ("Track Record", "10/20"), ("Body Care", "15/15"),
                   ("Proximity", "15/15"), ("MOQ Flexibility", "10/10"), ("Client Portfolio", "6/10"), ("Reputation", "5/5")],
    },
    {
        "rank": 3, "name": "Vicora Cosmeceuticals", "score": 78,
        "location": "North York (Toronto), Ontario",
        "address": "559 Fenmar Dr, North York, ON M9L 2R6",
        "phone": "416-640-2421 / 416-640-2422",
        "email": "h.vanaki@vicora.ca",
        "website": "vicora.ca",
        "founded": "Established (exact year not public)",
        "certs": "cGMP • Health Canada NHP Site License • USDA Organic (Ecocert USA)",
        "body_care": "Skincare and body care, including niche formats (facial sheet masks)",
        "moq": "Not publicly stated",
        "highlights": "Products found at Sephora, Holt Renfrew, Whole Foods, Costco, and Rexall. USDA Organic certification is rare among Canadian formulators.",
        "best_for": "Organic certification and prestige retail credibility.",
        "scores": [("Certifications", "24/25"), ("Track Record", "12/20"), ("Body Care", "13/15"),
                   ("Proximity", "10/15"), ("MOQ Flexibility", "5/10"), ("Client Portfolio", "10/10"), ("Reputation", "4/5")],
    },
    {
        "rank": 4, "name": "Angel Cosmoceuticals", "score": 75,
        "location": "Scarborough (Toronto), Ontario",
        "address": "763 Warden Ave, Unit 2A, Scarborough, ON M1L 4B7",
        "phone": "416-321-8783 / Toll-Free: 1-833-321-8783",
        "email": "Info@angelcosmoceuticals.com",
        "website": "angelcosmoceuticals.com",
        "founded": "Newer company (exact year not public)",
        "certs": "GMP • ISO 22716:2007 • Health Canada Cosmetic License • MoCRA Compliant (US export ready)",
        "body_care": "Body care, personal care, reverse engineering and natural enhancement",
        "moq": "Works with brands of various sizes",
        "highlights": "Full MoCRA compliance makes them ideal if you plan to sell into the US. ISO 22716 is the gold standard for cosmetics GMP.",
        "best_for": "US market expansion (MoCRA compliance is a significant advantage).",
        "scores": [("Certifications", "25/25"), ("Track Record", "8/20"), ("Body Care", "14/15"),
                   ("Proximity", "10/15"), ("MOQ Flexibility", "6/10"), ("Client Portfolio", "7/10"), ("Reputation", "5/5")],
    },
    {
        "rank": 5, "name": "Petra Soap (Petra Hygienic Systems)", "score": 73,
        "location": "Concord, Ontario (warehouses coast to coast)",
        "address": "1-86 Moyal Crt, Concord, ON L4K 4R8",
        "phone": "905-879-0575",
        "email": "petrasoap.com/contact-us (contact form)",
        "website": "petrasoap.com",
        "founded": "~1995 (30+ years)",
        "certs": "GMP ISO 22716:2017 Certified",
        "body_care": "Body/face wash, body/face lotion, scrubs, oils",
        "moq": "Not publicly stated (large 60,000 sq ft facility)",
        "highlights": "4,000+ customers. State-of-the-art facility with advanced robotics, AI, and vision computing. 12 kettles, 10 filling lines. Warehouses across Canada.",
        "best_for": "Scale production with cross-Canada logistics already built in.",
        "scores": [("Certifications", "22/25"), ("Track Record", "17/20"), ("Body Care", "13/15"),
                   ("Proximity", "10/15"), ("MOQ Flexibility", "4/10"), ("Client Portfolio", "5/10"), ("Reputation", "2/5")],
    },
    {
        "rank": 6, "name": "DBO Labs (OptaDerm Products)", "score": 71,
        "location": "Burnaby (Vancouver), British Columbia",
        "address": "6741 Cariboo Rd, Unit 202, Building C, Burnaby, BC V3N 4A3",
        "phone": "604-251-1190",
        "email": "Via dbolabs.com (format: first initial + last name @dbolabs.com)",
        "website": "dbolabs.com",
        "founded": "Established (division of OptaDerm Products Inc.)",
        "certs": "GMP (Health Canada + ICCR standards) • Endorses ISO 22716",
        "body_care": "Body lotions, body creams, plus serums, cleansers, shampoo, conditioner",
        "moq": "Works with startups and established brands",
        "highlights": "Vancouver location means closer shipping to Edmonton than Ontario-based companies. Strong R&D capabilities. Open Monday–Saturday.",
        "best_for": "West Coast proximity and strong formulation R&D.",
        "scores": [("Certifications", "22/25"), ("Track Record", "12/20"), ("Body Care", "13/15"),
                   ("Proximity", "10/15"), ("MOQ Flexibility", "6/10"), ("Client Portfolio", "5/10"), ("Reputation", "3/5")],
    },
    {
        "rank": 7, "name": "ILC Skin Care (Interlab Canada)", "score": 69,
        "location": "Calgary, Alberta",
        "address": "63 Skyline Crescent NE, Calgary, AB",
        "phone": "Not publicly listed",
        "email": "info@interlabcan.com",
        "website": "interlabcan.com",
        "founded": "Established (100% North American owned)",
        "certs": "GMP • Health Canada NHP Site License",
        "body_care": "Gels, emulsions, waxes, scrubs, creams, powders",
        "moq": "Offers small batch AND scaled manufacturing",
        "highlights": "Calgary-based — close to Edmonton. Small batch capability is great for testing. NHP site license means they can make natural health product claims.",
        "best_for": "Small batch runs while testing the market. Second-closest to Edmonton.",
        "scores": [("Certifications", "21/25"), ("Track Record", "12/20"), ("Body Care", "13/15"),
                   ("Proximity", "12/15"), ("MOQ Flexibility", "7/10"), ("Client Portfolio", "4/10"), ("Reputation", "2/5")],
    },
    {
        "rank": 8, "name": "ATS Health & Beauty Care", "score": 67,
        "location": "Toronto, Ontario",
        "address": "Toronto, ON (exact address via inquiry)",
        "phone": "416-953-5833",
        "email": "Sales@atshealthandbeautycare.com",
        "website": "atshealthandbeautycare.com",
        "founded": "2005 (20+ years)",
        "certs": "GMP Certified Facility • Health Canada NPN License",
        "body_care": "Hand and body care, skincare, hair care",
        "moq": "Not publicly stated",
        "highlights": "Canadian-owned A-to-Z approach from formulation to finished product. 20+ years of experience.",
        "best_for": "Full-service manufacturing from concept to shelf.",
        "scores": [("Certifications", "20/25"), ("Track Record", "14/20"), ("Body Care", "12/15"),
                   ("Proximity", "10/15"), ("MOQ Flexibility", "5/10"), ("Client Portfolio", "4/10"), ("Reputation", "2/5")],
    },
    {
        "rank": 9, "name": "Cosmetic Labs Canada", "score": 65,
        "location": "Sault Ste. Marie, Ontario",
        "address": "298 Wellington St W, Sault Ste Marie, ON P6A 1H7",
        "phone": "705-910-0338 ext. 3",
        "email": "cosmeticlabscanada.com/contact-us (contact form)",
        "website": "cosmeticlabscanada.com",
        "founded": "2006 (20 years)",
        "certs": "GMP Compliant • In-house R&D Chemists (15+ years collective expertise)",
        "body_care": "Skincare, hair care, body care, cleansers, moisturizers",
        "moq": "Not publicly stated",
        "highlights": "Positions itself as Canada’s #1 private label and raw material supplier. Also sells raw materials if you want to formulate yourself.",
        "best_for": "Private label with raw material access.",
        "scores": [("Certifications", "18/25"), ("Track Record", "16/20"), ("Body Care", "12/15"),
                   ("Proximity", "10/15"), ("MOQ Flexibility", "5/10"), ("Client Portfolio", "3/10"), ("Reputation", "1/5")],
    },
    {
        "rank": 10, "name": "EC Studios", "score": 62,
        "location": "Toronto, Ontario",
        "address": "50 Carroll Street, Toronto, ON M4M 3G3",
        "phone": "416-985-0614",
        "email": "hi@ec-studios.ca",
        "website": "ec-studios.ca",
        "founded": "Family-owned (legacy in cosmetic chemistry)",
        "certs": "No specific certifications publicly listed",
        "body_care": "Body cleansers, personal care, skincare, haircare",
        "moq": "Boutique studio — works with indie founders",
        "highlights": "Strong client reviews praising transparency and quality. Inc.com profiled. Certified woman-owned business. Full 360° support (formulation, production, packaging, branding).",
        "best_for": "Creative founders who want a hands-on boutique partner.",
        "scores": [("Certifications", "10/25"), ("Track Record", "10/20"), ("Body Care", "11/15"),
                   ("Proximity", "10/15"), ("MOQ Flexibility", "8/10"), ("Client Portfolio", "6/10"), ("Reputation", "5/5")],
    },
    {
        "rank": 11, "name": "Niche Skin Labs", "score": 59,
        "location": "Toronto, Ontario",
        "address": "18 King St E, Suite 1400, Toronto, ON M5C 1C4",
        "phone": "647-794-7080",
        "email": "hello@nicheskinlabs.com",
        "website": "nicheskinlabs.com",
        "founded": "Newer company",
        "certs": "No specific certifications publicly listed",
        "body_care": "Skincare, hair care, cosmetics (body care less emphasized)",
        "moq": "LOW MINIMUMS — founded specifically to serve indie brands",
        "highlights": "Built for startups and indie brands. Lab-scale batches available for stability and preservative testing before scaling.",
        "best_for": "Very early-stage brand needing tiny batches and hand-holding.",
        "scores": [("Certifications", "8/25"), ("Track Record", "8/20"), ("Body Care", "11/15"),
                   ("Proximity", "10/15"), ("MOQ Flexibility", "10/10"), ("Client Portfolio", "5/10"), ("Reputation", "3/5")],
    },
    {
        "rank": 12, "name": "Leslie Cosmetics", "score": 57,
        "location": "North York (Toronto), Ontario",
        "address": "650 Petrolia Rd, North York, ON",
        "phone": "416-739-7773",
        "email": "mrival@lesliecosmetics.com",
        "website": "lesliecosmetics.ca",
        "founded": "50+ years in business",
        "certs": "No specific certifications listed (pharma-grade QC internally)",
        "body_care": "Body lotions, exfoliants, hand creams, foot scrubs, massage oils, shower gels",
        "moq": "Works with startups and small businesses",
        "highlights": "Extensive body care range. Tests all products as if they were pharmaceuticals. Sources certified organic and fair-trade raw materials.",
        "best_for": "Deep body care expertise with pharma-grade internal standards.",
        "scores": [("Certifications", "8/25"), ("Track Record", "16/20"), ("Body Care", "14/15"),
                   ("Proximity", "10/15"), ("MOQ Flexibility", "5/10"), ("Client Portfolio", "3/10"), ("Reputation", "1/5")],
    },
]

international_companies = [
    {
        "rank": 1, "name": "Columbia Cosmetics Manufacturing", "score": 82,
        "country": "USA",
        "location": "San Francisco Bay Area, California, USA",
        "address": "San Francisco Bay Area, CA (exact address via inquiry)",
        "phone": "510-562-5900",
        "email": "columbiacosmetics.com (contact form)",
        "website": "columbiacosmetics.com",
        "founded": "1978 (45+ years)",
        "certs": "FDA Registered • FDA/CDPH Drug & Cosmetic Licenses • NSF/ANSI 305 & NOP Organic • COSMOS/ECOCERT • RSPO • GMP ISO 22716:2007",
        "body_care": "Skincare, body care, hair care, color cosmetics",
        "moq": "Not publicly stated",
        "ships_to_canada": "Yes — one of the largest private label manufacturers in North America",
        "highlights": "Most heavily certified manufacturer on this list. Organic (NOP + COSMOS/ECOCERT), palm oil sustainable (RSPO), FDA-registered. Full turnkey including regulatory compliance.",
        "best_for": "Brands needing the deepest certification stack (organic, sustainable, FDA, EU compliant).",
    },
    {
        "rank": 2, "name": "RainShadow Labs", "score": 76,
        "country": "USA",
        "location": "St. Helens, Oregon, USA",
        "address": "St. Helens, OR (Columbia River facility)",
        "phone": "Via rainshadowlabs.com",
        "email": "Via rainshadowlabs.com (online ordering system)",
        "website": "rainshadowlabs.com",
        "founded": "1983 (40+ years)",
        "certs": "FDA Registered • ISO Certified • GMP Compliant • Kosher Certified Materials • Wind-Powered Facility",
        "body_care": "Full range of skin care, body care, and hair care products",
        "moq": "Private label: 10-gallon minimum. Custom formulation: 25-gallon minimum.",
        "ships_to_canada": "Yes — ships globally",
        "highlights": "Very low MOQs for a certified facility. Vegan and biodegradable formulas. Powered by renewable wind energy. 40+ years in business. Online ordering system for ease.",
        "best_for": "Low-MOQ orders from a veteran, eco-conscious US manufacturer.",
    },
    {
        "rank": 3, "name": "Voyant Beauty", "score": 74,
        "country": "USA / Canada / Europe",
        "location": "Chicago, IL (HQ) + facilities in Canada and Europe",
        "address": "Chicago, IL (HQ); Los Angeles, CA; New Jersey",
        "phone": "708-482-8881 (Chicago) / 818-206-6700 (LA) / 732-888-7788 (NJ)",
        "email": "voyantbeauty.com/contact-voyant-beauty (contact form)",
        "website": "voyantbeauty.com",
        "founded": "Established (major multi-facility operation)",
        "certs": "Not publicly detailed (contact for specifics)",
        "body_care": "Hand and body soaps, bath and body care, skincare, hair care, sun care, fragrance",
        "moq": "Flexible — from low minimums to high-volume production",
        "ships_to_canada": "Yes — has facilities IN Canada already",
        "highlights": "Multi-country operation (US, Canada, Europe). Flexible MOQs from startup to enterprise scale. Atelier by Voyant Beauty is their indie-brand division.",
        "best_for": "Brands wanting a single partner that can grow with them globally.",
    },
    {
        "rank": 4, "name": "Purolea Cosmetics Lab", "score": 70,
        "country": "USA",
        "location": "Livonia, Michigan, USA",
        "address": "Livonia, MI (Detroit metro area)",
        "phone": "Via purolea.com",
        "email": "purolea.com/contact-us (contact form)",
        "website": "purolea.com",
        "founded": "Established",
        "certs": "USDA Organic Certified • FDA Registered • MoCRA Compliant • cGMP",
        "body_care": "Oil-based body care, skincare, haircare, anhydrous products",
        "moq": "1,000 units minimum",
        "ships_to_canada": "Yes — describes itself as 'Detroit-based, Global Reach'",
        "highlights": "Specializes in USDA Organic oil-based products. If your body care line is oil-forward (body oils, oil-based butters, balms), this is a strong specialist.",
        "best_for": "Oil-based / anhydrous body care products with USDA Organic certification.",
    },
    {
        "rank": 5, "name": "Cosmos Labs", "score": 68,
        "country": "USA",
        "location": "Austin, Texas, USA",
        "address": "Austin, TX (exact address via inquiry)",
        "phone": "Via cosmos-labs.com",
        "email": "Via cosmos-labs.com (contact form)",
        "website": "cosmos-labs.com",
        "founded": "Established (woman-owned)",
        "certs": "ISO 22716 Certified • GMP Compliant",
        "body_care": "Custom formulations across skincare and body care categories",
        "moq": "Flexible — small batch to large-scale manufacturing",
        "ships_to_canada": "Likely (US-based, ships domestically; confirm international)",
        "highlights": "Woman-owned business. ISO 22716 certified. Specializes in scaling from small to large batches. Based in Austin's growing beauty/wellness ecosystem.",
        "best_for": "Custom body care formulations with ISO 22716 quality assurance.",
    },
    {
        "rank": 6, "name": "Made By Nature Labs", "score": 65,
        "country": "Bulgaria (EU)",
        "location": "Bulgaria, European Union",
        "address": "Bulgaria, EU (exact address via inquiry)",
        "phone": "EU: +359 882 919148 / US: (302) 409-0923",
        "email": "sales@madebynaturelabs.com",
        "website": "madebynaturelabs.com",
        "founded": "Established",
        "certs": "EU Cosmetic Regulation Compliant • CPNP Registered • Stability and Microbiological Testing",
        "body_care": "Body lotions, body butters, exfoliating scrubs, anti-cellulite treatments, essential oils",
        "moq": "Not publicly stated (private label stock available)",
        "ships_to_canada": "Yes — ships to 80+ countries via UPS, DHL, TNT",
        "highlights": "EU-made means strict EU cosmetic regulation compliance (among the toughest globally). 100% natural ingredient focus. Ships worldwide. Lower EU manufacturing costs can mean competitive pricing.",
        "best_for": "Natural body care with EU regulatory compliance and global shipping.",
    },
]

def build_pdf():
    doc = SimpleDocTemplate(OUTPUT, pagesize=letter,
        topMargin=0.6*inch, bottomMargin=0.6*inch,
        leftMargin=0.7*inch, rightMargin=0.7*inch)

    story = []

    # Title page content
    story.append(Spacer(1, 0.8*inch))
    story.append(Paragraph("Body Care Cosmetics Formulators", title_style))
    story.append(Paragraph("Canadian &amp; International Market Research Report for Edmonton, Alberta", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=HIGHLIGHT))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"Prepared: {date.today().strftime('%B %d, %Y')}", body))
    story.append(Paragraph("Prepared for: chike.bruno9@gmail.com", body))
    story.append(Spacer(1, 20))

    story.append(Paragraph("18 formulators researched and ranked by trust score — 12 Canadian and 6 international (USA &amp; Europe) that ship to Canada. All focused on body care products (lotions, butters, scrubs, washes, oils).", body))
    story.append(Spacer(1, 16))

    # Trust Score Criteria
    story.append(Paragraph("Trust Score Methodology (100 points)", h1))
    story.append(HRFlowable(width="100%", thickness=1, color=BLUE))
    story.append(Spacer(1, 8))

    criteria_data = [
        [Paragraph("<b>Criterion</b>", table_header_style),
         Paragraph("<b>Weight</b>", table_header_style),
         Paragraph("<b>What It Measures</b>", table_header_style)],
        [Paragraph("Certifications & Compliance", table_cell_style), Paragraph("25 pts", table_cell_style),
         Paragraph("GMP, ISO 22716, Health Canada NHP/cosmetic license, USDA Organic, FDA registration, MoCRA", table_cell_style)],
        [Paragraph("Track Record (Years)", table_cell_style), Paragraph("20 pts", table_cell_style),
         Paragraph("How long they've been operating — longevity = stability", table_cell_style)],
        [Paragraph("Body Care Specialization", table_cell_style), Paragraph("15 pts", table_cell_style),
         Paragraph("Do they specifically formulate body lotions, butters, scrubs, washes, oils?", table_cell_style)],
        [Paragraph("Proximity to Edmonton", table_cell_style), Paragraph("15 pts", table_cell_style),
         Paragraph("Alberta = 15, elsewhere in Canada = 10, US-based = 5", table_cell_style)],
        [Paragraph("MOQ Flexibility", table_cell_style), Paragraph("10 pts", table_cell_style),
         Paragraph("No MOQ or low minimums = better for a new or growing brand", table_cell_style)],
        [Paragraph("Client Portfolio & Recognition", table_cell_style), Paragraph("10 pts", table_cell_style),
         Paragraph("Notable retail clients, awards, industry memberships", table_cell_style)],
        [Paragraph("Public Reputation", table_cell_style), Paragraph("5 pts", table_cell_style),
         Paragraph("BBB profile, online reviews, absence of complaints", table_cell_style)],
    ]

    criteria_table = Table(criteria_data, colWidths=[1.8*inch, 0.8*inch, 4.2*inch])
    criteria_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("BACKGROUND", (0, 1), (-1, -1), LIGHT_BG),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#cccccc")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(criteria_table)
    story.append(Spacer(1, 16))

    # Quick ranking summary
    story.append(Paragraph("Part 1: Canadian Formulators — Rankings at a Glance", h1))
    story.append(HRFlowable(width="100%", thickness=1, color=BLUE))
    story.append(Spacer(1, 8))

    rank_data = [
        [Paragraph("<b>#</b>", table_header_style),
         Paragraph("<b>Company</b>", table_header_style),
         Paragraph("<b>Score</b>", table_header_style),
         Paragraph("<b>Location</b>", table_header_style),
         Paragraph("<b>Best For</b>", table_header_style)],
    ]
    for c in companies:
        rank_data.append([
            Paragraph(str(c["rank"]), table_cell_style),
            Paragraph(f"<b>{c['name']}</b>", table_cell_style),
            Paragraph(f"<b>{c['score']}/100</b>", table_cell_style),
            Paragraph(c["location"], table_cell_style),
            Paragraph(c["best_for"], table_cell_style),
        ])

    rank_table = Table(rank_data, colWidths=[0.35*inch, 1.6*inch, 0.6*inch, 1.75*inch, 2.5*inch])
    rank_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#cccccc")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(rank_table)

    story.append(PageBreak())

    # Detailed profiles
    story.append(Paragraph("Canadian Company Profiles (Detailed)", h1))
    story.append(HRFlowable(width="100%", thickness=2, color=HIGHLIGHT))
    story.append(Spacer(1, 8))

    for i, c in enumerate(companies):
        if i > 0 and i % 2 == 0:
            story.append(PageBreak())

        story.append(Spacer(1, 6))
        story.append(HRFlowable(width="100%", thickness=1, color=HexColor("#dddddd")))
        story.append(Spacer(1, 4))

        story.append(Paragraph(f"#{c['rank']}. {c['name']}", h2))
        story.append(Paragraph(f"<b>Trust Score: {c['score']}/100</b>", score_style))
        story.append(Paragraph(f"★ {c['best_for']}", badge_style))

        # Contact info block
        story.append(Paragraph("<b>Contact Information</b>", h3))
        story.append(Paragraph(f"• <b>Location:</b> {c['location']}", body_small))
        story.append(Paragraph(f"• <b>Address:</b> {c['address']}", body_small))
        story.append(Paragraph(f"• <b>Phone:</b> {c['phone']}", body_small))
        story.append(Paragraph(f"• <b>Email:</b> {c['email']}", body_small))
        story.append(Paragraph(f"• <b>Website:</b> {c['website']}", body_small))

        # Company details
        story.append(Paragraph("<b>Company Details</b>", h3))
        story.append(Paragraph(f"• <b>Founded:</b> {c['founded']}", body_small))
        story.append(Paragraph(f"• <b>Certifications:</b> {c['certs']}", body_small))
        story.append(Paragraph(f"• <b>Body Care Products:</b> {c['body_care']}", body_small))
        story.append(Paragraph(f"• <b>MOQ:</b> {c['moq']}", body_small))

        story.append(Spacer(1, 4))
        story.append(Paragraph(f"<b>Highlights:</b> {c['highlights']}", body_small))

        # Score breakdown mini-table
        score_data = [[Paragraph(f"<b>{s[0]}</b>", table_cell_style), Paragraph(s[1], table_cell_style)] for s in c["scores"]]
        score_table = Table(score_data, colWidths=[2.2*inch, 0.8*inch])
        score_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.3, HexColor("#dddddd")),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, LIGHT_BG]),
        ]))
        story.append(Spacer(1, 4))
        story.append(score_table)
        story.append(Spacer(1, 8))

    # International section
    story.append(PageBreak())
    story.append(Paragraph("International Formulators (Ship to Canada)", h1))
    story.append(HRFlowable(width="100%", thickness=2, color=HIGHLIGHT))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "The following 6 companies are based outside Canada (USA and Europe) but ship to Canada. "
        "They are scored on the same trust criteria, with the Proximity score adjusted: "
        "US-based companies receive 5/15, EU-based receive 3/15 for proximity to Edmonton. "
        "International shipping adds cost and customs considerations, but these companies offer "
        "certifications and specializations not always available domestically.", body))
    story.append(Spacer(1, 8))

    # International rankings summary
    intl_rank_data = [
        [Paragraph("<b>#</b>", table_header_style),
         Paragraph("<b>Company</b>", table_header_style),
         Paragraph("<b>Score</b>", table_header_style),
         Paragraph("<b>Country</b>", table_header_style),
         Paragraph("<b>Best For</b>", table_header_style)],
    ]
    for c in international_companies:
        intl_rank_data.append([
            Paragraph(str(c["rank"]), table_cell_style),
            Paragraph(f"<b>{c['name']}</b>", table_cell_style),
            Paragraph(f"<b>{c['score']}/100</b>", table_cell_style),
            Paragraph(c["country"], table_cell_style),
            Paragraph(c["best_for"], table_cell_style),
        ])

    intl_rank_table = Table(intl_rank_data, colWidths=[0.35*inch, 1.8*inch, 0.6*inch, 1.2*inch, 2.85*inch])
    intl_rank_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#cccccc")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(intl_rank_table)
    story.append(PageBreak())

    # International detailed profiles
    story.append(Paragraph("International Company Profiles", h1))
    story.append(HRFlowable(width="100%", thickness=2, color=HIGHLIGHT))
    story.append(Spacer(1, 8))

    for i, c in enumerate(international_companies):
        if i > 0 and i % 2 == 0:
            story.append(PageBreak())

        story.append(Spacer(1, 6))
        story.append(HRFlowable(width="100%", thickness=1, color=HexColor("#dddddd")))
        story.append(Spacer(1, 4))

        story.append(Paragraph(f"Intl #{c['rank']}. {c['name']}", h2))
        story.append(Paragraph(f"<b>Trust Score: {c['score']}/100</b>  |  <b>Country: {c['country']}</b>", score_style))
        story.append(Paragraph(f"★ {c['best_for']}", badge_style))

        story.append(Paragraph("<b>Contact Information</b>", h3))
        story.append(Paragraph(f"• <b>Location:</b> {c['location']}", body_small))
        story.append(Paragraph(f"• <b>Address:</b> {c['address']}", body_small))
        story.append(Paragraph(f"• <b>Phone:</b> {c['phone']}", body_small))
        story.append(Paragraph(f"• <b>Email:</b> {c['email']}", body_small))
        story.append(Paragraph(f"• <b>Website:</b> {c['website']}", body_small))
        story.append(Paragraph(f"• <b>Ships to Canada:</b> {c['ships_to_canada']}", body_small))

        story.append(Paragraph("<b>Company Details</b>", h3))
        story.append(Paragraph(f"• <b>Founded:</b> {c['founded']}", body_small))
        story.append(Paragraph(f"• <b>Certifications:</b> {c['certs']}", body_small))
        story.append(Paragraph(f"• <b>Body Care Products:</b> {c['body_care']}", body_small))
        story.append(Paragraph(f"• <b>MOQ:</b> {c['moq']}", body_small))

        story.append(Spacer(1, 4))
        story.append(Paragraph(f"<b>Highlights:</b> {c['highlights']}", body_small))
        story.append(Spacer(1, 8))

    # Recommendation page
    story.append(PageBreak())
    story.append(Paragraph("Recommendation for Edmonton, AB", h1))
    story.append(HRFlowable(width="100%", thickness=2, color=HIGHLIGHT))
    story.append(Spacer(1, 12))

    story.append(Paragraph("<b>Primary Recommendation: Swift Innovations (#2 overall, #1 for your situation)</b>", h2))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "While Delon Laboratories scores highest overall due to 80+ years of track record and top-tier certifications, "
        "<b>Swift Innovations is the strongest choice for an Edmonton-based body care business</b>. They are the only "
        "formulator physically located in Edmonton, have no minimum order requirement (critical for a new brand), "
        "hold solid certifications (GMP, ISO, ECOCERT), and specialize in exactly the body care product types you need. "
        "Being local means you can visit the facility, iterate on formulations in person, and save significantly on shipping.", body))
    story.append(Spacer(1, 12))

    story.append(Paragraph("<b>Also noteworthy: ILC Skin Care (#7) is in Calgary</b> — just 3 hours from Edmonton, "
        "offers small-batch manufacturing, and holds a Health Canada NHP site license. A strong backup or second source.", body))
    story.append(Spacer(1, 16))

    story.append(Paragraph("When to Look Beyond Local", h2))
    story.append(Spacer(1, 6))
    recs = [
        ("Need organic certification", "Vicora (CA #3) or Columbia Cosmetics (Intl #1) — USDA/COSMOS/ECOCERT"),
        ("Need US export readiness", "Angel Cosmoceuticals (CA #4) — Full MoCRA compliance"),
        ("Need massive scale", "Delon Laboratories (CA #1) — 80+ years, ISO 22716, FDA-registered"),
        ("Need West Coast proximity", "DBO Labs (CA #6) — Burnaby/Vancouver, BC"),
        ("Need prestige retail validation", "Vicora Cosmeceuticals (CA #3) — Sephora, Holt Renfrew, Costco clients"),
        ("Need tiny test batches", "Niche Skin Labs (CA #11) or RainShadow Labs (Intl #2, 10-gal min)"),
        ("Need oil-based / anhydrous products", "Purolea (Intl #4) — USDA Organic specialist for oils and balms"),
        ("Need EU regulatory compliance", "Made By Nature Labs (Intl #6) — EU-made, ships to 80+ countries"),
        ("Need a global multi-facility partner", "Voyant Beauty (Intl #3) — US, Canada, and Europe facilities"),
        ("Need deepest certification stack", "Columbia Cosmetics (Intl #1) — FDA, COSMOS, ECOCERT, RSPO, NOP, ISO"),
    ]
    for scenario, rec in recs:
        story.append(Paragraph(f"• <b>{scenario} →</b> {rec}", body))
    story.append(Spacer(1, 20))

    story.append(Paragraph("Disclaimer", h3))
    story.append(Paragraph(
        "This report is based on publicly available information gathered in May 2026. Trust scores are the author’s "
        "assessment based on the stated criteria and may not reflect recent changes. Always verify certifications, MOQs, "
        "and pricing directly with each company before entering into agreements. This report does not constitute an "
        "endorsement or guarantee of any company’s services.", note_style))

    doc.build(story)
    print(f"PDF generated: {OUTPUT}")

if __name__ == "__main__":
    build_pdf()
