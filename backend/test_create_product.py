import requests

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJtYW5hZ2VyIiwiZXhwIjoxNzY3MzcxNjI1fQ.Y5Ar8x9PbZVcJq7YujUojLFvRGH5gcFAinL5pglmrIU"
headers = {
    "Authorization": f"Bearer {token}"
}
data = {
    "name": "Test Product",
    "price": 10.0,
    "quantity": 100
}

response = requests.post("http://localhost:8000/stock/", headers=headers, data=data)

print(response.status_code)
print(response.json())
