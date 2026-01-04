import requests
import json

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJtYW5hZ2VyIiwiZXhwIjoxNzY3MzcxNjI1fQ.Y5Ar8x9PbZVcJq7YujUojLFvRGH5gcFAinL5pglmrIU"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
data = {
    "items": [
        {
            "product_id": 102,
            "quantity": 10
        }
    ]
}

response = requests.post("http://localhost:8000/vouchers/", headers=headers, json=data)

print(response.status_code)
print(response.json())
