/**
 * Vapi Call Analysis Prompts
 * These prompts are used to analyze voice calls and extract structured data
 */

export const CALL_SUMMARY_PROMPT = `
You are analyzing a voice call between Mia AI (representing an auto shop) and a parts supplier. 

Create a concise summary that includes:

1. **Call Outcome**: Was the call successful? (Quote received, voicemail, busy, no answer, etc.)
2. **Parts Discussed**: What specific parts were requested?
3. **Vehicle Information**: Year, make, model mentioned
4. **Supplier Response**: 
   - Availability (in stock, backorder, discontinued)
   - Pricing information provided
   - Delivery timeframe
   - Part numbers given
5. **Contact Information**: Who was spoken to at the supplier
6. **Next Steps**: Any follow-up actions mentioned

Keep the summary under 200 words and focus on actionable information that would help the auto shop owner understand the call results at a glance.

Example format:
"Successfully reached [Contact Name] at [Supplier]. Requested 2 Brembo brake pads for 2015 Chevrolet Cruze. Parts available in stock at $85 each, part number BP-1234. Estimated delivery 2-3 business days. Total quote: $170 + shipping. Ready to place order."
`;

export const SUCCESS_VALIDATION_PROMPT = `
Determine if this voice call was successful based on the conversation content.

A call is considered SUCCESSFUL if:
Connected to a live person (not voicemail)
Discussed the requested parts
Received pricing information OR availability status
Obtained part numbers or specifications
Got delivery timeframe information
Completed the quote request process

A call is considered UNSUCCESSFUL if:
Reached voicemail only
Call was not answered
Hung up immediately
Unable to discuss parts (wrong department, etc.)
No pricing or availability information provided
Technical issues prevented communication

Return only one of these values:
- "successful" - Quote information was obtained
- "partial" - Some information obtained but incomplete
- "failed" - No useful information obtained
- "voicemail" - Reached voicemail
- "no_answer" - Call was not answered
- "technical_issue" - Call had technical problems

Consider the overall value of information obtained for the auto shop's parts ordering process.
`;

export const STRUCTURED_DATA_PROMPT = `
Extract structured data from this voice call conversation between Mia AI and a parts supplier.

Return a JSON object with the following structure:

{
  "call_outcome": {
    "status": "successful|partial|failed|voicemail|no_answer",
    "contact_person": "Name of person spoken to",
    "department": "Parts, Service, Sales, etc.",
    "notes": "Any additional important notes"
  },
  "supplier_info": {
    "supplier_name": "Name from conversation",
    "contact_person": "Primary contact name",
    "phone_number": "Phone number if mentioned",
    "account_number": "Account number if provided"
  },
  "parts_info": [
    {
      "part_name": "Brake Pads",
      "part_number": "BP-1234",
      "brand": "Brembo",
      "quantity": 2,
      "vehicle_application": "2015 Chevrolet Cruze",
      "availability": "in_stock|backorder|discontinued|unknown",
      "unit_price": 85.00,
      "total_price": 170.00,
      "delivery_days": 3,
      "delivery_method": "standard|expedited|pickup",
      "warranty": "Warranty information if mentioned",
      "notes": "Any part-specific notes"
    }
  ],
  "quote_details": {
    "subtotal": 170.00,
    "shipping_cost": 15.00,
    "tax": 13.60,
    "total_cost": 198.60,
    "currency": "USD",
    "quote_valid_until": "2024-01-15",
    "payment_terms": "Net 30, COD, etc.",
    "minimum_order": "Minimum order amount if mentioned"
  },
  "vehicle_info": {
    "year": "2015",
    "make": "Chevrolet",
    "model": "Cruze",
    "engine": "1.4L Turbo",
    "vin": "VIN if mentioned",
    "mileage": "Mileage if relevant"
  },
  "next_steps": {
    "order_ready": true,
    "requires_approval": false,
    "follow_up_needed": false,
    "follow_up_date": "2024-01-10",
    "additional_info_needed": "Any missing information",
    "special_instructions": "Special ordering instructions"
  },
  "call_metadata": {
    "call_duration": "Duration in seconds if available",
    "call_quality": "good|fair|poor",
    "language": "en",
    "timestamp": "Call timestamp if available"
  }
}

Important guidelines:
- Only include fields with actual data from the conversation
- Use null for unavailable information
- Ensure pricing is in decimal format (85.00, not $85)
- Use ISO date format (YYYY-MM-DD) for dates
- Be conservative with assumptions - if uncertain, use null
- Standardize availability values to the exact options provided
- Extract exact part numbers, don't guess or abbreviate

If multiple parts were discussed, include each as a separate object in the parts_info array.
`;

export const CALL_ANALYSIS_CONFIG = {
  summary: {
    enabled: true,
    prompt: CALL_SUMMARY_PROMPT
  },
  successValidation: {
    enabled: true,
    prompt: SUCCESS_VALIDATION_PROMPT
  },
  structuredData: {
    enabled: true,
    prompt: STRUCTURED_DATA_PROMPT,
    schema: {
      type: "object",
      properties: {
        call_outcome: { type: "object" },
        supplier_info: { type: "object" },
        parts_info: { type: "array" },
        quote_details: { type: "object" },
        vehicle_info: { type: "object" },
        next_steps: { type: "object" },
        call_metadata: { type: "object" }
      }
    }
  }
};
