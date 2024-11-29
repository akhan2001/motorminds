import json
import time
import argparse
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import undetected_chromedriver as uc
import gc
import os  # Import for directory creation

# Setup argument parser
def parse_arguments():
    parser = argparse.ArgumentParser(description="Scrape vehicle models for a specific make and model.")
    parser.add_argument('make', type=str, help='The make of the vehicle to scrape models for (e.g., "Acura", "Honda")')
    parser.add_argument('model', type=str, help='The model of the vehicle to scrape content for (e.g., "CSX", "TLX")')
    return parser.parse_args()

# Set up Selenium WebDriver
def setup_driver():
    options = Options()
    options.add_argument("--disable-blink-features=AutomationControlled")  # Make automation less detectable
    options.add_argument("--start-maximized")  # Start with a maximized window
    driver = uc.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    return driver

# Function to get the make page
def get_make_page(driver, make):
    # Open the main page
    driver.get("https://cardiagn.com/")
    
    # Wait for manual handling of Cloudflare
    print("Waiting for manual interaction with Cloudflare (10 seconds)...")
    time.sleep(10)
    
    # Wait for the page to load and get vehicle makes
    print("Waiting for the page to load...")
    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "ul.menu.centered-categories li a"))
    )

    makes = driver.find_elements(By.CSS_SELECTOR, "ul.menu.centered-categories li a")
    print(f"Vehicle makes found. Searching for '{make}'...")

    # Click the link for the desired make
    for vehicle_make in makes:
        if vehicle_make.text.strip().lower() == make.lower():
            print(f"Found '{make}'. Clicking the link...")
            vehicle_make.click()
            break
    else:
        print(f"Error: '{make}' not found.")
        driver.quit()
        return False
    
    # Confirm that the correct make page is loaded
    print(f"Confirming {make} page is loaded...")
    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "p#breadcrumbs .breadcrumb_last strong"))
    )
    breadcrumb_text = driver.find_element(By.CSS_SELECTOR, "p#breadcrumbs .breadcrumb_last strong").text.strip()
    if breadcrumb_text.lower() == make.lower():
        print(f"Confirmed: The page is on {make}.")
        return True
    else:
        print(f"Error: The page is not on {make}.")
        driver.quit()
        return False

# Function to get the model page
def get_model_page(driver, model):
    print(f"Searching for the model '{model}'...")

    # Find all models on the current page
    models = driver.find_elements(By.CSS_SELECTOR, "div.subcategory-wrapper ul.menu.centered-categories a")
    
    # Click the desired model
    for vehicle_model in models:
        if vehicle_model.text.strip().lower() == model.lower():
            print(f"Found '{model}'. Clicking the link...")
            vehicle_model.click()
            
            # Wait for the page to load and find the breadcrumb
            WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "span.breadcrumb_last strong"))
            )
            
            # Get the breadcrumb text and confirm the model matches
            breadcrumb_text = driver.find_element(By.CSS_SELECTOR, "span.breadcrumb_last strong").text.strip()
            if model.lower() in breadcrumb_text.lower():
                print(f"Successfully navigated to the page for '{model}'.")
                return True
            else:
                print(f"Error: The page does not match the model '{model}'. Breadcrumb shows '{breadcrumb_text}'.")
                return False
            
    print(f"Error: '{model}' not found.")
    return False

# Function to get the content and links from the specified section and save to JSON
def get_additional_links(driver):
    print("Waiting for the page content to load for additional links...")
    
    # Wait until the content with the <div class="entry-content clearfix"> is loaded
    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "div.entry-content.clearfix"))
    )
    
    # Find the <div> that contains the list
    content_div = driver.find_element(By.CSS_SELECTOR, "div.entry-content.clearfix")
    
    # Find all <a> tags within this div
    links = content_div.find_elements(By.TAG_NAME, "a")
    
    # Extract the href and text content for each link
    additional_links = []
    for link in links:
        href = link.get_attribute("href")
        text = link.text.strip()
        if href:
            additional_links.append({"text": text, "url": href})
    
    return additional_links

# Function to print the content of the model page (only <h3> and <p>)
def print_page_content(driver):
    print("Waiting for model page to load...")
    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.ID, "main-content"))  # Wait for the main content div
    )
    
    # Find the main content div
    main_content = driver.find_element(By.ID, "main-content")
    
    # Find the h3 elements with the specified class
    h3_elements = main_content.find_elements(By.CSS_SELECTOR, "h3.entry-title.content-list-title")
    
    # Find the p elements in the content-list-excerpt div
    p_elements = main_content.find_elements(By.CSS_SELECTOR, "div.content-list-excerpt p")
    
    # Initialize the dictionary to hold the content data
    content_data = {}

    # Loop through h3 and corresponding p elements, ensuring they match up by order
    for h3, p in zip(h3_elements, p_elements):
        header_text = h3.text.strip()
        paragraph_text = p.text.strip()
        
        # Get the href link from the <a> tag with rel="bookmark"
        link_element = h3.find_element(By.CSS_SELECTOR, 'a[rel="bookmark"]')
        link = link_element.get_attribute("href")
        
        # Assuming the header text contains the make and model (e.g., "2006-2009 Acura CSX")
        make, model = header_text.split(" ", 1)  # Split the header into make and model
        
        # Adding the data in the format of the desired JSON structure, including the link
        content_data[make.lower() + " " + model.lower()] = {
            "header": header_text,
            "p": paragraph_text,
            "link": link
        }
    
    # Now, get additional links from the page and add them to the content data
    additional_links = get_additional_links(driver)
    content_data["additional_links"] = additional_links
    # Save the data to a JSON file with a dynamic filename based on make and model
    directory = f"vehicle_data/{make.lower()}/"
    os.makedirs(directory, exist_ok=True)  # Create the directory if it doesn't exist

    filename = f"{directory}{model.lower().replace(' ', '_')}_content_data.json"
    with open(filename, "w") as json_file:
        json.dump(content_data, json_file, indent=4)

    print(f"Content data saved to '{filename}'.")

# Main function
def scrape_vehicle_content(make, model):
    driver = setup_driver()

    try:
        # Get the make page
        if not get_make_page(driver, make):
            return
        
        # Get the model page
        if not get_model_page(driver, model):
            return
        
        # Print the content of the model page
        print_page_content(driver)

    finally:
        # Quit the driver
        print("Closing the browser...")
        driver.quit()

if __name__ == "__main__":
    # Parse the command-line arguments
    args = parse_arguments()

    # Scrape vehicle content for the specified make and model
    scrape_vehicle_content(args.make, args.model)
    gc.collect()
