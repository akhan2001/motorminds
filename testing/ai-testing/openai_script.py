from azure.identity import DefaultAzureCredential
from azure.search.documents import SearchClient
from openai import OpenAI
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize clients
credential = DefaultAzureCredential()
search_client = SearchClient(
    endpoint=os.getenv("AZURE_SEARCH_SERVICE"),
    index_name=os.getenv("AZURE_SEARCH_INDEX"),
    credential=credential
)

openai_client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

# RAG prompt template
RAG_PROMPT = """
You are an automotive repair expert assistant. 
Answer the query using only the repair manual sources provided below.
Answer ONLY with the facts listed in the sources below.
If there isn't enough information, say you don't know.
Do not generate answers that don't use the sources below.

Query: {query}
Sources:
{sources}
"""

def search_repair_docs(query, top_k=5):
    """Search the repair documents in Azure Search"""
    search_results = search_client.search(
        search_text=query,
        top=top_k,
        select="title,content,section"
    )
    
    # Format search results
    sources = []
    for doc in search_results:
        source = f"Section: {doc['section']}\nTitle: {doc['title']}\nContent: {doc['content']}"
        sources.append(source)
    
    return "\n\n".join(sources)

def get_rag_response(query):
    """Get RAG-enhanced response using Azure Search and OpenAI"""
    try:
        # Get relevant documents from search
        sources = search_repair_docs(query)
        
        # Generate prompt with context
        prompt = RAG_PROMPT.format(
            query=query,
            sources=sources
        )
        
        # Get OpenAI response
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an automotive repair expert assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        return f"Error: {str(e)}"

def main():
    print("Automotive Repair Manual Assistant (RAG-enabled)")
    print("Type 'exit' to quit")
    
    while True:
        query = input("\nWhat would you like to know about vehicle repair? ")
        if query.lower() == 'exit':
            break
            
        response = get_rag_response(query)
        print("\nResponse:", response)

if __name__ == "__main__":
    main()