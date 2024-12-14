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
    data_dir = os.path.join(current_dir, "data", make, year)  # Create the make/year-specific directory under /data

    try:
        os.makedirs(data_dir, exist_ok=True)
    except Exception as e:
        print(f"Error creating directory: {e}")
        exit(1)

    print(f"Directory created or already exists: {data_dir}")

    csv_file_path = os.path.join(current_dir, f"links\{make}", f"{make}_{year}_repair_links.csv")
    output_json_path = os.path.join(data_dir, f"{year}_repair_data.json")
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
def scrape_content(url, depth=0, max_depth=2):
    """
    Scrapes content from the <div class='main'> tag of the URL.
    If 'Service and Repair' or 'Testing and Inspection' links are found, follows them recursively.
    Limits the recursion depth to prevent infinite loops.
    Excludes first-page content and <h1> tags.
    Includes images as part of the scraped content.
    """
    try:
        # Check recursion depth
        if depth > max_depth:
            return {
                "text": f"Max recursion depth ({max_depth}) reached. Skipping further links.",
                "images": []
            }

        # Fetch the page content
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # Extract content from the <div class="main">
        content_div = soup.find("div", class_="main")
        if not content_div:
            return {"text": "No content found", "images": []}

        # Remove the <h1> tag if present
        h1_tag = content_div.find("h1")
        if h1_tag:
            h1_tag.decompose()  # Remove the <h1> tag entirely

        # Extract text content
        content = content_div.get_text(strip=True)

        # Extract images from the current page
        images = scrape_images(content_div, url)

        # Skip the first page content if depth == 0
        if depth == 0:
            content = ""  # Discard the first page content

        # Look for pagination links with the desired text
        pagination_links = []
        for link in content_div.find_all("a", href=True):
            if "Service and Repair" in link.text or "Testing and Inspection" in link.text:
                pagination_links.append(link['href'])

        # Recursively follow the pagination links
        for link in pagination_links:
            full_url = requests.compat.urljoin(url, link)  # Resolve relative URLs
            print(f"Processing link: {full_url}")

            # Fetch and scrape the child page content
            response = requests.get(full_url)
            response.raise_for_status()
            child_soup = BeautifulSoup(response.text, "html.parser")

            child_content = scrape_content(full_url, depth=depth + 1, max_depth=max_depth)
            
            # Extract images from the child page
            child_images = scrape_images(child_soup.find("div", class_="main"), full_url)
            images.extend(child_images)

            if child_content["text"].strip() and child_content["text"] != "No content found":
                # Append child content with the separator
                content += f"\n\n---\n\n{child_content['text']}"
                images.extend(child_content["images"])  # Collect images from child links

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