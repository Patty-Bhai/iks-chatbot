# 🌱 WasteWise – Waste Segregation Assistant

**College IKS Practical – Experiment 08**  
**Topic:** Waste Segregation Chatbot  
**Faculty-in-Charge:** Ms. Tejal D’mello  
**Reasoning Framework:** Indian Logic (*Nyaya Tarka Shastra*: Observation → Evidence → Inference → Conclusion)

---

## 📋 Threat Modeling Summary

| Risk | Attack Scenario | Mitigation |
| :--- | :--- | :--- |
| **Cross-Site Scripting (XSS)** | User submits malicious `<script>` tags, event handlers, or markdown injection in the waste item input field. | All user input and bot outputs pass through strict HTML entity encoding (`escapeHtml()`) before DOM insertion. |
| **API Key Exposure** | Hardcoding private Google Gemini API keys in client-side source code or checking them into git repositories. | No API key is hardcoded. Keys can be set dynamically via local storage in the browser UI, or entered in a clearly marked configuration variable during testing. |
| **Prompt Injection / Jailbreak** | User inputs instructions attempting to trick the AI into providing dangerous chemical recipes or bypassing the segregation scope. | Strictly bounded system prompt enforcing output strictly in predefined JSON format with defined waste categories; off-topic filter rejects unrelated queries. |
| **API Denial of Service / Quota Failure** | Gemini API rate limit (HTTP 429) or offline lab environment breaks the classroom demonstration. | Multi-model fallback sequence (`gemini-2.5-flash` → `gemini-3.8-flash` → `gemini-flash-latest` → `gemini-3.1-flash-lite`) plus a zero-dependency local **Nyaya Offline Knowledge Engine**. |
| **Hazardous Disposal Misdirection** | Giving generic landfill advice for batteries or biohazardous sharp glass causing injury to sanitation workers. | Strict advisory warnings for hazardous and e-waste, directing students to designated campus/municipal drop-off points with terminal insulation. |

---

## 🗂️ Project Structure

The project is built with clean, beginner-friendly vanilla web technologies:

```
wastewise/
├── index.html       # Semantic HTML layout, categories reference & decision tree UI
├── style.css        # Responsive styling with modern eco-inspired color palette
├── script.js        # Gemini API integration & Nyaya Indian Logic reasoning engine
└── README.md        # Experiment documentation & setup instructions
```

---

## 🚀 How to Run the Project Locally

### Option 1: Direct Browser Launch (Easiest, zero-install)
1. Download or copy `index.html`, `style.css`, and `script.js` into a folder on your computer named `wastewise`.
2. Double-click `index.html` to open it in any web browser (Chrome, Edge, Firefox, Safari).
3. The chatbot will open immediately! It will run in **Nyaya Offline Mode** out of the box with complete support for all practical experiment items.

### Option 2: Using VS Code Live Server
1. Open the `wastewise` folder in **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click `index.html` and click **"Open with Live Server"**.
4. The application will launch at `http://127.0.0.1:5500/index.html`.

---

## 🔑 Where to Put the Gemini API Key

You can configure your Google Gemini API key in **either of two ways**:

### Method A: Through the Web Interface (Recommended)
1. Click the **"🔑 API Key"** button in the top-right header of the WasteWise application.
2. Paste your Google Gemini API key into the field.
3. Select your preferred model (default: `gemini-2.5-flash`).
4. Click **"Save Configuration"**.
5. The status badge will switch to **🟢 Gemini AI Active**. The key is saved safely in your browser's private `localStorage`.

### Method B: Directly in `script.js`
Open `script.js` and locate lines 17–20:

```javascript
/* ==========================================================================
   1. GEMINI API CONFIGURATION SECTION
   ========================================================================== */
let GEMINI_API_KEY = "PASTE_YOUR_GEMINI_API_KEY_HERE";
```

Get a free API key from Google AI Studio: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

---

## 🌿 How the Decision Tree Works

WasteWise follows a structured decision algorithm:

```
           User Enters Waste Item
                     ↓
         Is it biodegradable?
        ├── YES ───────────────→ 🟢 Wet / Organic Waste
        └── NO
             ↓
         Is it recyclable?
        ├── YES ───────────────→ 🔵 Dry / Recyclable Waste
        └── NO
             ↓
    Is it hazardous or electronic?
        ├── YES (Hazardous) ───→ 🔴 Hazardous Waste (Special Collection)
        ├── YES (Electronic) ──→ 🟣 E-Waste (Special Collection)
        └── NO ────────────────→ ⚫ General / Mixed Waste
```

---

## 📜 Indian Logic Framework (Nyaya Darshana) Demonstration

The chatbot demonstrates the classical Indian Nyaya epistemic method (*Pramana Shastra*):

1. **Observation (*Pratyaksha*):** What the user identified empirically (e.g., *Banana peel*, *Plastic bottle*).
2. **Evidence (*Hetu*):** The material nature, cellular origin, polymer code, or toxicity of the object.
3. **Inference (*Anumana / Vyapti*):** The universal relation (*Vyapti*) connecting organic origin with natural microbial decomposition, or synthetic polymer with mechanical reprocessing.
4. **Conclusion (*Nigamana*):** The prescriptive action and exact bin classification (Green, Blue, Red, Purple, Black).

---

## 🧪 Minimum Demonstration Test Cases

| # | Item | Category | Bin | Indian Logic Summary |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Banana peel** | Wet / Biodegradable | 🟢 Green | Organic plant matter → decomposes via microbes → compost. |
| 2 | **Plastic bottle** | Dry / Recyclable | 🔵 Blue | PET polymer → melts and re-pelletizes → industrial recovery. |
| 3 | **Newspaper** | Dry / Recyclable | 🔵 Blue | Processed cellulose fiber → repulped for recycled paper. |
| 4 | **Used battery** | Hazardous Waste | 🔴 Red | Toxic heavy metals & acid → leaches into groundwater → special drop-off. |
| 5 | **Old mobile phone** | E-Waste | 🟣 Purple | PCBs and lithium cells → persistent e-pollutants → certified e-waste bin. |
| 6 | **Broken glass** | Hazardous / Sharp | 🔴 Red | Razor shards → physical puncture hazard → wrap in paper and label. |
| 7 | **Food leftovers** | Wet / Biodegradable | 🟢 Green | Biomass residue → anaerobic / aerobic fermentation → vermicompost. |
| 8 | **Cardboard box** | Dry / Recyclable | 🔵 Blue | Kraft paper fiber → flatten and recycle dry. |
