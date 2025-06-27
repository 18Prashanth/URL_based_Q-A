from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print("GEMINI_API_KEY:", api_key)  # This should print your key, not None

if api_key is None:
    raise ValueError("GEMINI_API_KEY is not set in environment or .env file")

os.environ["GOOGLE_API_KEY"] = api_key