# Full-Stack App Deployment Automation

This project automates the deployment of full-stack applications by cloning a Git repository, detecting the technology stack (frontend, backend, and database), generating Dockerfiles, and deploying the application using Docker Compose. Real-time status updates are provided via WebSocket.

---

## 🚀 Features

- **Repository Cloning**: Clone repositories from GitHub, GitLab, or Bitbucket.
- **Technology Detection**: Automatically identify frontend, backend, and database technologies.
- **Dockerfile Generation**: Generate Dockerfiles based on detected technologies.
- **Docker Compose Integration**: Orchestrate deployment using `docker-compose.yml`.
- **Real-Time Status Updates**: Track deployment progress via WebSocket.
- **Nginx Configuration**: Auto-configure Nginx to serve the frontend and proxy requests to the backend.

---

## 📌 Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [Docker](https://www.docker.com/) (v20 or higher)
- [Docker Compose](https://docs.docker.com/compose/) (v2 or higher)

---

## 📂 Project Structure

Your project should follow this structure for seamless deployment:

```
your-repo/
├── frontend/   # Frontend code (React, Vue, etc.)
├── backend/    # Backend code (Node.js, Python Flask, etc.)
├── database/   # Database initialization scripts
│   └── init/   # Folder containing database initialization scripts
└── ...
```

### 🛠 Folder Naming Conventions

| Component  | Accepted Folder Names |
|------------|----------------------|
| **Frontend** | `frontend`, `client`, `web`, `ui`, `app` |
| **Backend** | `backend`, `server`, `api`, `services` |
| **Database** | `database`, `db`, `data`, `storage` |

### 🗄 Database Initialization

The `database/init/` folder must contain SQL scripts for database setup:

```
database/
└── init/
    ├── 01-create-tables.sql
    ├── 02-insert-data.sql
```

### 🔑 Required Environment Variables

#### Frontend
- `VITE_API_URL` (Vite) or `REACT_APP_API_URL` (Create React App) → Backend API URL (e.g., `http://localhost:4002/api`)

#### Backend
- `DB_HOST`: Database host (e.g., `db`)
- `DB_USER`: Database username (e.g., `root`, `postgres`)
- `DB_PASS`: Database password (e.g., `root`, `postgres`)
- `DB_NAME`: Database name (e.g., `mydb`)
- `PORT`: Backend server port (e.g., `4002`)

#### Database
- `MYSQL_ROOT_PASSWORD` (MySQL) or `POSTGRES_PASSWORD` (PostgreSQL) → Root password

---

## 🏗 SETUP & Installation

Run the following command in your terminal to install dependencies and start both frontend and backend:

### Clone the repository
```sh
git clone https://github.com/drawliin/web-based-auto-deploy-system.git
cd web-based-auto-deploy-system
```
### Install backend dependencies & start backend
```sh
cd nodejs
npm install
node server.js
```
### Install frontend dependencies & start frontend
```sh
cd ../react
npm install
npm run dev
```

## 🎯 Usage

### 🔹 Deploy a Repository

![Deployment Flow](./images/Capture.PNG)

1. Open the frontend in your browser at http://localhost:5173.
2. Enter your GitHub repository URL in the input field.
3. Click the Clone Repo button.
4. The backend will handle cloning the repository and setting up the deployment.
Replace `https://github.com/your-username/your-repo.git` with your repository URL.

### 🔹 Monitor Deployment
Track the deployment process in real-time via WebSocket:
```
ws://localhost:5001
```

### 🔹 Access the Deployed Application
Once the deployment is complete, visit:
```
http://localhost:8081
```

---

## 📁 Code Structure

```
.
├── app.js          # Main Express server file
├── routes/         # API routes
├── utils/          # Utility functions (cloning, tech detection, Dockerfile generation)
├── cloned-repos/   # Directory where cloned repositories are stored
└── ...
```

---

## 🤝 Contributing
Contributions are welcome! Feel free to open an issue or submit a pull request for improvements.

---

## 📜 License
This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## 🙌 Acknowledgments
- **[Express.js](https://expressjs.com/)** – Web server framework
- **[Docker](https://www.docker.com/)** – Containerization
- **[Socket.IO](https://socket.io/)** – Real-time communication
