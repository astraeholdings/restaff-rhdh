# Rising Hill Staff Management Portal

A comprehensive staff management system for residential care facilities, built with React 19, Supabase, and Tailwind CSS.

## Features

### Core Functionality
- **Authentication**: Email/password sign-in and sign-up via Supabase
- **User Management**: SuperAdmin can promote users to different roles (staff → supervisor → admin → superAdmin)
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
- **Admin Dashboard**:
  - User Management (SuperAdmin only): View and manage all users, change roles and status
  - Homes: View all facilities
  - Staff: Manage staff profiles and assignments
  - Clients: Manage client information
  - Daily Notes Review: Supervisor approval workflow

### Technical Features
- Multi-facility support with home switching
- Real-time data synchronization via Supabase
- Row-level security (RLS) for data protection
- Responsive design: Desktop sidebar + Mobile bottom tab bar
- Role-based access (superAdmin, admin, supervisor, staff)
- Digital signatures for supervisor approvals (ready for signature-pad integration)

## Tech Stack

- **Frontend**: React 19, React Router DOM v7, Vite
- **Styling**: Tailwind CSS v4, CSS Variables
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Utilities**: date-fns, signature-pad
- **Fonts**: Google Fonts (Lora + Outfit)

## User Roles

- **SuperAdmin**: Full system access, can manage all users, homes, and facilities
- **Admin**: Can manage home staff and clients, review daily notes, access admin dashboard
- **Supervisor**: Can supervise staff, approve daily notes, access most features
- **Staff**: Can clock in/out, create daily notes, log medications, view information

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
    ├── Signup.jsx
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

### 4. Create Master Admin User

#### Option A: Using Supabase UI
1. Go to **Authentication > Users** in Supabase
2. Click **"Add user"** and create:
   - Email: `Braylon@astraeholdings.com`
   - Password: (set secure password)
3. Copy the user ID from the auth.users table
4. Open **SQL Editor** and run:
   ```sql
   INSERT INTO profiles (user_id, full_name, role, active)
   VALUES ('PASTE_USER_ID_HERE', 'Braylon', 'superAdmin', true);
   ```

#### Option B: Via Sign-Up Page
1. Visit the app and click "Sign Up"
2. Create account with email: `Braylon@astraeholdings.com`
3. In Supabase SQL Editor, update the role to superAdmin:
   ```sql
   UPDATE profiles SET role = 'superAdmin' WHERE full_name = 'Braylon';
   ```

### 5. Create Additional Users

Users can self-register via the **Sign Up** page, or admins can create them manually through the **User Management** dashboard.

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## Usage

### Sign Up
- New users can create accounts via the **Sign Up** page
- Account creation automatically assigns `staff` role
- SuperAdmin can promote users to higher roles

### User Management (SuperAdmin Only)
1. Log in with superAdmin account
2. Click **Admin** → **User Management** tab
3. View all users in the system
4. Change user roles with the dropdown menu
5. Toggle user active/inactive status
6. Assign users to facilities

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

### SuperAdmin Functions
- Full User Management dashboard with role assignment
- View and manage all homes
- View all staff and clients across facilities
- Access to all administrative functions
- Promote users to admin/superAdmin status

## Database Schema

### Core Tables
- `homes`: Facility locations
- `profiles`: Staff/user accounts with roles
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
- SuperAdmin and Admin users can access all data
- Staff users can only access their home's data
- Helper functions: `is_super_admin()`, `is_admin()`, `is_supervisor_or_above()`

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
- Two-factor authentication
- User profile customization

## Notes

- The app uses Supabase's realtime subscriptions for live data updates
- All times are stored in ISO format and displayed using date-fns
- Responsive design adapts between desktop (sidebar) and mobile (bottom tab bar)
- Home selection persists in localStorage for user convenience
- Role-based navigation: users see only menu items they have permission to access

## Support

For issues or questions, contact the development team.
