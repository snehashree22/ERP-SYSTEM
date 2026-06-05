from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

print("DATABASE URL:", DATABASE_URL)

try:
    engine = create_engine(DATABASE_URL)
    connection = engine.connect()

    print("DATABASE CONNECTED SUCCESSFULLY")

except Exception as e:
    print("ERROR:")
    print(e)