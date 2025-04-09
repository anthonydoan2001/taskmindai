# Backend Structure Document

This document outlines the backend structure for TaskMind AI, providing a clear look into the various components of the backend architecture, database setup, API design, hosting, infrastructure, security measures, and monitoring strategies. The aim is to explain how the backend is built to support scalability, maintainability, and performance in everyday language.

## Backend Architecture

The backend is designed using a modern, modular approach that leverages a range of specialized technologies and frameworks. Key points include:

- **Design Patterns:**
  - Modular and layered architecture ensuring each component (authentication, scheduling, calendar sync, etc.) is isolated for easy maintenance and updates.
  - Use of type-safe API communication with tRPC to bridge the frontend and backend seamlessly.

- **Frameworks & Services:**
  - **Supabase:** Provides PostgreSQL 15 database with built-in security features such as Row-Level Security (RLS) and real-time updates.
  - **Prisma ORM:** Simplifies interaction with the SQL database through a clean, type-safe API.
  - **tRPC:** Provides end-to-end type safety in API interactions, ensuring that the communication between the frontend and backend is consistent and error-free.
  - **Clerk:** Handles secure user authentication including social logins, multi-factor authentication (MFA), and session management.
  - **Stripe:** Manages billing and subscriptions with robust and scalable payment processing.
  - **OpenAI GPT-4:** Powers the AI scheduling feature that converts natural language into personalized calendar plans.
  - **Redis (via Upstash):** Used for rate limiting and caching, ensuring that AI request limits are respected and services remain responsive.

- **Scalability & Performance:**
  - Each component is loosely coupled, facilitating independent scaling and maintenance.
  - The use of a real-time database (Supabase) and caching mechanisms (Redis) ensures that the platform can handle high loads while offering instantaneous data updates.
  - The type-safe communication via tRPC reduces runtime errors and speeds up debugging and development cycles.

## Database Management

TaskMind AI uses a robust and secure database setup:

- **Primary Database:**
  - **PostgreSQL 15** (hosted via Supabase) is the primary relational database.
  - **Key Practices:**
    - Adoption of Row-Level Security (RLS) to enforce data access permissions at the database level.
    - Real-time capabilities to update the interactive calendar and other live features.
    - Regular encrypted backups to protect user data and ensure quick recovery when needed.

- **Data Storage:**
  - User profiles, tasks, schedules, and calendar data are stored with defined relationships ensuring consistency.
  - Integration with external services like Google Calendar and Stripe for supplementary data synchronization.

## Database Schema

### Human Readable Description

- **Users:** Contains user profile information, authentication details, and data preferences.
- **Tasks:** Represents individual tasks including details such as title, description, priority, and status.
- **Calendars:** Stores calendar metadata and links to user-specific calendar configurations.
- **Schedules:** Holds the AI-generated schedule plans and manual modifications.
- **RecurringTasks:** Details for tasks with recurrence patterns (daily, weekly, custom, etc.) and settings for auto-rescheduling and missed task handling.
- **Notifications:** Manages email, in-app, and optionally push notifications, including summaries and alerts.
- **Subscriptions:** Contains billing status and subscription details managed via Stripe.
- **Analytics:** Stores usage statistics, productivity metrics, and AI interaction insights.

### SQL Schema (PostgreSQL)

Below is an example SQL schema that provides a starting point for the database. Note that this is a simplified version illustrating the relationships:

```sql
-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendars Table
CREATE TABLE calendars (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  google_calendar_id VARCHAR(255),
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedules Table
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  ai_generated BOOLEAN DEFAULT TRUE,
  schedule_data JSONB, -- stores the calendar plan details
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RecurringTasks Table
CREATE TABLE recurring_tasks (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  recurrence_pattern VARCHAR(100), -- e.g., daily, weekly, custom
  auto_reschedule BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50), -- email, in-app, push
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions Table
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Table
CREATE TABLE analytics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  metric VARCHAR(255),
  value NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Design and Endpoints

The API is built with a type-safe approach using tRPC, allowing fluid communication between the frontend and backend:

- **API Type:**
  - REST-like endpoints via tRPC that directly avoid manual route definitions.
  - Endpoints designed with clear responsibilities to handle actions such as user authentication, calendar synchronization, task management, and analytics tracking.

- **Key Endpoints Include:**
  - **Authentication Endpoints:** Manage sign-up, login, MFA, and session handling (integrated with Clerk).
  - **Schedule Creation & AI Interaction:** Accept natural language input and return an AI-generated schedule plan using OpenAI GPT-4.
  - **Calendar Sync Endpoints:** Manage two-way synchronization with Google Calendar and real-time updates using Supabase’s real-time features.
  - **Task and Recurrence Management:** Create, update, and manage tasks including recurring scheduling patterns.
  - **Notification Endpoints:** Dispatch email, in-app, and push notifications to users.
  - **Analytics Endpoints:** Provide data on task completion, time allocation, and other productivity metrics.

## Hosting Solutions

The backend leverages a modern cloud-based hosting environment to ensure high availability and robust performance:

- **Primary Hosting Provider:**
  - **Supabase:** Hosts the PostgreSQL database and offers real-time data functionality.
  - **Vercel:** Often used alongside Next.js for deploying the serverless functions and API endpoints in a scalable manner.

- **Benefits:**
  - **Reliability:** Cloud-based solutions are backed by robust infrastructure, ensuring minimal downtime.
  - **Scalability:** The architecture can scale up during high loads by auto-scaling and load balancing.
  - **Cost-Effectiveness:** Pay-as-you-go pricing allows for dynamic scaling based on usage; integration with serverless functions minimizes overhead costs.

## Infrastructure Components

Numerous infrastructure components work together to enhance performance and provide a seamless user experience:

- **Load Balancers:** Distribute incoming traffic across the Vercel serverless functions and backend services to optimize response times.
- **Caching Mechanisms:** Utilizing Redis (via Upstash) for rate limiting and caching critical data to reduce latency.
- **Content Delivery Network (CDN):** Often used in conjunction with Vercel, CDNs help deliver static assets quickly to users around the globe.
- **Real-Time Updates:** Supabase provides native support for real-time data streaming, ensuring that calendar updates and notifications are pushed instantly to the frontend.

## Security Measures

Security is integrated at multiple layers of the backend to protect user data and ensure regulatory compliance:

- **Authentication & Authorization:**
  - Clerk handles secure user authentication, social logins, MFA, and session management.
  - Role-based access controls are enforced both at the application and database levels (using Supabase RLS).

- **Data Encryption:**
  - End-to-end encryption of sensitive data including field-level encryption for highly sensitive information.
  - Regular encrypted backups to safeguard against data loss.

- **OAuth & External Integrations:**
  - Google Calendar synchronization uses the minimum required OAuth scopes to ensure privacy.

- **Additional Measures:**
  - GDPR-ready consent mechanisms
  - Middleware checks for subscription levels and rate limits (Redis based) to prevent abuse

## Monitoring and Maintenance

Maintaining a healthy backend system means using proactive monitoring and regular maintenance strategies:

- **Monitoring Tools:**
  - Supabase provides monitoring for the PostgreSQL database and real-time events.
  - Vercel and other logging tools (e.g., Sentry, Logflare) track serverless function performance and error rates.
  - Custom dashboards for tracking analytics and AI interactions.

- **Maintenance Practices:**
  - Routine database optimizations and encryption backups ensure data integrity.
  - Scheduled updates, security patches, and regular audit logs to spot anomalies and ensure compliance.
  - Automated alerting systems to notify the team about significant issues or downtime.

## Conclusion and Overall Backend Summary

TaskMind AI’s backend is built to support a modern, feature-rich platform that transforms natural language into actionable calendar plans. Key aspects include:

- A modern, modular backend architecture using Supabase, Prisma, tRPC, and Clerk.
- Robust data management practices in a PostgreSQL environment with real-time capabilities and strong security measures.
- A clean API design that enables seamless and type-safe communication between the frontend and backend.
- Hosting solutions that ensure scalability, reliability, and cost-effectiveness, paired with infrastructure components such as load balancers, caching, and CDNs.
- Stringent security protocols (including OAuth, MFA, RLS, and encryption) to keep user data safe.
- Comprehensive monitoring and maintenance practices that guarantee performance and fast issue resolution.

This setup aligns with TaskMind AI’s goals of providing a dynamic scheduling experience while ensuring data security and robust performance, setting it apart from similar productivity platforms.