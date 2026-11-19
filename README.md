# 🔐 Secure File Transfer & Access Auditing System

A role-based file transfer and access auditing platform built with React.js, Node.js, Express.js, and MongoDB. The application provides controlled file sharing, access tracking, and administrative monitoring, with Docker and Kubernetes deployment support.

## ✨ Features

- **User Authentication** — JWT-based login and authentication.
- **Role-Based Access Control** — Four roles: Admin, Sender, Recipient, and Auditor.
- **File Upload** — Supports PDF, DOCX, TXT, JPG, PNG, and ZIP files.
- **Secure File Sharing** — Generate protected sharing links with download limits and expiry dates.
- **Link Management** — Senders can revoke their shared links.
- **Access Auditing** — Records file access, downloads, login activity, and other audit events.
- **User Management** — Admins can manage registered users.
- **Reports** — Transfer History, File Access Audit, Expired Shares, and Storage Usage.
- **CSV Export** — Export supported reports.
- **Containerization** — Docker and Docker Compose support.
- **Kubernetes Deployment** — Deployment manifests for the application.
- **Responsive Interface** — Role-based dashboards and application pages.

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Nginx |
| Backend | Node.js, Express.js |
| Database | MongoDB 6 |
| Authentication | JWT (JSON Web Tokens) |
| DevOps | Docker, Docker Compose, Kubernetes |

## 📁 Project Structure

```text
secure-file-transfer/
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   ├── server.js
│   ├── package.json
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── controllers/
│   └── uploads/
│
├── frontend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── nginx.conf
│   ├── package.json
│   ├── public/
│   └── src/
│
├── k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── mongo-pv.yaml
│   ├── mongo-deployment.yaml
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── uploads-pv.yaml
│   └── ingress.yaml
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── .dockerignore
├── .gitignore
└── README.md
```

> Environment files and Kubernetes Secret manifests containing sensitive information are excluded from the repository.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Docker Compose](https://docs.docker.com/compose/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/) (for Kubernetes deployment)

## 🚀 Quick Start with Docker Compose

### 1. Clone the repository

```bash
git clone <repository-url>
cd secure-file-transfer
```

### 2. Configure environment variables

Create your private backend environment file using the example:

**Windows CMD:**

```cmd
copy backend\.env.example backend\.env
```

**Linux/macOS:**

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and configure a strong, private `JWT_SECRET` and the required environment variables.

Never commit your actual `.env` file or share your JWT secret publicly.

### 3. Build and start the application

```bash
docker compose up --build -d
```

### 4. Access the application

| Service | URL |
|---|---|
| Frontend | http://localhost |
| Backend API | http://localhost:5000 |
| MongoDB | localhost:27017 |

### 5. Stop the application

```bash
docker compose down
```

To stop the application and remove its persistent volumes:

```bash
docker compose down -v
```

> **Warning:** Removing volumes with `-v` deletes the stored database and uploaded-file data.

## 💻 Development Setup (Manual)

### Backend

Create and configure `backend/.env` before starting the backend.

```bash
cd backend
npm install
npm run dev
```

The backend runs at:

http://localhost:5000

### Frontend

Open a separate terminal:

```bash
cd frontend
npm install
npm start
```

The frontend runs at:

http://localhost:3000

For local development, the backend and MongoDB services must be running.

## ☸️ Kubernetes Deployment

The following instructions describe deployment on a Kubernetes cluster with the required application images available to the cluster.

### 1. Start Kubernetes

Enable Kubernetes in Docker Desktop and verify that the cluster is running:

```bash
kubectl get nodes
```

### 2. Create the namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 3. Apply application configuration

```bash
kubectl apply -f k8s/configmap.yaml
```

### 4. Create the Kubernetes Secret

Create the Secret using your own private JWT signing secret:

```bash
kubectl create secret generic backend-secret --namespace secure-file-transfer --from-literal=JWT_SECRET=YOUR_PRIVATE_JWT_SECRET --dry-run=client -o yaml | kubectl apply -f -
```

Replace `YOUR_PRIVATE_JWT_SECRET` with a strong private value. Do not commit the value to GitHub.

### 5. Build the application images

Run these commands from the project root:

```bash
docker build -t secure-file-transfer-backend:latest ./backend
docker build -t secure-file-transfer-frontend:latest ./frontend
```

### 6. Set up persistent storage

```bash
kubectl apply -f k8s/mongo-pv.yaml
kubectl apply -f k8s/uploads-pv.yaml
```

### 7. Deploy the application

```bash
kubectl apply -f k8s/mongo-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```

### 8. Verify deployment

Check the pods:

```bash
kubectl get pods -n secure-file-transfer
```

Check the services:

```bash
kubectl get services -n secure-file-transfer
```

The frontend can be accessed at:

`http://localhost`

> The included Ingress manifest is not required for the tested Docker Desktop LoadBalancer setup. An Ingress controller and appropriate configuration are needed before using Ingress.

## 📝 Environment Variables

| Variable | Description | Configuration |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://mongo:27017/secure-file-transfer` in the container environment |
| `JWT_SECRET` | JWT signing secret | Configure privately in `backend/.env` |
| `JWT_EXPIRE` | JWT token expiration | `24h` |
| `NODE_ENV` | Node environment | `production` for deployment |

## 🔒 Security Notes

- Keep environment files and signing secrets private.
- Do not commit `.env` files or Kubernetes Secret manifests.
- Use strong credentials for application accounts.
- Configure appropriate access permissions before deployment.
- Avoid using demonstration credentials in production environments.

---

<p align="center">
  Made with ❤️ for secure file transfers
</p>