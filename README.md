# 🗨️ Chat Platform

A responsive chat platform with a collapsible sidebar for managing conversations. Supports dark mode and adapts to different screen sizes for an optimized user experience.

## ✨ Features

- 📱 **Responsive Design** – Automatically adapts to desktop and mobile views.
- 🌑 **Dark Mode Support** – Allows users to toggle between light and dark themes.
- 📜 **Conversation List Sidebar** – Displays a list of conversations in a sidebar.
- 📌 **Fixed & Collapsible Sidebar** – 
  - Sidebar is **fixed** on desktop.
  - Sidebar is **collapsible** on mobile with smooth transitions.
- 🎭 **Mobile Overlay** – A semi-transparent overlay appears when the sidebar is open on mobile.
- 🔄 **Auto-Hide Sidebar on Resize** – Sidebar automatically hides on smaller screens and appears on larger screens.
- 🏎️ **Optimized Performance** – Uses React state (`useState`) and effects (`useEffect`) efficiently.

## 🛠️ Tech Stack

- **React (Next.js)** – Core framework.
- **Tailwind CSS** – For styling and responsive design.
- **React Icons** – Used for sidebar toggle buttons (`FaBars`, `FaTimes`).
- **Zustand** – Manages global state (`useChatStore`).

## 🚀 Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/your-username/chat-platform.git
   cd chat-platform

2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install

3. Start the development server:
   ```sh
   npm run dev
   # or
   yarn dev

4. Open http://localhost:3000 in your browser.