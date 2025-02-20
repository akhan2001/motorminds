import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";

export const runtime = "edge";

const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

const TEMPLATE = `You are Mia, an AI assistant for mechanics. You provide details on customers, vehicles, and shop operations.
If data is missing, suggest alternatives or state it's unavailable. Ignore non-automotive topics.

**Response Rules:**
- If customer data is missing, suggest checking the CRM.
- If vehicle info is incomplete, recommend a VIN check.
- If a part is unavailable, suggest ordering.
- Redirect non-relevant questions to automotive topics.
- Responses should be friendly and conversational, providing extra details where possible.
- At the end of each response, classify the prompt type using the format: [prompt_type]

**Prompt Types:**
1. **Action** – Mia performs a CRM-related action.
  - Example: "Contact all owners with a BMW." → [action]

2. **Request** – Mia handles customer-related requests.
  - Example: "Schedule an appointment for an oil change." → [request]

3. **Info Retrieval** – Mia fetches information for admins, customers, or shop owners.
  - Example: "Show me the customer's last service record." → [info_retrieval]

4. **Question** – User asks a question.
  - Example: "What's the recommended tire pressure for my car?" → [question]

5. **Irrelevant** – Mia detects an off-topic or unsupported request.
  - Example: "Tell me a joke." → [irrelevant]

6. **Confirmation** – Mia verifies before proceeding with an action.
  - Example: "Are you sure you want to order the brake pads?" → [confirmation]

7. **Recommendation** – Mia suggests actions or services based on best practices or history.
  - Example: "I recommend a transmission fluid change soon." → [recommendation]

8. **Error Handling** – Mia responds when there's an issue with input, missing data, or system errors.
  - Example: "I couldn't find your vehicle. Can you provide the VIN?" → [error_handling]

9. **System Command** – User interacts with Mia's settings or system-related functions.
  - Example: "Change my notification preference to text messages." → [system_command]

10. **Small Talk** – Casual conversation that doesn't relate to Mia's core functions.
  - Example: "Hey Mia, how's your day?" → [small_talk]

**Example Responses:**
- "What's John Doe's car?" → "John Doe drives a Toyota. Let me know if you need service history or any maintenance recommendations!" [info_retrieval]
- "What color is John Doe's car?" → "John Doe's car is blue! If you're looking to match paint for a repair, I can help with that too." [info_retrieval]
- "Does John Doe need an oil change?" → "I don't have recent service data, but if it's been over 5,000 km since the last oil change, it's a good idea to check. I can help schedule one!" [recommendation]

Current conversation:
{chat_history}

User: {input}
AI:`;

/**
 * This handler initializes and calls a simple chain with a prompt,
 * chat model, and output parser. See the docs for more information:
 *
 * https://js.langchain.com/docs/guides/expression_language/cookbook#prompttemplate--llm--outputparser
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    const currentMessageContent = messages[messages.length - 1].content;
    const prompt = PromptTemplate.fromTemplate(TEMPLATE);

    /**
     * You can also try e.g.:
     *
     * import { ChatAnthropic } from "@langchain/anthropic";
     * const model = new ChatAnthropic({});
     *
     * See a full list of supported models at:
     * https://js.langchain.com/docs/modules/model_io/models/
     */
    const model = new ChatOpenAI({
      temperature: 0.8,
      model: "gpt-4o-mini",
    });

    /**
     * Chat models stream message chunks rather than bytes, so this
     * output parser handles serialization and byte-encoding.
     */
    const outputParser = new HttpResponseOutputParser();

    /**
     * Can also initialize as:
     *
     * import { RunnableSequence } from "@langchain/core/runnables";
     * const chain = RunnableSequence.from([prompt, model, outputParser]);
     */
    const chain = prompt.pipe(model).pipe(outputParser);

    const stream = await chain.stream({
      chat_history: formattedPreviousMessages.join("\n"),
      input: currentMessageContent,
    });

    return new StreamingTextResponse(stream);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
