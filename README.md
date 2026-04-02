# Smart Queue

A modern queue management system for university and college settings. Built with Next.js, it enables students to submit document requests and track their queue status in real-time.

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS 4

## Roles

- **Student/Alumni**: Submit document requests, track queue status, receive notifications
- **Staff**: Process requests, manage queue, generate reports
- **Admin**: Manage users, view analytics dashboard

## Features

- Role-based authentication and authorization
- Document request submission with queue numbering
- Real-time queue status tracking
- Email notifications for status updates
- Staff dashboard for request processing
- Report generation
- Rate limiting for API protection

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

```bash
npm install
```

### Database Setup

1. Create a PostgreSQL database
2. Configure your environment variables in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/smartqueue"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-email-password"
```

3. Run Prisma migrations:

```bash
npx prisma migrate dev
```

### Running

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── admin/        # Admin endpoints
│   │   ├── auth/         # Authentication endpoints
│   │   ├── staff/        # Staff endpoints
│   │   └── student/      # Student endpoints
│   └── dashboard/        # Dashboard pages
├── components/            # React components
├── lib/                   # Utility libraries
├── prisma/                # Database schema
└── reducers/              # Redux reducers
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT