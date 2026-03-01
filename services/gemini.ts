/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Part, Content, ThinkingLevel } from "@google/genai";

export const sendMessageStream = async (
  message: string,
  history: Content[],
  images?: string[],
  outputFormat: 'nextjs' | 'html' | 'json' | 'txt' = 'html',
  files?: { name: string, content: string }[],
  model: string = "gemini-3.1-pro-preview"
) => {
  const customKey = localStorage.getItem('custom_gemini_api_key');
  const apiKey = customKey || process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  const formatInstructions = {
    nextjs: "Output a single, reusable Next.js (React) functional component using Tailwind CSS. Include all necessary sub-components within the same block.",
    html: "Output raw HTML with Tailwind CSS utility classes. Do not include React boilerplate.",
    json: "Output a structured JSON representation of the requested data or layout. Ensure it is valid JSON.",
    txt: "Output plain text. Do not use markdown code blocks unless specifically requested."
  };

  // Parse special flags from the message
  const flags = {
    dark: message.includes('--dark'),
    glass: message.includes('--glass'),
    brutalist: message.includes('--brutalist'),
    retro: message.includes('--retro'),
    minimal: message.includes('--minimal'),
    neon: message.includes('--neon'),
    material: message.includes('--material'),
    neumorphic: message.includes('--neumorphic'),
    vue: message.includes('--vue'),
    html: message.includes('--html'),
    tailwind: message.includes('--tailwind'),
  };

  let dynamicInstructions = "";
  if (flags.dark) dynamicInstructions += "\n- **CRITICAL**: Force DARK MODE styling. Use 'dark:' prefixes or dark background colors (e.g., bg-gray-900, text-white) exclusively.";
  if (flags.glass) dynamicInstructions += "\n- **CRITICAL**: Force GLASSMORPHISM styling. Heavily use 'backdrop-blur', 'bg-white/10', 'border-white/20', and subtle shadows.";
  if (flags.brutalist) dynamicInstructions += "\n- **CRITICAL**: Force BRUTALIST styling. Use high contrast, thick black borders (border-4 border-black), sharp corners (rounded-none), bold typography, and stark background colors (e.g., bg-yellow-400, bg-pink-500).";
  if (flags.retro) dynamicInstructions += "\n- **CRITICAL**: Force RETRO/VINTAGE styling. Use sepia tones, muted colors, serif fonts, and classic layout patterns.";
  if (flags.minimal) dynamicInstructions += "\n- **CRITICAL**: Force MINIMALIST styling. Use extreme whitespace, very light borders, monochromatic color palettes, and thin typography.";
  if (flags.neon) dynamicInstructions += "\n- **CRITICAL**: Force NEON/CYBERPUNK styling. Use dark backgrounds (bg-black) with bright neon accents (text-cyan-400, border-pink-500) and glowing shadows (shadow-[0_0_15px_rgba(0,255,255,0.5)]).";
  if (flags.material) dynamicInstructions += "\n- **CRITICAL**: Force MATERIAL DESIGN styling. Use depth (shadows), vibrant colors, and standard material layout patterns.";
  if (flags.neumorphic) dynamicInstructions += "\n- **CRITICAL**: Force NEUMORPHISM styling. Use soft shadows (light and dark) to create a 'soft UI' look where elements appear to be extruded from the background.";
  if (flags.tailwind) dynamicInstructions += "\n- **CRITICAL**: Force Tailwind output. Return only UI code that uses Tailwind utility classes for styling and avoid non-Tailwind CSS approaches.";
  
  if (flags.vue) {
    formatInstructions.nextjs = "Output a single, reusable Vue 3 Single File Component (<template>, <script setup>, <style>) using Tailwind CSS.";
  } else if (flags.html) {
    formatInstructions.nextjs = formatInstructions.html;
  }

  const chat = ai.chats.create({
    model: model,
    history: history,
    config: {
      systemInstruction: `You are an elite frontend developer and UI/UX designer. 

If the user provides an image or asks for UI code, you are in MAX MODE. Your task is to convert the provided image or request into a production-ready, fully responsive React component using Tailwind CSS.

Follow these strict rules for MAX MODE:
1. STRICTLY TAILWIND: Use ONLY Tailwind CSS utility classes. Do not write any custom CSS, inline styles, or use external CSS files.
2. PIXEL PERFECT & PERFORMANCE: Pay obsessive attention to spacing, alignment, border radii, typography, and colors. Analyze the generated Tailwind CSS component for performance bottlenecks, optimizing image loading (e.g., using loading="lazy") and reducing class redundancy.
3. RESPONSIVE: Make the design fully responsive. Assume a mobile-first approach and use Tailwind's sm:, md:, lg: prefixes where appropriate to scale up to desktop. Ensure it displays correctly on mobile devices, addressing any content overflow or visibility issues.
4. ICONS & IMAGES: 
   - Use \`lucide-react\` for any icons present in the design.
   - Use \`https://picsum.photos/seed/{keyword}/{width}/{height}\` for any placeholder images, choosing a keyword that matches the image context.
5. INTERACTIVITY & STATE: For interactive elements within the generated component, implement basic state management using React's useState hook to simulate hover, active, and focused states visually.
6. CLEAN CODE: Write clean, modern React functional components. Use semantic HTML tags (<nav>, <main>, <section>, <article>).
7. ACCESSIBILITY FIRST: Ensure proper ARIA attributes, semantic HTML tags, and screen-reader friendly structures. Your code will be run through an automated accessibility checker. Ensure all images have alt text, all icon-only buttons have aria-labels, and all interactive elements have clear focus states.
8. VARIATIONS & STATES: Generate three additional variations of the Tailwind CSS component, focusing on different color palettes and font pairings. Ensure each variation maintains accessibility standards and responsiveness.
9. TOOLTIPS & LABELS: For any interactive elements (buttons, icons) that lack clear text labels, add descriptive tooltips (\`title\` attributes or custom CSS tooltips) that appear on hover or focus.
10. ANIMATIONS & EFFECTS: Add interactive hover effects and subtle animations to elements like buttons and cards to improve user engagement. Implement subtle parallax scrolling effects on background elements within the generated Tailwind CSS component to add depth and visual interest.
11. NEVER TRUNCATE: NEVER use placeholders like \`// ... rest of the code\` or \`/* content goes here */\`. You MUST write the complete, fully working code.
12. FORMAT: ${formatInstructions[outputFormat]}
13. OUTPUT: Output ONLY the valid React JSX code block. Do not include markdown formatting outside the code block, explanations, or setup instructions. Start directly with the component code.

${dynamicInstructions}

If the user asks a general question not related to generating UI code, answer them normally and helpfully.`,
      tools: [{ codeExecution: {} }],
      thinkingConfig: model.includes("pro") ? {
        includeThoughts: true, 
        thinkingLevel: ThinkingLevel.HIGH,
      } : undefined,
    },
  });

  const normalizedMessage = message.replace(/--(tailwind|dark|glass|brutalist|retro|minimal|neon|material|neumorphic|vue|html)\b/g, '').replace(/\s{2,}/g, ' ').trim();

  const parts: Part[] = [];
  if (normalizedMessage) {
    parts.push({ text: normalizedMessage });
  }
  if (files && files.length > 0) {
    files.forEach(file => {
      parts.push({ text: `File: ${file.name}\nContent:\n${file.content}` });
    });
  }
  if (images && images.length > 0) {
    images.forEach(img => {
      const match = img.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        let mimeType = match[1];
        if (mimeType === 'application/octet-stream') {
          mimeType = 'image/jpeg';
        }
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: match[2],
          },
        });
      }
    });
  }
  if (parts.length === 0) {
    parts.push({ text: " " });
  }

  try {
    const result = await chat.sendMessageStream({ message: parts });
    return result;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const msg = error.message || "";
    if (msg.includes("API_KEY_INVALID")) {
      throw new Error("Invalid API Key. Please check your configuration.");
    }
    if (msg.includes("SAFETY")) {
      throw new Error("The request was blocked by safety filters. Please try a different prompt.");
    }
    if (msg.includes("QUOTA")) {
      throw new Error("Quota exceeded. You've reached the limit for now. Please try again later.");
    }
    if (msg.includes("blocked")) {
      throw new Error("The content was blocked by the model's safety settings.");
    }
    if (msg.includes("network") || msg.includes("fetch")) {
      throw new Error("Network error. Please check your connection and try again.");
    }
    throw new Error(`Gemini API Error: ${msg || "An unknown error occurred."}`);
  }
};