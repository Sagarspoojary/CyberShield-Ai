import logging
import firebase_admin
from firebase_admin import credentials, auth
from app.config import settings

logger = logging.getLogger("uvicorn")

def initialize_firebase():
    if not firebase_admin._apps:
        try:
            if settings.FIREBASE_CREDENTIALS_PATH and settings.FIREBASE_CREDENTIALS_PATH != "":
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin SDK initialized successfully with certificate.")
            else:
                firebase_admin.initialize_app()
                logger.info("Firebase Admin SDK initialized with default credentials.")
        except Exception as e:
            logger.warning(f"Firebase Admin SDK initialization skipped or failed: {e}")

def verify_firebase_token(token: str):
    """
    Verifies Firebase ID token for protected API endpoints.
    """
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        return None
