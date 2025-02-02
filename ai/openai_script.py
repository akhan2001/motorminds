import os
import json
from supabase import create_client, Client
from openai import OpenAI
import dotenv
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter

dotenv.load_dotenv()

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# Initialize OpenAI client
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")  # Ensure the API key is securely managed
)

GROUNDED_PROMPT = """
You are a friendly assistant that recommends hotels based on activities and amenities.
Answer the query using only the sources provided below in a friendly and concise bulleted manner.
Answer ONLY with the facts listed in the list of sources below.
If there isn't enough information below, say you don't know.
Do not generate answers that don't use the sources below.
Query: {query}
Sources:\n{sources}
"""

def query_table_with_question(question):
    try:
        print("Querying the table...")
        response = supabase.table('test-table').select('*').execute()
        rows = response.data
        print(f"Fetched {len(rows)} rows from the table.")

        relevant_rows = []
        for row in rows:
            if any(question.lower() in str(value).lower() for value in row.values()):
                relevant_rows.append(row)

        print(f"Found {len(relevant_rows)} relevant rows.")
        return relevant_rows
    except Exception as e:
        print("Error querying table:", e)
        return []

def create_embeddings_and_index(rows):
    print("Creating embeddings and index...")
    texts = [json.dumps(row) for row in rows]
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_texts(texts)

    embeddings = OpenAIEmbeddings()
    vectors = embeddings.embed_documents(chunks)

    index = FAISS.from_vectors(vectors, chunks)
    print("Index created.")
    return index

def retrieve_relevant_chunks(index, question):
    print("Retrieving relevant chunks...")
    embeddings = OpenAIEmbeddings()
    question_vector = embeddings.embed_query(question)

    relevant_chunks = index.similarity_search(question_vector, k=5)
    print(f"Retrieved {len(relevant_chunks)} relevant chunks.")
    return relevant_chunks

def chat_gpt(prompt):
    print("Calling OpenAI API...")
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content.strip()

def call_ai_with_question(question, rows):
    try:
        index = create_embeddings_and_index(rows)
        relevant_chunks = retrieve_relevant_chunks(index, question)

        sources = json.dumps(relevant_chunks, indent=2)
        prompt = GROUNDED_PROMPT.format(query=question, sources=sources)

        ai_response = chat_gpt(prompt)
        print(f"AI Response: {ai_response}")
    except Exception as e:
        print("Error calling AI:", e)

def main():
    question = input("Enter your question: ")
    relevant_rows = query_table_with_question(question)
    call_ai_with_question(question, relevant_rows)

if __name__ == "__main__":
    main()