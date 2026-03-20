# ✨ AI-Powered Personal Portfolio

Welcome to the repository for my personal portfolio! This website is a dynamic, high-performance web application built with modern web technologies, featuring an interactive AI chatbot that knows everything about my professional experience.

## 🚀 Features

*   **Intelligent AI Chatbot:** An embedded RAG-style assistant powered by the **Vercel AI SDK** that answers questions about my background, skills, and projects in real-time.
*   **Multi-LLM Fallback Architecture:** The API seamlessly attempts to use **OpenAI (GPT-4o)** for blazing-fast responses, automatically falling back to **Anthropic (Claude 3 Haiku)** or **Google (Gemini 1.5 Flash)** to guarantee high availability.
*   **Centralized Knowledge Base:** All project data and professional experience is driven by a clean, static `context.json` file, eliminating the need for a complex external database while keeping SEO performance flawless.
*   **Premium UI & Animations:** Designed with **Tailwind CSS** and animated with **Framer Motion** for a smooth, premium user experience perfectly optimized for mobile, tablet, and desktop viewing.

## 🛠️ Tech Stack

*   **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling & UI:** [Tailwind CSS v4](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
*   **AI Integration:** Vercel AI SDK (`@ai-sdk/react`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`)

## 💻 Running Locally

To run this project on your local machine, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/TirthPatel3223/personal-website.git
    cd personal-website
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root directory and add your API keys:
    ```env
    OPENAI_API_KEY=your_openai_key_here
    ANTHROPIC_API_KEY=your_anthropic_key_here
    GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key_here
    NEXT_PUBLIC_SITE_URL=http://localhost:3000
    ```

4.  **Start the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser to see the portfolio!

## 🚢 Deployment

This project is optimized for hassle-free deployment on [Vercel](https://vercel.com).
1. Import your GitHub repository into Vercel.
2. Under "Environment Variables", add the API keys used in step 3.
3. Click **Deploy**.

---
*If you have any questions about this repository, feel free to interact with the AI chatbot on the live site!*
