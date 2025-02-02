import os
import json
from supabase import create_client, Client
import dotenv

dotenv.load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

# print(f"Supabase URL: {url}")
# print(f"Supabase Key: {key}")

# Initialize Supabase client
supabase: Client = create_client(url, key)

def process_directory(json_dir_path, table_name):
    # Iterate through each file in the directory
    for filename in os.listdir(json_dir_path):
        if filename.endswith('.json'):
            json_file_path = os.path.join(json_dir_path, filename)
            process_file(json_file_path, table_name)

def process_file(json_file_path, table_name):
    with open(json_file_path, 'r') as file:
        data = json.load(file)

    # Extract data
    for make, years in data.items():
        for year, models in years.items():
            for model, details in models.items():
                repair_and_diagnosis = details.get("Repair and Diagnosis", {})

                # Insert each section as a separate row
                for repair_section, sections in repair_and_diagnosis.items():
                    for section, content in sections.items():
                        row = {
                            "year": year,
                            "make": make,
                            "model": model,
                            "repair_and_diagnosis": repair_section,
                            "section": section,
                            "content": content
                        }

                        try:
                            # Insert data into the table
                            response = supabase.table(table_name).insert(row).execute()
                            # print(response)
                        except Exception as e:
                            print("Error:", e)
    print(f"Processed file: {json_file_path}")

def delete_all_rows():
    try:
        # Delete all rows in the table
        response = supabase.table('test-table').delete().eq('id', 1).execute()
        print("All rows deleted:", response)
    except Exception as e:
        print("Error deleting rows:", e)

def delete_column(columnName):
    try:
        response = supabase.rpc('delete_column', {'column_name': columnName})
        print("Column deleted:", response)
    except Exception as e:
        print("Error deleting column:", e)

def remove_duplicate_rows():
    try:
        # Fetch all rows
        response = supabase.table('test-table').select('*').execute()
        rows = response.data

        # Use a set to track unique rows
        seen = set()
        duplicates = []

        for row in rows:
            # Convert the row to a tuple of sorted items to make it hashable
            row_tuple = tuple(sorted((key, json.dumps(value, sort_keys=True)) for key, value in row.items() if key != 'id'))
            if row_tuple in seen:
                duplicates.append(row['id'])
            else:
                seen.add(row_tuple)

        # Delete duplicate rows
        for duplicate_id in duplicates:
            supabase.table('test-table').delete().eq('id', duplicate_id).execute()

        print(f"Removed {len(duplicates)} duplicate rows.")
    except Exception as e:
        print("Error removing duplicates:", e)

def main():
    # Process all files in a directory
    json_dir_path = '../scripts/data/Toyota/'
    table_name = 'toyota-table'
    process_directory(json_dir_path, table_name)

    # Delete all rows in the table
    # delete_all_rows()

    # Delete a column in the table
    # columnName = 'repair-and-diagnosis'
    # delete_column(columnName)

    # Process a specific JSON file
    # specific_file_path = '../scripts/data/Acura/2013_Acura_ZDX_V6-3.7L_(J37A5).json'
    # process_file(specific_file_path)

    # Remove duplicate rows
    # remove_duplicate_rows()

    print("\nDone")


if __name__ == "__main__":
    main()
