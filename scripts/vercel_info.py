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

V18_ID = "prj_NQtBRskGLbkBAiBTb5BFY6OQccWv"
deps = get(f"/v6/deployments?projectId={V18_ID}&limit=5")["deployments"]
lines = []
for d in deps:
    lines.append(f"state:{d.get('state')} | commit:{d.get('meta',{}).get('githubCommitSha','')[:7]} | {d.get('url','')}")

result = "\n".join(lines)
print(result)
gh_put("VERCEL_RESULT.txt", result)
