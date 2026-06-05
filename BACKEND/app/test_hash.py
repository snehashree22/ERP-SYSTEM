from auth.hashing import hash_password

password = "admin123"

hashed = hash_password(password)

print("ORIGINAL PASSWORD:", password)

print("HASHED PASSWORD:", hashed)