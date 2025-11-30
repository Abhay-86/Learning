from Scraper_service.core.db import Database
from difflib import SequenceMatcher
from Scraper_service.utils.timestamps import generate_nucleus_code, updated_at, normalize_name
DB = Database()

def get_first_two_words(name: str) -> str:
    """Extract first two words from normalized name."""
    words = name.split()
    return ' '.join(words[:2]) if len(words) >= 2 else name

def check(name: str):
    """
    Check if company exists in nucleus table with fuzzy matching.
    
    Logic:
    1. Exact match -> return nucleus record
    2. First two words match -> search within those companies for 80%+ similarity
    3. If match found -> update variant array with new name and return updated record
    4. No match -> return None (will insert as new)
    """
    normalized_name = normalize_name(name)
    
    # 1. Exact match query
    sql = f"SELECT * FROM nucleus WHERE name = '{normalized_name}';"
    exact_results = DB.query(sql)
    
    if exact_results:
        nucleus_uid = exact_results[0]["nucleus_uid"]
        print("✓ Exact match found in nucleus.", nucleus_uid)
        return nucleus_uid
    
    # 2. Get first two words for prefix matching
    first_two_words = get_first_two_words(normalized_name)
    
    # Search for companies with same first two words
    sql = f"SELECT * FROM nucleus WHERE name ILIKE '{first_two_words}%';"
    prefix_results = DB.query(sql)
    
    # 3. Find best match (80%+ similarity)
    best_match = None
    best_similarity = 0
    
    for record in prefix_results:
        db_normalized = normalize_name(record['name'])
        similarity = SequenceMatcher(None, normalized_name, db_normalized).ratio()
        
        if similarity >= 0.8 and similarity > best_similarity:
            best_match = record
            best_similarity = similarity
    
    if best_match:
        # Update the best matching nucleus with variant
        updated_record = update_nucleus_with_variants(best_match['nucleus_uid'], name)
        return updated_record[0]['nucleus_uid']
    
    # 4. No match found nucleus id
    return add_to_nucleus(name)

def update_nucleus_with_variants(nucleus_uid: int, variant_name: str):
    """Update nucleus record's variant array with new variant."""
    sql = """UPDATE nucleus 
             SET variant = array_append(variant, %s),
                 updated_at = %s
             WHERE nucleus_uid = %s 
             RETURNING *;"""
    result = DB.execute(sql, (variant_name, updated_at(), nucleus_uid))
    sql = """INSERT INTO company (name, nucleus_uid, created_at, updated_at) 
             VALUES (%s, %s, %s, %s) 
             RETURNING *;"""
    DB.execute(sql, (variant_name, nucleus_uid, updated_at(), updated_at()))
    print("✓ Inserted company.", result)
    return result

def add_to_nucleus(name: str):
    """
    Add a new company to nucleus table.
    """
    normalized_name = normalize_name(name)
    code = generate_nucleus_code(normalized_name)
    sql = """INSERT INTO nucleus (name, nucleus_uid, display_name, variant, created_at, updated_at) 
             VALUES (%s, %s, %s, %s, %s, %s) 
             RETURNING *;"""
    result = DB.execute(sql, (normalized_name, code, name, '{}', updated_at(), updated_at()))
    nucleus_uid = result['nucleus_uid']
    sql = """INSERT INTO company (name, nucleus_uid, created_at, updated_at) 
             VALUES (%s, %s, %s, %s) 
             RETURNING *;"""
    DB.execute(sql, (name, nucleus_uid, updated_at(), updated_at()))
    print("✓ Inserted company.", result)
    return nucleus_uid

def nucleus(name: str):
    return check(name)
    pass