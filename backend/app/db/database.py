import os
import logging
import pymysql
from sqlmodel import create_engine, Session, text
from contextlib import contextmanager
import time
import urllib.parse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get database connection details from environment variables
DB_HOST = os.environ.get("DB_HOST", "")
DB_PORT = os.environ.get("DB_PORT", "3306")
DB_NAME = os.environ.get("DB_NAME", "")
DB_USER = os.environ.get("DB_USER", "")
DB_PASS = os.environ.get("DB_PASS", "")


def test_raw_connection():
    """Test the raw MySQL connection without SQLAlchemy to diagnose issues."""
    logger.info(
        f"Testing direct MySQL connection to {DB_HOST}:{DB_PORT}/{DB_NAME} as {DB_USER}"
    )
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=int(DB_PORT),
            user=DB_USER,
            password=DB_PASS,
            database=DB_NAME,
            connect_timeout=5,
        )
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            logger.info(f"Direct MySQL connection successful: {result}")
        conn.close()
        return True
    except pymysql.Error as e:
        error_code = e.args[0] if len(e.args) > 0 else "unknown"
        if error_code == 1045:  # Access denied error
            logger.error(f"MySQL access denied. Check credentials for user {DB_USER}.")
        else:
            logger.error(f"MySQL connection error (code {error_code}): {e}")
        return False


# Log connection details for debugging (without password)
logger.info(
    f"Database connection info - Host: {DB_HOST}, Port: {DB_PORT}, DB: {DB_NAME}, User: {DB_USER}"
)

# Initialize engine as None
engine = None

# Check if all required environment variables are set
if not all([DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS]):
    logger.warning(
        "Missing database environment variables. Database features will be disabled."
    )
else:
    # Test raw connection first
    raw_connection_ok = test_raw_connection()

    if raw_connection_ok:
        # If raw connection works, try SQLAlchemy
        try:
            # Create database connection URL with proper escaping and formatting
            # Make sure we're properly URL encoding special characters in the password
            encoded_password = urllib.parse.quote_plus(DB_PASS)

            # Create the connection URL - use proper format to avoid the @ symbol issue
            DATABASE_URL = f"mysql+pymysql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

            logger.info(
                f"Creating SQLAlchemy engine with host: {DB_HOST}, port: {DB_PORT}, db: {DB_NAME}"
            )

            # Create SQLModel engine with minimal options
            engine = create_engine(
                DATABASE_URL,
                echo=False,
                pool_recycle=3600,  # Recycle connections after an hour
                pool_pre_ping=False,  # Disable connection testing
            )

            # Basic connection test using proper SQLAlchemy 2.0 syntax
            try:
                with engine.connect() as conn:
                    # Using text() to create a SQL expression
                    result = conn.execute(text("SELECT 1"))
                    logger.info(
                        f"SQLAlchemy database connection test successful: {result.fetchone()}"
                    )
            except Exception as e:
                logger.error(f"SQLAlchemy database connection test failed: {e}")
                # Keep the engine but mark the error
                engine._connection_error = str(e)

        except Exception as e:
            logger.error(f"Error creating database engine: {e}")
            engine = None
    else:
        logger.error("Skipping SQLAlchemy setup due to raw connection failure.")

# Context manager for database sessions with better error handling
@contextmanager
def get_session():
    """Get a database session if possible, otherwise return None."""
    if engine is None:
        logger.warning("Database engine is not configured. Returning None session.")
        yield None
        return

    # Check if we have a known connection error
    if hasattr(engine, "_connection_error"):
        logger.warning(
            f"Skipping database session due to known connection error: {engine._connection_error}"
        )
        yield None
        return

    session = None
    try:
        session = Session(engine)
        logger.debug("Database session created")
        yield session
    except pymysql.err.OperationalError as e:
        error_code = e.args[0] if len(e.args) > 0 else "unknown"
        if error_code == 1045:  # Access denied error
            logger.error(
                f"Database access denied. Check credentials for user {DB_USER}."
            )
        else:
            logger.error(f"Database operational error: {e}")
        yield None
    except Exception as e:
        logger.error(f"Database error: {e}")
        yield None
    finally:
        if session:
            logger.debug("Database session closed")
            session.close()
