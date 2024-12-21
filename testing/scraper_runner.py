import json

# Function to load the existing JSON file
def load_json(file_path):
    try:
        with open(file_path, 'r') as file:
            data = json.load(file)
        return data
    except FileNotFoundError:
        # If the file doesn't exist, return an empty dictionary
        return {}

# Function to save the modified JSON back to the file
def save_json(data, file_path):
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)

# Function to append a new vehicle
def append_vehicle(file_path, year, vehicle_name, details):
    data = load_json(file_path)
    
    # If the year key doesn't exist, create it
    if year not in data:
        data[year] = {}
    
    # Add the new vehicle under the year and vehicle name
    data[year][vehicle_name] = details
    
    # Save the updated data to the file
    save_json(data, file_path)

# Example usage
file_path = '2001_repair_data.json'  # path to your JSON file

# New vehicle information to append
new_vehicle = "Civic EX Sedan L4-1998cc 2.0L DOHC VTEC MFI"
new_vehicle_details = {}

# Append the new vehicle to the year "2000"
append_vehicle(file_path, "2000", new_vehicle, new_vehicle_details)