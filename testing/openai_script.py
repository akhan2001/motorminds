import openai
import json

# Load the JSON data from the file
def load_json(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

# Function to recursively search through nested dictionaries and lists
def search_repair_data(query, data):
    results = []
    
    # Recursive function to check all nested dictionaries and lists
    def recursive_search(query, data):
        # If data is a dictionary, check each key-value pair
        if isinstance(data, dict):
            for key, value in data.items():
                # Check if the query matches the key
                if query.lower() in key.lower():
                    results.append(data)  # If key matches, add the data
                if isinstance(value, (dict, list)):
                    recursive_search(query, value)  # Recursively search deeper
                elif isinstance(value, str) and query.lower() in value.lower():
                    results.append(data)  # If value matches, add the data

        # If data is a list, iterate through the list and search
        elif isinstance(data, list):
            for item in data:
                recursive_search(query, item)

        # If data is a string, check for the query match
        elif isinstance(data, str) and query.lower() in data.lower():
            results.append(data)

    # Start the recursive search
    recursive_search(query, data)
    return results

# Function to get an answer from OpenAI using the retrieved data
def get_answer_from_openai(query, data):
    # Prepare context for the OpenAI model by joining the results
    context = "\n".join([json.dumps(record, indent=2) for record in data[:5]])  # Limit context to first 5 records
    
    prompt = f"Answer the following question based on the repair data:\n{context}\n\nQuestion: {query}"

    # Call OpenAI API with your API key
    openai.api_key = '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'  # Replace with your OpenAI API key
    
    # New method: Using chat models in OpenAI API v1.0.0 and above
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",  # or use "gpt-3.5-turbo"
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=500,
        temperature=0.7
    )

    return response['choices'][0]['message']['content'].strip()

# Main function to search and get the response
def handle_query(query, data):
    # Step 1: Search for relevant data based on the query
    search_results = search_repair_data(query, data)

    # Step 2: Generate a response based on the retrieved data
    if search_results:
        answer = get_answer_from_openai(query, search_results)
        return answer
    else:
        return "No relevant repair data found for your query."

# Load the large JSON data
repair_data = load_json('testfile.json')

# Example query
query = "Module"  # Use a broad query like "Module" to test the search
answer = handle_query(query, repair_data)

print(answer)
