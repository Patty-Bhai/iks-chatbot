/**
 * ==========================================================================
 * 🌱 WasteWise – Smart Waste & Recycling Assistant
 * College IKS Practical – Experiment 08
 * Faculty-in-Charge: Ms. Tejal D’mello
 * 
 * Logic Framework:
 * 1. Waste Relevance Check: Is it related to waste, recycling, composting, etc.?
 * 2. Identifiable Item Check: Is it a specific object or open-ended educational question?
 * 3. Indian Logic (Nyaya Darshana) for items:
 *    - Observation (Pratyaksha)
 *    - Evidence (Hetu)
 *    - Inference (Anumana)
 *    - Conclusion (Nigamana)
 * 4. Conversational Educational Answers for broader sustainability concepts.
 * 5. Resilient fallback sequence for Gemini API + robust offline local engine.
 * ==========================================================================
 */

/* ==========================================================================
   1. GEMINI API CONFIGURATION SECTION
   ========================================================================== */
let GEMINI_API_KEY = ""; // Injected dynamically via UI or local storage

// Recommended Flash models with automatic fallback
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

// Camera & File Upload DOM elements
const cameraBtnEl = document.getElementById("cameraBtn");
const uploadBtnEl = document.getElementById("uploadBtn");
const cameraInputEl = document.getElementById("cameraInput");
const fileUploadInputEl = document.getElementById("fileUploadInput");
const imagePreviewContainerEl = document.getElementById("imagePreviewContainer");
const imagePreviewThumbnailEl = document.getElementById("imagePreviewThumbnail");
const imagePreviewFilenameEl = document.getElementById("imagePreviewFilename");
const removeImageBtnEl = document.getElementById("removeImageBtn");

// Selected image attachment state: { dataUrl: string, mimeType: string, base64: string, name: string } | null
let attachedImage = null;

// Dashboard cards & category modal
const dashCards = document.querySelectorAll(".dash-card");
const categoryModalEl = document.getElementById("categoryModal");
const closeCatModalEl = document.getElementById("closeCatModal");
const catModalTitleEl = document.getElementById("catModalTitle");
const catModalBodyEl = document.getElementById("catModalBody");
const askAboutCategoryBtnEl = document.getElementById("askAboutCategoryBtn");

// Suggested question chips & quick example chips
const suggChips = document.querySelectorAll(".sugg-chip");
const exampleChips = document.querySelectorAll(".chip-btn");

/* ==========================================================================
   3. CATEGORY MODAL DATA DEFINITIONS
   ========================================================================== */
const CATEGORY_DETAILS = {
  wet: {
    title: "🟢 Wet / Biodegradable Waste",
    color: "#15803d",
    binColor: "Green Bin 🟢",
    summary: "Organic biodegradable kitchen and garden waste that naturally decomposes via microorganisms.",
    examples: ["Fruit and vegetable peels", "Cooked food leftovers", "Eggshells", "Tea leaves and coffee grounds", "Dry leaves, plants, and flowers", "Soiled paper napkins"],
    disposalTips: "Never mix with plastic bags or wrappers. Can be turned into compost or used in campus biogas digesters.",
    decisionRule: "Is it biodegradable? YES → Wet Waste.",
    suggestedQuery: "What is wet waste and how should I compost it?"
  },
  dry: {
    title: "🔵 Dry / Recyclable Waste",
    color: "#0369a1",
    binColor: "Blue Bin 🔵",
    summary: "Clean, non-biodegradable recyclable items manufactured from plastics, paper, glass, or metals.",
    examples: ["Plastic bottles & beverage containers", "Newspapers, cardboard & office paper", "Aluminum soda cans & tin food cans", "Clean glass jars & bottles", "Metal packaging & foil"],
    disposalTips: "Items should be clean, rinsed, and dry. Greasy pizza boxes or dirty foil cannot be recycled with clean dry paper.",
    decisionRule: "Is it biodegradable? NO → Is it recyclable? YES → Dry Waste.",
    suggestedQuery: "Can plastic bottles and cardboard be recycled together?"
  },
  ewaste: {
    title: "🟣 E-Waste (Electronic Waste)",
    color: "#6b21a8",
    binColor: "Purple / Dedicated E-Waste Drop Box 🟣",
    summary: "Discarded electrical and electronic equipment containing microchips, printed circuit boards, wiring, and precious metals.",
    examples: ["Old mobile phones & tablets", "Laptop chargers, cables & wires", "Broken earphones, keyboards & mice", "Calculators & digital wristwatches", "Old circuit boards & hardware"],
    disposalTips: "Never dump with ordinary municipal garbage or incinerate. Drop off at authorized campus e-waste collection boxes or certified recyclers. Always wipe personal data first.",
    decisionRule: "Is it biodegradable? NO → Standard Recyclable? NO → Electronic? YES → E-Waste.",
    suggestedQuery: "What is e-waste and how do colleges collect it?"
  },
  hazard: {
    title: "🔴 Special & Hazardous Waste",
    color: "#b91c1c",
    binColor: "Red / Specialized Hazardous Disposal 🔴",
    summary: "Toxic, corrosive, infectious, chemical, or sharp waste requiring specialized handling to prevent environmental contamination and injury.",
    examples: ["Used batteries (alkaline, lithium-ion)", "Broken glass and mirrors (sharp hazard)", "Expired medications and blister packs", "Paints, thinners, and laboratory chemicals", "Fluorescent tubes & CFL bulbs"],
    disposalTips: "Wrap broken glass securely in thick cardboard or newspaper and label 'SHARP'. Tape battery terminals to prevent short-circuit sparks. Hand over to campus laboratory safety staff or specialized collectors.",
    decisionRule: "Is it toxic, chemical, or sharp? YES → Specialized Hazardous Stream.",
    suggestedQuery: "How should I safely dispose of a used battery and broken glass?"
  }
};

let currentModalCategory = "wet";

/* ==========================================================================
   4. LOCAL KNOWLEDGE BASE FOR OFFLINE / VIVA DEMONSTRATIONS
   ========================================================================== */
const OFFLINE_KNOWLEDGE_BASE = {
  // Direct Items
  "banana peel": {
    isWasteRelated: true,
    isItemAnalysis: true,
    category: "wet",
    categoryName: "Wet / Biodegradable Waste 🟢",
    decisionPoint: "Is it biodegradable? YES → Wet / Organic Waste",
    observation: "The item is a banana peel (organic fruit residue).",
    evidence: "It is composed of natural plant cellulose, water, and organic matter with zero synthetic polymers.",
    inference: "It can decompose naturally via microbial digestion into nutrient-rich compost without toxic byproducts.",
    conclusion: "Put it in the green wet/organic waste bin 🟢.",
    safetyAdvisory: "Remove any plastic brand stickers before composting."
  },
  "plastic bottle": {
    isWasteRelated: true,
    isItemAnalysis: true,
    category: "dry",
    categoryName: "Dry / Recyclable Waste 🔵",
    decisionPoint: "Is it biodegradable? NO → Is it recyclable? YES → Dry / Recyclable Waste",
    observation: "The item is a plastic beverage bottle (PET #1 or HDPE #2 container).",
    evidence: "Most common beverage plastic bottles are recyclable synthetic polymers engineered with standard resin codes.",
    inference: "It can generally be processed for recycling if accepted by local facilities, melted, and formed into new items.",
    conclusion: "Rinse lightly, crush or flatten to save space, and place it in the blue dry/recyclable waste bin 🔵.",
    safetyAdvisory: "Empty all liquid contents to avoid spoiling dry paper in the same bin."
  },
  "newspaper": {
    isWasteRelated: true,
    isItemAnalysis: true,
    category: "dry",
    categoryName: "Dry / Recyclable Waste 🔵",
    decisionPoint: "Is it biodegradable? YES (Cellulose) but Dry: YES → Recyclable Paper Stream",
    observation: "The item is a printed newspaper made of cellulose wood pulp fibers.",
    evidence: "Clean, dry printed paper has high fiber value and an established industrial recycling stream.",
    inference: "Recycling newspaper preserves trees, saves water, and creates recycled cardboard and newsprint.",
    conclusion: "Fold neatly and put it in the blue dry waste bin 🔵 or college scrap paper collection.",
    safetyAdvisory: "Ensure it is kept completely dry and clean from grease or food."
  },
  "used battery": {
    isWasteRelated: true,
    isItemAnalysis: true,
    category: "hazard",
    categoryName: "Hazardous Waste 🔴",
    decisionPoint: "Is it biodegradable? NO → Recyclable in standard bin? NO → Hazardous Stream",
    observation: "The item is a spent electrochemical battery cell.",
    evidence: "It contains heavy metals (lithium, cadmium, zinc) and caustic chemicals/electrolytes that pose toxic and fire hazards.",
    inference: "Landfill dumping causes hazardous leachate that pollutes soil and groundwater.",
    conclusion: "Take it to a designated battery drop-off box or hazardous waste collection point 🔴. Never throw in regular green or blue bins.",
    safetyAdvisory: "Cover both terminal ends with transparent tape to prevent accidental short circuits."
  },
  "broken glass": {
    isWasteRelated: true,
    isItemAnalysis: true,
    category: "hazard",
    categoryName: "Special / Sharp Hazard Waste 🔴",
    decisionPoint: "Is it sharp or hazardous? YES → Specialized Protected Handling",
    observation: "The item is broken glass or shards from glassware/window panes.",
    evidence: "It has sharp, jagged cutting edges and poses an immediate laceration hazard to sanitation and housekeeping workers.",
    inference: "Loose glass in garbage bags tears plastic and severely injures waste handlers.",
    conclusion: "Wrap it securely in multiple layers of newspaper or pack in a rigid cardboard box, label it 'SHARP / BROKEN GLASS', and hand it over separately 🔴.",
    safetyAdvisory: "Never throw loose glass into regular waste bags."
  },
  "old mobile phone": {
    isWasteRelated: true,
    isItemAnalysis: true,
    category: "ewaste",
    categoryName: "E-Waste (Electronic Waste) 🟣",
    decisionPoint: "Is it biodegradable? NO → Standard recyclable? NO → Electronic: YES → E-Waste",
    observation: "The item is a retired smartphone or consumer electronic gadget.",
    evidence: "It contains printed circuit boards (PCBs), rare earth metals (gold, copper, tantalum), toxic flame retardants, and a lithium battery.",
    inference: "Standard incinerator or landfill disposal releases toxic fumes; authorized e-waste facilities can safely recover precious metals.",
    conclusion: "Hand it over to an authorized e-waste collection center, college engineering e-waste bin, or manufacturer take-back drive 🟣.",
    safetyAdvisory: "Back up and securely factory-reset your device to wipe personal data before disposal."
  },
  "food leftovers": {
    isWasteRelated: true,
    isItemAnalysis: true,
    category: "wet",
    categoryName: "Wet / Biodegradable Waste 🟢",
    decisionPoint: "Is it biodegradable? YES → Wet / Organic Waste",
    observation: "The item is discarded cooked food or organic meal scraps.",
    evidence: "It is biodegradable organic biomass containing moisture, carbohydrates, and nutrients.",
    inference: "It decomposes rapidly via microbial activity into compost or biogas.",
    conclusion: "Put it in the green wet waste bin 🟢. Avoid leaving it stagnant to prevent odors and pests.",
    safetyAdvisory: "Keep it free from plastic food wrappers or toothpicks."
  },
  "cardboard box": {
    isWasteRelated: true,
    isItemAnalysis: true,
    category: "dry",
    categoryName: "Dry / Recyclable Waste 🔵",
    decisionPoint: "Is it biodegradable? YES but Dry: YES → Recyclable Paper Stream",
    observation: "The item is a corrugated cardboard packaging box.",
    evidence: "It is manufactured from strong Kraft paper fibers that can be repulped multiple times.",
    inference: "Cardboard recycling saves valuable landfill space and tree fiber.",
    conclusion: "Flatten the box completely, remove plastic tape, and place it in the blue dry/recyclable waste bin 🔵.",
    safetyAdvisory: "If heavily stained with food oil or grease (like the bottom of a pizza box), tear off the greasy part for general/compost and recycle only the clean top."
  },

  // Open-Ended Questions
  "why should we segregate waste": {
    isWasteRelated: true,
    isItemAnalysis: false,
    text: `Waste segregation is the foundation of modern waste management and environmental health. Here is why it is essential:
    
1. **Prevents Landfill Overload:** Segregating wet and dry waste keeps organic matter out of landfills where it produces methane (a potent greenhouse gas).
2. **Enables High-Quality Recycling:** Clean, unsoiled dry waste (paper, plastic, metal) can be easily processed into new goods. Once contaminated by wet food, recyclables become useless.
3. **Protects Sanitation Workers:** Separating sharp glass, biomedical waste, and chemicals protects workers from infections, injuries, and toxic fumes.
4. **Produces Natural Compost:** Clean wet waste can be turned into organic fertilizer for farming and college gardens.
5. **Economic Value:** Recyclable materials re-enter the circular economy, saving energy and virgin natural resources.`
  },
  "what is wet waste": {
    isWasteRelated: true,
    isItemAnalysis: false,
    text: `**Wet Waste** refers to all organic, biodegradable matter that comes primarily from kitchens, gardens, and food preparation.

- **Examples:** Vegetable and fruit peels, food leftovers, tea leaves, coffee grounds, eggshells, garden clippings, and fallen leaves.
- **Where it goes:** Green Bin 🟢.
- **How it is treated:** Composting, vermicomposting, or biogas generation.
- **Key Rule:** Never mix plastic bags, metal cutlery, or non-biodegradable wrappers with wet waste.`
  },
  "what is e-waste": {
    isWasteRelated: true,
    isItemAnalysis: false,
    text: `**E-Waste (Electronic Waste)** includes any discarded electrical or electronic devices, whether working, broken, or obsolete.

- **Examples:** Old mobile phones, chargers, headphones, laptops, batteries, circuit boards, televisions, and electrical cords.
- **Where it goes:** Dedicated E-Waste bins or authorized recycling centers 🟣.
- **Why it is hazardous:** Electronics contain heavy toxic metals like lead, mercury, and cadmium that poison soil and water if dumped in open landfills.
- **Value:** Certified recyclers can safely extract precious metals like gold, silver, and copper to manufacture new devices.`
  },
  "how can i compost kitchen waste": {
    isWasteRelated: true,
    isItemAnalysis: false,
    text: `Composting at home or in college is a rewarding and simple process:

1. **Choose a Container:** Use an earthen pot (matka), aerated plastic bin, or garden pit with small holes for air circulation.
2. **Balance Greens & Browns:**
   - **Greens (Nitrogen/Moisture):** Fruit/vegetable scraps, tea leaves, fresh food leftovers.
   - **Browns (Carbon/Dry):** Dry leaves, shredded egg cartons, sawdust, or shredded plain newspaper.
   - *Tip: Use 2 parts browns to 1 part greens to avoid odors.*
3. **Layer the Waste:** Start with a layer of dry leaves, add kitchen scraps, and cover with another layer of dry leaves or a handful of garden soil.
4. **Aerate & Turn:** Stir the pile once a week to provide oxygen to aerobic bacteria.
5. **Harvest:** In 4 to 8 weeks, it transforms into dark, pleasant-smelling organic compost rich in plant nutrients!`
  },
  "can i recycle a pizza box": {
    isWasteRelated: true,
    isItemAnalysis: false,
    text: `The answer depends on **grease contamination**:

- **Greasy / Cheese-Stained Bottom:** Cannot be recycled! Grease and oil do not separate from paper fibers during pulping, ruining entire batches of recycled paper. Put the greasy part in the **wet/compost bin** or general waste.
- **Clean Top Lid:** If the top lid is clean and dry, tear it off and place it in the **blue Dry / Recyclable bin 🔵**.
- *Always tear away contaminated portions before binning packaging!*`
  },
  "how can students reduce waste in college": {
    isWasteRelated: true,
    isItemAnalysis: false,
    text: `Students can drive meaningful environmental impact on campus through simple everyday habits:

1. **Carry a Reusable Water Bottle & Mug:** Avoid single-use plastic bottles and canteen paper cups.
2. **Digital Notes & Double-Sided Printing:** Take lecture notes digitally or print assignments double-sided on recycled paper.
3. **Bring Your Own Cutlery / Dabba:** Avoid disposable plastic spoons and styrofoam lunch trays at the campus cafeteria.
4. **Organize E-Waste & Book Drives:** Donate semester textbooks and recycle old chargers in campus collection bins.
5. **Practice Active Segregation:** Ensure you put food scraps in the green bin 🟢 and clean beverage cans in the blue bin 🔵.`
  },
  "how do i identify hazardous waste": {
    isWasteRelated: true,
    isItemAnalysis: false,
    text: `**Hazardous Waste** can be identified by the **"Four C-T-I-R"** danger traits:

1. **Corrosive:** Acids, battery liquids, drain cleaners.
2. **Toxic / Poisonous:** Pesticides, chemical reagents, expired pharmaceuticals, mercury thermometers.
3. **Ignitable / Flammable:** Paint thinners, aerosol spray cans, solvent adhesives.
4. **Reactive / Explosive:** Unsealed lithium batteries, chemical laboratory oxidizers.
5. **Physical / Sharp Hazard:** Broken glass shards, laboratory needles, syringes.

*Disposal Rule:* Never dump hazardous waste down the sink or in green/blue bins. Always take it to authorized hazardous drop-off stations 🔴.`
  }
};

/* ==========================================================================
   5. INITIALIZATION & STATE MANAGEMENT
   ========================================================================== */
let isProcessing = false;

document.addEventListener("DOMContentLoaded", () => {
  // Load saved API Key / Model if existing
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
});

/* ==========================================================================
   6. EVENT LISTENERS
   ========================================================================== */
function setupEventListeners() {
  // Chat submission
  sendBtnEl.addEventListener("click", () => handleUserSubmission());
  chatInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUserSubmission();
    }
  });

  // Clear chat
  clearChatBtnEl.addEventListener("click", () => resetChat());

  // Camera & File Upload Buttons
  cameraBtnEl.addEventListener("click", () => {
    cameraInputEl.click();
  });

  uploadBtnEl.addEventListener("click", () => {
    fileUploadInputEl.click();
  });

  cameraInputEl.addEventListener("change", (e) => {
    handleImageSelection(e.target.files?.[0]);
    e.target.value = ""; // Reset file input so re-snapping works
  });

  fileUploadInputEl.addEventListener("change", (e) => {
    handleImageSelection(e.target.files?.[0]);
    e.target.value = ""; // Reset file input so re-upload works
  });

  removeImageBtnEl.addEventListener("click", () => {
    clearAttachedImage();
  });

  // Suggested questions chips (above input)
  suggChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const q = chip.getAttribute("data-query") || chip.getAttribute("data-q") || chip.textContent.trim();
      chatInputEl.value = q;
      handleUserSubmission();
    });
  });

  // Quick example chips (below suggested questions)
  exampleChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const item = chip.getAttribute("data-item") || chip.textContent.trim();
      chatInputEl.value = item;
      handleUserSubmission();
    });
  });

  // Dashboard 4 Cards Click -> Open Category Detail Modal
  dashCards.forEach((card) => {
    card.addEventListener("click", () => {
      const catKey = card.getAttribute("data-cat") || "wet";
      openCategoryModal(catKey);
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const catKey = card.getAttribute("data-cat") || "wet";
        openCategoryModal(catKey);
      }
    });
  });

  // Category Modal Handlers
  closeCatModalEl.addEventListener("click", () => {
    categoryModalEl.classList.remove("open");
  });

  categoryModalEl.addEventListener("click", (e) => {
    if (e.target === categoryModalEl) {
      categoryModalEl.classList.remove("open");
    }
  });

  askAboutCategoryBtnEl.addEventListener("click", () => {
    const detail = CATEGORY_DETAILS[currentModalCategory];
    categoryModalEl.classList.remove("open");
    if (detail && detail.suggestedQuery) {
      chatInputEl.value = detail.suggestedQuery;
      handleUserSubmission();
    }
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
        ? `✅ Google Gemini API configured with model <strong>${escapeHtml(selectedModel)}</strong>. Open-ended waste intelligence is now live!`
        : `ℹ️ Running in <strong>Offline / Viva Practical Mode</strong>. Comprehensive knowledge base is ready to demonstrate Indian Logic!`
    });
  });
}

/* ==========================================================================
   IMAGE ATTACHMENT HANDLERS
   ========================================================================== */
function handleImageSelection(file) {
  if (!file) return;

  // Validate image type
  if (!file.type.startsWith("image/")) {
    appendBotMessage({
      type: "warning",
      text: "⚠️ Please select a valid image file (JPEG, PNG, WebP, GIF)."
    });
    return;
  }

  // Limit file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    appendBotMessage({
      type: "warning",
      text: "⚠️ Image is larger than 5MB. Please choose or capture a smaller image."
    });
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    // Extract base64 without prefix
    const base64Data = dataUrl.split(",")[1];
    const mimeType = file.type || "image/jpeg";

    attachedImage = {
      name: file.name || "waste-photo.jpg",
      mimeType: mimeType,
      dataUrl: dataUrl,
      base64: base64Data
    };

    // Update UI
    imagePreviewThumbnailEl.src = dataUrl;
    imagePreviewFilenameEl.textContent = attachedImage.name;
    imagePreviewContainerEl.style.display = "block";
    cameraBtnEl.classList.add("has-file");
    uploadBtnEl.classList.add("has-file");

    if (!chatInputEl.value.trim()) {
      chatInputEl.placeholder = "Describe this waste item (or press Send for automatic Indian Logic analysis)...";
    }
    chatInputEl.focus();
  };

  reader.onerror = () => {
    console.error("Failed to read image file");
  };

  reader.readAsDataURL(file);
}

function clearAttachedImage() {
  attachedImage = null;
  imagePreviewContainerEl.style.display = "none";
  imagePreviewThumbnailEl.src = "";
  imagePreviewFilenameEl.textContent = "";
  cameraBtnEl.classList.remove("has-file");
  uploadBtnEl.classList.remove("has-file");
  chatInputEl.placeholder = "Ask ANY question, or snap/upload a waste photo...";
}

function updateApiStatusUI() {
  if (GEMINI_API_KEY) {
    apiStatusBadgeEl.className = "status-badge live";
    apiStatusBadgeEl.innerHTML = `<span class="status-dot"></span> Gemini AI Active (${escapeHtml(ACTIVE_MODEL)})`;
  } else {
    apiStatusBadgeEl.className = "status-badge local";
    apiStatusBadgeEl.innerHTML = `<span class="status-dot"></span> Offline Knowledge Engine`;
  }
}

function openCategoryModal(catKey) {
  const detail = CATEGORY_DETAILS[catKey] || CATEGORY_DETAILS.wet;
  currentModalCategory = catKey;

  catModalTitleEl.innerHTML = `<span style="color: ${detail.color}">${detail.title}</span>`;

  let examplesHtml = detail.examples.map(ex => `<li>${escapeHtml(ex)}</li>`).join("");

  catModalBodyEl.innerHTML = `
    <div>
      <p style="font-size: 0.95rem; margin-bottom: 0.75rem;">${escapeHtml(detail.summary)}</p>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.75rem;">
        <strong style="color: #1e293b; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.03em;">Recommended Bin:</strong>
        <p style="font-weight: 700; color: ${detail.color}; margin-top: 0.2rem;">${detail.binColor}</p>
      </div>

      <div style="margin-bottom: 0.75rem;">
        <strong style="font-size: 0.85rem; color: #334155;">Common Campus Examples:</strong>
        <ul style="margin: 0.35rem 0 0.35rem 1.25rem; font-size: 0.85rem; color: #475569;">
          ${examplesHtml}
        </ul>
      </div>

      <div style="background: #f0fdf4; border-left: 3px solid #16a34a; padding: 0.5rem 0.75rem; border-radius: 4px; font-size: 0.8rem; color: #166534; margin-bottom: 0.5rem;">
        <strong>Decision Logic:</strong> ${escapeHtml(detail.decisionRule)}
      </div>

      <p style="font-size: 0.78rem; color: #64748b;"><strong>Campus Tip:</strong> ${escapeHtml(detail.disposalTips)}</p>
    </div>
  `;

  categoryModalEl.classList.add("open");
}

/* ==========================================================================
   7. USER SUBMISSION HANDLER
   ========================================================================== */
async function handleUserSubmission() {
  if (isProcessing) return;

  const rawInput = chatInputEl.value.trim();
  const currentImage = attachedImage; // Capture reference before clearing

  // Require either text or an attached image
  if (!rawInput && !currentImage) {
    chatInputEl.focus();
    return;
  }

  if (rawInput.length > 500) {
    appendBotMessage({
      type: "warning",
      text: "⚠️ Please keep your question under 500 characters so WasteWise can analyze it accurately."
    });
    return;
  }

  // Display user message in chat (with attached photo thumbnail if present)
  appendUserMessage(rawInput, currentImage);

  // Clear inputs and state
  chatInputEl.value = "";
  clearAttachedImage();
  chatInputEl.disabled = true;
  sendBtnEl.disabled = true;
  isProcessing = true;

  // Show Thinking Indicator
  const loadingId = appendLoadingIndicator();

  try {
    let responseData = null;

    if (GEMINI_API_KEY) {
      try {
        responseData = await queryGeminiWithFallback(rawInput, currentImage);
      } catch (apiError) {
        console.warn("Gemini API call failed, falling back to local engine:", apiError);
        responseData = analyzeWithLocalEngine(rawInput, currentImage);
        responseData.fallbackNote = `(Note: Gemini API temporarily unavailable [${escapeHtml(apiError.message || "Quota/Network")}]. Switched to Offline Knowledge Engine).`;
      }
    } else {
      // Natural simulated thinking delay for offline mode
      await new Promise((resolve) => setTimeout(resolve, 400));
      responseData = analyzeWithLocalEngine(rawInput, currentImage);
    }

    removeLoadingIndicator(loadingId);
    renderBotResponse(responseData, rawInput || "Captured Waste Image");

  } catch (error) {
    removeLoadingIndicator(loadingId);
    console.error("Critical reasoning error:", error);
    appendBotMessage({
      type: "error",
      text: "❌ An unexpected error occurred while analyzing your question. Please try asking again or rephrase."
    });
  } finally {
    chatInputEl.disabled = false;
    sendBtnEl.disabled = false;
    chatInputEl.focus();
    isProcessing = false;
  }
}

/* ==========================================================================
   8. GEMINI API REASONING ENGINE (EXPANDED PROMPT WITH INDIAN LOGIC & VISION)
   ========================================================================== */
async function queryGeminiWithFallback(userQuery, imageAttachment = null) {
  const systemInstruction = `You are WasteWise 🌱, an educational waste awareness and segregation assistant for a college IKS practical experiment (Experiment 08).
Your mission is to help students identify waste items (from text or photos), understand waste categories, recycling, composting, segregation, pollution prevention, and environmental sustainability.

Follow these strict rules:

1. WASTE-RELATED CHECK:
Determine whether the user's question or image relates to waste, recycling, composting, segregation, trash disposal, discarded objects, litter, pollution caused by waste, environmental awareness, or sustainability.
If the question/photo is UNRELATED to waste (e.g., human faces, random scenery, pets, coding, math, recipes, general memes):
Politely respond:
"I’m WasteWise 🌱, so I mainly answer questions and analyze photos of waste items, recycling, composting, segregation, and environmental awareness. Please provide a waste-related question or item photo."
Set "isWasteRelated": false.

2. SPECIFIC ITEM DISPOSAL & IMAGE ANALYSIS (INDIAN LOGIC NYAYA DARSHANA):
- If the user provides a SPECIFIC ITEM in text OR uploads/captures an IMAGE of a waste item:
  Structure your analysis strictly using the classical INDIAN LOGIC (Nyaya Darshana) FRAMEWORK:
  - Observation (Pratyaksha): What is empirically observed or identified from the text or image (e.g., "The image shows a crumpled PET beverage plastic bottle with label" or "The user identified a banana peel").
  - Evidence (Hetu): Relevant physical/material characteristics of the waste (biodegradability, synthetic polymers, heavy metals, glass sharpness, organic plant tissue).
  - Inference (Anumana): What can be logically concluded from those characteristics (e.g., microbial enzymatic breakdown into organic compost, or polymer melting and pelletizing for textile fiber, or chemical battery leakage).
  - Conclusion (Nigamana): The recommended waste category and exact bin (Wet Waste 🟢, Dry Waste 🔵, E-Waste 🟣, Hazardous Waste 🔴, General Waste ⚫).
  - Decision Point: Explicitly state the decision gate (e.g., "Is it biodegradable? YES -> Wet Waste" or "Is it biodegradable? NO -> Is it recyclable? YES -> Dry Waste" or "Hazardous / Electronics -> Specialized Safe Drop-off").
  Set "isItemAnalysis": true.

3. GENERAL EDUCATIONAL / AWARENESS QUESTIONS (TEXT ONLY):
- If the user asks general or conceptual questions (e.g., "Why should we segregate waste?", "What is wet waste?", "How can I compost kitchen waste?", "What happens to recyclable waste?", "How can students reduce waste in college?"):
  Provide a clear, helpful, educational answer explaining the concepts with practical, student-friendly tips.
  Set "isItemAnalysis": false.

4. AMBIGUOUS INPUT:
- If the user's waste item is ambiguous or unclear from the image/text, ask a follow-up question to clarify material. Include options in "followUpOptions".

5. PRACTICAL REALITY & ADVISORY:
- Mention that municipal or campus regulations may vary when appropriate.
- For hazardous items (broken glass, batteries, chemicals), include a prominent safety warning in "safetyAdvisory".

OUTPUT FORMAT: Respond with ONLY valid, parseable JSON (no markdown backticks, no text outside JSON) with this exact schema:
{
  "isWasteRelated": true | false,
  "isItemAnalysis": true | false,
  "isAmbiguous": true | false,
  "category": "wet" | "dry" | "hazard" | "ewaste" | "general" | "unrelated",
  "categoryName": "Wet / Biodegradable Waste 🟢",
  "decisionPoint": "Is it biodegradable? YES -> Wet Waste",
  "observation": "...",
  "evidence": "...",
  "inference": "...",
  "conclusion": "...",
  "educationalAnswer": "...",
  "safetyAdvisory": "...",
  "followUpQuestion": "...",
  "followUpOptions": ["Option A", "Option B"]
}`;

  // Assemble query prompt
  let promptText = userQuery
    ? `User Question/Description: "${userQuery}".`
    : `Please analyze the attached image of a waste item.`;

  if (imageAttachment) {
    promptText += ` Identify the waste item in the photo, inspect its material properties, and provide Indian Logic (Observation, Evidence, Inference, Conclusion) reasoning and disposal advice following the JSON schema.`;
  }

  const modelsToTry = [ACTIVE_MODEL, ...FALLBACK_MODELS.filter(m => m !== ACTIVE_MODEL)];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

      // Construct parts array supporting both text and inline image data
      const parts = [
        { text: `${systemInstruction}\n\n${promptText}` }
      ];

      if (imageAttachment && imageAttachment.base64) {
        parts.push({
          inlineData: {
            mimeType: imageAttachment.mimeType || "image/jpeg",
            data: imageAttachment.base64
          }
        });
      }

      const payload = {
        contents: [
          {
            role: "user",
            parts: parts
          }
        ],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 1000
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

      const cleanJson = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      return parsed;

    } catch (err) {
      console.warn(`Model ${model} failed in fallback chain:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models exhausted.");
}

/* ==========================================================================
   9. LOCAL / OFFLINE REASONING ENGINE
   ========================================================================== */
function analyzeWithLocalEngine(userText, imageAttachment = null) {
  const norm = (userText || "").toLowerCase().trim();

  // If text is empty but image was provided in offline mode
  if (!norm && imageAttachment) {
    // Check filename for hints or provide standard visual reasoning demonstration
    const fname = (imageAttachment.name || "").toLowerCase();
    if (fname.includes("peel") || fname.includes("banana") || fname.includes("food") || fname.includes("apple") || fname.includes("leaf")) {
      return OFFLINE_KNOWLEDGE_BASE["banana peel"];
    }
    if (fname.includes("bottle") || fname.includes("plastic") || fname.includes("can")) {
      return OFFLINE_KNOWLEDGE_BASE["plastic bottle"];
    }
    if (fname.includes("battery") || fname.includes("cell")) {
      return OFFLINE_KNOWLEDGE_BASE["used battery"];
    }
    if (fname.includes("phone") || fname.includes("charger") || fname.includes("wire") || fname.includes("laptop")) {
      return OFFLINE_KNOWLEDGE_BASE["old mobile phone"];
    }

    // Default visual analysis demonstration in offline mode
    return {
      isWasteRelated: true,
      isItemAnalysis: true,
      category: "dry",
      categoryName: "Dry / Recyclable Waste 🔵",
      decisionPoint: "Is it biodegradable? NO → Is it recyclable? YES → Dry Waste",
      observation: `Captured image: "${imageAttachment.name || "waste-item.jpg"}". Visual inspection shows discarded container/packaging material.`,
      evidence: "Synthetic packaging or manufactured container showing non-biodegradable, solid recyclable composition.",
      inference: "Material can be separated, sanitized, and reprocessed into industrial pellets or secondary commodities without decomposing in compost.",
      conclusion: "Rinse clean if contaminated with food, then place into the blue Dry/Recyclable Waste Bin 🔵.",
      safetyAdvisory: "In offline mode, image recognition runs local heuristic inspection. Enter a Gemini API Key in Settings (⚙️) for full multimodal AI vision."
    };
  }

  // Check 1: Greetings or identity
  if (/^(hi|hello|hey|namaste|good morning|who are you|what is your name)/i.test(norm)) {
    return {
      isWasteRelated: true,
      isItemAnalysis: false,
      educationalAnswer: "Hi! I’m **WasteWise 🌱**. I can help you identify the correct waste category and disposal method, or answer any question about waste management, recycling, composting, segregation, and sustainability.\n\nTry asking me: *'Where should I throw a banana peel?'* or *'Why should we segregate waste?'*"
    };
  }

  // Check 2: Unrelated topics
  if (/^(who won|cricket|football|capital of|tell me a joke|weather|write code|stock price|movie|song)/i.test(norm)) {
    return {
      isWasteRelated: false,
      educationalAnswer: "I’m WasteWise 🌱, so I mainly answer questions about waste management, recycling, segregation, disposal, composting, and environmental awareness. Please ask me a waste-related question."
    };
  }

  // Check 3: Exact or near match in pre-defined knowledge base
  for (const [key, data] of Object.entries(OFFLINE_KNOWLEDGE_BASE)) {
    if (norm === key || norm.includes(key) || key.includes(norm)) {
      if (data.isItemAnalysis) {
        return {
          isWasteRelated: true,
          isItemAnalysis: true,
          category: data.category,
          categoryName: data.categoryName,
          decisionPoint: data.decisionPoint,
          observation: data.observation,
          evidence: data.evidence,
          inference: data.inference,
          conclusion: data.conclusion,
          safetyAdvisory: data.safetyAdvisory
        };
      } else {
        return {
          isWasteRelated: true,
          isItemAnalysis: false,
          educationalAnswer: data.text
        };
      }
    }
  }

  // Check 4: Check if query contains general keywords (why, what is, how to compost, reduce, difference)
  if (norm.includes("segregat") || norm.includes("why should we") || norm.includes("importance")) {
    return {
      isWasteRelated: true,
      isItemAnalysis: false,
      educationalAnswer: OFOFFLINE_GET("why should we segregate waste")
    };
  }

  if (norm.includes("compost")) {
    return {
      isWasteRelated: true,
      isItemAnalysis: false,
      educationalAnswer: OFOFFLINE_GET("how can i compost kitchen waste")
    };
  }

  if (norm.includes("e-waste") || norm.includes("ewaste") || norm.includes("electronic waste")) {
    return {
      isWasteRelated: true,
      isItemAnalysis: false,
      educationalAnswer: OFOFFLINE_GET("what is e-waste")
    };
  }

  if (norm.includes("hazard") || norm.includes("toxic")) {
    return {
      isWasteRelated: true,
      isItemAnalysis: false,
      educationalAnswer: OFOFFLINE_GET("how do i identify hazardous waste")
    };
  }

  if (norm.includes("reduce") || norm.includes("college") || norm.includes("campus") || norm.includes("student")) {
    return {
      isWasteRelated: true,
      isItemAnalysis: false,
      educationalAnswer: OFOFFLINE_GET("how can students reduce waste in college")
    };
  }

  // Check 5: Heuristic Item Classification using Indian Logic
  return classifyItemHeuristically(norm, userText);
}

function OFOFFLINE_GET(key) {
  return OFFLINE_KNOWLEDGE_BASE[key]?.text || "Waste segregation protects health, preserves natural resources, and enables composting and circular recycling.";
}

function classifyItemHeuristically(lower, originalText) {
  // Decision Point 1: Biodegradable?
  const bioKeywords = ["leaf", "leaves", "apple", "orange", "mango", "vegetable", "fruit", "peel", "tea", "coffee", "rice", "bread", "food", "meat", "bone", "egg", "flower", "grass", "plant", "wood"];
  if (bioKeywords.some(kw => lower.includes(kw))) {
    return {
      isWasteRelated: true,
      isItemAnalysis: true,
      category: "wet",
      categoryName: "Wet / Biodegradable Waste 🟢",
      decisionPoint: "Is it biodegradable? YES → Wet Waste",
      observation: `The item identified is organic biodegradable matter (${originalText}).`,
      evidence: "It is composed of natural biological matter that decomposes naturally without toxic residue.",
      inference: "Aerobic bacteria and microorganisms can decompose this organic material into nutrient-rich compost.",
      conclusion: "Dispose of in the green Wet/Organic Waste Bin 🟢.",
      safetyAdvisory: "Keep it free from plastic wraps and synthetic packaging."
    };
  }

  // Decision Point 2: Recyclable Dry Waste?
  const recyclableKeywords = ["can", "tin", "aluminum", "metal", "paper", "magazine", "notebook", "carton", "box", "bottle", "plastic", "cup", "jar", "glass"];
  if (recyclableKeywords.some(kw => lower.includes(kw))) {
    return {
      isWasteRelated: true,
      isItemAnalysis: true,
      category: "dry",
      categoryName: "Dry / Recyclable Waste 🔵",
      decisionPoint: "Is it biodegradable? NO → Is it recyclable? YES → Dry / Recyclable Waste",
      observation: `The item identified is clean dry recyclable material (${originalText}).`,
      evidence: "Manufactured from recoverable paper, metal, glass, or plastic resin suitable for industrial remanufacturing.",
      inference: "Reprocessing through municipal recycling channels avoids raw resource extraction and landfill buildup.",
      conclusion: "Ensure it is clean and dry, then place it in the blue Dry/Recyclable Waste Bin 🔵.",
      safetyAdvisory: "Rinse food residue to avoid contaminating dry paper in the same bin."
    };
  }

  // Decision Point 3: Hazardous or E-Waste?
  const hazardKeywords = ["battery", "chemical", "acid", "paint", "pesticide", "syringe", "needle", "medicine", "pill", "tablet", "thermometer", "tube", "bulb"];
  if (hazardKeywords.some(kw => lower.includes(kw))) {
    return {
      isWasteRelated: true,
      isItemAnalysis: true,
      category: "hazard",
      categoryName: "Hazardous Waste 🔴",
      decisionPoint: "Is it biodegradable? NO → Recyclable in standard bin? NO → Hazardous Waste",
      observation: `The item identified is potentially toxic or bio-hazardous (${originalText}).`,
      evidence: "Contains chemical, toxic, heavy metal, or reactive compounds.",
      inference: "Ordinary landfill disposal risks chemical leaching into groundwater or injury to waste collectors.",
      conclusion: "Take directly to specialized hazardous collection points 🔴. Never throw in regular bins.",
      safetyAdvisory: "Handle carefully and follow campus health and laboratory safety protocols."
    };
  }

  const ewasteKeywords = ["charger", "wire", "cable", "laptop", "computer", "phone", "mouse", "keyboard", "printer", "earphone", "headphone", "screen", "electronic"];
  if (ewasteKeywords.some(kw => lower.includes(kw))) {
    return {
      isWasteRelated: true,
      isItemAnalysis: true,
      category: "ewaste",
      categoryName: "E-Waste (Electronic Waste) 🟣",
      decisionPoint: "Is it biodegradable? NO → Recyclable in standard bin? NO → Electronic Waste",
      observation: `The item identified is consumer electronic or electrical hardware (${originalText}).`,
      evidence: "Contains printed circuit boards, wiring, and heavy or precious metals.",
      inference: "Electronic components require specialized recovery to prevent toxic pollution and salvage precious resources.",
      conclusion: "Deposit into authorized campus e-waste recycling bins 🟣.",
      safetyAdvisory: "Reset electronic memory and remove detachable batteries before disposal."
    };
  }

  // Fallback: General Waste
  return {
    isWasteRelated: true,
    isItemAnalysis: true,
    category: "general",
    categoryName: "General / Other Waste ⚫",
    decisionPoint: "Is it biodegradable? NO → Recyclable? NO → Hazardous? NO → General Waste",
    observation: `The item identified is mixed or non-recyclable composite residue (${originalText}).`,
    evidence: "Does not qualify for organic composting or standard clean dry recycling.",
    inference: "Cannot be safely reclaimed via typical single-stream municipal sorting without specialized facilities.",
    conclusion: "Dispose of in the black/grey General Waste Bin ⚫ for sanitary disposal.",
    safetyAdvisory: "Check campus and local municipal guidelines for specialized recovery programs."
  };
}

/* ==========================================================================
   10. RESPONSE RENDERING
   ========================================================================== */
function renderBotResponse(data, originalQuery) {
  // Case 1: Unrelated Question
  if (data.isWasteRelated === false) {
    appendBotMessage({
      type: "unrelated",
      html: `
        <div style="color: #475569;">
          <p>I’m <strong>WasteWise 🌱</strong>, so I mainly answer questions about waste management, recycling, segregation, disposal, composting, and environmental awareness. Please ask me a waste-related question!</p>
          <div style="margin-top: 0.6rem; display: flex; gap: 0.35rem; flex-wrap: wrap;">
            <button class="sugg-chip" onclick="handleQuickClick('Where should I throw a banana peel?')">🍌 Banana peel</button>
            <button class="sugg-chip" onclick="handleQuickClick('Can plastic bottles be recycled?')">🧴 Plastic bottles</button>
            <button class="sugg-chip" onclick="handleQuickClick('Why should we segregate waste?')">❓ Why segregate?</button>
          </div>
        </div>
      `
    });
    return;
  }

  // Case 2: Ambiguous item question -> Ask Follow-up
  if (data.isAmbiguous && data.followUpQuestion) {
    let optionsHtml = "";
    if (data.followUpOptions && Array.isArray(data.followUpOptions)) {
      optionsHtml = data.followUpOptions.map(opt => `
        <button class="followup-btn" onclick="handleQuickClick('${escapeHtml(opt)}')">${escapeHtml(opt)}</button>
      `).join("");
    }

    appendBotMessage({
      type: "followup",
      html: `
        <div>
          <p>${escapeHtml(data.followUpQuestion)}</p>
          ${optionsHtml ? `<div class="followup-options">${optionsHtml}</div>` : ""}
        </div>
      `
    });
    return;
  }

  // Case 3: Specific Waste Item Analysis (Demonstrating Indian Logic Framework)
  if (data.isItemAnalysis) {
    const catClass = getCategoryClass(data.category);

    const html = `
      <div>
        <p style="margin-bottom: 0.45rem;">Here is the <strong>Indian Logic (Nyaya Darshana)</strong> reasoning for this item:</p>
        
        <div class="reasoning-card">
          <div class="reasoning-header">
            <span>🌿 Nyaya Logic Reasoning</span>
            <span>Category: ${escapeHtml((data.category || "general").toUpperCase())}</span>
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
              <span class="val">${escapeHtml(data.observation || `Item: ${originalQuery}`)}</span>
            </div>

            <div class="reasoning-item">
              <span class="term">
                <span>🧬 2. Evidence</span>
                <span class="term-sanskrit">(Hetu)</span>
              </span>
              <span class="val">${escapeHtml(data.evidence || "Material composition and physical characteristics.")}</span>
            </div>

            <div class="reasoning-item">
              <span class="term">
                <span>🧠 3. Inference</span>
                <span class="term-sanskrit">(Anumana)</span>
              </span>
              <span class="val">${escapeHtml(data.inference || "Logical deduction connecting evidence to decomposition or recycling capability.")}</span>
            </div>

            <div class="reasoning-item conclusion">
              <span class="term">
                <span>🎯 4. Conclusion</span>
                <span class="term-sanskrit">(Nigamana)</span>
              </span>
              <span class="val">${escapeHtml(data.conclusion || "Dispose into designated bin.")}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 0.625rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <span class="category-tag-pill ${catClass}">
            ${getCategoryEmoji(data.category)} ${escapeHtml(data.categoryName || getCategoryLabel(data.category))}
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
    return;
  }

  // Case 4: General Educational / Awareness Response
  const formattedAnswer = formatEducationalMarkdown(data.educationalAnswer || data.text || "Here is information on waste management.");
  
  const html = `
    <div>
      ${formattedAnswer}
      
      ${data.safetyAdvisory ? `
        <div class="advisory-notice" style="margin-top: 0.75rem;">
          <span>💡</span>
          <span><strong>Campus Note:</strong> ${escapeHtml(data.safetyAdvisory)}</span>
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
    type: "educational",
    html: html
  });
}

// Global helper so dynamically rendered buttons can trigger queries
window.handleQuickClick = function(text) {
  if (chatInputEl) {
    chatInputEl.value = text;
    handleUserSubmission();
  }
};

function formatEducationalMarkdown(text) {
  if (!text) return "";
  let html = text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Paragraph breaks
    .split("\n\n")
    .map(para => {
      para = para.trim();
      if (!para) return "";
      if (para.startsWith("- ") || para.startsWith("* ")) {
        const items = para.split("\n").map(line => `<li>${line.replace(/^[-*]\s*/, "")}</li>`).join("");
        return `<ul>${items}</ul>`;
      }
      if (/^\d+\.\s/.test(para)) {
        const items = para.split("\n").map(line => `<li>${line.replace(/^\d+\.\s*/, "")}</li>`).join("");
        return `<ol>${items}</ol>`;
      }
      return `<p>${para.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("");

  return html;
}

function appendUserMessage(text, imageAttachment = null) {
  const row = document.createElement("div");
  row.className = "message-row user";

  let imgHtml = "";
  if (imageAttachment && imageAttachment.dataUrl) {
    imgHtml = `
      <img src="${imageAttachment.dataUrl}" alt="User waste photo" class="user-msg-image" />
    `;
  }

  const textHtml = text ? `<p>${escapeHtml(text)}</p>` : (imageAttachment ? `<p style="font-style: italic; opacity: 0.9;">[Photo submitted for Indian Logic analysis]</p>` : "");

  row.innerHTML = `
    <div class="msg-avatar">👤</div>
    <div class="msg-bubble">
      ${imgHtml}
      ${textHtml}
    </div>
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
    innerContent = `<p>${escapeHtml(text)}</p>`;
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
        <span>WasteWise is observing &amp; analyzing…</span>
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
  if (el) el.remove();
}

function resetChat() {
  chatMessagesEl.innerHTML = `
    <div class="message-row bot">
      <div class="msg-avatar">🌱</div>
      <div class="msg-bubble">
        <p><strong>Hi! I’m WasteWise 🌱.</strong> I can help you identify the correct waste category and disposal method.</p>
        <p style="margin-top: 0.4rem; color: #475569; font-size: 0.85rem;">
          You can ask me <strong>ANY question</strong> about waste management, recycling, composting, segregation, pollution, or sustainability, or <strong>snap/upload a picture</strong> (📷 / 🖼️)! 
          For waste items, I will demonstrate the <strong>Observation → Evidence → Inference → Conclusion</strong> Indian Logic framework.
        </p>
      </div>
    </div>
  `;
  chatInputEl.value = "";
  clearAttachedImage();
  chatInputEl.focus();
}

function scrollToBottom() {
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
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
    hazard: "Hazardous / Special Waste 🔴",
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
