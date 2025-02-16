# RAG Workflow with OpenAI API for AI Mechanic Assistant

This program uses the Retrieval-Augmented Generation (RAG) workflow to simulate an AI mechanic assistant. The assistant will provide accurate and specific responses based on JSON-format automotive data.

## Setup and Requirements

### Prerequisites
1. **OpenAI API Key**: Ensure you have an API key from OpenAI.
2. **Python Environment**: Python 3.8+ installed.
3. **Libraries**: Install the following Python libraries:
   ```bash
   pip install openai langchain tiktoken
   ```
4. **Automotive Data**: JSON files containing specifications and details for automotive queries.

### Directory Structure
Ensure your directory has the following structure:
```
project-root/
├── data/
│   ├── automotive_specs.json
├── main.py
```

### Sample JSON Data (`data/automotive_specs.json`)
```json
{
  "vehicles": [
    {
      "make": "Honda",
      "model": "Civic",
      "year": 2020,
      "engine": "2.0L I4",
      "specifications": {
        "horsepower": 158,
        "torque": 138,
        "fuel_type": "Gasoline"
      }
    },
    {
      "make": "Toyota",
      "model": "Camry",
      "year": 2021,
      "engine": "2.5L I4",
      "specifications": {
        "horsepower": 203,
        "torque": 184,
        "fuel_type": "Gasoline"
      }
    }
  ]
}
```

## Prompt Engineering

Here is the prompt you will use in the program for interacting with the OpenAI API:

```text
You are an AI mechanic assistant. Your job is to provide detailed and accurate information about vehicles based on the provided JSON data. Respond only using the data given and include specific details and specifications. If the information is not in the data, state "I do not have that information."

Data:
{data}

Question: {user_question}
```

Replace `{data}` with the loaded JSON data and `{user_question}` with the user’s query.

## Python Program (`main.py`)
```python
import json
import openai
from pathlib import Path

def load_data(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

def query_openai(prompt):
    openai.api_key = "your-openai-api-key"  # Replace with your actual API key

    response = openai.Completion.create(
        engine="text-davinci-003",  # Use the appropriate model
        prompt=prompt,
        max_tokens=200,
        temperature=0.5
    )
    return response.choices[0].text.strip()

def generate_prompt(data, user_question):
    return f"""
    You are an AI mechanic assistant. Your job is to provide detailed and accurate information about vehicles based on the provided JSON data. Respond only using the data given and include specific details and specifications. If the information is not in the data, state "I do not have that information."

    Data:
    {json.dumps(data, indent=2)}

    Question: {user_question}
    """

def main():
    # Load automotive data
    data_file = Path("data/automotive_specs.json")
    if not data_file.exists():
        print("Data file not found!")
        return

    data = load_data(data_file)

    print("Welcome to the AI Mechanic Assistant!")
    print("Type 'exit' to quit.")

    while True:
        user_question = input("Ask your question: ")
        if user_question.lower() == 'exit':
            print("Goodbye!")
            break

        prompt = generate_prompt(data, user_question)
        answer = query_openai(prompt)
        print(f"AI Mechanic Assistant: {answer}")

if __name__ == "__main__":
    main()
```

## Instructions
1. Replace `your-openai-api-key` in the script with your actual OpenAI API key.
2. Ensure the `data/automotive_specs.json` file contains valid JSON data.
3. Run the program:
   ```bash
   python main.py
   ```
4. Ask questions like:
   - "What is the horsepower of the 2020 Honda Civic?"
   - "Does the Toyota Camry 2021 use gasoline?"
   
The AI will respond based on the JSON data provided.
