import json

def add_repair(file_path, year, model, repair_name, repair_data):
    """
    Adds a repair entry to the specified model in the JSON file.
    
    :param file_path: Path to the JSON file
    :param year: Year of the vehicle (e.g., "2000")
    :param model: Model of the vehicle (e.g., "Integra GS Coupe L4-1834cc 1.8L DOHC MFI")
    :param repair_name: Name of the repair (e.g., "Crankshaft Pulley Torque")
    :param repair_data: Dictionary containing the repair data (text and images)
    """
    try:
        # Load existing JSON data
        with open(file_path, "r", encoding="utf-8") as f:
            json_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        # Start with an empty structure if the file does not exist or is malformed
        json_data = {}

    # Ensure the hierarchy exists
    if year not in json_data:
        json_data[year] = {}
    if model not in json_data[year]:
        json_data[year][model] = {}

    # Add or update the repair
    json_data[year][model][repair_name] = repair_data

    # Save back to the file
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=4)
    print(f"Added/Updated repair '{repair_name}' under {year} -> {model}.")

# Example usage
file_path = "testfile.json"
year = "2000"
model = "Integra GS Coupe L4-1834cc 1.8L DOHC MFI"
repair_name = "Crankshaft Pulley Torque"
repair_data = {
    "text": "1. Remove the crankshaft pulley bolt using a suitable tool.\n2. Align the pulley marks with the engine timing marks.\n3. Tighten the pulley bolt to 130 lb-ft (176 Nm).",
    "images": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
    ]
}

add_repair(file_path, year, model, repair_name, repair_data)