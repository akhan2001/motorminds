# MotorMinds Voice Calling System

An AI-powered voice calling system for quick and efficient automotive parts ordering.

## Features

### ✅ AI Parts Ordering (Available)
- **Alex**: Fast, efficient AI agent for parts procurement
- **Quick ordering**: Complete orders in under 3 minutes per part
- **Direct communication**: Minimal filler words, maximum efficiency
- **Essential data collection**: Part numbers, pricing, availability, delivery

### 🔄 Voice Scheduling (Coming Soon)
- Appointment scheduling calls
- Customer follow-ups

## Setup

### 1. Vapi Configuration

Environment variables needed in `.env.local`:

```bash
VAPI_API_KEY=your_vapi_api_key_here
VAPI_PHONE_NUMBER_ID=your_phone_number_id_here
VAPI_ASSISTANT_ID=your_assistant_id_here
```

### 2. Vapi Dashboard Setup

1. Create account at [Vapi Dashboard](https://dashboard.vapi.ai/)
2. Purchase phone number for outbound calls
3. Create AI assistant with the streamlined prompt
4. Copy credentials to environment variables

### 3. AI Assistant Configuration

**Streamlined AI Prompt:**
`src/app/(features)/voice-calling/voice-ordering/AI_PARTS_ORDERING_PROMPT.md`

**Complete Vapi Configuration Guide:**
`src/app/(features)/voice-calling/VAPI_CONFIGURATION.md`

**Critical Settings:**
- **Model**: GPT-4o Cluster
- **First Message**: "Hi, this is Alex from MotorMinds Auto Shop calling to place a parts order. Can I speak with parts or sales?"
- **Voice**: Professional, fast-paced
- **Transcriber**: Deepgram Nova 3

⚠️ **Important:** Ensure First Message is set correctly for **outbound calls** to suppliers, not inbound.

## Usage

### Quick Parts Ordering

1. Navigate to `/voice-calling/voice-ordering`
2. Enter supplier's phone number
3. Click "Call Supplier to Order Parts"
4. Alex will:
   - Introduce MotorMinds (10 seconds)
   - Verify account information (5 seconds)
   - Order each part efficiently (30 seconds per part)
   - Collect all required parameters
   - Confirm order details (15 seconds)

## Required Parameters Collected

### For Each Part:
- ✅ **Part Number** (exact specification)
- ✅ **Price** (including all fees)
- ✅ **Availability** (in stock / delivery date)
- ✅ **Supplier Reference Number**
- ✅ **Part Compatibility** (vehicle fitment)

### For Complete Order:
- ✅ **Total Order Amount**
- ✅ **Order Confirmation Number**
- ✅ **Purchase Order Number** (PO#)
- ✅ **Account Number** verification
- ✅ **Delivery Date & Method**
- ✅ **Payment Terms**

## Performance Goals

- **Call Duration**: Under 3 minutes per part
- **Information Accuracy**: 100% required parameters collected
- **Communication Style**: Direct, professional, efficient
- **Success Rate**: Quick order placement with all confirmations

## File Structure

```
src/app/(features)/voice-calling/
├── page.tsx                           # Voice hub
├── voice-ordering/
│   ├── page.tsx                       # Quick ordering dashboard
│   ├── vapi-client.ts                 # Vapi utilities
│   └── AI_PARTS_ORDERING_PROMPT.md   # Streamlined AI prompt
├── VAPI_CONFIGURATION.md              # Complete Vapi setup guide
└── README.md                          # This file

src/app/api/voice/
└── start-call/
    └── route.ts                       # Call initiation
```

## Testing Your Configuration

✅ **First message sounds professional and identifies MotorMinds**
✅ **AI asks for parts department transfer**
✅ **Collects all required parameters per part**
✅ **Speaks clearly with part numbers and prices**
✅ **Completes calls efficiently (under 3 minutes per part)**
✅ **Properly handles "out of stock" scenarios**
✅ **Collects order confirmation numbers**

The streamlined AI Parts Ordering system ensures MotorMinds gets parts ordered quickly and efficiently with all necessary information collected for accurate procurement.
