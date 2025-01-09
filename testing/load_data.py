from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobServiceClient
from azure.mgmt.resource import ResourceManagementClient
from azure.mgmt.storage import StorageManagementClient
import os
import dotenv

# Load environment variables
dotenv.load_dotenv()

CONTAINER_NAME = "scraping-scripts"
RESOURCE_GROUP = "MiaAI-Resources"

def load_data():
    print(f"Using Azure Resource Group: {RESOURCE_GROUP}")

    # Create credential object
    credential = DefaultAzureCredential()

    # Get subscription ID from environment variables
    subscription_id = os.getenv('AZURE_SUBSCRIPTION_ID')
    if not subscription_id:
        print("Error: AZURE_SUBSCRIPTION_ID is not set in the environment.")
        return

    # Create Azure clients
    resource_client = ResourceManagementClient(credential, subscription_id)
    storage_client = StorageManagementClient(credential, subscription_id)

    motor_minds_account = None
    storage_connection_string = None

    # List all resource groups
    print("\nResource Groups in subscription:")
    for group in resource_client.resource_groups.list():
        print(f"Group: {group.name} (Location: {group.location})")
        try:
            print(f"\tStorage accounts in {group.name}:")
            for storage_account in storage_client.storage_accounts.list_by_resource_group(group.name):
                if storage_account.name == "motormindsdata":
                    print(f"\t\t- {storage_account.name}")
                    motor_minds_account = storage_account
                    # Retrieve keys to construct connection string
                    keys = storage_client.storage_accounts.list_keys(group.name, storage_account.name)
                    key = keys.keys[0].value
                    storage_connection_string = (
                        f"DefaultEndpointsProtocol=https;"
                        f"AccountName={storage_account.name};"
                        f"AccountKey={key};"
                        f"EndpointSuffix=core.windows.net"
                    )
        except Exception as e:
            print(f"Error listing storage accounts in {group.name}: {e}")

    print(storage_connection_string)

    # if motor_minds_account and storage_connection_string:
    #     print("\nMotorMinds Storage Account Details:")
    #     print(f"Name: {motor_minds_account.name}")
    #     print(f"Location: {motor_minds_account.location}")
    #     print(f"Connection String: {storage_connection_string}")

    #     # Connect to the Blob Storage container
    #     blob_service_client = BlobServiceClient.from_connection_string(storage_connection_string)
    #     container_client = blob_service_client.get_container_client(CONTAINER_NAME)
        
    #     # List blobs in the container
    #     print(f"\nBlobs in container '{CONTAINER_NAME}':")
    #     try:
    #         for blob in container_client.list_blobs():
    #             print(f"- {blob.name}")
    #     except Exception as e:
    #         print(f"Error listing blobs in container '{CONTAINER_NAME}': {e}")
    # else:
    #     print("\nMotorMinds storage account not found or connection string unavailable.")

if __name__ == "__main__":
    load_data()
