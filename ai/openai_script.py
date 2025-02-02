import os
import json
from supabase import create_client, Client
from openai import OpenAI
import dotenv


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
        response = supabase.table('test-table').select('*').execute()
        rows = response.data
        print(f"Fetched {len(rows)} rows from the table.")
        return rows
    except Exception as e:
        print("Error querying table:", e)
        return []

def generate_response(question, rows):
    # Use the rows directly to create a prompt
    sources = json.dumps(rows, indent=2)
    prompt = f"Answer the following question using the provided sources:\nQuestion: {question}\nSources:\n{sources}"

    print("Calling OpenAI API...")
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150
    )

    return response.choices[0].message['content'].strip()

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