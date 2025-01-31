import csv
import urllib.parse
import json
import requests
from bs4 import BeautifulSoup
import os

END_SEGMENT = "Repair and Diagnosis"

SKIP_WORDS = [
    "Home",
    "About Operation CHARM",
    "2000",
    "Acura"
]

BATCH_SIZE = 100  # Number of rows to process in each batch

def scrape_content(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        content_div = soup.find("div", class_="main")
        if not content_div:
            return {"text": "No content found", "images": []}

        content = content_div.get_text(strip=True)
        images = [img.get("src") for img in soup.find_all("img") if img.get("src")]

        return {"text": content.strip(), "images": images}

    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return {"text": "Error fetching content", "images": []}

def build_json_from_rows(rows):
    data = {}

    for row in rows:
        link_name = row["Link Name"]
        url = row["URL"]

        if link_name in SKIP_WORDS:
            continue

        parsed_url = urllib.parse.urlparse(url)
        path_components = parsed_url.path.split('/')[1:]

        # Check if the URL path is longer than the base path and ends with the specified segment
        if url.endswith(urllib.parse.quote(END_SEGMENT) + '/'):
            continue

        current_level = data
        for component in path_components:
            decoded_component = urllib.parse.unquote(component)
            if decoded_component:  # Ensure the component is not empty
                if decoded_component not in current_level:
                    current_level[decoded_component] = {}
                current_level = current_level[decoded_component]

        content = scrape_content(url)
        current_level.update(content)

    return data

def append_to_json(file_path, batch_data):
    """Append batch data to a JSON file."""
    if os.path.exists(file_path):
        # Load existing data and merge with new batch
        with open(file_path, "r", encoding="utf-8") as json_file:
            existing_data = json.load(json_file)
    else:
        # Start with an empty dictionary if the file doesn't exist
        existing_data = {}

    # Merge new data into existing data
    def merge_dicts(d1, d2):
        for key, value in d2.items():
            if isinstance(value, dict) and key in d1 and isinstance(d1[key], dict):
                merge_dicts(d1[key], value)
            else:
                d1[key] = value

    merge_dicts(existing_data, batch_data)

    # Save updated data back to the JSON file
    with open(file_path, "w", encoding="utf-8") as json_file:
        json.dump(existing_data, json_file, indent=4)

def process_csv_in_batches(input_csv, output_json):
    with open(input_csv, "r", encoding="utf-8") as csv_file:
        reader = csv.DictReader(csv_file)
        rows = []
        for row in reader:
            rows.append(row)
            if len(rows) == BATCH_SIZE:
                # Process the batch
                print(f"Processing a batch of {BATCH_SIZE} rows...")
                batch_data = build_json_from_rows(rows)
                append_to_json(output_json, batch_data)
                print(f"Batch appended to '{output_json}'.")
                rows = []

        # Process any remaining rows
        if rows:
            print("Processing final batch...")
            batch_data = build_json_from_rows(rows)
            append_to_json(output_json, batch_data)
            print(f"Final batch appended to '{output_json}'.")

def main():
    input_csv = "../../data/obselete/test_file_repair_data.csv"  # Correct CSV file path
    output_json = "output.json"  # Output JSON file

    process_csv_in_batches(input_csv, output_json)
    print(f"All data has been processed and appended to '{output_json}'.")

if __name__ == "__main__":
    main()
