# Rising Hill Staff Management Portal

A comprehensive staff management system for residential care facilities, built with React 19, Supabase, and Tailwind CSS.

## Features

### Core Functionality
- **Authentication**: Email/password authentication via Supabase
- **Dashboard**: Real-time metrics (active clients, clocked-in staff, incidents, medications given)
- **Clock In/Out**: Staff time tracking with shift types and actions
- **Daily Notes**: Client documentation with supervisor review workflow
- **MAR**: Medication administration records tracking
- **Menu Planning**: Daily meal scheduling per facility
- **Activities**: Community outings and day programs scheduling
- **Cleaning Logs**: Daytime and night shift cleaning documentation
- **Incident Reports**: Behavioral, medical, environmental, and allegation reporting
- **Client Directory**: Client information management
- **Grocery Management**: Shopping list by category with purchase tracking
- **Admin Dashboard**: Homes, staff, clients, and daily notes review management

### Technical Features
- Multi-facility support with home switching
- Real-time data synchronization via Supabase
- Row-level security (RLS) for data protection
- Responsive design: Desktop sidebar + Mobile bottom tab bar
- Role-based access (admin, supervisor, staff)
- Digital signatures for supervisor approvals (ready for signature-pad integration)

## Tech Stack

- **Frontend**: React 19, React Router DOM v7, Vite
- **Styling**: Tailwind CSS v4, CSS Variables
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Utilities**: date-fns, signature-pad
- **Fonts**: Google Fonts (Lora + Outfit)

## Project Structure

```
src/
├── App.jsx                # Main app with routing
├── main.jsx              # React entry point
├── index.css             # Tailwind + global styles
├── lib/
│   └── supabase.js       # Supabase client
├── context/
│   ├── AuthContext.jsx   # Authentication state
│   └── HomeContext.jsx   # Active home selection
├── components/
│   ├── Layout.jsx        # Main layout with nav
│   ├── ProtectedRoute.jsx # Auth guard
│   └── HomeSelector.jsx  # Home switcher dropdown
└── pages/
    ├── Login.jsx
    ├── Dashboard.jsx
    ├── ClockInOut.jsx
    ├── DailyNotes.jsx
    ├── MAR.jsx
    ├── Menu.jsx
    ├── Activities.jsx
    ├── Cleaning.jsx
    ├── NOCCleaning.jsx
    ├── Incidents.jsx
    ├── Clients.jsx
    ├── Grocery.jsx
    └── Admin.jsx
```

## Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Copy `.env.example` to `.env` and fill in credentials:
   ```
   VITE_SUPABASE_URL=your_url_here
   VITE_SUPABASE_ANON_KEY=your_key_here
   ```

### 3. Initialize Database

1. Open Supabase SQL Editor
2. Copy and paste the contents of `supabase-schema.sql`
3. Execute the SQL to create all tables, functions, and policies

### 4. Create Admin User

In Supabase Authentication:
1. Create a new user (email/password)
2. In the profiles table, insert a record with:
   - `user_id`: (from auth.users)
   - `home_id`: `550e8400-e29b-41d4-a716-446655440000` (Rising Hill Main)
   - `full_name`: Your name
   - `role`: `admin`
   - `active`: `true`

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## Usage

### Login
- Use your Supabase admin credentials to log in

### Staff Functions
- Clock in/out with shift types
- Create and submit daily notes for clients
- Log medications via MAR
- Report incidents
- View and manage menus, activities, grocery lists
- Log cleaning tasks

### Admin Functions
- Manage homes (view all facilities)
- Manage staff profiles (view all staff across homes)
- Manage clients (view all clients across homes)
- Review submitted daily notes with supervisor approval workflow

## Database Schema

### Core Tables
- `homes`: Facility locations
- `profiles`: Staff/user accounts
- `clients`: Client information
- `daily_notes`: Client documentation with review status
- `medications`: Medication catalog per client
- `mar_records`: Medication administration tracking
- `clock_records`: Staff time tracking
- `incidents`: Incident reports
- `clean_logs`: Cleaning documentation
- `menus`: Daily meal plans
- `activities`: Community outings
- `grocery_items`: Shopping list

### Security
- All tables have Row Level Security (RLS) enabled
- Policies restrict access based on home_id and user role
- Admin users can access all data
- Staff users can only access their home's data

## Color Scheme

CSS Variables defined in `src/index.css`:
- `--primary`: #1e4d3a (dark green)
- `--primary-dark`: #163828
- `--primary-light`: #2a6b50
- `--gold`: #e8a844 (accents)
- `--gold-light`: #f0c06a
- `--red`: #c0392b (warnings/alerts)
- `--red-light`: #e74c3c

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory, ready to deploy to Vercel, Netlify, or any static host.

## Future Enhancements

- Digital signature implementation for supervisor approvals (signature-pad)
- Email notifications for pending reviews
- Report generation and PDF export
- Shift scheduling system
- Payroll integration
- Advanced analytics dashboard
- Mobile app version

## Notes

- The app uses Supabase's realtime subscriptions for live data updates
- All times are stored in ISO format and displayed using date-fns
- Responsive design adapts between desktop (sidebar) and mobile (bottom tab bar)
- Home selection persists in localStorage for user convenience

## Support

For issues or questions, contact the development team.
