import urllib.request, json, os, base64

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
    try:
        req = urllib.request.Request(
            f"https://api.github.com/repos/Aureus-Social/aureus-social-v18/contents/{path}",
            headers={"Authorization": f"token {GH}"}
        )
        with urllib.request.urlopen(req) as r:
            body["sha"] = json.loads(r.read())["sha"]
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

# Trouver le deploy ERROR sur v18
V18_ID = "prj_NQtBRskGLbkBAiBTb5BFY6OQccWv"
deps = get(f"/v6/deployments?projectId={V18_ID}&limit=10")["deployments"]

error_dep = None
for d in deps:
    if d.get("state") == "ERROR":
        error_dep = d
        break

if not error_dep:
    print("Pas de deploy ERROR trouvé")
    gh_put("VERCEL_ERR.txt", "No ERROR deploy found", "📊 result")
    exit()

dep_id = error_dep["uid"]
dep_url = error_dep.get("url","")
print(f"Deploy en erreur: {dep_id} | {dep_url}")

# Récupérer les events/logs du deploy
events = get(f"/v2/deployments/{dep_id}/events?types=command,stdout,stderr,exit&limit=100")
lines = [f"DEPLOY: {dep_id}", f"URL: {dep_url}", "=== BUILD LOGS ==="]
for e in events if isinstance(events, list) else events.get("events", []):
    t = e.get("type","")
    p = e.get("payload","")
    if isinstance(p, dict):
        text = p.get("text","") or p.get("info","")
    else:
        text = str(p)
    if text and ("error" in text.lower() or "Error" in text or "fail" in text.lower() or "cannot" in text.lower() or "Module not found" in text):
        lines.append(f"[{t}] {text[:200]}")

result = "\n".join(lines[:50])
print(result)
gh_put("VERCEL_ERR.txt", result, "📊 Vercel error log")
print("Ecrit dans VERCEL_ERR.txt")
