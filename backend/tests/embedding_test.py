from openai import OpenAI
import os
import dotenv

dotenv.load_dotenv()

client = OpenAI(
    api_key=os.getenv("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"),
)

try:
    print("Hello")
    
    response = client.embeddings.create(
        input="Your text string goes here",
        model="text-embedding-3-small"
    )

    print(response.data[0].embedding)
except Exception as e:
    print(f"Error embedding: {e}")
