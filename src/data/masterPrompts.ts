export interface MasterPromptDefinition {
  id: string;
  title: string;
  category: "Magazine & Editorial" | "Branding & Mockups" | "Social Media Marketing" | "Content & Strategy";
  description: string;
  badge: string;
  formFields: {
    key: string;
    label: string;
    type: "text" | "textarea" | "select";
    placeholder?: string;
    defaultValue?: string;
    options?: string[];
    required?: boolean;
    helperText?: string;
  }[];
  compilePrompt: (values: Record<string, string>) => string;
  rawTemplate: string;
}

// Raw prompt texts supplied by user
const RAW_HERO_PROMPT_SNIPPET = `MASTER PROMPT — HERO PAGE LAYOUT REINVENTOR (v2)
1. ROLE: World-class magazine art director and editorial designer.
2. DELIVERABLE: ONE single, complete, print-ready magazine HERO PAGE.
3. 20 ARCHETYPE LIBRARY: Full-bleed, Off-centre window, Hard horizontal split, Diagonal cut, Vertical spine, Centred monument, etc.
4. SAFE AREA & DISCIPLINE: Max 3 colours, max 3 shapes, max 2 typefaces.`;

const RAW_HERO_PROMPT = `MASTER PROMPT — HERO PAGE LAYOUT REINVENTOR (v2)

HOW THIS FILE IS USED
The user uploads exactly three things: Reference A (image), Reference B (image), and this file. Nothing else will ever be written. You must not ask questions, request files, or wait for clarification. Where anything is unclear, decide it yourself with expert editorial judgment and deliver.

================================================================
1. ROLE
================================================================
Act as a world-class magazine art director, senior editorial designer, visual identity specialist and print-layout expert with twenty years of experience on premium international magazines. You think in grids, optical alignment, hierarchy and negative space. You have strong taste, and you know when to stop adding.

================================================================
2. THE DELIVERABLE
================================================================
ONE single, complete, print-ready magazine HERO PAGE: a full-page editorial opener built around ONE person.
It is NOT a cover, NOT a spread, NOT a poster, NOT a mockup, NOT a template preview.
This is one of a series of 50 hero pages for the same publication. Each must feel like a different art direction, and all must clearly belong to the same magazine.

================================================================
3. PHASE 1 — SILENT ANALYSIS (internal; never printed)
================================================================
Study both references and build a private brief:
a) Theme, concept, editorial purpose, target audience.
b) Country and culture: which country the publication belongs to and which cultural signals appear.
c) Identity: masthead, brand mark, logo treatment, sponsor/partner lines, section kicker, folio, issue line.
d) Grid and composition of A and B separately: columns, margin ratios, alignment axis, subject zone, text zone, reading direction.
e) Typography: display vs text faces, size hierarchy, case, tracking, alignment.
f) Palette and proportional colour ratio.
g) Photo treatment: crop, scale, cut-out vs full-bleed, colour vs duotone, background handling.
h) Recurring devices: rules, boxes, numerals, kickers, captions, labels.
i) What A and B SHARE = the publication's DNA. KEEP IT.
j) What A and B DIFFER on = free territory. EXPLOIT IT.
k) Which archetype (section 6) each reference uses. Those two are now forbidden.

================================================================
4. PHASE 2 — SAME-THEME MANDATE (what must NOT change)
================================================================
- Theme, subject matter, country, culture and audience stay identical to the references.
- Carry the country's cultural signal forward: one cue is enough, two is plenty. Reinterpret it minimally and elegantly.
- Keep the publication's DNA: masthead and brand-mark treatment, sponsor/partner lines, folio, issue line, section kicker.
- Page size, orientation and aspect ratio must be EXACTLY the same as the references.

================================================================
5. PHASE 3 — NON-COPY MANDATE (hard, measurable rules)
================================================================
R1 GRID: a different column structure AND a different margin ratio from both references.
R2 FOCAL POSITION: the portrait must sit in a different third of the page from where it sits in either reference.
R3 ARCHETYPE: one archetype from section 6 that neither reference uses.
R4 SCALE SHIFT: change portrait crop and scale substantially.
R5 TEXT RELOCATION: the name / title / standfirst block must sit in a different relationship to the subject than in either reference.
R6 SHAPES: maximum 3 geometric shapes on the whole page.
R7 PALETTE: maximum 3 colours including black and white, in a different proportional ratio from the references.
R8 TYPOGRAPHY: a new display + text pairing of the same class and spirit.
R9 STRUCTURAL DEVICE: replace the references' main structural device with a different one.

================================================================
6. ARCHETYPE LIBRARY — 20 FULLY DIFFERENT LAYOUTS
================================================================
01 FULL-BLEED + EDGE TYPE
02 OFF-CENTRE WINDOW
03 HARD HORIZONTAL SPLIT
04 ASYMMETRIC T-ZONE
05 PANEL + COLUMN
06 CUT-OUT + OVERSIZED NUMERAL
07 DUOTONE SILHOUETTE BLEED
08 TALL IMAGE STRIP
09 TWO-IMAGE LAYER
10 TYPE-AS-IMAGE
11 VERTICAL SPINE
12 CENTRED MONUMENT
13 DIAGONAL CUT
14 OVERSIZED CIRCLE CROP
15 PLINTH BAND
16 TINY FIGURE, VAST FIELD
17 FOUR-QUADRANT GRID
18 STRADDLED HEADLINE
19 TRIPLE BAND STACK
20 CORNER CARD OVERLAY

================================================================
7. CONTENT RULES
================================================================
- ONE person is the hero.
- All text must be real, correctly spelled, meaningful words.
- Safe area minimal, generous and disciplined: limits max 3 colours, max 3 shapes, max 2 typefaces.`;

const RAW_LOGO_PROMPT_SNIPPET = `UNIVERSAL LOGO BRAND PRESENTATION — MASTER PROMPT
LOGO NAME: [WRITE LOGO NAME HERE]
INDUSTRY / CATEGORY: [WRITE INDUSTRY OR CATEGORY HERE]
Create a premium, photorealistic brand identity presentation for the uploaded logo.
8-9 industry-specific real-world mockups arranged in an intentional Bento grid.`;

const RAW_LOGO_PROMPT = `UNIVERSAL LOGO BRAND PRESENTATION — MASTER PROMPT

LOGO NAME: [WRITE LOGO NAME HERE]
INDUSTRY / CATEGORY: [WRITE INDUSTRY OR CATEGORY HERE]

Create a premium, photorealistic brand identity presentation for the uploaded logo.

IMPORTANT:
The uploaded logo image, logo name, and industry/category above are the only required inputs. Analyze them intelligently and determine everything else automatically.

==================================================
1. PRIMARY OBJECTIVE
==================================================
Create a professional brand identity / logo mockup presentation that feels specifically designed for this brand.
Do NOT create a generic logo mockup sheet.
The presentation must communicate:
- The brand's industry
- Brand personality
- Visual identity
- Real-world business applications
- Professionalism and consistency

First understand the logo.
Then understand the industry.
Then determine the visual personality.
Then select the most relevant real-world applications.
Then determine the color/background system.
Then choose the strongest grid composition.
Then create the final presentation.

==================================================
4. INDUSTRY-SPECIFIC MOCKUP SELECTION (8-9 APPLICATIONS)
==================================================
Automatically select 8–9 highly relevant real-world brand applications for the specified industry.

==================================================
5. GRID COMPOSITION
==================================================
Adaptive Bento grid or asymmetrical modular composition with approximately 8-9 sections.

==================================================
6. HERO LOGO PRESENTATION
==================================================
Reserve 1-2 sections specifically for the primary hero logo presentation (embossed, 3D acrylic, metallic, or minimal premium paper).

==================================================
17. FINAL OUTPUT
==================================================
Create ONE single presentation image in 1:1 square aspect ratio with studio-quality commercial lighting and 4K-level photorealistic fidelity.`;

const RAW_SOCIAL_PROMPT_SNIPPET = `SOCIAL MEDIA PRODUCT ADVERTISING CAMPAIGN
CATEGORY: [ENTER CATEGORY]
PRODUCTS: [PRODUCT1], [PRODUCT2], [PRODUCT3], [PRODUCT4]
COLOR MODE: [ENTER YOUR COLOR PALETTE]
Creates 4 unique square promotional posts presented together on ONE 1080x1080 canvas with dual shadow systems, Anton + Poppins typography, and shape-driven compositions.`;

const RAW_SOCIAL_PROMPT = `MASTER PROMPT

Create a premium, modern, high-end social media product advertising campaign consisting of EXACTLY 4 different square promotional post designs presented together on ONE clean white 1080×1080 canvas.

IMPORTANT:
NO REFERENCE IMAGE WILL BE PROVIDED.
Therefore, independently create the complete visual style using the detailed design direction, composition rules, shape language, typography system, product presentation, shadows and advertising aesthetics described below.

==================================================
USER INPUT
==================================================

YOUR CATEGORY:
[ENTER CATEGORY]

YOUR PRODUCT 1:
[PRODUCT1]

YOUR PRODUCT 2:
[PRODUCT2]

YOUR PRODUCT 3:
[PRODUCT3]

YOUR PRODUCT 4:
[PRODUCT4]

YOUR COLOR MODE:
[ENTER YOUR COLOR PALETTE]

==================================================
CORE CONCEPT
==================================================
Create EXACTLY 4 individual square social media advertising posts.
All four posts promote the four products provided.
POST 1 = PRODUCT 1
POST 2 = PRODUCT 2
POST 3 = PRODUCT 3
POST 4 = PRODUCT 4

All four products belong to the SAME CATEGORY.
The four advertisements must look like one professionally art-directed advertising campaign, but each individual post must have its OWN ORIGINAL COMPOSITION (not four copies of one template).

==================================================
CANVAS & CARD PRESENTATION
==================================================
Overall canvas: 1080 × 1080 pixels on clean white background.
Arrange EXACTLY 4 equal-sized square advertising cards in a precise 2×2 arrangement with soft external drop shadows.

==================================================
TWO SHADOW SYSTEMS
==================================================
1. PRODUCT CONTACT SHADOW: Realistic contact shadow directly connected to the product.
2. CARD DROP SHADOW: Soft external drop shadow underneath the entire square card.

==================================================
TYPOGRAPHY SYSTEM
==================================================
HEADLINE FONT: Anton (bold condensed display sans-serif, 2-6 words).
BODY FONT: Poppins Regular (clean, lightweight descriptions, feature bullets, price tags).

==================================================
FINAL OUTPUT
==================================================
Generate ONE 1080×1080 clean white presentation canvas with 4 professional promotional posts.`;

export const MASTER_PROMPTS_DATA: MasterPromptDefinition[] = [
  {
    id: "hero_page_layout_reinventor_v2",
    title: "Hero Page Layout Reinventor (v2)",
    category: "Magazine & Editorial",
    badge: "Editorial Design",
    description: "World-class magazine art direction prompt for creating a single, print-ready full-page editorial opener with strict negative space, grids, and 20 distinct archetype layouts.",
    formFields: [
      {
        key: "heroName",
        label: "Hero Person Name",
        type: "text",
        placeholder: "e.g., Kengo Kuma, Zaha Hadid, Maya Lin",
        defaultValue: "Alexandre Moreau",
        required: true,
        helperText: "The focal personality around which the editorial opener is designed.",
      },
      {
        key: "heroRole",
        label: "Title / Role",
        type: "text",
        placeholder: "e.g., Principal Architect & Spatial Theorist",
        defaultValue: "Principal Architect & Sustainable Urbanist",
        required: true,
      },
      {
        key: "theme",
        label: "Publication Concept & Audience",
        type: "text",
        placeholder: "e.g., International Architectural Quarterly, Contemporary Art Review",
        defaultValue: "International Contemporary Architecture & Spatial Design Review",
        required: true,
      },
      {
        key: "culture",
        label: "Country & Cultural Signals",
        type: "text",
        placeholder: "e.g., Japanese Modernist, Nordic Minimalism, Parisian Brutalism",
        defaultValue: "Nordic Architectural Minimalism with Warm Timber Accents",
        required: true,
      },
      {
        key: "archetype",
        label: "Preferred Archetype Layout",
        type: "select",
        defaultValue: "Auto (AI Editorial Choice)",
        options: [
          "Auto (AI Editorial Choice)",
          "01 FULL-BLEED + EDGE TYPE",
          "02 OFF-CENTRE WINDOW",
          "03 HARD HORIZONTAL SPLIT",
          "04 ASYMMETRIC T-ZONE",
          "05 PANEL + COLUMN",
          "06 CUT-OUT + OVERSIZED NUMERAL",
          "07 DUOTONE SILHOUETTE BLEED",
          "08 TALL IMAGE STRIP",
          "09 TWO-IMAGE LAYER",
          "10 TYPE-AS-IMAGE",
          "11 VERTICAL SPINE",
          "12 CENTRED MONUMENT",
          "13 DIAGONAL CUT",
          "14 OVERSIZED CIRCLE CROP",
          "15 PLINTH BAND",
          "16 TINY FIGURE, VAST FIELD",
          "17 FOUR-QUADRANT GRID",
          "18 STRADDLED HEADLINE",
          "19 TRIPLE BAND STACK",
          "20 CORNER CARD OVERLAY",
        ],
        helperText: "Select one of the 20 distinct editorial layout archetypes.",
      },
    ],
    compilePrompt: (values) => {
      let prompt = RAW_HERO_PROMPT;
      const archetypeNote = values.archetype && values.archetype !== "Auto (AI Editorial Choice)"
        ? `\n\nUSER OVERRIDE: SPECIFICALLY USE ARCHETYPE: ${values.archetype}`
        : "";

      const contextInjection = `\n\nEDITORIAL ASSIGNMENT CONTEXT:\n- HERO PERSON NAME: ${values.heroName || "Hero Person"}\n- TITLE / ROLE: ${values.heroRole || "Lead Innovator"}\n- PUBLICATION CONCEPT: ${values.theme || "Premium Editorial Magazine"}\n- COUNTRY & CULTURAL SIGNALS: ${values.culture || "International Modernist"}${archetypeNote}\n`;

      return prompt + contextInjection;
    },
    rawTemplate: RAW_HERO_PROMPT_SNIPPET,
  },
  {
    id: "universal_logo_brand_presentation",
    title: "Universal Logo Brand Presentation",
    category: "Branding & Mockups",
    badge: "Identity System",
    description: "Premium, photorealistic brand identity presentation prompt creating a complete real-world brand ecosystem with Bento grid compositions and 8-9 authentic mockups.",
    formFields: [
      {
        key: "logoName",
        label: "Logo / Brand Name",
        type: "text",
        placeholder: "e.g., NovaWave, Apex Cloud, Solstice Cafe",
        defaultValue: "NovaWave",
        required: true,
        helperText: "The exact brand name to be represented across all mockups.",
      },
      {
        key: "industry",
        label: "Industry / Category",
        type: "select",
        defaultValue: "TECHNOLOGY / SAAS",
        options: [
          "TECHNOLOGY / SAAS",
          "CLOUD / HOSTING / DATA CENTER",
          "COFFEE SHOP / CAFE",
          "RESTAURANT / FOOD",
          "CLOTHING / FASHION",
          "FINANCE / ACCOUNTING",
          "REAL ESTATE / ARCHITECTURE",
          "HEALTHCARE / CLINIC",
          "LOGISTICS / DELIVERY",
          "CREATIVE AGENCY / STUDIO",
        ],
        required: true,
        helperText: "Determines the 8-9 authentic, industry-specific real-world applications.",
      },
      {
        key: "brandPersonality",
        label: "Brand Personality",
        type: "text",
        placeholder: "e.g., Minimal, High-Tech, Corporate Luxury, Friendly Playful",
        defaultValue: "Minimal, Modern, Technical, Clean",
      },
      {
        key: "colorPalette",
        label: "Brand Color System (Optional)",
        type: "text",
        placeholder: "e.g., Deep Indigo + Electric Cyan + Charcoal",
        defaultValue: "Deep Indigo + Electric Cyan + Crisp White",
      },
    ],
    compilePrompt: (values) => {
      let prompt = RAW_LOGO_PROMPT;
      prompt = prompt.replace("[WRITE LOGO NAME HERE]", values.logoName || "NovaWave");
      prompt = prompt.replace("[WRITE INDUSTRY OR CATEGORY HERE]", values.industry || "TECHNOLOGY / SAAS");

      if (values.brandPersonality) {
        prompt += `\n\nTARGET BRAND PERSONALITY: ${values.brandPersonality}`;
      }
      if (values.colorPalette) {
        prompt += `\nBRAND COLOR PALETTE: ${values.colorPalette}`;
      }

      return prompt;
    },
    rawTemplate: RAW_LOGO_PROMPT_SNIPPET,
  },
  {
    id: "social_media_product_advertising_campaign",
    title: "Social Media Product Advertising Campaign",
    category: "Social Media Marketing",
    badge: "Campaign Suite",
    description: "4-in-1 premium square promotional post campaign generator with shape-driven art direction, dual shadow systems, Anton + Poppins typography, and visual balance on a 1080x1080 canvas.",
    formFields: [
      {
        key: "category",
        label: "Product Category",
        type: "text",
        placeholder: "e.g., Premium Wireless Audio, Minimalist Footwear, Organic Skincare",
        defaultValue: "Premium Wireless Audio Gear",
        required: true,
      },
      {
        key: "product1",
        label: "Product 1 (Post 1)",
        type: "text",
        placeholder: "e.g., Studio Pro Noise-Cancelling Headphones",
        defaultValue: "AuraWave Pro ANC Over-Ear Headphones",
        required: true,
      },
      {
        key: "product2",
        label: "Product 2 (Post 2)",
        type: "text",
        placeholder: "e.g., True Wireless Earbuds with Wireless Case",
        defaultValue: "AuraPods Ultra Wireless Earbuds",
        required: true,
      },
      {
        key: "product3",
        label: "Product 3 (Post 3)",
        type: "text",
        placeholder: "e.g., 360-Degree Waterproof Bluetooth Speaker",
        defaultValue: "AuraBoom 360 Waterproof Portable Speaker",
        required: true,
      },
      {
        key: "product4",
        label: "Product 4 (Post 4)",
        type: "text",
        placeholder: "e.g., Magnetic Wireless Charging Dock",
        defaultValue: "AuraCharge MagFast Desktop Charging Stand",
        required: true,
      },
      {
        key: "colorPalette",
        label: "Color Mode / Palette",
        type: "text",
        placeholder: "e.g., Lime Green + Matte Black + Crisp White",
        defaultValue: "Electric Lime Green + Deep Matte Black + Crisp White",
        required: true,
      },
    ],
    compilePrompt: (values) => {
      let prompt = RAW_SOCIAL_PROMPT;
      prompt = prompt.replace("[ENTER CATEGORY]", values.category || "Premium Audio");
      prompt = prompt.replace("[PRODUCT1]", values.product1 || "Product 1");
      prompt = prompt.replace("[PRODUCT2]", values.product2 || "Product 2");
      prompt = prompt.replace("[PRODUCT3]", values.product3 || "Product 3");
      prompt = prompt.replace("[PRODUCT4]", values.product4 || "Product 4");
      prompt = prompt.replace(/\[ENTER YOUR COLOR PALETTE\]/g, values.colorPalette || "Lime Green + Black + White");

      return prompt;
    },
    rawTemplate: RAW_SOCIAL_PROMPT_SNIPPET,
  },
];
