import requests
import json

def test_endpoint(url):
    print(f"Testing {url}...")
    try:
        response = requests.post(url, json={"email": "test@example.com", "password": "password"}, timeout=2)
        print(f"Status: {response.status_code}")
        if response.status_code != 404:
            print("SUCCESS: Endpoint exists!")
            return True
    except Exception as e:
        print(f"Error: {e}")
    return False

print("--- Probing Backend ---")
exists_api = test_endpoint("http://127.0.0.1:8000/api/auth/login")
exists_root = test_endpoint("http://127.0.0.1:8000/auth/login")

if exists_api:
    print("\nCONCLUSION: Backend is serving at /api/auth/login")
elif exists_root:
    print("\nCONCLUSION: Backend is serving at /auth/login")
else:
    print("\nCONCLUSION: Neither endpoint is working.")
