import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

if (apiKey && !apiKey.includes('AQ.')) { // Note: AQ. is the format in user env, but let's check validity
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('Gemini API initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini API:', err);
  }
} else {
  console.warn('WARNING: GEMINI_API_KEY is not configured or placeholder. Aetheris AI Service is running in Mock Mode.');
}

// 1. AI Itinerary Generator (AI Content Generator)
export async function generateItinerary(details: {
  destination: string;
  duration: number;
  budget: string;
  style: string;
  pace: string;
}): Promise<string> {
  const { destination, duration, budget, style, pace } = details;
  
  if (!genAI) {
    return getMockItinerary(destination, duration, budget, style, pace);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are an expert agentic travel planner. Generate a highly detailed, professional, and exciting day-by-day travel itinerary for a trip to "${destination}".
      
      Trip Details:
      - Duration: ${duration} Days
      - Budget level: ${budget}
      - Travel Style: ${style} (e.g. Adventure, Relaxing, Foodie, Culture)
      - Travel Pace: ${pace} (e.g. Slow, Moderate, Fast-paced)

      Requirements:
      - Provide a creative title for the trip.
      - Write a short summary introduction that sells the experience.
      - Provide a day-by-day breakdown. For each day, include:
        - Morning, Afternoon, and Evening activities.
        - Suggested meal options (local cuisine).
        - Estimated budget range for that day.
      - Add a section for "Travel Tips" specific to ${destination} (culture, transport, safety).
      - Add a section for "Packing Essentials" for a ${style} trip.
      - Output the itinerary in rich, clean Markdown format with professional headers, bullets, and bold text. Do not return raw JSON.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini itinerary generation error, falling back to mock:', error);
    return getMockItinerary(destination, duration, budget, style, pace);
  }
}

// 2. AI Conversational Assistant (AI Chat Assistant)
export async function getChatResponse(
  history: { role: 'user' | 'model'; parts: string }[],
  newMessage: string
): Promise<{ text: string; navigation?: string }> {
  
  if (!genAI) {
    return getMockChatResponse(newMessage);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
      },
    });

    // We inject system instructions into the chat history or prompt to guide the assistant's behavior
    const systemPrompt = `
      You are "Aetheris AI", a professional full-stack conversational travel agent.
      You understand the Aetheris platform, travel recommendations, budgeting, and itinerary planning.
      
      Capabilities & Navigation Commands:
      - You can suggest that the user navigate to specific pages on Aetheris.
      - If you want the client to navigate to a page, end your message with exactly: [NAVIGATE: /route]
      - Valid routes:
        - Explore Trips page: "/explore"
        - Add a Trip page: "/items/add"
        - Manage Trips page: "/items/manage"
        - AI Planner & Hub: "/ai-hub"
        - Main landing page: "/"
      - Avoid using [NAVIGATE: ...] unless it's a logical response to a user wanting to create, view, or manage trips.

      Guidelines:
      - Keep responses concise, warm, helpful, and highly travel-oriented.
      - Do not use markdown headers larger than ###.
      - Support follow-up reasoning based on previous comments.
    `;

    const formattedHistory = [
      { role: 'user' as const, parts: [{ text: systemPrompt }] },
      { role: 'model' as const, parts: [{ text: "Understood. I am Aetheris AI, ready to assist the user and navigate the application." }] },
      ...history.map(h => ({
        role: h.role,
        parts: [{ text: h.parts }]
      }))
    ];

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(newMessage);
    const text = result.response.text();

    // Check for navigation pattern in the response
    let navigation: string | undefined;
    const navMatch = text.match(/\[NAVIGATE:\s*([^[\]]+)\]/);
    if (navMatch && navMatch[1]) {
      navigation = navMatch[1].trim();
    }

    return { text, navigation };
  } catch (error) {
    console.error('Gemini chat error, falling back to mock:', error);
    return getMockChatResponse(newMessage);
  }
}

// 3. AI Expense Analyzer (AI Data Analyzer)
export async function analyzeExpenses(expensesRaw: string): Promise<{
  summary: string;
  categories: { name: string; value: number; color: string }[];
  recommendations: string[];
  totalSpent: number;
}> {
  if (!genAI) {
    return getMockExpenseAnalysis(expensesRaw);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are a professional Travel Budget Analyst. Analyze the following raw expense dataset (could be CSV, JSON, or text) representing travel expenditures:
      
      "${expensesRaw}"

      Requirements:
      1. Calculate the total expenditures (Total Spent).
      2. Categorize the expenses into exactly these five standard categories: "Food", "Lodging", "Transit", "Activities", "Shopping". Ensure all costs sum to the Total Spent.
      3. Write a concise, bulleted budget analysis summary evaluating the spending patterns (e.g. excessive food spending, good transit efficiency, lodging savings).
      4. Provide exactly 3 actionable recommendations on how the user could optimize this budget or travel cheaper in the future.
      5. Output MUST be in raw JSON format matching this EXACT typescript interface:
      {
        "summary": "Multi-line string analyzing the expenditure patterns in detail.",
        "categories": [
          { "name": "Food", "value": 150.50, "color": "#FF8042" },
          { "name": "Lodging", "value": 450.00, "color": "#0088FE" },
          { "name": "Transit", "value": 120.00, "color": "#00C49F" },
          { "name": "Activities", "value": 85.00, "color": "#FFBB28" },
          { "name": "Shopping", "value": 50.00, "color": "#8884d8" }
        ],
        "recommendations": [
          "Recommendation 1",
          "Recommendation 2",
          "Recommendation 3"
        ],
        "totalSpent": 855.50
      }

      Return ONLY the JSON object. Do not wrap in markdown \`\`\`json blocks.
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Clean up possible markdown code blocks if the model ignored instructions
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    }

    const parsed = JSON.parse(text);
    return parsed;
  } catch (error) {
    console.error('Gemini expense analyzer error, falling back to mock:', error);
    return getMockExpenseAnalysis(expensesRaw);
  }
}

// 4. AI Document Booking Intelligence (AI Document Intelligence)
export async function parseVoucher(voucherText: string): Promise<{
  bookingType: string;
  confirmationCode: string;
  location: string;
  startDate: string;
  endDate: string;
  keyDetails: { label: string; value: string }[];
  preTravelChecklist: string[];
}> {
  if (!genAI) {
    return getMockVoucherParsing(voucherText);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are a Document Intelligence Agent specializing in travel booking confirmation analysis.
      Analyze this copy-pasted document, ticket, or booking confirmation voucher text:
      
      "${voucherText}"

      Requirements:
      1. Identify the booking type (e.g. Flight, Hotel, Train, Car Rental, Tour Package).
      2. Extract the Confirmation Code / Reference Number.
      3. Extract the Location or destination.
      4. Extract the Start/Check-In Date and End/Check-Out Date (if mentioned, format as YYYY-MM-DD or standard readable text).
      5. Extract up to 4 key details as key-value pairs (e.g. Flight Number: EK201, Room Type: Deluxe Double, Passenger Name: John Doe, Bed Preference, etc.).
      6. Generate a checklist of exactly 5 preparation steps the traveler should complete before this specific booking (e.g. Web check-in opens 24h prior, print boarding pass, check passport validity, review check-in times).
      7. Return response in raw JSON format matching this EXACT typescript interface:
      {
        "bookingType": "Flight",
        "confirmationCode": "EK-8947A",
        "location": "Dubai International Airport (DXB)",
        "startDate": "2026-09-12",
        "endDate": "2026-09-12",
        "keyDetails": [
          { "label": "Airline / Flight", "value": "Emirates EK-501" },
          { "label": "Passenger", "value": "Kabya Rahman" }
        ],
        "preTravelChecklist": [
          "Complete online check-in 48 hours prior to departure.",
          "Ensure baggage weight is within 30kg limit.",
          "Keep digital and printed copy of this confirmation."
        ]
      }

      Return ONLY the JSON. Do not wrap in markdown \`\`\`json blocks.
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    }
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini voucher parser error, falling back to mock:', error);
    return getMockVoucherParsing(voucherText);
  }
}

// 5. AI Auto Tagging (AI Auto Classification & Tagging)
export async function autoTagTrip(title: string, description: string): Promise<string[]> {
  if (!genAI) {
    return getMockTags(title, description);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are an automated tagging classifier for travel products. 
      Analyze the trip titled "${title}" and described as "${description}".
      
      Generate between 3 and 5 descriptive keyword tags.
      Examples: "Adventure", "Eco Tour", "Solo-Friendly", "Luxury", "Budget", "Family-Friendly", "Beach", "Culinary", "Historical", "Wellness".
      
      Return ONLY a JSON array of strings, e.g. ["Adventure", "Solo-Friendly", "Hiking"].
      Do not include other text. Do not wrap in markdown blocks.
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    }
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini auto-tagging error, falling back to mock:', error);
    return getMockTags(title, description);
  }
}


/* --- MOCK FALLBACKS --- */

function getMockItinerary(dest: string, days: number, budget: string, style: string, pace: string): string {
  return `# Custom ${days}-Day Itinerary: Discovering ${dest} (${style} Style)
  
*Designed by Aetheris AI Agent | Budget: ${budget} | Pace: ${pace}*

Welcome to your personalized itinerary for **${dest}**. Based on your selection, we've designed an incredible trip focused on **${style}** with a **${pace}** pace to match your travel rhythm.

---

${Array.from({ length: days }, (_, i) => {
  const d = i + 1;
  return `### Day ${d}: Exploring Local Highlights & Experiences
- **Morning (09:00 AM)**: Grab breakfast at a local cafe and head to the historic heart of ${dest}. Capture beautiful scenic photos and visit the main cultural center.
- **Afternoon (01:00 PM)**: Enjoy a specialty lunch featuring authentic local delicacies. Follow up with a guided walking tour focused on ${style} landmarks.
- **Evening (06:00 PM)**: Wind down with a relaxing stroll along the central avenue or harbor. Indulge in dinner at a highly-rated rooftop restaurant overlooking the skyline.
- **Meal Suggestions**: Traditional breakfast items, local street food lunch, and premium fresh-catch dinner.
- **Estimated Cost**: $40 - $75 per person.

`;
}).join('\n')}

---

### Aetheris AI Expert Travel Tips for ${dest}
1. **Best Transit Options**: Utilize the local metro network or ride-shares, which are reliable and cost-effective.
2. **Cultural Etiquette**: A friendly greeting in the local tongue goes a long way. Respect historic temple and museum entry policies.
3. **Safety Checklist**: Keep digital backups of your passport and visa. Avoid unlit narrow alleys late at night.

### Packing Essentials
* comfortable walking shoes (highly recommended for ${style} itineraries)
* Universal socket adapter and dual-voltage power bank
* Lightweight water-resistant shell jacket
* Local currency in small denominations
`;
}

function getMockChatResponse(msg: string): { text: string; navigation?: string } {
  const query = msg.toLowerCase();
  
  if (query.includes('explore') || query.includes('find trip') || query.includes('show trips')) {
    return {
      text: "I'd love to help you find your next destination! I am routing you to our **Explore Trips** page where you can filter by budget, category, and locations. [NAVIGATE: /explore]",
      navigation: "/explore"
    };
  }
  if (query.includes('create') || query.includes('add trip') || query.includes('post trip') || query.includes('new trip')) {
    return {
      text: "Excellent! Let's build a new custom trip together. I am loading the **Add Trip** portal where you can input the details, dates, and price. AI Auto-tagging will classify it for you on the fly. [NAVIGATE: /items/add]",
      navigation: "/items/add"
    };
  }
  if (query.includes('manage') || query.includes('my trips') || query.includes('delete trip') || query.includes('list trip')) {
    return {
      text: "Sure thing! I can help you check, review, or delete your custom itineraries. I am navigating you to the **Manage Trips** panel. [NAVIGATE: /items/manage]",
      navigation: "/items/manage"
    };
  }
  if (query.includes('ai hub') || query.includes('analyze') || query.includes('planner') || query.includes('expense') || query.includes('ticket')) {
    return {
      text: "Opening our **AI Lab & Hub** where you can generate day-by-day itineraries, upload travel expense sheets for budget analysis, or scan booking tickets for travel checklists! [NAVIGATE: /ai-hub]",
      navigation: "/ai-hub"
    };
  }

  // General conversational response
  const generalReplies = [
    "Aetheris AI is at your service! If you'd like to plan an itinerary, you can visit our **AI Hub** or type 'navigate to AI Hub'. What destination is on your mind?",
    "That sounds like an amazing adventure! Did you know you can upload travel expense CSV files in our AI Hub to analyze budget patterns?",
    "I'm here to assist you. Ask me to find trips, manage your current trips, or help you map out travel checklist details.",
    "Interesting! For a trip like that, I highly recommend looking at our 'Cultural' or 'Adventure' filters. Would you like me to take you to the Explore page?"
  ];
  const text = generalReplies[Math.floor(Math.random() * generalReplies.length)] || generalReplies[0]!;
  return { text };
}

function getMockExpenseAnalysis(raw: string): {
  summary: string;
  categories: { name: string; value: number; color: string }[];
  recommendations: string[];
  totalSpent: number;
} {
  // Try to parse values out of raw string to make it reactive even in mock mode
  let total = 855.00;
  const matchNum = raw.match(/\b\d+(\.\d{1,2})?\b/g);
  if (matchNum && matchNum.length > 2) {
    const sum = matchNum.map(Number).reduce((a, b) => a + b, 0);
    if (sum > 0 && sum < 100000) total = parseFloat(sum.toFixed(2));
  }

  return {
    summary: "Your uploaded travel expenditure reflects a standard tourist budget distribution. Lodging comprises the largest share, followed by transit. Dining and cafe expenses appear slightly high, representing a major optimization opportunity.",
    categories: [
      { name: "Food", value: parseFloat((total * 0.22).toFixed(2)), color: "#FF8042" },
      { name: "Lodging", value: parseFloat((total * 0.45).toFixed(2)), color: "#0088FE" },
      { name: "Transit", value: parseFloat((total * 0.15).toFixed(2)), color: "#00C49F" },
      { name: "Activities", value: parseFloat((total * 0.10).toFixed(2)), color: "#FFBB28" },
      { name: "Shopping", value: parseFloat((total * 0.08).toFixed(2)), color: "#8884d8" }
    ],
    recommendations: [
      "Consider booking local guesthouses or hostels instead of central hotels to cut lodging costs by 30%.",
      "Limit dinner outings at premium establishments and try curated local street markets or meal bundles.",
      "Opt for multi-day subway transit passes instead of individual single-ride tickets or private taxis."
    ],
    totalSpent: total
  };
}

function getMockVoucherParsing(raw: string): {
  bookingType: string;
  confirmationCode: string;
  location: string;
  startDate: string;
  endDate: string;
  keyDetails: { label: string; value: string }[];
  preTravelChecklist: string[];
} {
  let conf = "AE-9824X";
  const confMatch = raw.match(/\b[A-Z0-9]{5,10}\b/);
  if (confMatch && confMatch[0]) conf = confMatch[0];

  let loc = "Paris, France";
  if (raw.toLowerCase().includes('tokyo')) loc = "Tokyo, Japan";
  else if (raw.toLowerCase().includes('london')) loc = "London, United Kingdom";
  else if (raw.toLowerCase().includes('dhaka')) loc = "Dhaka, Bangladesh";

  return {
    bookingType: raw.toLowerCase().includes('flight') || raw.toLowerCase().includes('airlines') ? "Flight" : "Hotel Booking",
    confirmationCode: conf,
    location: loc,
    startDate: "2026-10-15",
    endDate: "2026-10-22",
    keyDetails: [
      { label: "Document Class", value: "Parsed Voucher (AI Engine)" },
      { label: "Guest/Traveler", "value": "Kabya Rahman (Primary)" },
      { label: "Inclusions", value: "Standard entry & services" },
      { label: "Extracted Status", value: "Confirmed / Paid" }
    ],
    preTravelChecklist: [
      "Carry a printed copy of this confirmation sheet at boarding/check-in.",
      "Double check that the passport is valid for at least 6 months from entry date.",
      "Verify baggage limits and carry-on restriction guidelines.",
      "Inform credit card providers of international travel dates to prevent holds.",
      "Pre-download offline maps for the location before departure."
    ]
  };
}

function getMockTags(title: string, desc: string): string[] {
  const tags: string[] = ['Trending'];
  const text = (title + ' ' + desc).toLowerCase();
  
  if (text.includes('hike') || text.includes('climb') || text.includes('trek') || text.includes('adventure')) {
    tags.push('Adventure', 'Nature');
  }
  if (text.includes('historic') || text.includes('museum') || text.includes('art') || text.includes('culture')) {
    tags.push('Cultural');
  }
  if (text.includes('spa') || text.includes('relax') || text.includes('beach') || text.includes('resort')) {
    tags.push('Relaxing');
  }
  if (text.includes('budget') || text.includes('cheap') || text.includes('hostel')) {
    tags.push('Budget');
  }
  if (text.includes('luxury') || text.includes('5-star') || text.includes('premium')) {
    tags.push('Luxury');
  }
  
  if (tags.length < 3) {
    tags.push('Solo-Friendly', 'Recommended');
  }
  
  return tags.slice(0, 4);
}
