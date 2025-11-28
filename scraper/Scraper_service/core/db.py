import psycopg2
import psycopg2.extras
from threading import Lock
from Scraper_service.config.db_config import DB_CONFIG


class Database:
    """
    Singleton Database Class

    - Ensures only ONE PostgreSQL connection exists per service.
    - Thread-safe: multiple threads/files can safely access the same instance.
    - Each query uses a NEW cursor (required by psycopg2 for safety).
    - Allows executing raw SQL strings directly.
    """

    _instance = None
    _lock = Lock()

    def __new__(cls):
        """
        Create or return the single Database instance.
        Uses a lock to ensure thread safety.
        """
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:  
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """
        Initialize the PostgreSQL connection only once.
        Any further calls to Database() reuse the same connection.
        """
        if hasattr(self, "_initialized") and self._initialized:
            return

        self.conn = psycopg2.connect(
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            database=DB_CONFIG["database"],
        )
        self.conn.autocommit = True  
        self._initialized = True

    def query(self, sql: str):
        """
        Execute a SELECT query and return all rows as dictionaries.

        Example:
            db.query("SELECT * FROM nucleus;")
        """
        with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql)
            return cur.fetchall()

    def execute(self, sql: str, params: tuple = None):
        """
        Execute INSERT/UPDATE/DELETE and return one row if available.
        Supports parameterized queries for security.

        Example:
            db.execute("INSERT INTO nucleus (name) VALUES (%s) RETURNING *;", ('test',))
            db.execute("INSERT INTO nucleus (name) VALUES ('x') RETURNING *;")
        """
        with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            if params:
                cur.execute(sql, params)
            else:
                cur.execute(sql)
            try:
                return cur.fetchone()
            except psycopg2.ProgrammingError:
                return None
