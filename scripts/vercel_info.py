import urllib.request, json, os, sys

TOKEN = os.environ["VERCEL_TOKEN"]

def get(path):
    req = urllib.request.Request(
        f"https://api.vercel.com{path}",
        headers={"Authorization": f"Bearer {TOKEN}"}
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

projects = get("/v9/projects?limit=20")["projects"]
print("=== PROJECTS ===")
for p in projects:
    print(f"{p['name']} | {p['id']} | framework:{p.get('framework','?')} | root:{p.get('rootDirectory','/')} | node:{p.get('nodeVersion','?')}")

v18 = next((p for p in projects if p["name"] == "aureus-social-v18"), None)
pro = next((p for p in projects if p["name"] == "aureus-social-pro"), None)

print("\n=== DEPLOYS aureus-social-v18 ===")
if v18:
    deps = get(f"/v6/deployments?projectId={v18['id']}&limit=3")["deployments"]
    for d in deps:
        print(f"state:{d.get('state')} | {d.get('url','')} | err:{d.get('errorMessage','ok')[:100]}")

print("\n=== DEPLOYS aureus-social-pro ===")
if pro:
    deps = get(f"/v6/deployments?projectId={pro['id']}&limit=3")["deployments"]
    for d in deps:
        print(f"state:{d.get('state')} | {d.get('url','')} | err:{d.get('errorMessage','ok')[:100]}")
