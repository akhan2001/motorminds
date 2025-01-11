import os
from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobServiceClient

def upload_blob_file(blob_service_client: BlobServiceClient, container_name: str, file_path: str, blob_name: str):
    # Get the container client
    container_client = blob_service_client.get_container_client(container_name)

    try:
        # Check if the container exists
        if not container_client.exists():
            print(f"Container '{container_name}' does not exist.")
            return

        # Upload the file
        with open(file_path, "rb") as data:
            container_client.upload_blob(name=blob_name, data=data, overwrite=True)
            print(f"File uploaded successfully to blob: {blob_name}")
    except Exception as e:
        print(f"Error uploading file: {e}")

if __name__ == "__main__":
    # Replace with your storage account URL
    account_url = "https://motormindsdata.blob.core.windows.net"
    credential = DefaultAzureCredential()

    # Create the BlobServiceClient object
    blob_service_client = BlobServiceClient(account_url, credential=credential)

    # Define container name, file path, and blob name
    container_name = "training-data"  # Replace with your container name
    file_path = "data/honda/2000/2000_repair_data.json"  # Replace with your file path
    blob_name = "transformed_data/honda/2000_honda_repair_data.json"  # Updated to include folder-like path

    # Call the function to upload the file
    upload_blob_file(blob_service_client, container_name, file_path, blob_name)
