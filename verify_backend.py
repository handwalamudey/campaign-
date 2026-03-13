import requests
import json

try:
    print("Fetching voters from backend...")
    resp = requests.get('http://localhost:8000/api/voters/')
    if resp.status_code == 200:
        voters = resp.json()
        print(f"Total Voters in Backend: {len(voters)}")
        for v in voters:
            print(f"- {v['name']} (Clan: {v['clan']}, Station: {v['pollingStationName']})")
    else:
        print(f"Failed to fetch voters. Status: {resp.status_code}")
except Exception as e:
    print(f"Error: {e}")
