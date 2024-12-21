import requests
import argparse
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import os
import csv

# Global variables
make = ""
year = ""
# List of folders to skip
SKIP_FOLDERS = [
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

# Setup argument parser
def parse_arguments():
    global make, year  # Declare them as global variables
    parser = argparse.ArgumentParser(description="Scrape vehicle models for a specific make from charm.li.")
    parser.add_argument('make', type=str, help='The make of the vehicle to scrape models for (e.g., "Acura", "Honda")')
    parser.add_argument('year', type=str, help='The year of the vehicle to scrape content for (e.g., "2000 - 2013")')

    # Parse the arguments and assign them to global variables
    args = parser.parse_args()
    make = args.make
    year = args.year

def scrape_vehicle_content():
    base_url = "https://charm.li/"  # Replace with the correct URL for the website
    try:
        # Fetch the page
        response = requests.get(base_url)
        response.raise_for_status()  # Raise an error for HTTP issues
        soup = BeautifulSoup(response.text, "html.parser")

        # Find all <ul><li><a> tags
        links = soup.select("ul li a")
        found = False

        for link in links:
            make_name = link.text.strip()
            if make.lower() in make_name.lower():
                make_url = urljoin(base_url, link.get('href'))
                print(f"Found make: {make_name}, URL: {make_url}")

                # Fetch and process the make's specific page
                process_main_page(make_url)
                found = True
                break

        if not found:
            print(f"Make '{make}' not found on the website.")

    except requests.exceptions.RequestException as e:
        print(f"Error accessing the website: {e}")

def process_main_page(make_url):
    try:
        response = requests.get(make_url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        print(f"Scraping data for {make} from {make_url}...")
        year_links = soup.select("ul li a")  # Extract all year links
        for link in year_links:
            year_name = link.text.strip()
            year_href = urljoin(make_url, link.get('href'))

            if year == year_name:  # Match the specified year
                print(f"Found year: {year_name}, URL: {year_href}")
                scrape_year_page(year_href)  # Connect to year page and scrape links
                return

        print(f"Year '{year}' not found for make '{make}'.")

    except requests.exceptions.RequestException as e:
        print(f"Error accessing the make page: {e}")

def scrape_year_page(year_url):
    try:
        response = requests.get(year_url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        print(f"Scraping models from: {year_url}")
        # Select only <a> tags within the div with class "main"
        links = soup.select("div.main a")

        for link in links:
            href = link.get('href')
            if href:
                full_url = urljoin(year_url, href)
                print(f"Model Link: {full_url}")

                # Go to the model page and scrape links from it
                scrape_model_page(full_url)

    except requests.exceptions.RequestException as e:
        print(f"Error accessing the year page: {e}")

def scrape_model_page(model_url):
    """
    Scrape the main model page to find the specific 'Repair and Diagnosis' link
    and process it further.
    """
    try:
        response = requests.get(model_url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        print(f"Scraping details from: {model_url}")

        # Find the specific 'Repair and Diagnosis' link
        repair_link = soup.select_one("a[href='Repair%20and%20Diagnosis/']")
        if repair_link:
            href = repair_link.get("href")
            if href:
                full_url = urljoin(model_url, href)
                print(f"Found 'Repair and Diagnosis' Link: {full_url}")
                # Call the function to scrape the 'Repair and Diagnosis' page
                scrape_repair_page(full_url)
        else:
            print("No 'Repair and Diagnosis' link found on this page.")

    except requests.exceptions.RequestException as e:
        print(f"Error accessing the model page: {e}")

def scrape_repair_page(repair_url):
    """
    Scrape the 'Repair and Diagnosis' page and extract all links.
    Skip links belonging to specific folders like 'Testing and Inspection', 'Locations', etc.
    Call the save_links_to_csv function to save the links into a CSV file.
    """

    try:
        response = requests.get(repair_url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        print(f"Scraping 'Repair and Diagnosis' details from: {repair_url}")

        # Extract all <a> tags within this page
        repair_links = soup.select("a")

        # Prepare a list to store the links
        links = []

        # Collect the links
        for link in repair_links:
            href = link.get("href")
            if href:
                full_url = urljoin(repair_url, href)
                link_name = link.get_text(strip=True)

                # Skip links that match the folders to skip
                if any(folder.lower() in full_url.lower() for folder in SKIP_FOLDERS):
                    print(f"Skipping link: {full_url} (belongs to a skipped folder)")
                    continue

                # Append the link name and URL as a tuple to the links list
                links.append((link_name, full_url))

        # Call the function to save the links to CSV
        save_links_to_csv(links)

    except requests.exceptions.RequestException as e:
        print(f"Error accessing the repair page: {e}")

def save_links_to_csv(links):
    """
    Append the extracted links into a CSV file with the make and year in the filename.
    The file will be saved in the /data/make directory of the working directory.
    """
    # Ensure the /data/make directory exists
    data_dir = os.path.join("./links", make)  # Create the make-specific directory under /data
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

    # Create the CSV filename with make and year
    csv_filename = os.path.join(data_dir, f"{make}_{year}_repair_links.csv")

    # Check if the file already exists to decide whether to write the header or not
    file_exists = os.path.exists(csv_filename)

    # Open the CSV file in append mode
    with open(csv_filename, mode="a", newline="", encoding="utf-8") as csvfile:
        fieldnames = ["Link Name", "URL"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        # Write the header row only if the file is being created (not appended to)
        if not file_exists:
            writer.writeheader()

        # Write each link to the CSV file
        for link_name, link_url in links:
            writer.writerow({"Link Name": link_name, "URL": link_url})

    print(f"Links appended to {csv_filename}")

# Example usage
if __name__ == "__main__":
    parse_arguments()
    print(f"Make: {make}, Year: {year}")
    
    scrape_vehicle_content()
