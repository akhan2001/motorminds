import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import os

# Load the JSON data
with open('car_brands_links.json', 'r') as file:
    car_brands_data = json.load(file)

# Directory to save the scraped data
output_dir = "scraped_data"
os.makedirs(output_dir, exist_ok=True)

def scrape_and_save(url, general_model, output_dir):
    """Fetch a URL and save its content to a file."""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        # Extract the model name from <h2> (assuming each model is wrapped in <h2>)
        model_name = general_model

        # Extract all <p> and <a href> content under the <h2> model name
        content = ""
        paragraphs = soup.find_all('p')
        for para in paragraphs:
            # Append paragraph text
            content += para.get_text(strip=True) + "\n"
            # Also extract any <a> links if present
            links = para.find_all('a', href=True)
            for link in links:
                content += f"Link: {link['href']} - {link.get_text(strip=True)}\n"

        # Save content to a file named after the model
        model_dir = os.path.join(output_dir, model_name[:30])  # Shorten folder name
        os.makedirs(model_dir, exist_ok=True)

        file_name = f"{model_name[:30]}.txt"  # Use general model name for the filename
        file_path = os.path.join(model_dir, file_name)

        if os.path.exists(file_path):
            with open(file_path, 'a', encoding='utf-8') as file:  # Append if file already exists
                file.write("\n" + content)  # Append scraped content
            print(f"Appended content to: {file_path}")
        else:
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(content)
            print(f"Scraped and saved: {file_path}")

    except requests.RequestException as e:
        print(f"Error scraping {url}: {e}")

def is_file_link(url):
    """Check if the URL points to a file based on common file extensions."""
    file_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar']
    return any(url.lower().endswith(ext) for ext in file_extensions)

# Process each brand
for brand_name, brand_data in car_brands_data.items():
    base_url = brand_data.get("brand_url", "")
    links = brand_data.get("links", [])

    # Group the links by general model (determine the model name based on URL or link structure)
    model_links = {}

    for link in links:
        # Resolve relative URLs to absolute URLs
        if link.startswith("https:"):
            full_url = link
        else:
            full_url = urljoin(base_url, link)

        # Skip file links
        if is_file_link(full_url):
            print(f"Skipping file link: {full_url}")
            continue

        # Scrape the content for each link
        response = requests.get(full_url)
        soup = BeautifulSoup(response.content, 'html.parser')

        # Find all <h2> tags (which contain the model name)
        h2_tags = soup.find_all('h2')

        for h2_tag in h2_tags:
            general_model = h2_tag.get_text(strip=True)

            # Add the link to the general model's list
            if general_model not in model_links:
                model_links[general_model] = []
            model_links[general_model].append(full_url)

    # Scrape each model and save all content in one file
    for general_model, model_urls in model_links.items():
        for url in model_urls:
            scrape_and_save(url, general_model, output_dir)

print("Scraping complete.")
