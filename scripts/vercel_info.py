import urllib.request, json, os, base64, traceback

TOKEN = os.environ["VERCEL_TOKEN"]
GH = os.environ["GH_TOKEN"]

def get(path):
    req = urllib.request.Request(
        f"https://api.vercel.com{path}",
        headers={"Authorization": f"Bearer {TOKEN}"}
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def gh_put(path, content):
    b64 = base64.b64encode(content.encode()).decode()
    body = {"message": "result", "content": b64}
    try:
        req = urllib.request.Request(
            f"https://api.github.com/repos/Aureus-Social/aureus-social-v18/contents/{path}",
            headers={"Authorization": f"token {GH}"}
        )
        with urllib.request.urlopen(req) as r:
            body["sha"] = json.loads(r.read())["sha"]
    except: pass
    req = urllib.request.Request(
        f"https://api.github.com/repos/Aureus-Social/aureus-social-v18/contents/{path}",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"token {GH}", "Content-Type": "application/json"},
        method="PUT"
    )
    with urllib.request.urlopen(req) as r:
        return r.status

try:
    V18_ID = "prj_NQtBRskGLbkBAiBTb5BFY6OQccWv"
    deps = get(f"/v6/deployments?projectId={V18_ID}&limit=10")["deployments"]
    
    # Trouver le deploy ERROR
    error_dep = next((d for d in deps if d.get("state")=="ERROR"), None)
    if not error_dep:
        gh_put("VERCEL_ERR.txt", "No ERROR deploy found. All states: " + str([d.get("state") for d in deps]))
        exit(0)
    
    dep_id = error_dep["uid"]
    
    # Logs du build
    try:
        logs = get(f"/v2/deployments/{dep_id}/events?limit=50")
        if isinstance(logs, list):
            events = logs
        else:
            events = logs.get("events", [])
        
        lines = [f"deploy: {dep_id}"]
        for e in events:
            t = e.get("type","")
            p = e.get("payload","")
            text = p.get("text","") if isinstance(p, dict) else str(p)
            lines.append(f"[{t}] {text[:150]}")
        
        gh_put("VERCEL_ERR.txt", "\n".join(lines[:60]))
    except Exception as e2:
        gh_put("VERCEL_ERR.txt", f"Events error: {e2}\ndep_id={dep_id}")
        
except Exception as e:
    gh_put("VERCEL_ERR.txt", f"ERROR: {traceback.format_exc()}")
    raise
