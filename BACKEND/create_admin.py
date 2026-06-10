"""
One-time script to create the FIRST ADMIN user directly in the database.
Run this once from your BACKEND directory:
    .\\venv\\Scripts\\python create_admin.py
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from app.database.database import SessionLocal
from app.models.user import User
from app.auth.hashing import hash_password

# ─────────────────────────────────────────────────────────
# ✏️  CHANGE THESE to your desired admin credentials
ADMIN_USERNAME = "admin"
ADMIN_EMAIL    = "admin@erp.com"
ADMIN_PASSWORD = "Admin@123"
# ─────────────────────────────────────────────────────────

def create_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if existing:
            print(f"⚠️  A user with email '{ADMIN_EMAIL}' already exists.")
            print(f"   Username : {existing.username}")
            print(f"   Role     : {existing.role}")
            if existing.role != "admin":
                existing.role = "admin"
                db.commit()
                print(f"✅ Upgraded '{existing.username}' to admin role!")
            else:
                print("   Already admin. No changes made.")
            return

        # Create new admin
        new_admin = User(
            username=ADMIN_USERNAME,
            email=ADMIN_EMAIL,
            hashed_password=hash_password(ADMIN_PASSWORD),
            role="admin"
        )
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)

        print("✅ Admin user created successfully!")
        print(f"   Username : {new_admin.username}")
        print(f"   Email    : {new_admin.email}")
        print(f"   Role     : {new_admin.role}")
        print(f"   Password : {ADMIN_PASSWORD}")
        print()
        print("🔑 You can now log in with these credentials.")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
