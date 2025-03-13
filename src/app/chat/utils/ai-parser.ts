import { generateObject } from "ai";
import { z } from "zod";
import OpenAI from "openai";
import { openai } from "@ai-sdk/openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
});

const customerFormSchema = z.object({
    customer_name: z.string().min(1, "Customer name is required")
    .describe("The name of the customer"),
    customer_phone: z.string().min(1, "Customer phone is required")
    .describe("The phone number of the customer"),
    customer_email: z.string().min(1, "Customer email is required")
    .describe("The email address of the customer"),
    customer_address: z.string().min(1, "Customer address is required")
    .describe("The address of the customer"),
});

export type CustomerFormData = z.infer<typeof customerFormSchema>;

export async function parseCustomerInfo(input: string): Promise<CustomerFormData> {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `Extract customer information according to the schema provided:
                    {
                        "customer_name": "string",
                        "customer_phone": "number",
                        "customer_email": "string",
                        "customer_address": "string"
                    }
                    Return ONLY valid JSON without any explanation or markdown. Leave fields empty if not found.`
                },
                {
                    role: "user",
                    content: input
                }
            ],
            temperature: 0.1, // Low temperature for more deterministic results
            response_format: { type: "json_object" }, // Ensure response is JSON
        });
        
        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error("Failed to parse content");
        }

        const parsedData = JSON.parse(content);
        return customerFormSchema.parse(parsedData);
    } catch (error) {
        console.error("Error parsing customer info:", error);
        throw error;
    }
}