# Portfolio RAG Website Completion Walkthrough

I have successfully built the end-to-end architecture and UI for your AI-powered portfolio website! Everything has been scaffolded, coded, and verified to build cleanly in a production environment.

## What Was Accomplished

### 1. The Local Database ([context.json](file:///c:/Users/tirth/OneDrive/Desktop/Agentic_Systems/Personal_Website/context.json))
We created a single source of truth ([context.json](file:///c:/Users/tirth/OneDrive/Desktop/Agentic_Systems/Personal_Website/context.json)) in the root of the project. This replaces a complex Vector Database and holds:
*   Your personal information, title, and social links.
*   Your professional experience.
*   Detailed entries for each project, including your personal motivation, technical stack, and achievements.
> [!TIP]
> To update your website content, simply edit this [context.json](file:///c:/Users/tirth/OneDrive/Desktop/Agentic_Systems/Personal_Website/context.json) file. The Chatbot and the Projects UI will instantly learn the new information!

### 2. Multi-LLM Chatbot Backend
In [src/app/api/chat/route.ts](file:///C:/Users/tirth/OneDrive/Desktop/Agentic_Systems/Personal_Website/src/app/api/chat/route.ts), we built an intelligent API endpoint powered by the **Vercel AI SDK**:
*   **Guardrails**: It uses a strict system prompt to refuse questions unrelated to your professional profile.
*   **Context Injection**: The [context.json](file:///c:/Users/tirth/OneDrive/Desktop/Agentic_Systems/Personal_Website/context.json) data is passed directly into the AI's system prompt.
*   **High-Availability Fallback**: The API tries to stream from **OpenAI (GPT-4o-mini)**. If that fails (e.g., due to rate limits), it automatically and seamlessly falls back to **Anthropic (Claude 3 Haiku)**, and then to **Google (Gemini 1.5 Flash)**.

### 3. Premium Frontend Design
We used **Tailwind CSS** and **Framer Motion** to create a stunning, responsive user interface:
*   **Hero Section**: Features a gorgeous animated gradient backdrop, your introduction, and links to your GitHub, LinkedIn, and Resume.
*   **AI Search Interface**: Placed prominently in the center of the screen, providing a delightful chat experience where users can ask questions directly to your AI counterpart. The responses are streamed live word-by-word.
*   **Projects Gallery**: A dynamic grid of project cards that showcase your work.
*   **Project Mini-Sites**: Detailed pages for each project (e.g., `/projects/ai-portfolio`) that dynamically read from [context.json](file:///c:/Users/tirth/OneDrive/Desktop/Agentic_Systems/Personal_Website/context.json) to statically generate fast, SEO-friendly pages.

---

## Next Steps: Deployment

Your Next.js project uses the App Router and is fully optimized for Vercel. Here is how you can launch it to the world:

### 1. Set Up Environment Variables
Create a `.env.local` file inside the `Personal_Website` folder locally. You will need to get your API keys from the AI providers. At minimum, you need the OpenAI key for the primary model:
```env
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key_here
```

### 2. Run Locally
Test the chatbot flow on your own machine.
1. Open a terminal.
2. `cd Personal_Website`
3. `npm run dev`
4. Open `http://localhost:3000` in your browser.

### 3. Deploy to Vercel
1. Initialize a Git repository inside `Personal_Website` if you haven't already.
2. Push the codebase to a new repository on **GitHub**.
3. Go to [Vercel.com](https://vercel.com/) and click **Add New Project**.
4. Import your GitHub repository.
5. In the **Environment Variables** section on Vercel, paste your API keys.
6. Click **Deploy**! 

Your high-performance, AI-driven portfolio is now alive on the internet.
