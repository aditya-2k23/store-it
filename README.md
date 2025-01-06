# StoreIt - A simple file storage system

A storage management and file sharing platform that lets users effortlessly upload, organize, and share files. Built with Next.js, Appwrite, and Tailwind CSS.

See the app live at [store-it.vercel.app](https://store-it.vercel.app/). <!-- Change this -->

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Installation (Quick Start)](#installation-quick-start)

## Tech Stack

- **React 19**
- **Next.js 15**
- **Appwrite**
- **Tailwind CSS**
- **ShadCN**
- **TypeScript**
- **Vercel**

## Features

- **User Authentication with Appwrite**: Users can sign up and log in to their accounts using appwrite authentication system.
- **File Uploads**: Users can effortlessly upload a variety of file types to their accounts.
- **View and Manage Files**: Users can view and manage their files in a clean and organized manner, with the ability to view on a new tab, rename or delete files.
- **Download Files**: Users can download the uploaded files to their local machine.
- **Share Files**: Users can share files with others by generating a specifying their email address, enabling collaboration and easy access to important content.
- **Dashboard**: Users can view their storage usage, recent uploads, and a summary of files grouped by type.
- **Global Search**: Users can quickly find files and shared content across their account.
- **Sorting Options**: Organize files efficiently by sorting them by name, size, and date.
- **Modern Responsive Design**: A clean and modern UI that works seamlessly across all devices.

## Installation (Quick Start)

Follow these steps to run the project locally:

**Prerequisites**:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

1. **Clone the repository**

```bash
git clone https://github.com/aditya-2k23/store-it.git
cd store-it
```

2. **Install dependencies**

```bash
npm install
```

3. **Set Up Environment Variables**

Create a `.env.local` file in the root directory and add the following environment variables:

```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
NEXT_PUBLIC_APPWRITE_PROJECT=""
NEXT_PUBLIC_APPWRITE_DATABASE=""
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION=""
NEXT_PUBLIC_APPWRITE_FILES_COLLECTION=""
NEXT_PUBLIC_APPWRITE_BUCKET=""
NEXT_APPWRITE_KEY=""
```

Replace the values with your actual Appwrite credentials. You can sign up for a free account at [Appwrite](https://appwrite.io/) and create a new project.

4. **Running the project**

```bash
npm run dev
```

The project will be available at `http://localhost:3000`.

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request for any changes.

## With the guidance of JavaScript Mastery

This project was built with the help of [JavaScript Mastery](https://www.youtube.com/@javascriptmastery) YouTube channel. Check out the [video tutorial](https://www.youtube.com/watch?v=lie0cr3wESQ) to build this project from scratch.
