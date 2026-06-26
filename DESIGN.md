# DormWatch Design System

## 1. Design Philosophy
DormWatch bridges the gap between residents and housing management. The interface must prioritize utility, accessibility, and institutional trust over flashy consumer trends. 

We explicitly reject the "AI slop" aesthetic. 
**Avoid:** Heavy gradients, soft glow drop-shadows, pill-shaped (\`9999px\`) corner radii, emojis as UI elements, and bulbous, floating components.
**Embrace:** Crisp borders, sharp edges, distinct visual hierarchy, utilitarian texture (dot grids), asymmetrical hover states, and meaningful micro-visualizations.

---

## 2. Global Aesthetics & Motifs

### The "Blueprint" Texture
To relate to the physical domain of facilities management, the application background utilizes a subtle dot matrix pattern rather than a flat color. This provides depth without being distracting.
*   **CSS Implementation:** A radial-gradient dot pattern on the \`body\` element.
    \`\`\`css
    /* Dark Mode */
    background-color: #1c1917; /* stone-900 */
    background-image: radial-gradient(circle, rgba(120, 113, 108, 0.3) 1px, transparent 1px);
    background-size: 24px 24px;
    
    /* Light Mode */
    background-color: #fafaf9; /* stone-50 */
    background-image: radial-gradient(circle, rgba(214, 211, 209, 0.5) 1px, transparent 1px);
    background-size: 24px 24px;
    \`\`\`

### The "Ticket" Motif
Complaint cards and data tables should feel like physical work orders.
*   **Categorization:** Use uppercase, heavily tracked text for categories (e.g., \`text-[10px] uppercase tracking-widest font-semibold\`).
*   **Separators:** Use dashed borders (\`border-dashed border-stone-700\` or \`stone-300\`) to separate headers from body content within cards.
*   **Status Indicators:** Use small, crisp, rectangular badges with high-contrast text and a subtle background fill.

### Asymmetrical Hover States
Interactions should feel mechanical and precise.
*   Instead of lifting elements with a drop-shadow on hover, reveal a solid \`4px\` left border in the primary accent color (\`indigo-500\` or \`indigo-600\`), accompanied by a slight horizontal translation (\`translate-x-1\`) of the text content.

---

## 3. Typography
A legible, highly utilitarian sans-serif font ensures readability across all devices. We avoid monospace fonts for metadata to maintain a premium, bespoke feel.

*   **Primary Font Family:** Inter
*   **Scale:**
    *   **Page Titles (H1):** 24px (1.5rem) / Bold
    *   **Section Titles (H2):** 20px (1.25rem) / Semi-Bold
    *   **Body Text:** 16px (1rem) / Regular
    *   **Small/Auxiliary:** 14px (0.875rem) / Regular
    *   **Micro-Labels (Categories/Overheads):** 10px / Semi-Bold / Uppercase / Tracking-Widest

---

## 4. Color Palette

Our palette is grounded in warm neutrals (Stone) and a deep, authoritative primary accent (Indigo/Navy). 

### Primary Accent (Brand/Action)
*   **Default:** \`indigo-800\` (\`#3730a3\` - Closest to #2E3192)
*   **Hover:** \`indigo-900\` (\`#312e81\` - Closest to #252775)
*   **Dark Mode Vibrant Accent:** \`indigo-500\` (\`#6366f1\`) - Used sparingly for borders or active indicators against dark backgrounds.

### Light Mode Theme
The Light Mode should feel like a clean, well-lit office desk holding fresh paperwork.
*   **App Background:** \`#FAFAF9\` (Stone 50) + Light dot grid.
*   **Surface/Cards:** \`#FFFFFF\` (White)
*   **Primary Text:** \`#1C1917\` (Stone 900)
*   **Secondary Text:** \`#57534E\` (Stone 600)
*   **Borders:** \`#E7E5E4\` (Stone 200)
*   **Hover Surfaces (Tables):** \`#F5F5F4\` (Stone 100)

### Dark Mode Theme (Current Default)
The Dark Mode should feel like a late-night control room—high contrast, low glare.
*   **App Background:** \`#1C1917\` (Stone 900) + Dark dot grid.
*   **Surface/Cards:** \`#292524\` (Stone 800)
*   **Primary Text:** \`#FAFAF9\` (Stone 50)
*   **Secondary Text:** \`#A8A29E\` (Stone 400)
*   **Borders:** \`#44403C\` (Stone 700)
*   **Hover Surfaces (Tables):** \`#292524 / 50% opacity\` (Stone 800/50 or Stone 700/50)

### Semantic Status Colors
*   **Pending (Yellow):** Text: \`yellow-500\`, Bg: \`yellow-900/30\`, Border: \`yellow-700/50\`
*   **In Progress (Blue):** Text: \`blue-500\`, Bg: \`blue-900/30\`, Border: \`blue-700/50\`
*   **Resolved (Green):** Text: \`green-500\`, Bg: \`green-900/30\`, Border: \`green-700/50\`

---

## 5. UI Components & Geometry

### Shape & Radius (Strictly Sharp)
*   **Standard Radius:** \`rounded-none\` (0px) for all cards, buttons, dialogs, avatars, and inputs.
*   **Strict Rule:** No rounded corners. The interface relies entirely on sharp, structural 90-degree angles to maintain its brutalist, utilitarian authority.

### Buttons & Inputs
*   **Primary Action Buttons:** Solid \`indigo-800\` background, white text, bold font weight, square corners. Hover is \`indigo-900\`.
*   **Inputs:** Must have a visible, solid border.
*   **Focus States:** A sharp, 2px solid ring (\`focus:ring-2 focus:ring-indigo-600 focus:outline-none focus:ring-offset-1\`).

### Intentional Empty States
Do not leave dead space when there is no data.
*   Use a dashed border box (\`border-dashed border-stone-700\`).
*   Include a muted icon inside a small, centered, square box.
*   Provide a brief, reassuring message.

---

## 6. Iconography
*   **Library:** Hugelcons or Lucide Icons.
*   **Style:** Strict outline style, 2px stroke width.
*   **Sizing:** 
    *   Primary Navigation/Actions: \`24x24\` (\`w-6 h-6\`).
    *   Secondary Actions/List items: \`20x20\` (\`w-5 h-5\`).

---

## 7. Frontend Implementation (React & shadcn/ui)

To enforce this exact design system in the React frontend without manual CSS drift, the project **must** be initialized using \`shadcn/ui\` with a highly specific configuration preset.

Run the following command to initialize the project components:

\`\`\`bash
npx shadcn@latest init --preset b3lCbBb32
\`\`\`

**Why this preset?**
This specific preset configuration (\`b3lCbBb32\`) natively enforces our core design principles out-of-the-box:
*   **Style:** Lyra
*   **Base Color:** Stone (Matching our warm gray requirement)
*   **Theme / Chart Color:** Indigo (Replace the default orange with our brand blue)
*   **Font / Heading Font:** Inter
*   **Radius:** None (0px) - This is critical for eliminating the default web "slop" styling in favor of our crisp, architectural ticket motifs.
