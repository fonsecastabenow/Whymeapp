"""
Seed script: create the 4 socio (partner/admin) users.
Run with: python seed_socios.py
The API must be running at http://localhost:8000.
"""
import sys
import httpx

API_BASE = "http://localhost:8000"

SOCIOS = [
    {"name": "Rodri",     "email": "rodri@whyme.app",     "password": "canetabic12"},
    {"name": "Leo",       "email": "leo@whyme.app",       "password": "canetabic23"},
    {"name": "Lucas",     "email": "lucas@whyme.app",     "password": "canetabic34"},
    {"name": "Demitrius", "email": "demitrius@whyme.app", "password": "canetabic45"},
]


def seed():
    created = 0
    skipped = 0
    errors = 0

    with httpx.Client(base_url=API_BASE, timeout=10.0) as client:
        for user in SOCIOS:
            payload = {
                "name": user["name"],
                "email": user["email"],
                "password": user["password"],
                "role": "admin",
            }
            resp = client.post("/auth/register", json=payload)

            if resp.status_code == 201:
                data = resp.json()
                print(f"[OK]      Created: {data['name']} <{data['email']}> id={data['id']}")
                created += 1
            elif resp.status_code == 409:
                print(f"[SKIP]    Already exists: {user['email']}")
                skipped += 1
            else:
                is_json = resp.headers.get("content-type", "").startswith("application/json")
                body = resp.json() if is_json else resp.text
                print(f"[ERROR]   {user['email']} — HTTP {resp.status_code}: {body}", file=sys.stderr)
                errors += 1

    print(f"\nDone: {created} created, {skipped} skipped, {errors} error(s)")
    if errors:
        sys.exit(1)


if __name__ == "__main__":
    seed()
