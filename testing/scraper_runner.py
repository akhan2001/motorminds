import subprocess

def run_scraper_for_year(make, start_year, end_year):
    """
    Run the charm-li_scraper.py script for each year in the specified range.
    """
    for year in range(start_year, end_year + 1):
        print(f"Starting scraping for {make} {year}...")
        # Run the scraper script with the make and year as arguments
        try:
            result = subprocess.run(
                ["python", "charm-li_scraper.py", make, str(year)], 
                check=True,  # Raise an exception if the command fails
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            print(f"Successfully completed scraping for {make} {year}.")
        except subprocess.CalledProcessError as e:
            print(f"Error occurred while scraping {make} {year}: {e.stderr.decode()}")
            continue  # Move to the next year if there's an error

if __name__ == "__main__":
    # Define the make and the range of years
    make = "Toyota"
    start_year = 2000
    end_year = 2013

    # Run the scraper for each year in the range
    run_scraper_for_year(make, start_year, end_year)
