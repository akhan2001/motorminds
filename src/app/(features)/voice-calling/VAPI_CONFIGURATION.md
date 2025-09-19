# Vapi Assistant Configuration for AI Parts Ordering

## Recommended Settings Based on Your Configuration

### ✅ **MODEL Configuration (Good as-is)**
```
Provider: OpenAI
Model: GPT-4o Cluster
Temperature: 0.5
Max Tokens: 250
```

### ❌ **FIRST MESSAGE - NEEDS CORRECTION**

**Current (Incorrect):**
```
First Message: "Hey, I'm looking for a part!"
```

**Should Be (Outbound Calling):**
```
First Message: "Hi, this is Alex from MotorMinds Auto Shop calling to place a parts order. Can I speak with parts or sales?"
```

**Why:** Since Alex is making **outbound calls** to suppliers, he should introduce himself professionally, not act like he's receiving a call.

### ✅ **VOICE Configuration (Good)**
```
Provider: Vapi
Background Sound: Default/None (professional calls)
Input Min Characters: 30
```

### ✅ **TRANSCRIBER Configuration (Excellent)**
```
Provider: Deepgram
Model: Nova 3
Language: En
Background Denoising: Enabled
Confidence Threshold: 0.4
Use Numerals: Enabled (important for part numbers)
```

### ✅ **TOOLS Configuration (Good)**
```
End Call Function: Enabled ✅
Dial Keypad: Enabled ✅
Forwarding Phone Number: 4257623355
```

### ⚠️ **ANALYSIS - Suggested Improvements**

**Current Summary Prompt:** Generic note-taking
**Suggested Summary Prompt:**
```
You are an expert automotive parts order analyst. Summarize this parts ordering call including:
- Parts ordered (numbers, quantities, prices)
- Supplier details and delivery dates
- Order confirmation numbers and PO numbers
- Any issues or alternatives discussed
Keep summary focused on procurement details.
```

**Suggested Success Evaluation Prompt:**
```
Evaluate if this parts ordering call was successful by checking:
- Were all required part numbers, prices, and availability confirmed?
- Was delivery date established?
- Were order confirmation and PO numbers collected?
- Was the call completed efficiently (under 3 minutes per part)?
Rate as successful if all essential procurement data was collected.
```

**Suggested Structured Data Schema:**
```json
{
  "type": "object",
  "properties": {
    "parts_ordered": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "part_number": {"type": "string"},
          "quantity": {"type": "number"},
          "price": {"type": "number"},
          "availability": {"type": "string"},
          "supplier_reference": {"type": "string"},
          "vehicle_application": {"type": "string"}
        }
      }
    },
    "total_order_amount": {"type": "number"},
    "order_confirmation_number": {"type": "string"},
    "po_number": {"type": "string"},
    "delivery_date": {"type": "string"},
    "delivery_method": {"type": "string"},
    "supplier_contact": {"type": "string"},
    "call_successful": {"type": "boolean"}
  }
}
```

### ✅ **TIMEOUT Settings (Good)**
```
Silence Timeout: 30 seconds ✅
Maximum Duration: 600 seconds (10 minutes) ✅
Wait Seconds: 0.4 ✅
```

### ⚠️ **MESSAGING - Suggested Updates**

**End Call Message:**
```
"Thanks for the order. Expecting delivery [DATE]. Order confirmation [NUMBER]. Good day."
```

**Voicemail Message:**
```
"Hi, this is Alex from MotorMinds Auto Shop calling about a parts order. Please call back at [PHONE] when parts department is available. Thanks."
```

### ✅ **ADVANCED Settings (Well Configured)**
```
Smart Endpointing: Recommended for better speech detection
On Punctuation Seconds: 0.1 ✅
On No Punctuation Seconds: 1.5 ✅
Stop Speaking Plan: 0.2 voice seconds ✅
```

## Key Configuration Changes Needed:

### 1. **Fix First Message (Critical)**
Change from: `"Hey, I'm looking for a part!"`
To: `"Hi, this is Alex from MotorMinds Auto Shop calling to place a parts order. Can I speak with parts or sales?"`

### 2. **Add Keyterms for Better Transcription**
```
part number, price, availability, delivery, stock, order, confirmation, PO, account, reference
```

### 3. **Custom Function for Order Processing**
Consider adding a webhook function to capture structured order data:
```
Function Name: process_parts_order
URL: https://your-domain.com/api/voice/process-order
Method: POST
```

## Testing Checklist:

✅ **First message sounds professional and identifies MotorMinds**
✅ **AI asks for parts department transfer**
✅ **Collects all required parameters per part**
✅ **Speaks clearly with part numbers and prices**
✅ **Completes calls efficiently (under 3 minutes per part)**
✅ **Properly handles "out of stock" scenarios**
✅ **Collects order confirmation numbers**

Your configuration is solid overall - just needs the First Message correction and the enhanced analysis prompts for better parts ordering tracking!
