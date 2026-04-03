# Design System Specification: Editorial SaaS Excellence

## 1. Overview & Creative North Star
**Creative North Star: The Digital Curator**

This design system is built for clarity, authority, and discovery. It moves away from the "cluttered dashboard" trope of traditional SaaS, instead adopting the DNA of a high-end digital gallery or a premium editorial publication. The goal is to make every interaction feel intentional and every content piece feel curated.

To break the "template" look, we leverage **intentional asymmetry** and **tonal depth**. Rather than boxing content into rigid grids with heavy outlines, we use generous white space and varying surface planes to guide the eye. The interface does not shout; it whispers with precision.

---

## 2. Colors & Surface Architecture
The palette is rooted in high-contrast neutrals—deep charcoals and pure whites—punctuated by sophisticated, low-chroma accents.

### Color Tokens
- **Primary (Core Brand):** `#05070e` (Used for primary actions and heavy headings)
- **Primary Container:** `#1d1f27` (The "Mobbin" charcoal—ideal for dark-mode cards or sidebars)
- **Surface:** `#f8f9fb` (The primary canvas)
- **Surface Container Low:** `#f3f4f6` (Subtle secondary background)
- **Surface Container Lowest:** `#ffffff` (The "lifted" card color)

### The "No-Line" Rule
Explicitly prohibit 1px solid borders for sectioning. Structural boundaries must be defined through **background color shifts**. 
*Example:* A navigation sidebar should be `surface-container-low`, sitting flush against a `surface` main content area without a dividing line.

### Surface Hierarchy & Nesting
Treat the UI as physical layers. Use the "Nesting" principle to create depth:
1.  **Level 0 (Base):** `surface` (`#f8f9fb`)
2.  **Level 1 (Section):** `surface-container-low` (`#f3f4f6`)
3.  **Level 2 (Active Element):** `surface-container-lowest` (`#ffffff`)

### The Glass & Gradient Rule
To achieve a premium "custom" feel, floating elements (modals, dropdowns) must use **Glassmorphism**:
- **Fill:** `surface-container-lowest` at 80% opacity.
- **Effect:** `backdrop-blur: 12px`.
- **CTA Soul:** Main buttons should use a subtle linear gradient from `primary` (`#05070e`) to `primary-container` (`#1d1f27`) at a 145-degree angle to provide a satin-like finish.

---

## 3. Typography
We utilize **Inter** for its modern, neutral, yet highly legible characteristics. The hierarchy is designed to mimic an editorial layout.

| Token | Size | Weight | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display-LG** | 3.5rem | 600 | -0.02em | Hero marketing headers |
| **Headline-MD** | 1.75rem | 600 | -0.01em | Section headers |
| **Title-SM** | 1.0rem | 500 | 0 | Card titles / Sub-headers |
| **Body-MD** | 0.875rem | 400 | 0 | Standard interface text |
| **Label-MD** | 0.75rem | 600 | +0.03em | Caps/Small-caps for metadata |

**Editorial Strategy:** Use `Headline-MD` for primary content titles, but pair it with `Label-MD` in all-caps for categories or overlines. This contrast in scale creates a professional, journalistic feel.

---

## 4. Elevation & Depth
In this system, elevation is conveyed through **Tonal Layering** rather than traditional structural shadows.

### The Layering Principle
Depth is achieved by "stacking" surface tiers. To create a card, do not draw a border; simply place a `surface-container-lowest` (`#ffffff`) shape onto a `surface` (`#f8f9fb`) background. The 2-3% shift in brightness provides a soft, natural lift.

### Ambient Shadows
When an element must float (e.g., a modal or a primary hover state):
- **Blur:** 32px to 64px.
- **Spread:** -4px.
- **Color:** `on-surface` (`#191c1e`) at **4% to 6% opacity**. 
- *Note:* The shadow should feel like a soft glow of light being blocked, not a dark smudge.

### The "Ghost Border"
If a border is required for accessibility (e.g., in high-contrast scenarios), use a **Ghost Border**:
- **Token:** `outline-variant` (`#c7c6cb`).
- **Opacity:** 20% max.
- **Stroke:** 1px.

---

## 5. Components

### Buttons
- **Primary:** Gradient (`primary` to `primary-container`), white text, `0.375rem` (md) radius.
- **Secondary:** `surface-container-high` background, `on-surface` text. No border.
- **Tertiary:** Text-only with `label-md` styling. High-contrast on hover via a subtle `surface-container-low` background pill.

### Input Fields
- **Default State:** `surface-container-highest` background with a `0.25rem` (sm) radius. No border.
- **Focus State:** 1px Ghost Border using `primary`.
- **Labeling:** Use `label-md` positioned strictly above the field, never as a placeholder.

### Cards & Lists
- **Forbid Dividers:** Do not use horizontal rules (`<hr>`). Separate list items using `12px` or `16px` of vertical white space.
- **Interaction:** On hover, a card should transition from `surface` to `surface-container-lowest` with an **Ambient Shadow**.

### Contextual Chips
- **Style:** Small-caps (`label-sm`), high-tracking (+0.05em), `9999px` (full) radius. Use `surface-container-high` for the background to keep them secondary to the main content.

---

## 6. Do’s and Don’ts

### Do
*   **Do** embrace "uncomfortable" white space. If a section feels empty, add more padding, not more content.
*   **Do** use asymmetrical layouts for image/text pairings to create a bespoke feel.
*   **Do** use `surface-container-low` for large background areas to make white cards pop.

### Don't
*   **Don't** use 100% black (`#000000`). Use `primary` (`#05070e`) for a softer, more premium depth.
*   **Don't** use saturated blue for links. Use `primary` with a 1px underline or a weight shift.
*   **Don't** use standard 8px shadows. If it looks like a default UI kit, it has failed the system.
*   **Don't** use dividers. If elements need separation, increase the margin.