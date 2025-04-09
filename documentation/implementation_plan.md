# Implementation plan

Below is the step-by-step implementation plan for TaskMind AI, a web-based platform for converting natural language goals into personalized calendar plans. Follow the steps carefully and validate each step with the specified checks.

## Phase 1: Environment Setup

1.  **Prevalidation:** Check if the current directory already contains a project (e.g. verify the existence of `package.json`). If found, skip project initialization. (Reference: PRD: Project Overview)

2.  **Initialize Project:** If no project exists, run the command to create a Next.js 14 project with TypeScript:

    *   Command: `npx create-next-app@14 taskmind-ai --typescript`
    *   Note: Next.js 14 is specifically chosen to ensure compatibility with current AI coding tools and LLM models. (Reference: Tech Stack: Frontend)

3.  **Install Node & Other Core Tools:** Ensure Node.js (version recommended by your environment, e.g. Node.js v20.2.1 if needed) is installed. Validate with:

    *   `node -v`
    *   (Reference: Tech Stack: Core Tools)

4.  **Set Up Cursor Environment for Supabase Connection:**

    *   Prevalidate: Check if a `.cursor` directory exists in the project root. If not, create it.
    *   Create the file `.cursor/mcp.json`.
    *   Open `.cursor/mcp.json` and add the following configuration template. (**Note**: Replace `<connection-string>` with your Supabase connection string. Get this string from: [Supabase MCP Connection Guide](https://supabase.com/docs/guides/getting-started/mcp#connect-to-supabase-using-mcp))

7.  **For Windows:**

8.  `{ "mcpServers": { "supabase": { "command": "cmd", "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-postgres", "<connection-string>"] } } }`

9.  **Validation (Cursor):** Open the Cursor IDE, navigate to **Settings > MCP**, and verify a green active status to confirm the Supabase server is connected. (Reference: Tech Stack: Cursor)

## Phase 2: Frontend Development

1.  **Set Up Styling:** Install and configure Tailwind CSS according to the Next.js documentation. Create a `tailwind.config.js` at the project root. (Reference: Tech Stack: Frontend, Design Preferences)

2.  **Integrate UI Libraries:** Install Shadcn UI and Radix UI libraries, then import and configure their components for coherent and minimal UI design. (Reference: Design Preferences)

3.  **Layout using Next.js App Router:** Create the main layout file `app/layout.tsx` and necessary folders inside the `app/` directory to structure the application with a responsive and modular layout. (Reference: Tech Stack: Frontend)

4.  **Authentication UI with Clerk:**

    *   Install Clerk’s Next.js package.
    *   Create an authentication page at `app/login/page.tsx` using Clerk components to support social login, MFA, and session management. (Reference: Core Features: Authentication)

5.  **Implement Calendar UI:**

    *   Create a drag-and-drop calendar component at `app/calendar/page.tsx` using Shadcn UI/Radix UI components and Framer Motion for smooth animations.
    *   Ensure the calendar supports recurring tasks (daily, weekly, monthly, yearly, custom patterns). (Reference: Core Features: Calendar, Design Preferences)

6.  **AI Scheduling UI:**

    *   Create a page (`app/schedule/page.tsx`) with a natural language input field for generating AI-based schedule plans.
    *   Integrate TanStack Query for data fetching and maintain reactivity in the UI. (Reference: Core Features: AI Scheduling)

7.  **Feedback & Customization Components:**

    *   Develop components that allow users to drag-and-drop, lock blocks, adjust priorities, and provide feedback to the AI. (Reference: Core Features: AI Scheduling, Customization)

8.  **Validation (Frontend):** Run the Next.js development server via `npm run dev` and manually verify that pages (login, calendar, schedule) render with proper styling and interactivity. (Reference: Q&A: UI Validation)

## Phase 3: Backend Development

1.  **Set Up Supabase & Database:**

    *   Ensure you have access to a Supabase instance with PostgreSQL 15.
    *   Use the Supabase dashboard to create required tables. Below is a sample schema outline:

2.  **Users Table:** (Managed externally via Clerk; additional user data can be stored here)

    *   id (UUID, primary key)
    *   email (string)
    *   created_at (timestamp)

3.  **Schedules Table:**

    *   id (UUID, primary key)
    *   user_id (UUID, foreign key)
    *   title (string)
    *   start_time (timestamp)
    *   end_time (timestamp)
    *   recurrence (JSONB to support various patterns)
    *   created_at (timestamp)

4.  **Analytics Table:**

    *   id (UUID, primary key)
    *   user_id (UUID, foreign key)
    *   task_completion_rate (numeric)
    *   time_spent (numeric)
    *   created_at (timestamp)

5.  (Reference: Core Features: Analytics, Backend & Storage)

6.  **Integrate Prisma ORM:**

    *   Install Prisma and set it up in the project.
    *   Create the schema file at `prisma/schema.prisma` and input the database models matching the above schema.
    *   Run `npx prisma generate` and `npx prisma migrate dev` to validate and apply the schema. (Reference: Tech Stack: Backend & Storage)

7.  **tRPC API Setup:**

    *   Install and configure tRPC for type-safe API communications.
    *   Create a tRPC router file, e.g., `src/server/routers/schedule.ts`, to handle endpoints like `generateSchedule` that connects to OpenAI GPT-4.
    *   Develop additional tRPC endpoints for calendar sync, analytics data retrieval, and export functionality. (Reference: Core Features: AI Scheduling, Calendar Sync, Export)

8.  **Implement Clerk Authentication Back-end:**

    *   Integrate Clerk’s server-side SDK to validate sessions and restrict access to protected endpoints in your tRPC routers. (Reference: Core Features: Authentication)

9.  **Google Calendar Sync Integration:**

    *   Create secure API endpoints to handle OAuth callbacks with Google Calendar using minimal scopes.
    *   Utilize Supabase real-time features to reflect external calendar updates. (Reference: Core Features: Calendar Sync, Security & Privacy)

10. **Export Functionality:**

    *   Develop endpoints (e.g., `GET /api/export`) to generate CSV and PDF exports for tasks and schedules.
    *   Use appropriate libraries in Node.js for file generation. (Reference: Core Features: Export)

11. **Rate Limiting & Redis Integration:**

    *   Set up Upstash Redis for rate-limiting AI requests. Integrate it in a middleware that tracks API calls to the GPT-4 endpoint. (Reference: Core Features: Subscription & Rate Limiting)

12. **Stripe Integration for Subscription:**

    *   Implement backend endpoints to handle Stripe webhooks and subscription status updates at `api/stripe/webhook.ts`.
    *   Ensure credentials and region/account IDs are set as per your Stripe dashboard. (Reference: Core Features: Subscription & Rate Limiting)

13. **Validation (Backend):** Use tools like Postman or `curl` to test critical endpoints (e.g., `POST /trpc/generateSchedule`) and verify proper authentication and data responses. (Reference: Q&A: API Testing)

## Phase 4: Integration

1.  **Connect Frontend and Backend:**

    *   Integrate the tRPC client in your frontend (e.g., in `src/utils/trpc.ts`) to call your backend endpoints.
    *   Connect the AI scheduling page to the `generateSchedule` endpoint for dynamic planning. (Reference: App Flow: AI Scheduling)

2.  **Sync Calendar Data:**

    *   Implement API calls from the calendar page to fetch and update calendar events using the Google Calendar and Supabase endpoints. (Reference: Core Features: Calendar Sync)

3.  **Wire Up Authentication:**

    *   Ensure the Clerk authentication flows function seamlessly across both frontend and backend routes. (Reference: Core Features: Authentication)

4.  **Client-side Rate Limiting Feedback:**

    *   Display notifications to users when rate limits are reached based on the Upstash Redis backend responses.

5.  **Validation (Integration):** Manually test end-to-end flows: sign in via Clerk, generate an AI schedule, update calendar events by drag-and-drop, and export data. (Reference: Q&A: Pre-Launch Checklist)

## Phase 5: Deployment

1.  **Deploy Frontend Application:**

    *   Deploy the Next.js application on your chosen platform (e.g., Vercel). Ensure proper configuration of environment variables for Clerk, Supabase, and Google OAuth.
    *   Validate deployment in both light and dark mode as per design. (Reference: PRD: Deployment, Design Preferences)

2.  **Deploy Backend & Database:**

    *   Deploy the Supabase PostgreSQL 15 database and ensure that the schema has been applied.
    *   Deploy your tRPC API backend if separate from Next.js (or as integrated API routes). (Reference: Tech Stack: Backend & Storage)

3.  **Set Up CI/CD Pipeline:**

    *   Configure a CI/CD workflow (e.g., GitHub Actions) that runs tests for both frontend and backend before deployment. (Reference: Q&A: Deployment)

4.  **Validation (Deployment):**

    *   Run end-to-end tests using a tool like Cypress against the production URL to ensure complete functionality across authentication, AI scheduling, calendar sync, analytics, and export features. (Reference: Q&A: Pre-Launch Checklist)

## Final Checks & Documentation

1.  **Documentation:**

    *   Update README.md with setup instructions, environment variable details, and deployment notes for developers. (Reference: PRD: Project Overview)

2.  **User Testing:**

    *   Conduct a round of user testing focusing on TaskMind AI’s core flows (authentication, schedule generation, calendar operations, analytics) and gather feedback for refinement.

3.  **Security & Privacy Review:**

    *   Verify that minimum Google Calendar OAuth scopes are enforced and audit JWT expiry/refresh tokens alongside Supabase RLS configurations. (Reference: Security & Privacy)

4.  **Final Validation:**

    *   Double-check that error messages are clear, real-time collaboration (if enabled) is correctly limited, and all animations and interfaces are smooth and responsive. (Reference: Core Features: AI Scheduling, Collaboration)

End of implementation plan.
