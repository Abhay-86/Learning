This version is structured for **Mac (Apple Silicon / Intel)** users and includes all the missing install + setup steps 👇

---

````markdown

## ⚙️ 1. Install Docker & Colima (Docker Desktop Alternative)

Docker Desktop is heavy and paid for enterprise — Colima is a lightweight open-source alternative that runs Docker in a local VM.

### 🧩 Install Colima
```bash
brew install colima
````

### 🚀 Start Colima

```bash
colima start
```

You can check its status anytime:

```bash
colima status
```

Stop it when you’re done:

```bash
colima stop
```

---

## 🐳 2. Install Docker Compose Plugin

Colima runs the Docker Engine, but you need the **Compose plugin** for `docker compose` commands.

```bash
brew install docker-compose
```

---

## ⚙️ 3. Add Docker CLI Plugin Path

Tell Docker where to find the Compose plugin:

```bash
mkdir -p ~/.docker
```

Then open your Docker config file:

```bash
vim ~/.docker/config.json
```

Add (or merge) the following:

```json
{
  "cliPluginsExtraDirs": [
    "/opt/homebrew/lib/docker/cli-plugins"
  ]
}
```

Save and exit (`ESC + :wq` in Vim).

---

## 🔁 4. Restart Docker / Colima

Restart Colima to reload Docker settings:

```bash
colima stop
colima start
```

Then verify that Compose is detected:

```bash
docker compose version
```

✅ You should see something like:

```
Docker Compose version v2.40.3
```
---
Very important this is Ip for machine on which docker is running(this Give IP of host machine)
---
```bash
http://host.docker.internal
```

---
