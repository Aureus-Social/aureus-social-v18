import urllib.request, json, os, base64, subprocess

TOKEN = os.environ["VERCEL_TOKEN"]
GH = os.environ["GH_TOKEN"]

def get(path):
    req = urllib.request.Request(
        f"https://api.vercel.com{path}",
        headers={"Authorization": f"Bearer {TOKEN}"}
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def gh_put(path, content, msg):
    b64 = base64.b64encode(content.encode()).decode()
    body = {"message": msg, "content": b64}
    # Check if exists
    try:
        req = urllib.request.Request(
            f"https://api.github.com/repos/Aureus-Social/aureus-social-v18/contents/{path}",
            headers={"Authorization": f"token {GH}"}
        )
        with urllib.request.urlopen(req) as r:
            sha = json.loads(r.read())["sha"]
            body["sha"] = sha
    except:
        pass
    req = urllib.request.Request(
        f"https://api.github.com/repos/Aureus-Social/aureus-social-v18/contents/{path}",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"token {GH}", "Content-Type": "application/json"},
        method="PUT"
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

projects = get("/v9/projects?limit=20")["projects"]
lines = ["=== PROJECTS ==="]
for p in projects:
    lines.append(f"{p['name']} | {p['id']} | fw:{p.get('framework','?')} | root:{p.get('rootDirectory','/')} | node:{p.get('nodeVersion','?')}")

v18 = next((p for p in projects if p["name"] == "aureus-social-v18"), None)
pro = next((p for p in projects if p["name"] == "aureus-social-pro"), None)

lines.append("\n=== DEPLOYS aureus-social-v18 ===")
if v18:
    deps = get(f"/v6/deployments?projectId={v18['id']}&limit=3")["deployments"]
    for d in deps:
        lines.append(f"state:{d.get('state')} | {d.get('url','')} | {d.get('errorCode','')} | {str(d.get('errorMessage','ok'))[:100]}")

lines.append("\n=== DEPLOYS aureus-social-pro ===")
if pro:
    deps = get(f"/v6/deployments?projectId={pro['id']}&limit=3")["deployments"]
    for d in deps:
        lines.append(f"state:{d.get('state')} | {d.get('url','')} | {d.get('errorCode','')} | {str(d.get('errorMessage','ok'))[:100]}")

result = "\n".join(lines)
print(result)

gh_put("VERCEL_RESULT.txt", result, "📊 Vercel config result")
print("\nEcrit dans VERCEL_RESULT.txt")
