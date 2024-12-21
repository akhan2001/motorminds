import csv
import json
import argparse
import requests
import os
from bs4 import BeautifulSoup

# Global variables
make = ""
year = ""
SKIP_WORDS = [
    "Home",
    "About Operation CHARM",
    "Repair and Diagnosis",
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
]

# Setup argument parser
def parse_arguments():
    global make, year  # Declare them as global variables
    parser = argparse.ArgumentParser(description="Scrape vehicle models for a specific make from charm.li.")
    parser.add_argument('make', type=str, help='The make of the vehicle to scrape models for (e.g., "Acura", "Honda")')
    parser.add_argument('year', type=str, help='The year of the vehicle to scrape content for (e.g., "2000 - 2013")')

    # Parse the arguments and assign them to global variables
    args = parser.parse_args()
    make = args.make.lower()
    year = args.year

# Setup files
def setup_files():
    # Ensure the /data/make directory exists
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(current_dir, "data", make)  # Create the make/year-specific directory under /data

    try:
        os.makedirs(data_dir, exist_ok=True)
    except Exception as e:
        print(f"Error creating directory: {e}")
        exit(1)

    print(f"Directory created or already exists: {data_dir}")

    csv_file_path = os.path.join(current_dir, f"links\{make}", f"{make}_{year}_repair_links.csv")
    output_json_path = os.path.join(data_dir, f"{year}_{make}.json")
    print(f"CSV Path: {csv_file_path}")
    print(f"JSON Path: {output_json_path}")
    return csv_file_path, output_json_path

# Scrape for images relevant to the content
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

# Scrape content
def scrape_content(url):
    """
    Scrapes content and images from the given URL based on the specified process.
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
            return {"text": "", "images": []}  # Return empty content if the button is found

        # Extract text and images
        content = content_div.get_text(strip=True) if content_div else "No content found"
        images = scrape_images(content_div, url) if content_div else []

        return {"text": content.strip(), "images": images}

    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return {"text": "Error fetching content", "images": []}

# Function to process the CSV
def process_csv_and_generate_json(csv_file, output_json):
    """Processes the CSV file and generates a hierarchical JSON."""
    data = {}
    current_year = None
    current_model = None

    with open(csv_file, mode="r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            link_name = row["Link Name"]
            url = row["URL"]

            # Skip unwanted links
            if link_name in SKIP_WORDS:
                continue

            # Detect and set the current year
            if link_name.isdigit():
                current_year = link_name
                if current_year not in data:
                    data[current_year] = {}
                current_model = None  # Reset model when a new year starts
                continue

            # Detect and set the current model after a year is detected
            if current_year and not current_model:
                current_model = link_name
                data[current_year][current_model] = {}
                continue

            # Skip if it's the current model again (we only want repair links here)
            if link_name == current_model:
                continue

            # Process repair links under the current model
            if current_year and current_model:
                content = scrape_content(url)
                # Check if content is empty
                if not content["text"] and not content["images"]:
                    print(f"Skipped empty content for link: {link_name}")
                    continue  # Skip this entry if content is empty

                data[current_year][current_model][link_name] = content

                # Save the data after processing each repair link for the current model
                with open(output_json, mode="w", encoding="utf-8") as json_file:
                    json.dump(data, json_file, indent=4)
                    json_file.write("\n")  # To separate entries by model

    print(f"Data saved to {output_json}")

if __name__ == "__main__":
    parse_arguments()
    
    csv_file_path, output_json_path = setup_files()

    process_csv_and_generate_json(csv_file_path, output_json_path)