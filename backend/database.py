import os
import sqlite3
import hashlib
import logging

logger = logging.getLogger("database")

DB_FILE = os.path.join(os.path.dirname(__file__), "users.db")

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the SQLite database and creates the users table."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                department TEXT NOT NULL DEFAULT 'AIML'
            )
        """)
        conn.commit()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        raise e
    finally:
        conn.close()

def _hash_password(password: str) -> str:
    """Generates a secure PBKDF2 hash for a password using a random salt."""
    salt = os.urandom(16)
    # Use 100,000 iterations of SHA-256
    hash_bytes = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"{salt.hex()}${hash_bytes.hex()}"

def _verify_password(stored_hash: str, password: str) -> bool:
    """Verifies a password against a stored PBKDF2 salt-hash combination."""
    try:
        salt_hex, hash_hex = stored_hash.split("$")
        salt = bytes.fromhex(salt_hex)
        expected_hash = bytes.fromhex(hash_hex)
        
        current_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
        return current_hash == expected_hash
    except Exception:
        return False

def db_register_user(name: str, email: str, password: str, department: str = "AIML") -> dict:
    """
    Registers a new user in the SQLite database.
    Returns the user data dict if successful, or raises a ValueError if the email already exists.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        pwd_hash = _hash_password(password)
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, department) VALUES (?, ?, ?, ?)",
            (name, email.lower().strip(), pwd_hash, department)
        )
        conn.commit()
        
        user_id = cursor.lastrowid
        return {
            "id": user_id,
            "name": name,
            "email": email,
            "department": department
        }
    except sqlite3.IntegrityError:
        logger.warning(f"Registration failed: Email {email} already exists.")
        raise ValueError("Email already registered.")
    except Exception as e:
        logger.error(f"Error registering user: {str(e)}")
        raise e
    finally:
        conn.close()

def db_verify_user(email: str, password: str) -> dict:
    """
    Verifies user credentials.
    Returns the user data dict if valid, or None if validation fails.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email, password_hash, department FROM users WHERE email = ?", (email.lower().strip(),))
        row = cursor.fetchone()
        if not row:
            return None
            
        stored_hash = row["password_hash"]
        if _verify_password(stored_hash, password):
            return {
                "id": row["id"],
                "name": row["name"],
                "email": row["email"],
                "department": row["department"]
            }
        return None
    except Exception as e:
        logger.error(f"Error verifying user: {str(e)}")
        return None
    finally:
        conn.close()
