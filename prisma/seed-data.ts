// Starter catalogue & content for Carsappo. Prices are in rupees here; the seed converts to paise.
// Product images point at generated placeholders (npm run placeholders) until real photos are uploaded.

export type SeedCategory = { name: string; slug: string; icon: string; description: string; artIcon: string };

export const categories: SeedCategory[] = [
  { name: "Mats", slug: "mats", icon: "Layers", artIcon: "layers", description: "7D, 5D and anti-skid car mats, custom-fit for your exact model." },
  { name: "Seat Covers", slug: "seat-covers", icon: "Armchair", artIcon: "armchair", description: "Premium leatherette, Nappa and breathable mesh seat covers." },
  { name: "Car Care", slug: "car-care", icon: "SprayCan", artIcon: "spray-can", description: "Tyre polish, dashboard polish, shampoos, waxes and coatings." },
  { name: "Interior Accessories", slug: "interior-accessories", icon: "Sofa", artIcon: "sofa", description: "Perfumes, organisers, dashboard covers and comfort upgrades." },
  { name: "Exterior Accessories", slug: "exterior-accessories", icon: "CarFront", artIcon: "car-front", description: "Body covers, guards, garnish and mud flaps." },
  { name: "Electronics", slug: "electronics", icon: "Zap", artIcon: "zap", description: "Vacuum cleaners, chargers, dash cams, inflators and lighting." },
  { name: "Bike Accessories", slug: "bike-accessories", icon: "Bike", artIcon: "bike", description: "Covers, mounts and care essentials for two-wheelers." },
  { name: "Cleaning Essentials", slug: "cleaning-essentials", icon: "Sparkles", artIcon: "sparkles", description: "Microfiber cloths, mitts, brushes and waterless wash." },
];

export const brands = ["Carsappo", "Carsappo Pro", "Carsappo Luxe", "Carsappo Tech", "Carsappo Essentials"];

export type Fit = "all-cars" | "all-bikes" | "universal" | "suv" | "popular";

export type SeedProduct = {
  name: string;
  slug: string;
  sku: string;
  category: string;
  brand: string;
  price: number;
  mrp: number;
  stock: number;
  gstRate: number;
  hsn: string;
  art: string; // lucide-static icon used for the placeholder image
  short: string;
  features: string[];
  specs: [string, string][];
  tags: string[];
  fit: Fit;
  flags?: Partial<{ featured: boolean; bestSeller: boolean; trending: boolean; premium: boolean }>;
  weight?: number;
  sales?: number;
  faqs?: [string, string][];
  video?: string;
};

export const products: SeedProduct[] = [
  // ── Mats ─────────────────────────────────────────
  {
    name: "7D Premium Car Mats — Custom Fit",
    slug: "7d-premium-car-mats-custom-fit",
    sku: "CS-MAT-7D",
    category: "mats",
    brand: "Carsappo",
    price: 3499,
    mrp: 5999,
    stock: 120,
    gstRate: 12,
    hsn: "57050049",
    art: "layers",
    short: "Laser-measured, edge-to-edge 7D mats with a raised lip that traps dust, mud and spills.",
    features: [
      "Custom-fit for your exact model — full floor coverage",
      "7-layer construction with anti-skid backing",
      "Waterproof, odourless PU leatherette top",
      "Raised edges trap water, mud and spills",
      "Wipe clean in seconds — no washing needed",
    ],
    specs: [["Material", "PU leatherette + XPE foam"], ["Layers", "7"], ["Pieces", "Front, rear & centre (model dependent)"], ["Colour", "Black with beige stitching"], ["Warranty", "1 year"]],
    tags: ["mat", "mats", "7d mat", "floor mat", "car mat"],
    fit: "all-cars",
    flags: { featured: true, bestSeller: true, premium: true },
    weight: 4500,
    sales: 540,
    faqs: [
      ["Will these mats fit my car exactly?", "Yes. Select your car model, year and variant at checkout or in Shop by Vehicle — every set is cut from a model-specific template."],
      ["Can I wash them?", "Simply wipe with a damp microfiber cloth. For deep cleaning, rinse with water and let them air dry."],
    ],
  },
  {
    name: "5D Leatherette Floor Mats",
    slug: "5d-leatherette-floor-mats",
    sku: "CS-MAT-5D",
    category: "mats",
    brand: "Carsappo",
    price: 2299,
    mrp: 3499,
    stock: 90,
    gstRate: 12,
    hsn: "57050049",
    art: "layers-2",
    short: "Durable 5D mats with diamond stitching and a snug, model-specific fit.",
    features: ["Model-specific fit", "Diamond quilted stitching", "Anti-slip granule base", "Water resistant"],
    specs: [["Material", "PU leatherette"], ["Layers", "5"], ["Colour", "Black / Tan"], ["Warranty", "6 months"]],
    tags: ["mat", "mats", "5d mat", "floor mat"],
    fit: "all-cars",
    flags: { trending: true },
    weight: 4000,
    sales: 310,
  },
  {
    name: "Anti-Skid Rubber Mats (Universal, Set of 4)",
    slug: "anti-skid-rubber-mats-universal",
    sku: "CS-MAT-RUB",
    category: "mats",
    brand: "Carsappo",
    price: 899,
    mrp: 1499,
    stock: 200,
    gstRate: 12,
    hsn: "40169100",
    art: "grid-2x2",
    short: "Heavy-duty trimmable rubber mats for monsoon-ready floors.",
    features: ["Trim-to-fit design", "Deep water channels", "Odour-free natural rubber", "Heel pad for driver side"],
    specs: [["Material", "Natural rubber"], ["Pieces", "4"], ["Colour", "Black"]],
    tags: ["mat", "mats", "rubber mat", "floor mat"],
    fit: "universal",
    weight: 3500,
    sales: 220,
  },
  {
    name: "Boot / Trunk Mat — Custom Fit",
    slug: "boot-trunk-mat-custom-fit",
    sku: "CS-MAT-BOOT",
    category: "mats",
    brand: "Carsappo",
    price: 1499,
    mrp: 2499,
    stock: 70,
    gstRate: 12,
    hsn: "57050049",
    art: "package-open",
    short: "Protect your boot from groceries, luggage and pets with a tailored mat.",
    features: ["Tailored to your boot shape", "Raised edges", "Waterproof leatherette"],
    specs: [["Material", "PU leatherette"], ["Colour", "Black"]],
    tags: ["mat", "boot mat", "trunk mat", "dickey mat"],
    fit: "all-cars",
    weight: 2000,
    sales: 95,
  },

  // ── Seat covers ─────────────────────────────────
  {
    name: "Premium Leatherette Seat Covers — Custom Fit",
    slug: "premium-leatherette-seat-covers",
    sku: "CS-SC-LTH",
    category: "seat-covers",
    brand: "Carsappo",
    price: 6999,
    mrp: 11999,
    stock: 60,
    gstRate: 12,
    hsn: "94019000",
    art: "armchair",
    short: "Factory-look leatherette seat covers stitched to your car's exact seat profile.",
    features: [
      "OEM-style custom fit — no loose folds",
      "Airbag-compatible side seams",
      "Breathable perforated centre panel",
      "Includes headrest and armrest covers",
      "Free installation guide video",
    ],
    specs: [["Material", "Premium PU leatherette"], ["Set", "Full car (front + rear)"], ["Colours", "Black, Black-Red, Tan, Beige"], ["Warranty", "1 year"]],
    tags: ["seat cover", "seat covers", "leather seat cover"],
    fit: "all-cars",
    flags: { featured: true, bestSeller: true, premium: true },
    weight: 5000,
    sales: 410,
    faqs: [["Do the covers work with side airbags?", "Yes — the side seams use tear-away stitching so seat-mounted airbags deploy normally."]],
  },
  {
    name: "Breathable Mesh Seat Covers",
    slug: "breathable-mesh-seat-covers",
    sku: "CS-SC-MESH",
    category: "seat-covers",
    brand: "Carsappo",
    price: 3999,
    mrp: 5999,
    stock: 55,
    gstRate: 12,
    hsn: "94019000",
    art: "wind",
    short: "Cool, sweat-free mesh seat covers made for Indian summers.",
    features: ["3D air-mesh fabric", "Custom fit", "Machine washable"],
    specs: [["Material", "3D air mesh"], ["Set", "Full car"], ["Colour", "Black / Grey"]],
    tags: ["seat cover", "seat covers", "mesh"],
    fit: "all-cars",
    flags: { trending: true },
    weight: 3500,
    sales: 150,
  },
  {
    name: "Nappa Leather Seat Covers — Luxe Series",
    slug: "nappa-leather-seat-covers-luxe",
    sku: "CS-SC-NAPPA",
    category: "seat-covers",
    brand: "Carsappo Luxe",
    price: 12999,
    mrp: 18999,
    stock: 25,
    gstRate: 12,
    hsn: "94019000",
    art: "crown",
    short: "Soft-touch Nappa-grain leather with quilted inserts for a luxury cabin.",
    features: ["Nappa-grain premium leather", "Diamond quilted inserts", "Custom fit with lumbar padding", "2-year warranty"],
    specs: [["Material", "Nappa-grain leather"], ["Set", "Full car"], ["Warranty", "2 years"]],
    tags: ["seat cover", "seat covers", "nappa", "luxury"],
    fit: "all-cars",
    flags: { premium: true, featured: true },
    weight: 6000,
    sales: 60,
  },
  {
    name: "Memory Foam Neck Rest & Lumbar Cushion Combo",
    slug: "memory-foam-neck-rest-lumbar-combo",
    sku: "CS-SC-CUSH",
    category: "seat-covers",
    brand: "Carsappo",
    price: 1299,
    mrp: 1999,
    stock: 150,
    gstRate: 12,
    hsn: "94049099",
    art: "sofa",
    short: "Ergonomic memory foam support for long drives.",
    features: ["Slow-rebound memory foam", "Adjustable straps", "Removable washable cover"],
    specs: [["Material", "Memory foam + velour"], ["Pieces", "2 (neck + lumbar)"]],
    tags: ["cushion", "neck rest", "pillow", "lumbar"],
    fit: "universal",
    weight: 900,
    sales: 180,
  },

  // ── Car care ────────────────────────────────────
  {
    name: "Tyre Polish — Deep Black Shine (500 ml)",
    slug: "tyre-polish-deep-black-500ml",
    sku: "CS-CC-TYRE",
    category: "car-care",
    brand: "Carsappo",
    price: 349,
    mrp: 499,
    stock: 300,
    gstRate: 18,
    hsn: "34053000",
    art: "circle-dot",
    short: "Long-lasting, non-greasy tyre dressing for a rich, deep-black finish.",
    features: ["Water-based, non-sling formula", "UV protection prevents cracking", "Lasts up to 2 weeks", "Applicator sponge included"],
    specs: [["Volume", "500 ml"], ["Finish", "Satin to high-gloss (layerable)"], ["Coverage", "20+ applications"]],
    tags: ["tyre polish", "tire polish", "tyre shine", "polish"],
    fit: "universal",
    flags: { bestSeller: true, trending: true },
    weight: 600,
    sales: 820,
  },
  {
    name: "Dashboard Polish — Matte Finish (300 ml)",
    slug: "dashboard-polish-matte-300ml",
    sku: "CS-CC-DASH",
    category: "car-care",
    brand: "Carsappo",
    price: 299,
    mrp: 449,
    stock: 280,
    gstRate: 18,
    hsn: "34053000",
    art: "gauge",
    short: "Anti-static, UV-protective dashboard polish that leaves a clean OEM matte look.",
    features: ["Anti-static — repels dust", "UV protection", "Fresh citrus fragrance", "Safe on plastic, vinyl and rubber"],
    specs: [["Volume", "300 ml"], ["Finish", "Matte"]],
    tags: ["dashboard polish", "dashboard", "polish", "interior"],
    fit: "universal",
    flags: { bestSeller: true },
    weight: 400,
    sales: 760,
  },
  {
    name: "Ceramic Coating Spray (500 ml)",
    slug: "ceramic-coating-spray-500ml",
    sku: "CS-CC-CER",
    category: "car-care",
    brand: "Carsappo Pro",
    price: 999,
    mrp: 1599,
    stock: 110,
    gstRate: 18,
    hsn: "34053000",
    art: "shield-check",
    short: "Spray-on SiO₂ ceramic protection with extreme water beading and gloss.",
    features: ["SiO₂ ceramic formula", "Hydrophobic water beading", "Up to 6 months protection", "Spray, spread, buff — 15 minutes"],
    specs: [["Volume", "500 ml"], ["Protection", "Up to 6 months"], ["Coverage", "3–4 cars"]],
    tags: ["ceramic", "coating", "polish", "wax", "shine"],
    fit: "universal",
    flags: { premium: true, trending: true },
    weight: 650,
    sales: 240,
  },
  {
    name: "pH-Neutral Car Shampoo (1 L)",
    slug: "ph-neutral-car-shampoo-1l",
    sku: "CS-CC-SHAM",
    category: "car-care",
    brand: "Carsappo",
    price: 449,
    mrp: 649,
    stock: 190,
    gstRate: 18,
    hsn: "34029099",
    art: "droplets",
    short: "Rich-foam shampoo that lifts dirt without stripping wax or coatings.",
    features: ["pH-neutral, wax-safe", "Thick foam, 1:400 dilution", "Scratch-free lubrication"],
    specs: [["Volume", "1 litre"], ["Dilution", "1:400"]],
    tags: ["shampoo", "car wash", "foam"],
    fit: "universal",
    weight: 1100,
    sales: 330,
  },
  {
    name: "Carnauba Liquid Wax Polish (300 ml)",
    slug: "carnauba-liquid-wax-polish",
    sku: "CS-CC-WAX",
    category: "car-care",
    brand: "Carsappo Pro",
    price: 649,
    mrp: 899,
    stock: 95,
    gstRate: 18,
    hsn: "34053000",
    art: "sparkles",
    short: "Classic carnauba wax for a warm, deep showroom shine.",
    features: ["Brazilian carnauba", "Hides light swirl marks", "Easy on, easy off"],
    specs: [["Volume", "300 ml"]],
    tags: ["wax", "polish", "shine"],
    fit: "universal",
    weight: 400,
    sales: 120,
  },
  {
    name: "Anti-Fog Glass Cleaner (500 ml)",
    slug: "anti-fog-glass-cleaner-500ml",
    sku: "CS-CC-GLASS",
    category: "car-care",
    brand: "Carsappo",
    price: 249,
    mrp: 399,
    stock: 240,
    gstRate: 18,
    hsn: "34029099",
    art: "spray-can",
    short: "Streak-free glass cleaner with anti-fog protection for monsoon and winter drives.",
    features: ["Streak-free finish", "Anti-fog layer", "Ammonia-free — tint safe"],
    specs: [["Volume", "500 ml"]],
    tags: ["glass cleaner", "windshield", "anti fog"],
    fit: "universal",
    weight: 600,
    sales: 290,
  },

  // ── Interior accessories ────────────────────────
  {
    name: "Car Perfume — Ocean Breeze Gel",
    slug: "car-perfume-ocean-breeze",
    sku: "CS-INT-PERF-OB",
    category: "interior-accessories",
    brand: "Carsappo Essentials",
    price: 299,
    mrp: 399,
    stock: 400,
    gstRate: 18,
    hsn: "33074900",
    art: "wind",
    short: "Fresh aquatic fragrance that lasts up to 60 days.",
    features: ["Lasts up to 60 days", "Spill-proof gel", "Adjustable intensity"],
    specs: [["Net weight", "45 g"], ["Fragrance", "Ocean Breeze"]],
    tags: ["perfume", "air freshener", "fragrance"],
    fit: "universal",
    flags: { bestSeller: true },
    weight: 150,
    sales: 900,
  },
  {
    name: "Luxury Car Perfume — Oud Noir",
    slug: "luxury-car-perfume-oud-noir",
    sku: "CS-INT-PERF-OUD",
    category: "interior-accessories",
    brand: "Carsappo Luxe",
    price: 799,
    mrp: 1199,
    stock: 140,
    gstRate: 18,
    hsn: "33074900",
    art: "flame",
    short: "A premium oud and amber blend in a weighted metal diffuser.",
    features: ["Premium oud & amber notes", "Weighted anti-slip metal bottle", "Refillable"],
    specs: [["Volume", "100 ml"], ["Fragrance family", "Woody / Amber"]],
    tags: ["perfume", "air freshener", "luxury", "fragrance"],
    fit: "universal",
    flags: { premium: true, trending: true },
    weight: 350,
    sales: 260,
  },
  {
    name: "Dashboard Cover — Custom Fit (Anti-Glare)",
    slug: "dashboard-cover-custom-fit",
    sku: "CS-INT-DCOV",
    category: "interior-accessories",
    brand: "Carsappo",
    price: 1199,
    mrp: 1999,
    stock: 80,
    gstRate: 12,
    hsn: "63079090",
    art: "panel-top",
    short: "Velvet-finish dashboard cover that cuts windscreen glare and protects from sun damage.",
    features: ["Model-specific cut-outs", "Anti-glare velvet surface", "Non-slip silicone base"],
    specs: [["Material", "Velvet + silicone"], ["Colour", "Black"]],
    tags: ["dashboard cover", "dashboard", "dash mat"],
    fit: "popular",
    weight: 800,
    sales: 140,
  },
  {
    name: "Backseat Organizer with Tablet Holder",
    slug: "backseat-organizer-tablet-holder",
    sku: "CS-INT-ORG",
    category: "interior-accessories",
    brand: "Carsappo",
    price: 799,
    mrp: 1299,
    stock: 160,
    gstRate: 18,
    hsn: "42029900",
    art: "package",
    short: "Keep kids' tablets, bottles and snacks tidy on long drives.",
    features: ["Clear tablet window (up to 11\")", "9 storage pockets", "Kick-mat protection"],
    specs: [["Material", "Oxford fabric + PU"], ["Pack", "1 piece"]],
    tags: ["organizer", "organiser", "storage", "backseat"],
    fit: "universal",
    weight: 700,
    sales: 170,
  },
  {
    name: "Seat Gap Filler Organizer (Pair)",
    slug: "seat-gap-filler-organizer",
    sku: "CS-INT-GAP",
    category: "interior-accessories",
    brand: "Carsappo",
    price: 499,
    mrp: 799,
    stock: 210,
    gstRate: 18,
    hsn: "42029900",
    art: "box",
    short: "Stop phones and keys from falling into the seat gap.",
    features: ["Leatherette finish", "Cup and phone slots", "Universal fit"],
    specs: [["Pack", "2 pieces"]],
    tags: ["organizer", "gap filler", "storage"],
    fit: "universal",
    weight: 500,
    sales: 130,
  },
  {
    name: "Leather Steering Wheel Cover",
    slug: "leather-steering-wheel-cover",
    sku: "CS-INT-STEER",
    category: "interior-accessories",
    brand: "Carsappo",
    price: 599,
    mrp: 999,
    stock: 130,
    gstRate: 12,
    hsn: "42050090",
    art: "life-buoy",
    short: "Soft grip, sweat-resistant steering cover for a sporty feel.",
    features: ["Microfiber leather", "Anti-slip inner ring", "Fits 37–39 cm wheels"],
    specs: [["Diameter", "37–39 cm"], ["Colour", "Black / Black-Red"]],
    tags: ["steering cover", "steering"],
    fit: "universal",
    weight: 400,
    sales: 210,
  },

  // ── Exterior accessories ────────────────────────
  {
    name: "Waterproof Car Body Cover — Custom Fit",
    slug: "waterproof-car-body-cover",
    sku: "CS-EXT-COVER",
    category: "exterior-accessories",
    brand: "Carsappo",
    price: 1499,
    mrp: 2499,
    stock: 100,
    gstRate: 12,
    hsn: "63069090",
    art: "car",
    short: "Triple-layer body cover that shields against sun, rain and dust.",
    features: ["Triple-layer waterproof fabric", "Mirror pockets", "Elastic hem & tie-down straps", "Storage bag included"],
    specs: [["Material", "Polyester + PVC"], ["Colour", "Silver / Military green"]],
    tags: ["body cover", "car cover", "cover"],
    fit: "all-cars",
    flags: { bestSeller: true },
    weight: 2200,
    sales: 380,
  },
  {
    name: "Door Edge Guards (Set of 4)",
    slug: "door-edge-guards-set-of-4",
    sku: "CS-EXT-GUARD",
    category: "exterior-accessories",
    brand: "Carsappo Pro",
    price: 399,
    mrp: 599,
    stock: 220,
    gstRate: 18,
    hsn: "39269099",
    art: "shield",
    short: "Transparent guards that prevent door-ding chips in tight parking.",
    features: ["Crystal-clear, invisible look", "3M adhesive", "Easy DIY install"],
    specs: [["Pack", "4 pieces"]],
    tags: ["door guard", "edge guard", "protection"],
    fit: "universal",
    weight: 200,
    sales: 160,
  },
  {
    name: "Chrome Window Garnish",
    slug: "chrome-window-garnish",
    sku: "CS-EXT-CHROME",
    category: "exterior-accessories",
    brand: "Carsappo",
    price: 1799,
    mrp: 2799,
    stock: 45,
    gstRate: 18,
    hsn: "87082900",
    art: "scan-line",
    short: "Model-specific chrome lining that adds a premium silhouette.",
    features: ["Rust-proof chrome finish", "Pre-applied 3M tape", "Model-specific"],
    specs: [["Finish", "Mirror chrome"]],
    tags: ["chrome", "garnish", "window"],
    fit: "popular",
    weight: 900,
    sales: 55,
  },
  {
    name: "Mud Flaps — Custom Fit (Set of 4)",
    slug: "mud-flaps-custom-fit",
    sku: "CS-EXT-MUD",
    category: "exterior-accessories",
    brand: "Carsappo",
    price: 799,
    mrp: 1199,
    stock: 85,
    gstRate: 18,
    hsn: "87082900",
    art: "square-dashed-bottom",
    short: "Keep mud and stone chips off your doors and paint.",
    features: ["Flexible, crack-resistant", "Model-specific mounts", "Hardware included"],
    specs: [["Pack", "4 pieces"]],
    tags: ["mud flap", "mudguard"],
    fit: "popular",
    weight: 1200,
    sales: 75,
  },

  // ── Electronics ─────────────────────────────────
  {
    name: "Portable Car Vacuum Cleaner — 120W",
    slug: "portable-car-vacuum-cleaner-120w",
    sku: "CS-ELE-VAC",
    category: "electronics",
    brand: "Carsappo Tech",
    price: 1999,
    mrp: 3499,
    stock: 90,
    gstRate: 18,
    hsn: "85081900",
    art: "fan",
    short: "Powerful 12V vacuum with HEPA filter and crevice tools for spotless interiors.",
    features: ["120W high suction", "Washable HEPA filter", "4.5 m cord reaches the boot", "3 nozzles + carry bag"],
    specs: [["Power", "120 W"], ["Input", "12V car socket"], ["Filter", "Washable HEPA"], ["Warranty", "6 months"]],
    tags: ["vacuum", "vacuum cleaner", "cleaner", "hoover"],
    fit: "universal",
    flags: { bestSeller: true, featured: true },
    weight: 1600,
    sales: 470,
  },
  {
    name: "Cordless Wireless Car Vacuum",
    slug: "cordless-wireless-car-vacuum",
    sku: "CS-ELE-VAC-W",
    category: "electronics",
    brand: "Carsappo Tech",
    price: 3499,
    mrp: 5499,
    stock: 50,
    gstRate: 18,
    hsn: "85081100",
    art: "battery-charging",
    short: "Type-C rechargeable cordless vacuum with 8000 Pa suction and blower mode.",
    features: ["8000 Pa suction", "USB-C fast charging", "Vacuum + blower", "25 min runtime"],
    specs: [["Battery", "4000 mAh"], ["Suction", "8000 Pa"], ["Warranty", "1 year"]],
    tags: ["vacuum", "vacuum cleaner", "wireless", "cordless"],
    fit: "universal",
    flags: { premium: true, trending: true },
    weight: 1200,
    sales: 190,
  },
  {
    name: "45W Dual USB-C Fast Car Charger",
    slug: "45w-dual-usb-c-fast-car-charger",
    sku: "CS-ELE-CHG",
    category: "electronics",
    brand: "Carsappo Tech",
    price: 899,
    mrp: 1499,
    stock: 180,
    gstRate: 18,
    hsn: "85044090",
    art: "plug-zap",
    short: "Charge phone and laptop together with PD 3.0 fast charging.",
    features: ["45W total, PD 3.0 + QC 3.0", "Dual USB-C", "Aluminium body with LED ring"],
    specs: [["Output", "45 W"], ["Ports", "2 × USB-C"]],
    tags: ["charger", "usb", "fast charger"],
    fit: "universal",
    weight: 150,
    sales: 350,
  },
  {
    name: "Magnetic Phone Holder for Dashboard",
    slug: "magnetic-phone-holder-dashboard",
    sku: "CS-ELE-HOLD",
    category: "electronics",
    brand: "Carsappo",
    price: 599,
    mrp: 999,
    stock: 260,
    gstRate: 18,
    hsn: "39269099",
    art: "smartphone",
    short: "N52 magnets hold your phone securely on the roughest roads.",
    features: ["N52 strong magnets", "360° rotation", "One-hand operation"],
    specs: [["Mount", "Dashboard / windscreen"]],
    tags: ["phone holder", "mobile holder", "mount"],
    fit: "universal",
    flags: { trending: true },
    weight: 200,
    sales: 520,
  },
  {
    name: "Digital Tyre Inflator with Auto Cut-off",
    slug: "digital-tyre-inflator",
    sku: "CS-ELE-INFL",
    category: "electronics",
    brand: "Carsappo Tech",
    price: 2499,
    mrp: 3999,
    stock: 65,
    gstRate: 18,
    hsn: "84148090",
    art: "gauge",
    short: "Set your PSI and let it inflate — stops automatically when done.",
    features: ["Preset pressure with auto cut-off", "Digital display + LED torch", "Car & bike nozzles"],
    specs: [["Max pressure", "150 PSI"], ["Input", "12V"]],
    tags: ["tyre inflator", "air pump", "compressor"],
    fit: "universal",
    weight: 1300,
    sales: 145,
  },
  {
    name: "2K Dash Cam with Night Vision",
    slug: "2k-dash-cam-night-vision",
    sku: "CS-ELE-DASH",
    category: "electronics",
    brand: "Carsappo Tech",
    price: 4999,
    mrp: 7499,
    stock: 40,
    gstRate: 18,
    hsn: "85258900",
    art: "video",
    short: "Crisp 2K recording, G-sensor emergency lock and app connectivity.",
    features: ["2K QHD recording", "Night vision", "G-sensor emergency recording", "Wi-Fi app"],
    specs: [["Resolution", "2560 × 1440"], ["Storage", "microSD up to 256 GB"]],
    tags: ["dash cam", "dashcam", "camera"],
    fit: "universal",
    flags: { premium: true },
    weight: 400,
    sales: 88,
  },
  {
    name: "LED Headlight Bulbs H4 (Pair)",
    slug: "led-headlight-bulbs-h4",
    sku: "CS-ELE-LED",
    category: "electronics",
    brand: "Carsappo",
    price: 1899,
    mrp: 2999,
    stock: 75,
    gstRate: 18,
    hsn: "85392990",
    art: "lightbulb",
    short: "6500K bright white LEDs with a sharp, road-legal beam cut-off.",
    features: ["6500K white light", "Plug & play", "Built-in cooling fan"],
    specs: [["Fitment", "H4"], ["Colour temperature", "6500K"]],
    tags: ["led", "headlight", "bulb", "lights"],
    fit: "universal",
    weight: 500,
    sales: 110,
  },

  // ── Bike accessories ────────────────────────────
  {
    name: "Waterproof Bike Cover",
    slug: "waterproof-bike-cover",
    sku: "CS-BIKE-COVER",
    category: "bike-accessories",
    brand: "Carsappo",
    price: 549,
    mrp: 899,
    stock: 150,
    gstRate: 12,
    hsn: "63069090",
    art: "bike",
    short: "Dust, rain and UV protection for motorcycles and scooters.",
    features: ["Waterproof fabric", "Elastic hem", "Lock holes"],
    specs: [["Size", "Universal (up to 220 cm)"]],
    tags: ["bike cover", "cover", "motorcycle"],
    fit: "all-bikes",
    weight: 700,
    sales: 200,
  },
  {
    name: "Bike Phone Mount — Anti-Shake",
    slug: "bike-phone-mount-anti-shake",
    sku: "CS-BIKE-MOUNT",
    category: "bike-accessories",
    brand: "Carsappo",
    price: 699,
    mrp: 1099,
    stock: 140,
    gstRate: 18,
    hsn: "39269099",
    art: "smartphone",
    short: "Vibration-dampened mount that keeps your phone steady for navigation.",
    features: ["Anti-vibration dampener", "One-touch lock", "Fits 4.7\"–7\" phones"],
    specs: [["Mount", "Handlebar / mirror"]],
    tags: ["phone holder", "bike mount", "mount"],
    fit: "all-bikes",
    weight: 250,
    sales: 160,
  },
  {
    name: "Chain Lube Spray (150 ml)",
    slug: "chain-lube-spray-150ml",
    sku: "CS-BIKE-LUBE",
    category: "bike-accessories",
    brand: "Carsappo",
    price: 299,
    mrp: 449,
    stock: 170,
    gstRate: 18,
    hsn: "27101980",
    art: "spray-can",
    short: "Fling-free chain lubricant for a smoother, quieter ride.",
    features: ["Fling-free", "Water resistant", "O/X-ring safe"],
    specs: [["Volume", "150 ml"]],
    tags: ["chain lube", "lubricant", "bike"],
    fit: "all-bikes",
    weight: 250,
    sales: 90,
  },

  // ── Cleaning essentials ─────────────────────────
  {
    name: "Microfiber Cloth 800 GSM (Pack of 3)",
    slug: "microfiber-cloth-800gsm-pack-of-3",
    sku: "CS-CLN-MF3",
    category: "cleaning-essentials",
    brand: "Carsappo",
    price: 499,
    mrp: 799,
    stock: 500,
    gstRate: 12,
    hsn: "63071090",
    art: "square-stack",
    short: "Ultra-plush 800 GSM microfiber that's scratch-free on paint and glass.",
    features: ["800 GSM ultra-plush", "Edgeless, scratch-free", "Absorbs 7× its weight", "Machine washable"],
    specs: [["Size", "40 × 40 cm"], ["GSM", "800"], ["Pack", "3"]],
    tags: ["microfiber", "microfibre", "cloth", "towel"],
    fit: "universal",
    flags: { bestSeller: true, featured: true },
    weight: 400,
    sales: 1100,
  },
  {
    name: "Chenille Microfiber Wash Mitt",
    slug: "chenille-microfiber-wash-mitt",
    sku: "CS-CLN-MITT",
    category: "cleaning-essentials",
    brand: "Carsappo",
    price: 349,
    mrp: 499,
    stock: 220,
    gstRate: 12,
    hsn: "63071090",
    art: "hand",
    short: "Deep chenille fingers trap grit away from your paint.",
    features: ["Chenille microfiber", "Elastic cuff", "Lint-free"],
    specs: [["Size", "Standard"]],
    tags: ["microfiber", "mitt", "wash"],
    fit: "universal",
    weight: 200,
    sales: 240,
  },
  {
    name: "Detailing Brush Set (5 pcs)",
    slug: "detailing-brush-set-5pcs",
    sku: "CS-CLN-BRUSH",
    category: "cleaning-essentials",
    brand: "Carsappo Pro",
    price: 599,
    mrp: 899,
    stock: 120,
    gstRate: 18,
    hsn: "96039000",
    art: "brush-cleaning",
    short: "Soft boar-hair brushes for vents, badges, seams and wheels.",
    features: ["Boar-hair bristles", "Metal-free ferrules", "5 sizes"],
    specs: [["Pieces", "5"]],
    tags: ["brush", "detailing", "cleaning"],
    fit: "universal",
    weight: 300,
    sales: 130,
  },
  {
    name: "Waterless Wash & Shine Spray (500 ml)",
    slug: "waterless-wash-shine-spray",
    sku: "CS-CLN-WL",
    category: "cleaning-essentials",
    brand: "Carsappo",
    price: 399,
    mrp: 599,
    stock: 260,
    gstRate: 18,
    hsn: "34029099",
    art: "droplet",
    short: "Clean and shine your car anywhere — no bucket, no hose. The same formula our daily cleaners use.",
    features: ["Saves up to 150 L water per wash", "Encapsulates dirt to prevent scratches", "Leaves a slick, glossy finish"],
    specs: [["Volume", "500 ml"], ["Coverage", "3–4 washes"]],
    tags: ["waterless", "wash", "spray", "cleaner"],
    fit: "universal",
    flags: { trending: true },
    weight: 600,
    sales: 310,
  },
];

export type SeedMake = { name: string; models: { name: string; from: number; to?: number; fuels: string[]; type?: "BIKE" }[] };

export const vehicles: SeedMake[] = [
  {
    name: "Maruti Suzuki",
    models: [
      { name: "Swift", from: 2011, fuels: ["PETROL", "CNG"] },
      { name: "Baleno", from: 2015, fuels: ["PETROL", "CNG"] },
      { name: "Brezza", from: 2016, fuels: ["PETROL", "DIESEL", "CNG"] },
      { name: "Dzire", from: 2012, fuels: ["PETROL", "DIESEL", "CNG"] },
      { name: "Ertiga", from: 2012, fuels: ["PETROL", "DIESEL", "CNG"] },
      { name: "WagonR", from: 2010, fuels: ["PETROL", "CNG"] },
      { name: "Grand Vitara", from: 2022, fuels: ["PETROL", "HYBRID", "CNG"] },
      { name: "Fronx", from: 2023, fuels: ["PETROL", "CNG"] },
    ],
  },
  {
    name: "Hyundai",
    models: [
      { name: "Creta", from: 2015, fuels: ["PETROL", "DIESEL", "EV"] },
      { name: "Venue", from: 2019, fuels: ["PETROL", "DIESEL"] },
      { name: "i20", from: 2014, fuels: ["PETROL", "DIESEL"] },
      { name: "Verna", from: 2011, fuels: ["PETROL", "DIESEL"] },
      { name: "Exter", from: 2023, fuels: ["PETROL", "CNG"] },
      { name: "Alcazar", from: 2021, fuels: ["PETROL", "DIESEL"] },
      { name: "Grand i10 Nios", from: 2019, fuels: ["PETROL", "CNG"] },
    ],
  },
  {
    name: "Tata",
    models: [
      { name: "Nexon", from: 2017, fuels: ["PETROL", "DIESEL", "EV", "CNG"] },
      { name: "Punch", from: 2021, fuels: ["PETROL", "CNG", "EV"] },
      { name: "Harrier", from: 2019, fuels: ["DIESEL", "EV"] },
      { name: "Safari", from: 2021, fuels: ["DIESEL"] },
      { name: "Altroz", from: 2020, fuels: ["PETROL", "DIESEL", "CNG"] },
      { name: "Tiago", from: 2016, fuels: ["PETROL", "CNG", "EV"] },
      { name: "Curvv", from: 2024, fuels: ["PETROL", "DIESEL", "EV"] },
    ],
  },
  {
    name: "Mahindra",
    models: [
      { name: "XUV700", from: 2021, fuels: ["PETROL", "DIESEL"] },
      { name: "Scorpio-N", from: 2022, fuels: ["PETROL", "DIESEL"] },
      { name: "Thar", from: 2020, fuels: ["PETROL", "DIESEL"] },
      { name: "XUV 3XO", from: 2024, fuels: ["PETROL", "DIESEL"] },
      { name: "Bolero Neo", from: 2021, fuels: ["DIESEL"] },
      { name: "BE 6", from: 2025, fuels: ["EV"] },
    ],
  },
  {
    name: "Kia",
    models: [
      { name: "Seltos", from: 2019, fuels: ["PETROL", "DIESEL"] },
      { name: "Sonet", from: 2020, fuels: ["PETROL", "DIESEL"] },
      { name: "Carens", from: 2022, fuels: ["PETROL", "DIESEL"] },
      { name: "Syros", from: 2025, fuels: ["PETROL", "DIESEL"] },
    ],
  },
  {
    name: "Toyota",
    models: [
      { name: "Innova Crysta", from: 2016, fuels: ["DIESEL", "PETROL"] },
      { name: "Innova Hycross", from: 2022, fuels: ["PETROL", "HYBRID"] },
      { name: "Fortuner", from: 2016, fuels: ["PETROL", "DIESEL"] },
      { name: "Urban Cruiser Hyryder", from: 2022, fuels: ["PETROL", "HYBRID", "CNG"] },
      { name: "Glanza", from: 2019, fuels: ["PETROL", "CNG"] },
    ],
  },
  {
    name: "Honda",
    models: [
      { name: "City", from: 2014, fuels: ["PETROL", "DIESEL", "HYBRID"] },
      { name: "Amaze", from: 2018, fuels: ["PETROL", "DIESEL"] },
      { name: "Elevate", from: 2023, fuels: ["PETROL"] },
    ],
  },
  {
    name: "MG",
    models: [
      { name: "Hector", from: 2019, fuels: ["PETROL", "DIESEL", "HYBRID"] },
      { name: "Astor", from: 2021, fuels: ["PETROL"] },
      { name: "ZS EV", from: 2020, fuels: ["EV"] },
      { name: "Windsor EV", from: 2024, fuels: ["EV"] },
    ],
  },
  {
    name: "Skoda",
    models: [
      { name: "Kushaq", from: 2021, fuels: ["PETROL"] },
      { name: "Slavia", from: 2022, fuels: ["PETROL"] },
      { name: "Kylaq", from: 2025, fuels: ["PETROL"] },
    ],
  },
  {
    name: "Volkswagen",
    models: [
      { name: "Taigun", from: 2021, fuels: ["PETROL"] },
      { name: "Virtus", from: 2022, fuels: ["PETROL"] },
    ],
  },
  {
    name: "Royal Enfield",
    models: [
      { name: "Classic 350", from: 2009, fuels: ["PETROL"], type: "BIKE" },
      { name: "Hunter 350", from: 2022, fuels: ["PETROL"], type: "BIKE" },
      { name: "Bullet 350", from: 2010, fuels: ["PETROL"], type: "BIKE" },
    ],
  },
  {
    name: "Honda Two Wheelers",
    models: [
      { name: "Activa", from: 2010, fuels: ["PETROL"], type: "BIKE" },
      { name: "Shine", from: 2010, fuels: ["PETROL"], type: "BIKE" },
    ],
  },
  {
    name: "Bajaj",
    models: [
      { name: "Pulsar", from: 2010, fuels: ["PETROL"], type: "BIKE" },
      { name: "Chetak", from: 2020, fuels: ["EV"], type: "BIKE" },
    ],
  },
];

// Models considered "popular" for model-specific accessories with narrower fitment.
export const popularModels = ["Swift", "Baleno", "Brezza", "Creta", "Venue", "Nexon", "Punch", "XUV700", "Scorpio-N", "Thar", "Seltos", "Sonet", "City", "Innova Crysta", "Fortuner"];

export const servicePlans = [
  {
    name: "Daily Shine — Hatchback",
    slug: "daily-shine-hatchback",
    serviceType: "DAILY_EXTERIOR" as const,
    vehicleSize: "Hatchback",
    price: 699,
    period: "MONTHLY" as const,
    description: "Daily waterless exterior cleaning for hatchbacks, done at your parking spot every morning.",
    features: ["Exterior cleaning 6 days a week", "Weekly tyre polish", "Monthly interior vacuum", "Premium waterless formula — no scratches"],
    isPopular: false,
  },
  {
    name: "Daily Shine — Sedan",
    slug: "daily-shine-sedan",
    serviceType: "DAILY_EXTERIOR" as const,
    vehicleSize: "Sedan / Compact SUV",
    price: 799,
    period: "MONTHLY" as const,
    description: "Daily exterior cleaning for sedans and compact SUVs, finished before you leave for work.",
    features: ["Exterior cleaning 6 days a week", "Weekly tyre polish", "Monthly interior vacuum", "Weekly dashboard wipe"],
    isPopular: true,
  },
  {
    name: "Daily Shine — SUV / MUV",
    slug: "daily-shine-suv",
    serviceType: "DAILY_EXTERIOR" as const,
    vehicleSize: "SUV / MUV",
    price: 999,
    period: "MONTHLY" as const,
    description: "Full-size SUVs and 7-seaters, cleaned every day with a dedicated cleaner.",
    features: ["Exterior cleaning 6 days a week", "Weekly tyre polish", "Fortnightly interior vacuum", "Weekly dashboard polish"],
    isPopular: false,
  },
  {
    name: "Interior Deep Clean",
    slug: "interior-deep-clean",
    serviceType: "INTERIOR" as const,
    vehicleSize: "All cars",
    price: 1299,
    period: "ONE_TIME" as const,
    description: "Complete cabin clean — vacuum, mats, seats, dashboard, door pads and glass.",
    features: ["Full vacuum incl. boot", "Mat & seat cleaning", "Dashboard & door pad detailing", "Interior glass cleaning"],
    isPopular: false,
  },
  {
    name: "Tyre Polish",
    slug: "tyre-polish-service",
    serviceType: "TYRE_POLISH" as const,
    vehicleSize: "All cars",
    price: 199,
    period: "ONE_TIME" as const,
    description: "Deep-black tyre dressing on all four tyres with UV protection.",
    features: ["All 4 tyres", "Non-sling, water-based dressing", "UV protection"],
    isPopular: false,
  },
  {
    name: "Dashboard Polish",
    slug: "dashboard-polish-service",
    serviceType: "DASHBOARD_POLISH" as const,
    vehicleSize: "All cars",
    price: 249,
    period: "ONE_TIME" as const,
    description: "Anti-static dashboard and console polish with a clean OEM finish.",
    features: ["Dashboard & centre console", "Anti-static, dust repellent", "Matte or gloss finish"],
    isPopular: false,
  },
];

export const faqs = {
  SERVICES: [
    ["Which areas do you serve?", "Daily car cleaning is currently available only in Greater Noida, including Greater Noida West. Enter your pincode on the booking form to check."],
    ["What time do you clean the car?", "Our cleaners visit early morning (6–10 AM) so your car is spotless before you leave. You can pick a preferred slot while booking."],
    ["Do I need to be present?", "No. Park at your usual spot — our cleaner works at your parking. For interior services we'll coordinate key handover with you."],
    ["Will waterless cleaning scratch my paint?", "No. We use a premium lubricating waterless formula and fresh 800 GSM microfiber cloths for every car."],
    ["How do I pay?", "Monthly plans are billed at the start of each month via UPI or card. One-time services are paid after completion."],
    ["Can I pause or cancel?", "Yes — pause for travel or cancel anytime with 3 days' notice before your next billing date."],
  ],
  SHIPPING: [
    ["Do you deliver across India?", "Yes, we ship across India through our courier partners. Enter your pincode on any product page to check delivery time."],
    ["How long does delivery take?", "Delhi NCR: 1–3 days. Metro cities: 3–5 days. Rest of India: 4–7 days after dispatch."],
    ["Is Cash on Delivery available?", "Yes, COD is available on most pincodes for a small handling fee."],
  ],
  GENERAL: [
    ["Are your products genuine?", "Every product is sourced directly from brands or authorised distributors and quality-checked before dispatch."],
    ["How do I know an accessory fits my car?", "Use Shop by Vehicle to select your brand, model, year and fuel type — we'll only show compatible products."],
    ["What is your return policy?", "Easy 7-day returns for damaged, defective or wrong items. See our Return & Refund Policy for details."],
  ],
} as const;

export const blogCategories = [
  { name: "Car Care Tips", slug: "car-care-tips", description: "Simple habits that keep your car looking new." },
  { name: "Buying Guides", slug: "buying-guides", description: "Choose the right accessories for your car and budget." },
  { name: "Product Comparisons", slug: "product-comparisons", description: "Side-by-side comparisons to help you decide." },
  { name: "Maintenance Tips", slug: "maintenance-tips", description: "Keep your car healthy between services." },
];

export const posts = [
  {
    title: "7D vs 5D Car Mats: Which One Should You Buy?",
    slug: "7d-vs-5d-car-mats",
    category: "product-comparisons",
    excerpt: "Both look premium, but they differ in coverage, cleaning and price. Here's how to choose the right car mats for your car.",
    art: "layers",
    tags: ["mats", "comparison"],
    minutes: 5,
    content: `Car mats are the first accessory most owners buy — and the one they use every single day. In India, **7D** and **5D** mats are the two most popular premium options. Here's how they compare.

## What do "5D" and "7D" mean?

The numbers roughly describe the **layers and the shape** of the mat. A 5D mat is moulded with raised edges; a 7D mat adds extra cushioning layers and extends further up the sides of the footwell for edge-to-edge coverage.

| | 5D Mats | 7D Mats |
|---|---|---|
| Coverage | Floor + low edges | Floor + full side walls |
| Layers | 5 | 7 |
| Comfort | Firm | Soft, cushioned |
| Cleaning | Wipe clean | Wipe clean |
| Price | ₹2,000 – ₹3,500 | ₹3,000 – ₹6,000 |

## Choose 7D mats if…

- You want **maximum protection** for your original carpet (great for resale value).
- You often drive in the monsoon or on dusty roads.
- You want a luxurious, finished cabin look.

## Choose 5D mats if…

- You want a premium upgrade on a tighter budget.
- You prefer a slightly lighter, firmer mat.

## Our verdict

For most new cars, **7D custom-fit mats** are worth the extra spend — they protect more, last longer and look factory-fitted. Use [Shop by Vehicle](/#shop-by-vehicle) to see the exact set for your car.`,
  },
  {
    title: "10 Car Care Habits That Keep Your Car Looking New",
    slug: "10-car-care-habits",
    category: "car-care-tips",
    excerpt: "You don't need a detailing studio to keep your car showroom-fresh. These 10 simple habits make the biggest difference.",
    art: "sparkles",
    tags: ["car care", "tips"],
    minutes: 6,
    content: `A clean car isn't about one big wash — it's about small habits done consistently.

## 1. Wipe, don't wash, every day
A quick waterless wipe with a quality **microfiber cloth** removes dust before it bonds to the paint. (Or let our [daily car cleaning](/services) team do it for you in Greater Noida.)

## 2. Never dry-wipe a dusty car
Dry dust acts like sandpaper. Always use a lubricating spray or water first.

## 3. Use two buckets for washing
One for soapy water, one for rinsing your mitt. It keeps grit away from the paint.

## 4. Use a pH-neutral shampoo
Dish soap strips wax and dries out rubber seals.

## 5. Dress your tyres every two weeks
A water-based **tyre polish** keeps rubber from cracking and makes the whole car look sharper.

## 6. Protect the dashboard from UV
Indian summers are brutal on plastics. An anti-static **dashboard polish** with UV protection prevents fading and cracks.

## 7. Vacuum weekly
Sand and crumbs wear down carpets and seat fabric. A 12V **car vacuum** makes this a 5-minute job.

## 8. Keep mats clean
Custom-fit mats trap the dirt so your carpet doesn't have to — wipe them weekly.

## 9. Park in the shade (or use a cover)
A breathable, waterproof **body cover** protects against sun, bird droppings and dust.

## 10. Add protection twice a year
A spray **ceramic coating** or wax makes cleaning easier and adds gloss.`,
  },
  {
    title: "How to Choose the Right Car Vacuum Cleaner",
    slug: "how-to-choose-car-vacuum-cleaner",
    category: "buying-guides",
    excerpt: "Corded or cordless? How much suction do you need? A practical buying guide for Indian car owners.",
    art: "fan",
    tags: ["vacuum", "buying guide"],
    minutes: 5,
    content: `A good car vacuum turns interior cleaning from a chore into a five-minute routine. Here's what to look for.

## Corded (12V) vs cordless

**Corded 12V vacuums** plug into your car's socket, so they never run out of power. They're ideal for thorough weekly cleaning.

**Cordless vacuums** are more convenient for quick touch-ups and can be used for the home too, but runtime is limited to 15–30 minutes.

## Suction power

- **100–120W** (corded) is plenty for dust, crumbs and sand.
- For cordless models, look for **6000 Pa or higher**.

## Filter

Choose a **washable HEPA filter** — it traps fine dust and saves you from buying replacements.

## Attachments

A crevice nozzle for seat gaps and a brush head for vents make a real difference.

## Our picks

- [Portable Car Vacuum Cleaner — 120W](/product/portable-car-vacuum-cleaner-120w): best value, never runs out of charge.
- [Cordless Wireless Car Vacuum](/product/cordless-wireless-car-vacuum): best for convenience, doubles as a blower.`,
  },
  {
    title: "Monsoon Car Maintenance Checklist",
    slug: "monsoon-car-maintenance-checklist",
    category: "maintenance-tips",
    excerpt: "Rain, waterlogging and humidity can hurt your car. Use this checklist to stay safe and dry this monsoon.",
    art: "cloud-rain",
    tags: ["monsoon", "maintenance"],
    minutes: 4,
    content: `The monsoon is the toughest season for cars in India. Run through this checklist before the rains arrive.

## Visibility
- Replace worn **wiper blades** — streaks mean it's time.
- Apply an **anti-fog glass cleaner** inside the windscreen.
- Check that all lights and indicators work.

## Grip and braking
- Check **tyre tread depth** (minimum 1.6 mm, ideally 3 mm+).
- Maintain the recommended tyre pressure — a **digital inflator** makes this easy.
- Have your brakes inspected if they feel spongy.

## Protect the cabin
- Switch to **waterproof rubber or 7D mats** that trap water.
- Keep a microfiber cloth handy to wipe condensation.
- Use a car perfume to beat damp smells.

## Protect the body
- Apply a coat of **wax or ceramic spray** — water beads off and mud washes away easily.
- Fit **mud flaps** to protect the doors and paint from stone chips.

## Avoid waterlogged roads
If water reaches the middle of the wheel, don't drive through it. Water can enter the engine intake and cause serious damage.`,
  },
  {
    title: "Leatherette vs Fabric Seat Covers: A Complete Guide",
    slug: "leatherette-vs-fabric-seat-covers",
    category: "buying-guides",
    excerpt: "Seat covers change how your cabin looks and feels. Compare leatherette, Nappa and mesh to find your perfect match.",
    art: "armchair",
    tags: ["seat covers", "buying guide"],
    minutes: 5,
    content: `Seat covers protect your original upholstery and completely transform your cabin. Here's how the popular materials compare.

## Leatherette (PU)
**Best for:** most car owners.
Looks like leather, is easy to wipe clean and resists spills. A custom-fit leatherette cover looks factory-fitted.

## Nappa-grain leather
**Best for:** a luxury upgrade.
Softer, more premium touch with quilted designs. Costs more but feels like a top-end variant.

## Mesh / fabric
**Best for:** hot climates and long drives.
Breathable and cool, but stains more easily than leatherette.

## Always choose custom fit
Universal covers sag and slide. **Custom-fit covers** are stitched to your seat's exact profile and include airbag-safe seams.

Find covers for your car with [Shop by Vehicle](/#shop-by-vehicle).`,
  },
  {
    title: "Is Daily Car Cleaning Worth It? What You Get for ₹699/month",
    slug: "is-daily-car-cleaning-worth-it",
    category: "car-care-tips",
    excerpt: "Daily doorstep car cleaning is booming in Greater Noida. We break down what's included and whether it's worth it.",
    art: "calendar-check",
    tags: ["services", "greater noida"],
    minutes: 4,
    content: `If you park in an open society parking in Greater Noida, you know the drill — by morning your car is covered in dust. **Daily car cleaning** solves that.

## What's included
With a Carsappo Daily Shine plan, a trained cleaner:
- Cleans your car's exterior **6 days a week** using a premium waterless formula.
- Polishes your **tyres weekly**.
- **Vacuums the interior** every month (fortnightly for SUVs).

## Why waterless?
Waterless cleaning saves up to 150 litres per wash and — done right, with lubricating spray and fresh microfiber — is completely scratch-free.

## The maths
A single wash at a car wash costs ₹300–₹500. A monthly plan starting at **₹699** gives you a clean car every day.

## Is it available in my area?
Daily car cleaning is currently available **only in Greater Noida**. [Book a service](/services/book) to check your pincode.`,
  },
];

export const testimonials = [
  { type: "IMAGE" as const, name: "Rohit S.", location: "Noida", rating: 5, content: "The 7D mats fit my Creta perfectly — looks like they came from the factory. Delivery was super quick.", art: "layers" },
  { type: "IMAGE" as const, name: "Priya M.", location: "Bengaluru", rating: 5, content: "Seat covers are premium quality and the stitching is flawless. My Nexon's cabin feels brand new.", art: "armchair" },
  { type: "IMAGE" as const, name: "Aman K.", location: "Greater Noida West", rating: 5, content: "Daily cleaning service is a game changer. My car is spotless every morning before office.", art: "sparkles" },
  { type: "GOOGLE" as const, name: "Vikas Sharma", location: "Google review", rating: 5, content: "Genuine products at great prices. The vacuum cleaner is powerful and the team helped me choose the right one on WhatsApp." },
  { type: "GOOGLE" as const, name: "Neha Gupta", location: "Google review", rating: 5, content: "Ordered tyre polish and dashboard polish — excellent results and packed very well. Will order again." },
  { type: "GOOGLE" as const, name: "Karan Mehta", location: "Google review", rating: 4, content: "Good experience overall. Custom body cover fits my XUV700 well. Delivery took 4 days to Pune." },
];

export const sampleReviews: [string, number, string, string][] = [
  ["Ankit", 5, "Excellent quality", "Exactly as shown. Fit and finish are top-notch, totally worth the price."],
  ["Sneha", 5, "Loved it", "Premium feel and quick delivery. Packaging was great too."],
  ["Rahul", 4, "Very good", "Good product for the price. Would have liked more colour options."],
  ["Deepak", 5, "Highly recommend", "Second time buying from Carsappo. Consistent quality."],
  ["Meera", 4, "Nice", "Works well. Customer support on WhatsApp was helpful."],
];
