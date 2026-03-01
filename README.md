<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a5289b6a-56be-4fb6-9ddd-778155b316ea

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Tailwind Global Tools API

A full Tailwind helper endpoint is available at `POST /api/tailwind-tools` backed by `utils/global-tw4-master.FINAL_GOD_JSON_V5_UNIFIED.json`.

Supported actions:
- `full` (default): returns hint, ghost inline, line snippet, suggestion, autocomplete, combo, class mapping (2-key and 4-key), and matched data hits.
- `hint`
- `ghost`
- `snippet`
- `suggestion`
- `autocomplete`
- `combo`
- `class-mapping`
- `data`

Example body:

```json
{
  "action": "full",
  "query": "btn",
  "prefix": "bg-",
  "snippet": "btnP",
  "combo": "glass",
  "className": "rounded",
  "limit": 20
}
```
