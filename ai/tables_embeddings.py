import os
import json
from supabase import create_client, Client
from openai import OpenAI
import dotenv

dotenv.load_dotenv()

openai: OpenAI = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

def fetchAndEmbed(content):
    
    try:
        # Convert the entire row to a JSON string
        text_content = json.dumps(content)
        input_text = text_content.replace('\n', ' ')

        # Use the new API for embeddings
        response = openai.embeddings.create(
            model="text-embedding-3-small",
            input=input_text
        )

        embedding = response['data'][0]['embedding']
        print(embedding)

    except Exception as e:
        print(f"Error embedding: {e}")
        return

    # Update the row with the new embedding
    # updateResponse = supabase.table(content).update({
    #     "embedding": embedding
    # }).eq("id", row['id']).execute()

    # if updateResponse['error']:
    #     print(f"Error updating embedding: {updateResponse['error']}")
    # else:
    #     print(f"Updated embedding for ID: {row['id']}")

def printTable(tableName):
    response = supabase.table(tableName).select("*").execute()
    data = response.data

    # Print each row individually and embed
    for row in data:
        # print(row)
        fetchAndEmbed(row)

def main():
    printTable("customers")

if __name__ == "__main__":
    main()
