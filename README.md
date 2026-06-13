# Storey — AI-Powered Collaborative Cloud Storage

Storey is a modern AI-powered cloud storage and collaboration platform that helps users upload, organize, search, manage, and collaborate on files intelligently in realtime.

Built with Next.js, Clerk, Supabase, Cloudflare R2, and Tailwind CSS, Storey combines secure file storage, AI-powered search, realtime collaboration, and smart organization into a clean and modern workspace experience.

The vision behind Storey is to move beyond traditional folder-based storage systems and create a smarter digital workspace where files become easier to discover, collaborate on, and understand.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Core Features](#core-features)
- [Upcoming AI Features](#upcoming-ai-features)
- [Realtime Collaboration](#realtime-collaboration)
- [Installation](#installation)

## Tech Stack

### Frontend

- **React 19**
- **Next.js 16 (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **ShadCN UI**
- **Framer Motion**

### Authentication

- **Clerk**

### Backend & Database

- **Supabase Postgres**
- **Supabase Realtime**
- **Supabase Row Level Security (RLS)**

### File Storage

- **Cloudflare R2**

### AI & Search

- **Gemini APIs**
- **pgvector**
- **Semantic Search**
- **AI Embeddings**

### Deployment

- **Vercel**

## Core Features

### Authentication & Security

- Secure user authentication with Clerk
- Protected routes and workspace-based access
- Row Level Security (RLS) for secure database access

### File Storage & Management

- Upload and manage any type of file
- Rename, move, organize, and delete files
- Drag-and-drop uploads
- Folder-based file organization
- File previews and downloads
- Storage usage dashboard
- File type categorization

### Smart Search & Organization

- Global search across files and folders
- AI-powered semantic file search
- Smart file tagging and categorization
- Search files using natural language
- Intelligent filtering and sorting

### Sharing & Collaboration

- Share files and folders securely
- Team workspaces
- Realtime collaboration
- Shared file activity
- Workspace member management
- Live presence indicators

### Modern User Experience

- Fully responsive modern UI
- Clean dashboard and analytics
- Smooth animations and transitions
- Fast and optimized performance
- Beautiful file previews

## Upcoming AI Features

Storey is evolving into an intelligent storage platform with AI-powered capabilities designed to improve productivity and organization.

### Planned AI Features

- Semantic search using embeddings
- AI-generated document summaries
- Automatic file tagging
- OCR-based text extraction from PDFs and images
- Duplicate file detection
- Smart recommendations and organization
- Context-aware file discovery
- AI-powered workspace insights

## Realtime Collaboration

Storey is designed to support collaborative team workflows with realtime synchronization powered by Supabase Realtime.

### Planned Collaboration Features

- Realtime collaborative document editing
- Live cursors and presence
- Shared collaborative notes
- Activity feeds
- Comments and mentions
- File version history
- Team workspaces and permissions

## Installation

Follow these steps to run the project locally.

### Prerequisites

- Git
- Node.js
- npm

### Clone the repository

```bash
git clone https://github.com/aditya-2k23/storey.git
cd storey
```

### Install dependencies

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory and add the following:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""

NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""

# Cloudflare R2
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""
```

### Run the development server

```bash
npm run dev
```

The project will be available at:

```bash
http://localhost:3000
```

## With the guidance of JavaScript Mastery

This project was built with the help of [JavaScript Mastery](https://www.youtube.com/@javascriptmastery) YouTube channel. Check out the [video tutorial](https://www.youtube.com/watch?v=lie0cr3wESQ) to build this project from scratch.
