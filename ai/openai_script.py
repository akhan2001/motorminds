import os
import json
from supabase import create_client, Client
from openai import OpenAI
import dotenv
from typing import List

print("Starting script...")

dotenv.load_dotenv()

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# Initialize OpenAI client
# openai.api_key = os.getenv("OPENAI_API_KEY")

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
)

def query_table():
    try:
        print("Querying the table...")
        response = supabase.table('customers').select('*').execute()
        rows = response.data
        print(f"Fetched {len(rows)} rows from the table.")
        return rows
    except Exception as e:
        print("Error querying table:", e)
        return []

def filter_relevant_rows(rows: List[dict], keywords: List[str]) -> List[dict]:
    relevant_rows = []
    for row in rows:
        row_text = json.dumps(row).lower()
        if all(keyword.lower() in row_text for keyword in keywords):
            relevant_rows.append(row)
    return relevant_rows

def generate_response(question, rows):
    # Define keywords for filtering
    keywords = question.split()  # Simple split, can be improved with NLP techniques

    # Filter rows to include only those relevant to the question
    relevant_rows = filter_relevant_rows(rows, keywords)
    if not relevant_rows:
        print("No relevant data found for the query.")
        return "No relevant data found for the query."

    # Limit the number of rows to avoid exceeding token limits
    limited_rows = relevant_rows[:5]  # Adjust the number as needed
    sources = json.dumps(limited_rows, indent=2)
    prompt = f"Answer the following question using the provided sources:\nQuestion: {question}\nSources:\n{sources}"

    print("Calling OpenAI API...")
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150
        )
        return response.choices[0].message.content.strip()
    except client.chat.error.RateLimitError as e:
        print(f"Rate limit error: {e}")
        return "Request exceeded token limits. Please try again with a smaller input."

def main():
    question = input("Enter your question: ")
    rows = query_table()
    if not rows:
        print("No data found in the table.")
        return
    ai_response = generate_response(question, rows)
    print(f"AI Response: {ai_response}")

if __name__ == "__main__":
    main()