# 🐘 PostgreSQL + pgAdmin Setup using Docker

This guide helps you quickly set up a PostgreSQL database with persistent storage and a pgAdmin UI for database management using Docker.

---

## 📁 Folder Setup

Create a directory to store your Postgres data on your local system:

```bash
mkdir -p ~/Documents/Learn/Test/postgres_data
```
mount folder

```bash
docker run -d --name postgres -e POSTGRES_USER=abhay -e POSTGRES_PASSWORD=abhay123 -e POSTGRES_DB=db -p 5432:5432 -v ~/Documents/Learn/Test/postgres_data:/var/lib/postgresql/data postgres:15  
```

storage managed by docker

```bash
docker run -d --name postgres -e POSTGRES_USER=abhay -e POSTGRES_PASSWORD=abhay123 -e POSTGRES_DB=db -p 5432:5432 -v postgres_data:/var/lib/postgresql/data postgres:15
```

PG admin UI for database

```bash
docker run -d --name pgadmin -e PGADMIN_DEFAULT_EMAIL=test@test.com -e PGADMIN_DEFAULT_PASSWORD=test -p 5050:80 --link postgres:postgres dpage/pgadmin4
```

Setup PG admin and database

```bash
docker compose up -d
```

remove everything
```bash
docker compose down 
```