import csv
import urllib.parse
import json
import requests
from bs4 import BeautifulSoup
import os

BATCH_SIZE = 10  # Define the batch size for processing

SKIP_WORDS = [
    "Home",
    "About Operation CHARM"
    "Technical Service Bulletins",
    "Testing and Inspection",
    "Service and Repair",
    "Locations",
    "Specifications",
    "Description and Operation",
    "Adjustments",
    "Service Precautions",
    "Tools and Equipment",
    "A L L  Diagnostic Trouble Codes ( DTC )",
    "Diagnostic Trouble Codes",
    "Testing and Inspection",
    "Locations",
    "Diagrams",
    "Specifications",
    "Technical Service Bulletins",
    "Tools and Equipment",
    "Diagnostic Trouble Codes",
    "Maintenance",
    "Normal Service",
    "Severe Service"
]

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

def scrape_images(soup, url):
    """
    Extracts image sources from the BeautifulSoup object.
    Filters out SVG images and returns a list of absolute image URLs.
    """
    image_links = []
    for img in soup.find_all("img"):
        img_src = img.get("src")
        if img_src and not img_src.lower().endswith(".svg"):  # Exclude SVG images
            # Convert relative URLs to absolute
            img_src = requests.compat.urljoin(url, img_src)
            image_links.append(img_src)
    return image_links

def fetch_url_scrape_content(url):
    """
    Fetches and scrapes content from a given URL.
    Args: url (str): The URL to fetch and scrape.
    Returns: dict: A dictionary containing the text and images from the URL.
    """
    try:
        # Fetch the page content
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # Check for "Service and Repair" or "Testing and Inspection" links
        content_div = soup.find("div", class_="main")
        if not content_div:
            return {"text": "No content found", "images": []}

        # Check for pagination links
        pagination_links = []
        for link in content_div.find_all("a", href=True):
            if "Service and Repair" in link.text or "Testing and Inspection" in link.text:
                pagination_links.append(link['href'])

        # If matching links are found, process the first one
        if pagination_links:
            next_url = requests.compat.urljoin(url, pagination_links[0])
            print(f"Navigating to: {next_url}")
            response = requests.get(next_url)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            content_div = soup.find("div", class_="main")

        # Check for the "Expand All" button by its content
        expand_all_button = soup.find(lambda tag: tag.name == "button" and "Expand All (for easy ctrl-f)" in tag.get_text())
        if expand_all_button:
            # print("Expand All button found")
            return None
            # return {"text": "", "images": []}  # Return empty content if the button is found

        # Extract text and images
        content = content_div.get_text(strip=True) if content_div else "No content found"
        images = scrape_images(content_div, url) if content_div else []

        if not content and not images:
            return None

        return {"text": content.strip(), "images": images}

    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return {"text": "Error fetching content", "images": []}

def update_json_file(batch_data, output_file):
    # Load existing data if the file exists and is not empty
    if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
        with open(output_file, "r", encoding="utf-8") as json_file:
            try:
                existing_data = json.load(json_file)
            except json.JSONDecodeError:
                existing_data = {}
    else:
        existing_data = {}

    # Merge existing data with new batch data
    merge_dicts(existing_data, batch_data)
    data_to_save = existing_data

    with open(output_file, "w", encoding="utf-8") as json_file:
        json.dump(data_to_save, json_file, indent=4)

def merge_dicts(target, source):
    for key, value in source.items():
        if key in target:
            if isinstance(target[key], dict) and isinstance(value, dict):
                merge_dicts(target[key], value)
            else:
                target[key] = value
        else:
            target[key] = value

def build_json_from_csv(file_path):
    batch_data = {}
    batch_count = 0

    with open(file_path, "r", encoding="utf-8") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            link_name = row["Link Name"]
            url = row["URL"]

            if link_name in SKIP_WORDS:
                continue

            parsed_url = urllib.parse.urlparse(url)
            path_components = parsed_url.path.split('/')[1:]

            # Ensure the URL has enough components to form a hierarchy
            if len(path_components) < 4:
                continue

            make = urllib.parse.unquote(path_components[0])
            year = urllib.parse.unquote(path_components[1])
            model = urllib.parse.unquote(path_components[2])
            rest_of_path = [urllib.parse.unquote(component) for component in path_components[3:]]

            # Skip URLs ending with the car model or "Repair%20and%20Diagnosis/"
            if url.endswith(urllib.parse.quote(model) + '/') or url.endswith("Repair%20and%20Diagnosis/"):
                continue

            # Fetch content
            content = fetch_url_scrape_content(url)
            if content is None:
                continue

            # Initialize the hierarchy
            if make not in batch_data:
                batch_data[make] = {}
            if year not in batch_data[make]:
                batch_data[make][year] = {}
            if model not in batch_data[make][year]:
                batch_data[make][year][model] = {}

            current_level = batch_data[make][year][model]
            for component in rest_of_path:
                if component:  # Ensure the component is not empty
                    if component not in current_level:
                        current_level[component] = {}
                    current_level = current_level[component]

            current_level.update(content)

            batch_count += 1
            if batch_count >= BATCH_SIZE:
                save_batch_data(batch_data)
                batch_data.clear()  # Clear the batch data for the next batch
                batch_count = 0

    # Save any remaining data
    if batch_count > 0:
        save_batch_data(batch_data)

def save_batch_data(batch_data, base_folder="data"):
    for make, years in batch_data.items():
        for year, models in years.items():
            for model, data in models.items():
                # Create a specific folder for each make
                output_folder = os.path.join(base_folder, make)
                os.makedirs(output_folder, exist_ok=True)

                json_filename = f"{year}_{make}_{model}.json".replace(" ", "_").replace("/", "_")
                file_path = os.path.join(output_folder, json_filename)

                # Load existing data if the file exists
                if os.path.exists(file_path):
                    with open(file_path, "r", encoding="utf-8") as json_file:
                        try:
                            existing_data = json.load(json_file)
                        except json.JSONDecodeError:
                            existing_data = {}
                else:
                    existing_data = {}

                # Merge existing data with new data
                merge_dicts(existing_data, {make: {year: {model: data}}})

                # Save the merged data
                with open(file_path, "w", encoding="utf-8") as json_file:
                    json.dump(existing_data, json_file, indent=4)
                print(f"Data for {model} saved to {file_path}.")

def main():
    input_csv = "../../data/links/Toyota/Toyota_2013_repair_links.csv"  # Correct CSV file path
    output_json = "output.json"  # Output JSON file

    build_json_from_csv(input_csv)
    # print(f"JSON data has been saved to '{output_json}'.")

if __name__ == "__main__":
    main()