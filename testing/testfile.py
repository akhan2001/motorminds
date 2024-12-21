import requests
from bs4 import BeautifulSoup
import os
import csv

def scrape_images(content_div, base_url):
    """
    Extracts image URLs from a given content div and resolves relative URLs.
    """
    images = []
    for img_tag in content_div.find_all("img", src=True):
        img_url = requests.compat.urljoin(base_url, img_tag["src"])
        images.append(img_url)
    return images

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

        # Check for the "Expand All" button
        expand_all_button = soup.find("button", id="expand-all", class_="hidden")
        if expand_all_button:
            print("Skipping page: Expand All button found")
            return {"text": "Skipped due to Expand All button", "images": []}

        # Extract text and images
        content = content_div.get_text(strip=True) if content_div else "No content found"
        images = scrape_images(content_div, url) if content_div else []

        return {"text": content.strip(), "images": images}

    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return {"text": "Error fetching content", "images": []}

# Example process for reading from a CSV and scraping each URL
def process_csv(csv_file_path):
    """
    Reads URLs from a CSV file and processes them using scrape_content.
    """
    results = []
    try:
        with open(csv_file_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                if row:  # Ensure the row is not empty
                    url = row[0]
                    print(f"Processing URL: {url}")
                    result = scrape_content(url)
                    results.append({"url": url, "result": result})
    except Exception as e:
        print(f"Error reading CSV file: {e}")
    return results

# Example usage
if __name__ == "__main__":
    csv_path = "path_to_csv.csv"  # Replace with your CSV file path
    scraped_data = process_csv(csv_path)
    for data in scraped_data:
        print(data)
