from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
from azure.mgmt.resource import ResourceManagementClient
from azure.mgmt.storage import StorageManagementClient
import os
import json
import dotenv

dotenv.load_dotenv()

STORAGE_CONNECTION_STRING = ""
CONTAINER_NAME = "scraping-scripts"
RESOURCE_GROUP = "MiaAI-Resources"

def load_data():
    print(f"Using Azure Resource Group: {RESOURCE_GROUP}")

    # Create credential object
    credential = DefaultAzureCredential()

    # Create the Resource Management client
    subscription_id = os.getenv('AZURE_SUBSCRIPTION_ID')
    resource_client = ResourceManagementClient(credential, subscription_id)
    storage_client = StorageManagementClient(credential, subscription_id)

    # List all resource groups
    print("\nResource Groups in subscription:")
    for group in resource_client.resource_groups.list():
        print(f"Group: {group.name} (Location: {group.location})")
        try:
            storage_client.storage_accounts.list_by_resource_group(group.name)
            print(f"\tStorage accounts in {group.name}:")
            for storage_account in storage_client.storage_accounts.list_by_resource_group(group.name):
                if storage_account.name == "motormindsdata":
                    print(f"\t\t- {storage_account.name}")
                    STORAGE_CONNECTION_STRING = storage_account.properties.primary_connection_string
        except Exception as e:
            print(f"Error listing storage accounts in {group.name}: {e}")
    
    print(f"Using Storage Connection String: {STORAGE_CONNECTION_STRING}")

if __name__ == "__main__":
    load_data()
