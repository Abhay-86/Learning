from core.db import Database
from utils.timestamps import updated_at

db1 = Database()
db2 = Database()

print("Testing Singleton Property...")
assert db1 is db2, "Database instances are not the same!"
if db1 is db2:
    print("Singleton test Abhay.")
print("Singleton test passed.")

table_check_sql = """
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'nucleus'
);
"""

exists = db1.query(table_check_sql)[0]["exists"]
print("nucleus table exists:", exists)

query = "SELECT * FROM nucleus;"

row = db1.query(sql=query)
print("First row from nucleus table:", row)
sql = """
INSERT INTO nucleus (name, variant)
VALUES ('abhay', '{"Abhay"}')
RETURNING *;
"""
inserted_row = db1.execute(sql=sql)
print("Inserted row:", inserted_row)

sql = """
DELETE FROM nucleus
WHERE id = 1
RETURNING *;
"""

deleted_row = db1.execute(sql=sql)
print("Deleted:", deleted_row)