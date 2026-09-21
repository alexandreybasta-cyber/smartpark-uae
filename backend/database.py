from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./smartpark.db")

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.close()


class Base(DeclarativeBase):
    pass


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_migrate_columns)


# Columns added after the first release. create_all() never alters existing
# tables, so we add them idempotently to keep an already-seeded database
# (smartpark.db) working after an upgrade.
_COLUMN_MIGRATIONS = [
    ("spots", "detection_source", "VARCHAR(20) DEFAULT 'simulated'"),
]


def _migrate_columns(connection):
    """Add any missing columns to pre-existing tables (idempotent)."""
    for table, column, ddl in _COLUMN_MIGRATIONS:
        existing = {
            row[1] for row in connection.exec_driver_sql(f"PRAGMA table_info({table})")
        }
        if column not in existing:
            connection.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}")


async def get_db():
    async with async_session() as session:
        yield session
