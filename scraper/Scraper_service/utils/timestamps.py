from datetime import datetime, timezone
BASE62_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

def updated_at():
    """Return a UTC timestamp with timezone awareness."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

def normalize_name(name: str) -> str:
    """
    Remove spaces, special chars, lowercase the name.
    Example: "Tower Research" → "towerresearch"
             "Samsung R&D"    → "samsungrd"
    """
    normalized = ''.join(char.lower() for char in name if char.isalnum())
    return normalized


def encode_base62(text: str) -> str:
    """
    Convert text into a small Base62 string.
    Reversible.
    """
    byte_value = int.from_bytes(text.encode(), 'big')

    if byte_value == 0:
        return "0"

    encoded = ""
    while byte_value > 0:
        byte_value, remainder = divmod(byte_value, 62)
        encoded = BASE62_ALPHABET[remainder] + encoded

    return encoded


def decode_base62(encoded: str) -> str:
    """
    Convert a Base62 encoded string back to the original text.
    """
    num = 0
    for char in encoded:
        num = num * 62 + BASE62_ALPHABET.index(char)

    # Convert number back to bytes → decode text
    byte_length = (num.bit_length() + 7) // 8
    return num.to_bytes(byte_length, 'big').decode()


def generate_nucleus_code(name: str) -> str:
    """
    Example:
        "Tower Research" → "towerresearch" → "ak3Z1f"
    """
    normalized = normalize_name(name)
    return encode_base62(normalized)

def reverse_nucleus_code(code: str) -> str:
    """
    Example:
        "ak3Z1f" → "towerresearch"
    """
    return decode_base62(code)

if __name__ == "__main__":
    name = "Samsung R&D"
    print(updated_at())
    normalized_name = normalize_name(name)
    print(f"Normalized Name: {normalized_name}")
    code = generate_nucleus_code(name)
    print(f"Name: {name} → Code: {code}")
    reversed_name = reverse_nucleus_code(code)
    print(f"Code: {code} → Reversed Name: {reversed_name}")