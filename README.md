# 🚀 DevMentor AI – Frontend Development Assistant

**DevMentor AI** is an AI-powered frontend development assistant designed to help developers understand coding errors, learn frontend concepts, and generate personalized project roadmaps.

Instead of simply providing ready-made solutions, DevMentor AI encourages developers to understand problems and improve their coding skills through step-by-step guidance.

## 🌐 Live Demo

[**Try DevMentor AI**](https://devmentor-ai-frontend-assistant.vercel.app/)

## ✨ Features

### 1. AI-Powered Code Debugger
- Diagnose frontend coding errors.
- Understand the root cause of bugs.
- Get beginner-friendly explanations.
- Receive progressive hints and suggested fixes.

### 2. Project Roadmap Generator
- Generate personalized project roadmaps.
- Get component architecture and project structure.
- Break projects into four development phases.
- Track tasks with difficulty levels and progress.

### 3. Frontend Concepts
- Learn important frontend development concepts.
- Explore React and CSS topics.
- Access simplified learning guides and explanations.

### 4. Saved Sessions
- Save debugging sessions and project roadmaps.
- Revisit previously saved work.
- Manage and delete saved sessions.

### 5. Additional Features
- Dark and light themes.
- Interactive learning experience.
- Responsive user interface.
- Beginner-friendly navigation.

## 🛠️ Tech Stack

- **Frontend:** React.js, TypeScript
- **Styling:** Tailwind CSS
- **Build Tool:** Vite
- **Backend:** Node.js
- **AI Integration:** Google Gemini API
- **Deployment:** Vercel
- **Version Control:** Git & GitHub

## 📂 Project Structure

```text
devmentor-ai-frontend-assistant/
│
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── CodeViewer.tsx
│   │   ├── DebuggerModule.tsx
│   │   ├── RoadmapModule.tsx
│   │   ├── ConceptsView.tsx
│   │   ├── HistoryView.tsx
│   │   └── WelcomeGuide.tsx
│   │
│   ├── data/
│   ├── server/
│   ├── types/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── server.ts
├── vite.config.ts
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites
- Node.js
- npm or Bun
- Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/vaibhavkr87/devmentor-ai-frontend-assistant.git
```

### 2. Navigate to the project directory

```bash
cd devmentor-ai-frontend-assistant
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the root directory and add:

```env
GEMINI_API_KEY=your_gemini_api_key
APP_URL=http://localhost:3000
```

Replace `your_gemini_api_key` with your own API key. Never commit your actual `.env` file to GitHub.

### 5. Start the development server

Check the scripts in `package.json` and run the appropriate development command. For example:

```bash
npm run dev
```

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| GEMINI_API_KEY | Google Gemini API key |
| APP_URL | Application base URL |

## 🚀 Deployment

The application is deployed on Vercel.

**Live Application:** https://devmentor-ai-frontend-assistant.vercel.app/

## 🎯 Project Goal

The main goal of DevMentor AI is to make frontend development easier and more interactive by combining AI-powered assistance with practical learning.

## 👨‍💻 Developer

**Vaibhav Kumar**

- GitHub: [@vaibhakr87](https://github.com/vaibhakr87)
- Portfolio: [My Portfolio](https://portfoliovaibhav-umber.vercel.app/)
- LinkedIn: [My LinkedIn Profile](https://www.linkedin.com/in/vaibhavkr03/)

---

⭐ If you find this project useful, consider giving it a star on GitHub!

**Built with curiosity, creativity, and a passion for learning.**
