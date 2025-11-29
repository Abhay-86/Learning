import gspread
from google.oauth2.service_account import Credentials

SERVICE_ACCOUNT_FILE = "/Users/abhay/Documents/Learn/Learning/Credentials/ordinal-quarter-387322-7194228669a8.json"

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
client = gspread.authorize(creds)

SHEET_NAME = "Linkedin"

# Cache spreadsheet object here
SPREADSHEET = client.open(SHEET_NAME)

SHEET_MAPPING = {
    1: "HR",
    2: "accounts",
    3: "profile",
    4: "jobs",
}

def get_sheet_by_number(sheet_number):
    """Return gspread worksheet based on mapped sheet number."""
    sheet_name = SHEET_MAPPING.get(sheet_number)

    if not sheet_name:
        raise ValueError(f"No sheet mapping found for number: {sheet_number}")

    # Use cached spreadsheet instead of opening again
    return SPREADSHEET.worksheet(sheet_name)