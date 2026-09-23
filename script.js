/**
 * ==========================================================================
 * 🌱 WasteWise – Waste Segregation Assistant
 * College IKS Practical – Experiment 08
 * Indian Knowledge Systems: Nyaya Logic Reasoning Engine
 * Framework: Observation (Pratyaksha) → Evidence (Hetu) →
 *            Inference (Anumana) → Conclusion (Nigamana)
 * ==========================================================================
 */

/* ==========================================================================
   1. GEMINI API CONFIGURATION SECTION
   --------------------------------------------------------------------------
   STUDENT NOTE: Enter your Google Gemini API Key below.
   You can generate a free API key at: https://aistudio.google.com/app/apikey
   Do NOT commit your real API key to public repositories like GitHub!
   You can also enter your key dynamically via the "🔑 API Key" button in UI.
   ========================================================================== */
let GEMINI_API_KEY = ""; // <--- Put your Gemini API Key here (e.g., "AIzaSy...")

// Model selection with resilient fallbacks
let ACTIVE_MODEL = "gemini-2.5-flash";
const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite"
];

/* ==========================================================================
   2. DOM ELEMENT REFERENCES
   ========================================================================== */
const chatMessagesEl = document.getElementById("chatMessages");
const chatInputEl = document.getElementById("chatInput");
const sendBtnEl = document.getElementById("sendBtn");
const clearChatBtnEl = document.getElementById("clearChatBtn");
const apiKeyBtnEl = document.getElementById("apiKeyBtn");
const apiKeyModalEl = document.getElementById("apiKeyModal");
const closeApiKeyModalEl = document.getElementById("closeApiKeyModal");
const apiKeyInputEl = document.getElementById("apiKeyInput");
const modelSelectEl = document.getElementById("modelSelect");
const saveApiKeyBtnEl = document.getElementById("saveApiKeyBtn");
const apiStatusBadgeEl = document.getElementById("apiStatusBadge");
const exampleChips = document.querySelectorAll(".chip-btn");

// Decision Tree visual nodes
const nodeItemEl = document.getElementById("treeNodeItem");
const rowBioYesEl = document.getElementById("treeRowBioYes");
const rowRecycYesEl = document.getElementById("treeRowRecycYes");
const rowHazardEl = document.getElementById("treeRowHazard");
const rowGeneralEl = document.getElementById("treeRowGeneral");

/* ==========================================================================
   3. LOCAL IKS KNOWLEDGE BASE (OFFLINE NYAYA REASONING ENGINE)
   --------------------------------------------------------------------------
   Guarantees 100% functionality during campus offline practicals/viva,
   even if no API key is provided or network is restricted.
   ========================================================================== */
const IKS_KNOWLEDGE_BASE = {
  "banana peel": {
    category: "wet",
    categoryName: "Wet / Biodegradable Waste 🟢",
    isBio: true,
    isRecyclable: false,
    decisionPath: "Biodegradable: YES → Wet / Organic Waste",
    observation: "The item observed is an organic fruit residue (banana peel).",
    evidence: "Composed of natural plant cellulose, moisture, and organic matter with zero synthetic polymers.",
    inference: "Microorganisms and aerobic bacteria can naturally decompose this matter into nutrient-rich compost without generating toxic residues.",
    conclusion: "Deposit directly into the green Wet Waste bin 🟢. Ideal for campus composting or biogas digesters.",
    safetyAdvisory: "Keep free from plastic wrappers or stickers before binning."
  },
  "food leftovers": {
    category: "wet",
    categoryName: "Wet / Biodegradable Waste 🟢",
    isBio: true,
    isRecyclable: false,
    decisionPath: "Biodegradable: YES → Wet / Organic Waste",
    observation: "The item identified is cooked or uncooked discarded food leftovers.",
    evidence: "It is biodegradable organic biomass containing carbohydrates, proteins, and moisture.",
    inference: "It decomposes quickly via microbial fermentation and can be converted into organic compost or vermicompost.",
    conclusion: "Dispose of in the green Wet/Organic Waste Bin 🟢. Avoid storing for prolonged periods to prevent pest infestation.",
    safetyAdvisory: "Drain excess gravies/soups if your campus composter requires semi-dry feedstock."
  },
  "plastic bottle": {
    category: "dry",
    categoryName: "Dry / Recyclable Waste 🔵",
    isBio: false,
    isRecyclable: true,
    decisionPath: "Biodegradable: NO → Recyclable: YES → Dry / Recyclable Waste",
    observation: "The item observed is a rigid thermoplastic container (PET / HDPE beverage bottle).",
    evidence: "Manufactured from recyclable synthetic polymer resin with defined SPI resin identification codes.",
    inference: "It does not biodegrade in standard environmental conditions, but can be mechanically shredded, melted, and pelletized into new recycled plastic products.",
    conclusion: "Rinse, flatten, replace the cap loosely, and place in the blue Dry/Recyclable Waste Bin 🔵.",
    safetyAdvisory: "Empty all residual liquids before disposal to prevent contaminating dry paper in the same bin."
  },
  "newspaper": {
    category: "dry",
    categoryName: "Dry / Recyclable Waste 🔵",
    isBio: true, // Paper is technically bio, but standard municipal rules prioritize clean dry recycling
    isRecyclable: true,
    decisionPath: "Biodegradable: YES (Cellulose) but Dry: YES → Recyclable Paper Stream",
    observation: "The item observed is printed newsprint paper made of processed wood pulp fibers.",
    evidence: "Clean, dry cellulose paper fiber that possesses high tensile value for secondary pulp re-processing.",
    inference: "Recycling paper preserves forest resources, consumes 60% less water than virgin pulp, and extends fiber life cycles.",
    conclusion: "Keep dry, fold neatly, and place into the blue Dry/Recyclable Waste Bin 🔵 or hand over to campus scrap paper drives.",
    safetyAdvisory: "If heavily soiled with grease or food oil, it cannot be recycled and must be composted or binned with general waste."
  },
  "cardboard box": {
    category: "dry",
    categoryName: "Dry / Recyclable Waste 🔵",
    isBio: true,
    isRecyclable: true,
    decisionPath: "Biodegradable: YES but Dry: YES → Recyclable Paper Stream",
    observation: "The item identified is a corrugated or pressed cardboard packaging box.",
    evidence: "Composed of high-grade unbleached Kraft paper fibers engineered for structural rigidity.",
    inference: "Corrugated cardboard has an established industrial recycling loop and can be repulped multiple times.",
    conclusion: "Flatten the box to conserve bin space, remove heavy plastic packing tapes, and place in the blue Dry Waste Bin 🔵.",
    safetyAdvisory: "Verify that metal staples or polystyrene foam inserts are separated."
  },
  "used battery": {
    category: "hazard",
    categoryName: "Hazardous Waste 🔴",
    isBio: false,
    isRecyclable: false, // requires specialized recovery, never blue bin
    decisionPath: "Biodegradable: NO → Recyclable: SPECIALIZED ONLY → Hazardous Stream",
    observation: "The item observed is an electrochemical power cell (alkaline, lithium-ion, or lead-acid).",
    evidence: "Contains heavy toxic metals (cadmium, lead, mercury, lithium) and caustic corrosive electrolytes.",
    inference: "If dumped in ordinary municipal bins or landfills, corrosive leaks leach into groundwater tables and risk fire hazards.",
    conclusion: "DO NOT place in regular green or blue bins. Deposit strictly at dedicated Campus Hazardous / E-Waste drop-off points 🔴.",
    safetyAdvisory: "Insulate the battery terminals with small strips of adhesive tape to prevent short circuits and fire hazards."
  },
  "broken glass": {
    category: "hazard",
    categoryName: "Hazardous / Sharp Waste 🔴",
    isBio: false,
    isRecyclable: false,
    decisionPath: "Biodegradable: NO → Sharp/Physical Hazard → Specialized Handling",
    observation: "The item identified is fractured glass shards, broken glassware, or shattered mirror/window panes.",
    evidence: "Rigid, non-biodegradable amorphous solid possessing razor-sharp jagged edges; window/plate glass differs from container glass cullet.",
    inference: "Presents immediate laceration danger to municipal sanitation staff and campus housekeeping workers.",
    conclusion: "Safely wrap in multiple layers of newspaper or pack inside a rigid cardboard carton labeled 'SHARP / BROKEN GLASS' before handing to authorized waste handlers 🔴.",
    safetyAdvisory: "Never throw loose glass into plastic garbage bags. Follow campus laboratory/facility disposal protocols."
  },
  "old mobile phone": {
    category: "ewaste",
    categoryName: "E-Waste (Electronic Waste) 🟣",
    isBio: false,
    isRecyclable: false,
    decisionPath: "Biodegradable: NO → Recyclable in Std Bin: NO → Electronic Waste",
    observation: "The item observed is a retired consumer electronic handset containing circuitry, display, and battery.",
    evidence: "Engineered with Printed Circuit Boards (PCBs), rare earth metals (gold, copper, tantalum), flame retardants, and a lithium cell.",
    inference: "Standard landfill disposal causes persistent environmental bioaccumulation; certified e-waste recyclers can safely harvest precious metals and neutralize toxins.",
    conclusion: "Hand over to a certified E-Waste collection drive, college electrical engineering drop-box, or authorized OEM buyback program 🟣.",
    safetyAdvisory: "Perform a complete factory reset to wipe personal data before disposal."
  }
};

/* ==========================================================================
   4. INITIALIZATION & STATE MANAGEMENT
   ========================================================================== */
let isProcessing = false;

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  // Check localStorage for saved API key
  const savedKey = localStorage.getItem("wastewise_gemini_api_key");
  const savedModel = localStorage.getItem("wastewise_gemini_model");

  if (savedKey) {
    GEMINI_API_KEY = savedKey;
    apiKeyInputEl.value = savedKey;
  }
  if (savedModel) {
    ACTIVE_MODEL = savedModel;
    modelSelectEl.value = savedModel;
  }

  updateApiStatusUI();
  setupEventListeners();

  // Highlight Decision Tree initial state
  highlightDecisionTree(null);
});

/* ==========================================================================
   5. EVENT LISTENERS
   ========================================================================== */
function setupEventListeners() {
  // Send message on click
  sendBtnEl.addEventListener("click", () => {
    handleUserSubmission();
  });

  // Send message on Enter key
  chatInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUserSubmission();
    }
  });

  // Clear chat
  clearChatBtnEl.addEventListener("click", () => {
    resetChat();
  });

  // Example Chips
  exampleChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const itemText = chip.getAttribute("data-item") || chip.textContent.trim();
      chatInputEl.value = itemText;
      handleUserSubmission();
    });
  });

  // API Key Settings Modal
  apiKeyBtnEl.addEventListener("click", () => {
    apiKeyModalEl.classList.add("open");
  });

  closeApiKeyModalEl.addEventListener("click", () => {
    apiKeyModalEl.classList.remove("open");
  });

  apiKeyModalEl.addEventListener("click", (e) => {
    if (e.target === apiKeyModalEl) {
      apiKeyModalEl.classList.remove("open");
    }
  });

  saveApiKeyBtnEl.addEventListener("click", () => {
    const enteredKey = apiKeyInputEl.value.trim();
    const selectedModel = modelSelectEl.value;

    GEMINI_API_KEY = enteredKey;
    ACTIVE_MODEL = selectedModel;

    if (enteredKey) {
      localStorage.setItem("wastewise_gemini_api_key", enteredKey);
    } else {
      localStorage.removeItem("wastewise_gemini_api_key");
    }
    localStorage.setItem("wastewise_gemini_model", selectedModel);

    updateApiStatusUI();
    apiKeyModalEl.classList.remove("open");

    appendBotMessage({
      type: "system",
      text: enteredKey
        ? `✅ Gemini API configured with model <strong>${escapeHtml(selectedModel)}</strong>. Live reasoning is now active!`
        : `ℹ️ Running in <strong>Nyaya Logic (Offline/Viva Mode)</strong>. Comprehensive local knowledge engine is active.`
    });
  });
}

function updateApiStatusUI() {
  if (GEMINI_API_KEY) {
    apiStatusBadgeEl.className = "status-badge live";
    apiStatusBadgeEl.innerHTML = `<span class="status-dot"></span> Gemini AI Active (${escapeHtml(ACTIVE_MODEL)})`;
  } else {
    apiStatusBadgeEl.className = "status-badge local";
    apiStatusBadgeEl.innerHTML = `<span class="status-dot"></span> Nyaya Offline Engine`;
  }
}

/* ==========================================================================
   6. USER SUBMISSION HANDLER
   ========================================================================== */
async function handleUserSubmission() {
  if (isProcessing) return;

  const rawInput = chatInputEl.value.trim();

  // Input Validation
  if (!rawInput) {
    chatInputEl.focus();
    return;
  }

  if (rawInput.length > 300) {
    appendBotMessage({
      type: "warning",
      text: "⚠️ Please keep your input concise (under 300 characters) so WasteWise can analyze the waste item accurately."
    });
    return;
  }

  // Render User Message
  appendUserMessage(rawInput);
  chatInputEl.value = "";
  chatInputEl.disabled = true;
  sendBtnEl.disabled = true;
  isProcessing = true;

  // Show Thinking Indicator
  const loadingId = appendLoadingIndicator();

  try {
    let result = null;

    // First: Check if user has Gemini API Key provided
    if (GEMINI_API_KEY) {
      try {
        result = await queryGeminiWithFallback(rawInput);
      } catch (apiError) {
        console.warn("Gemini API call failed, falling back to Nyaya Offline Engine:", apiError);
        // Fallback to local reasoning engine seamlessly
        result = analyzeWithLocalIksEngine(rawInput);
        result.fallbackNote = `(Note: Gemini API temporarily unavailable [${escapeHtml(apiError.message || "Quota/Network")}]. Switched to Nyaya Offline Knowledge Base).`;
      }
    } else {
      // Offline / Local Nyaya Reasoning Engine
      // Simulate natural thinking latency (400ms) for realistic UX
      await new Promise((resolve) => setTimeout(resolve, 450));
      result = analyzeWithLocalIksEngine(rawInput);
    }

    // Remove loading indicator
    removeLoadingIndicator(loadingId);

    // Render Bot Structured Response
    renderStructuredResponse(result);

    // Update Decision Tree visual highlights
    highlightDecisionTree(result.category);

  } catch (error) {
    removeLoadingIndicator(loadingId);
    console.error("Critical reasoning error:", error);
    appendBotMessage({
      type: "error",
      text: "❌ An unexpected error occurred while analyzing the waste item. Please try another item or check your network connection."
    });
  } finally {
    chatInputEl.disabled = false;
    sendBtnEl.disabled = false;
    chatInputEl.focus();
    isProcessing = false;
  }
}

/* ==========================================================================
   7. GEMINI API REASONING WITH RESILIENT FALLBACK
   ========================================================================== */
async function queryGeminiWithFallback(itemQuery) {
  const systemInstruction = `You are WasteWise, an educational waste segregation assistant for a college IKS practical experiment.
You analyze user waste items strictly using the Indian Logic reasoning framework:
- Observation (Pratyaksha): What the item physically is.
- Evidence (Hetu): Why the item belongs to this category (material properties, biodegradability, chemical composition).
- Inference (Anumana): What logical deduction connects the evidence to natural decomposition or recycling capability.
- Conclusion (Nigamana): Where and how to safely dispose of it, including the exact bin.

Decision Point Rule:
1. Is this waste biodegradable? If YES -> wet/organic waste.
2. If NO, is it recyclable? If YES -> dry/recyclable waste.
3. If NO, is it hazardous or electronic? If YES -> hazardous waste or e-waste (special collection). If NO -> general waste.

Categories allowed:
- wet (Wet/Biodegradable Waste 🟢)
- dry (Dry/Recyclable Waste 🔵)
- hazard (Hazardous Waste 🔴)
- ewaste (E-Waste 🟣)
- general (General/Other Waste ⚫)
- unrelated (if input is not a waste item at all, e.g. greeting, math question, joke)

Important Safety Rule: For batteries, electronics, chemicals, medical waste, and broken glass, recommend special/authorized collection and explicitly state that campus/local municipal regulations take precedence.

Output format: You MUST respond in pure valid JSON without markdown fences, with these exact keys:
{
  "isWasteItem": true,
  "category": "wet" | "dry" | "hazard" | "ewaste" | "general" | "unrelated",
  "categoryName": "Wet / Biodegradable Waste 🟢",
  "decisionPoint": "Is it biodegradable? YES -> Wet Waste",
  "observation": "...",
  "evidence": "...",
  "inference": "...",
  "conclusion": "...",
  "safetyAdvisory": "..."
}`;

  const promptText = `Analyze this waste item: "${itemQuery}". Respond with JSON only.`;

  // Build model try-sequence starting with ACTIVE_MODEL
  const modelsToTry = [ACTIVE_MODEL, ...FALLBACK_MODELS.filter(m => m !== ACTIVE_MODEL)];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
      
      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemInstruction}\n\n${promptText}` }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800
        }
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status} from model ${model}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error(`Empty response generated by ${model}`);
      }

      // Clean JSON string (remove possible markdown backticks)
      const cleanJson = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      return {
        isWasteItem: parsed.isWasteItem !== false,
        category: parsed.category || "general",
        categoryName: parsed.categoryName || getCategoryLabel(parsed.category),
        decisionPoint: parsed.decisionPoint || "Standard Waste Classification Flow",
        observation: parsed.observation || `Identified item: ${itemQuery}`,
        evidence: parsed.evidence || "Physical and material characteristics.",
        inference: parsed.inference || "Deduction based on material decomposition properties.",
        conclusion: parsed.conclusion || "Segregate into appropriate bin.",
        safetyAdvisory: parsed.safetyAdvisory || "Follow campus and local municipal waste management guidelines."
      };
    } catch (err) {
      console.warn(`Model ${model} failed:`, err.message);
      lastError = err;
      // Continue to next model in sequence
    }
  }

  throw lastError || new Error("All Gemini models exhausted.");
}

/* ==========================================================================
   8. LOCAL IKS NYAYA REASONING ENGINE (OFFLINE FALLBACK & SPEED)
   ========================================================================== */
function analyzeWithLocalIksEngine(userText) {
  const normalized = userText.toLowerCase().trim();

  // Check for greetings or unrelated queries
  if (/^(hi|hello|hey|namaste|good morning|who are you|what is your name)/i.test(normalized)) {
    return {
      isWasteItem: false,
      category: "unrelated",
      message: "Hi there! 🌱 I am <strong>WasteWise</strong>, your campus waste segregation assistant. Please tell me what waste item you want to dispose of (e.g., <em>banana peel</em>, <em>used battery</em>, <em>plastic bottle</em>, or <em>cardboard</em>), and I will break down its disposal using Indian Logic!"
    };
  }

  if (/^(what is|tell me a joke|weather|capital of|who won|how to code)/i.test(normalized)) {
    return {
      isWasteItem: false,
      category: "unrelated",
      message: "I am specifically designed for the <strong>IKS Waste Segregation Experiment</strong>! 🌱 Please enter a discarded object or material (such as food scraps, packaging, electronics, or broken glass) so we can practice proper segregation."
    };
  }

  // Exact or Substring match in Knowledge Base
  for (const [key, data] of Object.entries(IKS_KNOWLEDGE_BASE)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return {
        isWasteItem: true,
        category: data.category,
        categoryName: data.categoryName,
        decisionPoint: data.decisionPath,
        observation: data.observation,
        evidence: data.evidence,
        inference: data.inference,
        conclusion: data.conclusion,
        safetyAdvisory: data.safetyAdvisory
      };
    }
  }

  // Rule-based heuristic decision tree if item is not in pre-defined dict
  return classifyByNyayaHeuristics(normalized, userText);
}

function classifyByNyayaHeuristics(lower, originalText) {
  // Decision Tree Check 1: Biodegradable?
  const bioKeywords = ["leaf", "leaves", "apple", "orange", "mango", "vegetable", "fruit", "tea", "coffee", "rice", "bread", "meat", "bone", "egg", "flower", "grass", "plant", "wood", "cotton", "cloth"];
  const isBio = bioKeywords.some(kw => lower.includes(kw));

  if (isBio) {
    return {
      isWasteItem: true,
      category: "wet",
      categoryName: "Wet / Biodegradable Waste 🟢",
      decisionPoint: "Is it biodegradable? YES → Wet Waste",
      observation: `The item identified is organic biodegradable matter (${originalText}).`,
      evidence: "Derived from biological/organic origin without non-biodegradable synthetic additives.",
      inference: "Natural microorganisms can break down organic matter into carbon and nutrient-rich soil compost without toxic residue.",
      conclusion: "Dispose of in the green Wet/Organic Waste Bin 🟢. Keep separate from plastic wrapping.",
      safetyAdvisory: "Compost locally on campus or send to municipal organic waste collectors."
    };
  }

  // Decision Tree Check 2: Recyclable?
  const recyclableKeywords = ["can", "tin", "aluminum", "metal", "paper", "magazine", "notebook", "tetra pak", "plastic", "cup", "shampoo", "wrapper", "carton", "jar"];
  const isRecyclable = recyclableKeywords.some(kw => lower.includes(kw));

  if (isRecyclable) {
    return {
      isWasteItem: true,
      category: "dry",
      categoryName: "Dry / Recyclable Waste 🔵",
      decisionPoint: "Is it biodegradable? NO → Is it recyclable? YES → Dry / Recyclable Waste",
      observation: `The item identified is dry recyclable material (${originalText}).`,
      evidence: "Manufactured from recoverable paper, metal, or polymers suitable for industrial remanufacturing.",
      inference: "Reprocessing avoids raw resource extraction and landfill overload.",
      conclusion: "Ensure it is clean and dry, then place in the blue Dry/Recyclable Waste Bin 🔵.",
      safetyAdvisory: "Rinse food containers lightly to avoid fouling other recyclable paper."
    };
  }

  // Decision Tree Check 3: Hazardous or E-Waste?
  const hazardKeywords = ["chemical", "acid", "paint", "pesticide", "syringe", "needle", "medicine", "pill", "tablet", "thermometer", "fluorescent", "tube", "bulb"];
  if (hazardKeywords.some(kw => lower.includes(kw))) {
    return {
      isWasteItem: true,
      category: "hazard",
      categoryName: "Hazardous Waste 🔴",
      decisionPoint: "Is it biodegradable? NO → Recyclable in Std Bin? NO → Hazardous Waste",
      observation: `The item identified is potentially toxic or bio-hazardous (${originalText}).`,
      evidence: "Contains chemical, toxic, biomedical, or reactive compounds.",
      inference: "Ordinary disposal risks severe chemical leaching, groundwater poisoning, or physical harm to sanitation workers.",
      conclusion: "Take directly to specialized hazardous/biomedical waste collection points 🔴.",
      safetyAdvisory: "Never mix with dry or wet waste. Adhere strictly to campus health and laboratory safety protocols."
    };
  }

  const ewasteKeywords = ["charger", "wire", "cable", "laptop", "computer", "mouse", "keyboard", "printer", "earphone", "headphone", "tablet", "screen", "gadget"];
  if (ewasteKeywords.some(kw => lower.includes(kw))) {
    return {
      isWasteItem: true,
      category: "ewaste",
      categoryName: "E-Waste (Electronic Waste) 🟣",
      decisionPoint: "Is it biodegradable? NO → Recyclable in Std Bin? NO → Electronic Waste",
      observation: `The item identified is consumer electronic or electrical hardware (${originalText}).`,
      evidence: "Contains silicon circuits, wiring, metals, and electronic components.",
      inference: "Electronic components require specialized thermal and chemical recovery to prevent lead/mercury pollution.",
      conclusion: "Deposit into authorized campus e-waste recycling bins or hand over to certified e-waste recyclers 🟣.",
      safetyAdvisory: "Remove any detachable batteries first; store batteries in protective containers."
    };
  }

  // Fallback: General Waste
  return {
    isWasteItem: true,
    category: "general",
    categoryName: "General / Other Waste ⚫",
    decisionPoint: "Is it biodegradable? NO → Recyclable? NO → Hazardous? NO → General Waste",
    observation: `The item identified is mixed or non-recyclable composite residue (${originalText}).`,
    evidence: "Does not qualify for organic composting or standard clean dry recycling.",
    inference: "Cannot be safely reclaimed via typical municipal single-stream sorting without specialized processing.",
    conclusion: "Dispose of in the black/grey General Waste Bin ⚫ for sanitary disposal or authorized refuse processing.",
    safetyAdvisory: "Review local municipal bylaws as campus guidelines may specify alternative recovery for mixed packaging."
  };
}

/* ==========================================================================
   9. RESPONSE RENDERING
   ========================================================================== */
function renderStructuredResponse(data) {
  if (!data.isWasteItem || data.category === "unrelated") {
    appendBotMessage({
      type: "unrelated",
      text: data.message || "I am an educational waste segregation assistant. Please enter a specific waste item!"
    });
    return;
  }

  const catClass = getCategoryClass(data.category);

  const html = `
    <div>
      <p style="margin-bottom: 0.5rem;">I analyzed your waste item using the <strong>Indian Logic Framework</strong>:</p>
      
      <div class="reasoning-card">
        <div class="reasoning-header">
          <span>🌿 Nyaya Tarka Reasoning</span>
          <span>Category: ${escapeHtml(data.category.toUpperCase())}</span>
        </div>

        <div class="decision-point-box">
          <strong>Decision Point:</strong>
          <span>${escapeHtml(data.decisionPoint || "Biodegradable vs Recyclable Analysis")}</span>
        </div>

        <div class="reasoning-list">
          <div class="reasoning-item">
            <span class="term">
              <span>🔍 1. Observation</span>
              <span class="term-sanskrit">(Pratyaksha)</span>
            </span>
            <span class="val">${escapeHtml(data.observation)}</span>
          </div>

          <div class="reasoning-item">
            <span class="term">
              <span>🧬 2. Evidence</span>
              <span class="term-sanskrit">(Hetu)</span>
            </span>
            <span class="val">${escapeHtml(data.evidence)}</span>
          </div>

          <div class="reasoning-item">
            <span class="term">
              <span>🧠 3. Inference</span>
              <span class="term-sanskrit">(Anumana)</span>
            </span>
            <span class="val">${escapeHtml(data.inference)}</span>
          </div>

          <div class="reasoning-item conclusion">
            <span class="term">
              <span>🎯 4. Conclusion</span>
              <span class="term-sanskrit">(Nigamana)</span>
            </span>
            <span class="val">${escapeHtml(data.conclusion)}</span>
          </div>
        </div>
      </div>

      <div style="margin-top: 0.625rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
        <span class="category-tag-pill ${catClass}">
          ${getCategoryEmoji(data.category)} ${escapeHtml(data.categoryName)}
        </span>
      </div>

      ${data.safetyAdvisory ? `
        <div class="advisory-notice">
          <span>⚠️</span>
          <span><strong>Safety / Campus Rule:</strong> ${escapeHtml(data.safetyAdvisory)}</span>
        </div>
      ` : ""}

      ${data.fallbackNote ? `
        <p style="font-size: 0.72rem; color: #64748b; margin-top: 0.4rem; font-style: italic;">
          ${escapeHtml(data.fallbackNote)}
        </p>
      ` : ""}
    </div>
  `;

  appendBotMessage({
    type: "structured",
    html: html
  });
}

function appendUserMessage(text) {
  const row = document.createElement("div");
  row.className = "message-row user";
  row.innerHTML = `
    <div class="msg-avatar">👤</div>
    <div class="msg-bubble">${escapeHtml(text)}</div>
  `;
  chatMessagesEl.appendChild(row);
  scrollToBottom();
}

function appendBotMessage({ type, text, html }) {
  const row = document.createElement("div");
  row.className = "message-row bot";

  let innerContent = "";
  if (html) {
    innerContent = html;
  } else {
    innerContent = `<p>${text}</p>`;
  }

  row.innerHTML = `
    <div class="msg-avatar">🌱</div>
    <div class="msg-bubble">${innerContent}</div>
  `;
  chatMessagesEl.appendChild(row);
  scrollToBottom();
}

function appendLoadingIndicator() {
  const id = "loading-" + Date.now();
  const row = document.createElement("div");
  row.className = "message-row bot";
  row.id = id;
  row.innerHTML = `
    <div class="msg-avatar">🌱</div>
    <div class="msg-bubble">
      <div class="loading-indicator">
        <span>WasteWise is thinking…</span>
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  `;
  chatMessagesEl.appendChild(row);
  scrollToBottom();
  return id;
}

function removeLoadingIndicator(id) {
  const el = document.getElementById(id);
  if (el) {
    el.remove();
  }
}

function resetChat() {
  chatMessagesEl.innerHTML = `
    <div class="message-row bot">
      <div class="msg-avatar">🌱</div>
      <div class="msg-bubble">
        <p><strong>Hi! I’m WasteWise 🌱.</strong> I can help you identify the correct waste category and disposal method.</p>
        <p style="margin-top: 0.4rem; color: #475569; font-size: 0.85rem;">
          Please enter the name of any waste item (or click an example below) and I will demonstrate the 
          <strong>Observation → Evidence → Inference → Conclusion</strong> reasoning process.
        </p>
      </div>
    </div>
  `;
  highlightDecisionTree(null);
  chatInputEl.value = "";
  chatInputEl.focus();
}

function scrollToBottom() {
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

/* ==========================================================================
   10. DECISION TREE VISUAL HIGHLIGHTER
   ========================================================================== */
function highlightDecisionTree(category) {
  // Clear active highlights
  rowBioYesEl?.classList.remove("active");
  rowRecycYesEl?.classList.remove("active");
  rowHazardEl?.classList.remove("active");
  rowGeneralEl?.classList.remove("active");

  if (!category) return;

  if (category === "wet") {
    rowBioYesEl?.classList.add("active");
  } else if (category === "dry") {
    rowRecycYesEl?.classList.add("active");
  } else if (category === "hazard" || category === "ewaste") {
    rowHazardEl?.classList.add("active");
  } else {
    rowGeneralEl?.classList.add("active");
  }
}

/* ==========================================================================
   11. HELPER UTILITIES
   ========================================================================== */
function getCategoryClass(cat) {
  const map = {
    wet: "wet",
    dry: "dry",
    hazard: "hazard",
    ewaste: "ewaste",
    general: "general"
  };
  return map[cat] || "general";
}

function getCategoryEmoji(cat) {
  const map = {
    wet: "🟢",
    dry: "🔵",
    hazard: "🔴",
    ewaste: "🟣",
    general: "⚫"
  };
  return map[cat] || "🏷️";
}

function getCategoryLabel(cat) {
  const map = {
    wet: "Wet / Biodegradable Waste 🟢",
    dry: "Dry / Recyclable Waste 🔵",
    hazard: "Hazardous Waste 🔴",
    ewaste: "E-Waste (Electronic Waste) 🟣",
    general: "General / Other Waste ⚫"
  };
  return map[cat] || "General Waste ⚫";
}

function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
