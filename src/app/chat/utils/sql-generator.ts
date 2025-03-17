import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Generate a SQL query from natural language using OpenAI
 */
export async function generateSQLQuery(input: string, shopId: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a SQL (PostgreSQL) expert. Your job is to help generate SQL queries based on natural language questions.
          
          The database has the following schema:
          
          customers (
            id UUID PRIMARY KEY,
            customer_name TEXT NOT NULL,
            customer_email TEXT,
            customer_phone TEXT,
            customer_address TEXT,
            preferences JSONB,
            created_at TIMESTAMP WITH TIME ZONE,
            shop_id UUID NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE
          );
          
          orders (
            id UUID PRIMARY KEY,
            customer_id UUID REFERENCES customers(id),
            total_amount DECIMAL(10, 2),
            status TEXT,
            created_at TIMESTAMP WITH TIME ZONE,
            shop_id UUID NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE
          );
          
          IMPORTANT RULES:
          1. ALWAYS include "WHERE shop_id = '${shopId}'" in EVERY query for security
          2. Only generate SELECT queries (no INSERT, UPDATE, DELETE, etc.)
          3. Keep queries simple and efficient
          4. For text searches, use ILIKE with wildcards for partial matches
          5. Return ONLY the SQL query, nothing else
          `
        },
        {
          role: "user",
          content: input
        }
      ],
      temperature: 0.2,
    });

    const sqlQuery = completion.choices[0].message.content;
    
    // Validate the query
    if (!sqlQuery) {
      throw new Error("Failed to generate SQL query");
    }
    
    // Clean up the query (remove markdown formatting if present)
    let cleanQuery = sqlQuery;
    if (cleanQuery.includes("```")) {
      cleanQuery = cleanQuery.replace(/```sql\n/g, "").replace(/```/g, "").trim();
    }
    
    // Ensure the query includes shop_id for security
    if (!cleanQuery.toLowerCase().includes("shop_id")) {
      throw new Error("Generated query does not include shop_id filter");
    }
    
    // Ensure it's a SELECT query
    if (!cleanQuery.trim().toLowerCase().startsWith("select")) {
      throw new Error("Only SELECT queries are allowed");
    }
    
    return cleanQuery;
  } catch (error) {
    console.error("Error generating SQL query:", error);
    throw error;
  }
}

/**
 * Execute a SQL query securely
 */
export async function executeSQLQuery(query: string, shopId: string) {
  try {
    // Try to use RPC function if available
    try {
        const { data, error } = await supabase.rpc('execute_secure_query', {
            query_text: query
        });
        
        if (error) throw error;
            return data;
    } catch (rpcError) {
        console.log("RPC failed, falling back to direct query", rpcError);
      
      // Fall back to direct query if RPC fails
      // This is less secure but works if you haven't set up the RPC function
      if (query.toLowerCase().includes('from customers')) {
        const { data, error } = await supabase.from('customers')
          .select('*')
          .eq('shop_id', shopId);
          
        if (error) throw error;
        return data;
      }
      
      if (query.toLowerCase().includes('from orders')) {
        const { data, error } = await supabase.from('orders')
          .select('*')
          .eq('shop_id', shopId);
          
        if (error) throw error;
        return data;
      }
      
      throw new Error('Unable to execute query safely');
    }
  } catch (error) {
    console.error("Error executing SQL query:", error);
    throw error;
  }
}

/**
 * Generate a natural language explanation of the SQL query
 */
export async function explainSQLQuery(userQuery: string, sqlQuery: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a SQL expert explaining queries to non-technical users. 
          Break down the query into simple terms focusing on what information it retrieves.
          Be concise and avoid technical jargon.`
        },
        {
          role: "user",
          content: `
          User asked: "${userQuery}"
          
          SQL Query: ${sqlQuery}
          
          Explain what this query does in simple terms:
          `
        }
      ],
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error explaining SQL query:", error);
    return "I couldn't generate an explanation for this query.";
  }
} 