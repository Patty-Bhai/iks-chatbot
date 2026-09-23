# 🌱 WasteWise – Smart Waste & Recycling Assistant

**College IKS Practical – Experiment 08**  
**Topic:** Smart Waste & Recycling Assistant  
**Faculty-in-Charge:** Ms. Tejal D’mello  
**Reasoning Framework:** Indian Logic (*Nyaya Darshana*: Observation → Evidence → Inference → Conclusion)

---

## 📋 Threat Modeling Summary

| Risk | Attack Scenario | Mitigation |
| :--- | :--- | :--- |
| **Cross-Site Scripting (XSS)** | Malicious `<script>` tags, event handlers, or markdown injections submitted through the chat query input. | All user queries, response fields, and model outputs pass through strict HTML entity encoding (`escapeHtml()`) before DOM injection. |
| **API Key Exposure** | Committing private Google Gemini API keys into public git repositories or client bundles. | Zero hardcoded keys. Users can enter their Gemini API key dynamically via the UI modal; keys are retained only in private browser `localStorage`. |
| **Prompt Injection / Jailbreak** | Crafting prompts to bypass waste segregation guidelines or extract system instructions. | Strict system instructions with a primary domain boundary check (`isWasteRelated`). Non-waste queries are politely redirected. |
| **API Failure / 429 Quota Downtime** | Gemini API rate limit exhaustion or lack of internet connection during campus viva demonstration. | Multi-tier fallback sequence (`gemini-2.5-flash` → `gemini-3.8-flash` → `gemini-flash-latest` → `gemini-3.1-flash-lite`) paired with a robust **Offline Knowledge Engine**. |
| **Misclassification of Hazardous Items** | Toxic waste (e.g. spent batteries, sharp broken glass) treated as ordinary landfill garbage. | Dedicated hazardous/e-waste decision branch enforcing explicit safety advisories, terminal taping, and specialized drop-off points. |

---

## 🗂️ Project Architecture & File Separation

The application is structured into standard beginner-friendly web technologies:

```
wastewise/
├── index.html       # Clean semantic markup with dashboard cards, flowchart, and chat interface
├── style.css        # Responsive styling with modern eco-inspired palette (accessible color coding)
├── script.js        # Gemini API integration, Nyaya Logic engine, and UI state handlers
└── README.md        # Complete academic & deployment documentation
```

---

## 🚀 How to Run the Project Locally

### Option 1: Direct Browser Launch (Easiest, zero-install)
1. Download or copy `index.html`, `style.css`, and `script.js` into a folder on your computer named `wastewise`.
2. Double-click `index.html` to open it in any web browser (Chrome, Edge, Firefox, Safari).
3. The chatbot will open immediately in **Offline Mode** with instant responses for all practical items and conceptual questions!

### Option 2: Using VS Code Live Server
1. Open the `wastewise` folder in **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click `index.html` and click **"Open with Live Server"**.
4. The application will launch at `http://127.0.0.1:5500/index.html`.

---

## 🔑 Configuring Google Gemini API

WasteWise can run in two modes:

### Mode 1: Online Mode with Gemini AI (For open-ended questions)
1. Click the **"🔑 API Key"** button in the top-right header.
2. Paste your Google Gemini API key (get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey)).
3. Select your model (default: `gemini-2.5-flash`).
4. Click **"Save Configuration"**.
5. The badge will change to **🟢 Gemini AI Active**.

### Mode 2: Offline Nyaya Engine (For offline viva / lab exams)
- No API key or internet connection required!
- The built-in offline engine handles all Experiment 08 test items and core sustainability questions.

---

## 🌿 How the Decision Tree Works

WasteWise executes a hierarchical decision gate:

```
           User Enters Waste Item or Question
                           ↓
               Is it waste-related?
              ├── NO  ──────────────────→ Politely redirect to waste topics
              └── YES
                   ↓
               Is it an identifiable item?
              ├── AMBIGUOUS ────────────→ Ask clarifying follow-up question
              ├── GENERAL CONCEPT ──────→ Provide comprehensive educational answer
              └── SPECIFIC ITEM
                   ↓
               Is it biodegradable?
              ├── YES ──────────────────→ 🟢 Wet / Organic Waste
              └── NO
                   ↓
               Is it recyclable?
              ├── YES ──────────────────→ 🔵 Dry / Recyclable Waste
              └── NO
                   ↓
           Is it hazardous or electronic?
              ├── YES (Hazardous) ──────→ 🔴 Special / Hazardous Waste
              ├── YES (Electronic) ─────→ 🟣 E-Waste
              └── NO ───────────────────→ ⚫ General / Mixed Waste
```

---

## 📜 Indian Logic Framework (Nyaya Darshana)

For specific waste items, the bot structures reasoning into four classical steps:

1. **Observation (*Pratyaksha*):** Empirical identification of the discarded object (e.g., banana peel, plastic bottle).
2. **Evidence (*Hetu*):** Material composition, biodegradability, chemical properties, or heavy metal presence.
3. **Inference (*Anumana / Vyapti*):** The logical universal connection linking organic matter to natural decomposition, or synthetic resin to industrial recycling.
4. **Conclusion (*Nigamana*):** Actionable segregation recommendation and the exact bin color (Green, Blue, Purple, Red, Black).

---

## 🧪 Demonstration Test Questions

### 1. Specific Waste Items (Demonstrating Indian Logic):
- **"Where should I throw a banana peel?"** → Wet/Organic Waste 🟢
- **"Can plastic bottles be recycled?"** → Dry/Recyclable Waste 🔵
- **"How should I dispose of a battery?"** → Hazardous Waste 🔴
- **"Can I recycle a cardboard box?"** → Dry/Recyclable Waste 🔵
- **"What should I do with an old mobile phone?"** → E-Waste 🟣
- **"How should I dispose of broken glass?"** → Special / Sharp Hazard 🔴

### 2. General Waste & Environmental Questions:
- **"Why should we segregate waste?"**
- **"What is wet waste?"**
- **"How can I compost kitchen waste?"**
- **"Can I recycle a pizza box?"**
- **"What is e-waste?"**
- **"How can students reduce waste in college?"**
- **"How do I identify hazardous waste?"**

### 3. Multimodal Image Analysis (Camera & Upload):
- Click **📷** to capture a photo of any discarded object using your mobile or laptop camera.
- Click **🖼️** to upload a saved image (JPG, PNG, WebP) of waste or packaging.
- WasteWise will analyze the visual evidence, deduce material characteristics, and deliver the full Indian Logic reasoning (**Observation → Evidence → Inference → Conclusion**).
