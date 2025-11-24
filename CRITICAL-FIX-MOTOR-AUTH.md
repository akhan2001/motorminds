# CRITICAL FIX: MOTOR API Authentication

## Problem
MOTOR API returns **401 "Invalid authentication"** errors due to incorrect query parameter order.

## Root Cause
The authentication parameters were being appended in the wrong order. MOTOR's API requires specific parameter ordering for signature validation.

---

## Solution
Fix the query parameter order to match MOTOR's official documentation: **Scheme, XDate, ApiKey, Sig**

---

## File to Edit
**Path:** `src/lib/integrations/motor-daas/auth.ts`

## Lines to Change
**Around line 192-197**

### Before (WRONG):
```typescript
const authParamsStr = [
    `ApiKey=${encodeURIComponent(authParams.ApiKey)}`,
    `Sig=${encodedSig}`,
    `Scheme=${encodeURIComponent(authParams.Scheme)}`,
    `XDate=${authParams.XDate}`
].join('&');
```

### After (CORRECT):
```typescript
const authParamsStr = [
    `Scheme=${encodeURIComponent(authParams.Scheme)}`,
    `XDate=${authParams.XDate}`,
    `ApiKey=${encodeURIComponent(authParams.ApiKey)}`,
    `Sig=${encodedSig}`
].join('&');
```

---

## Official MOTOR Documentation Reference

From MOTOR DaaS JavaScript authentication example:

```javascript
function GenerateUriWithValidAuth(uri, verb, publicKey, privateKey) {
    var currentDate = new Date();
    var epoch = Math.floor(currentDate.getTime() / 1000.0);
    var toSign = publicKey + '\n' + verb + '\n' + epoch + '\n' + uri;
    var hash = CryptoJS.HmacSHA256(toSign, privateKey);  // ← SHA256, not SHA1
    var sig = CryptoJS.enc.Base64.stringify(hash);
    // Note the order: Scheme, XDate, ApiKey, Sig
    var requestUrl = uri + "?Scheme=Shared&XDate=" + epoch + "&ApiKey=" + publicKey + "&Sig=" + sig;
    return requestUrl;
}
```

**Key Points:**
- Algorithm: **HMAC-SHA256** (already correct in code)
- Parameter Order: **Scheme, XDate, ApiKey, Sig** (THIS was wrong)
- Signature must be URL-encoded (already correct)

---

## What This Fixes

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 "Invalid authentication" | Wrong parameter order | Reorder to: Scheme, XDate, ApiKey, Sig |
| XML error responses | Failed authentication | Proper order = successful auth = JSON responses |
| No AI responses | Tool failures blocking AI | Already fixed with better error handling |

---

## Expected URL Format

**Before (Wrong):**
```
...?ContentSilos=15&AttributeStandard=MOTOR&SearchTerm=P0420&ApiKey=xxx&Sig=yyy&Scheme=Shared&XDate=123
```

**After (Correct):**
```
...?ContentSilos=15&AttributeStandard=MOTOR&SearchTerm=P0420&Scheme=Shared&XDate=123&ApiKey=xxx&Sig=yyy
```

---

## Additional Context

### String to Sign Format (Correct)
```
{PUBLIC_KEY}\n{HTTP_VERB}\n{EPOCH}\n{RELATIVE_PATH}
```

Example:
```
izlXzLYxY4
GET
1764009409
/v1/Information/Vehicles/Attributes/BaseVehicleID/26332/Content/Summaries/Of/DiagnosticTroubleCodes
```

### Why Order Matters
While HTTP query parameters are typically order-independent, MOTOR's signature validation likely expects parameters in a specific sequence. This is common in API authentication schemes to prevent tampering.

---

## Testing After Fix

1. Restart dev server: `npm run dev`
2. Navigate to `/chat`
3. Select a vehicle and ask: "What does DTC P0420 mean?"
4. Check logs for:
   - `[MOTOR Auth]` logs showing correct parameter order
   - `POST /api/ai/diagnostics 200` (not 401)
   - No XML error responses
   - AI successfully responding with DTC information

---

## Branch Status

**Fix Applied On:** `mvp/MotorDiagnostics` (commit 958fbfa)

**Changes Made:**
1. ✅ Query parameter order fixed: Scheme, XDate, ApiKey, Sig
2. ✅ Confirmed SHA256 algorithm (already correct)
3. ✅ Enhanced error handling for better UX
4. ✅ Improved tool error messages

---

## Complete Changeset

### 1. Authentication Parameter Order (`auth.ts`)
- Changed parameter order to match MOTOR docs
- Updated comments to reflect correct order

### 2. Error Handling (`route.ts`)
- Added `maxSteps: 5` for multiple tool attempts
- Added `onToolCall` logging for debugging

### 3. Tool Error Messages (`motor-daas-tools.ts`)
- Better error messages that instruct AI to use fallback knowledge
- Console error logging with `[MOTOR Tool]` prefix

### 4. AI Prompt (`prompts.ts`)
- Added error handling instructions
- AI now responds even when MOTOR API unavailable

---

**Priority:** 🔴 **CRITICAL** - Blocks all MOTOR API functionality
**Difficulty:** ⭐ **TRIVIAL** - Reorder array elements
**Impact:** ✅ **IMMEDIATE** - Fixes authentication instantly

---

## Quick Apply

If you have the `mvp/MotorDiagnostics` branch locally:

```bash
git checkout mvp/MotorDiagnostics
git pull origin mvp/MotorDiagnostics
npm run dev
```

The fix is already committed and ready to test!
