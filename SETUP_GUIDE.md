# Quick Setup Guide - Rising Hill Staff Portal

## 1. Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- Git installed

## 2. Initial Setup (5 minutes)

### Clone and Install
```bash
cd restaff-rhdh
npm install
cp .env.example .env
```

### Add Supabase Credentials to .env
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 3. Database Setup (2 minutes)

1. Log in to [Supabase](https://supabase.com)
2. Go to your project → **SQL Editor**
3. Click **"New Query"**
4. Copy entire contents of `supabase-schema.sql`
5. Paste and click **"Run"**

## 4. Create Master Admin Account (5 minutes)

### Method A: Quick Via Sign-Up (Recommended)
1. Run development server: `npm run dev`
2. Visit `http://localhost:5173`
3. Click **"Sign Up"**
4. Create account:
   - Full Name: `Braylon`
   - Email: `Braylon@astraeholdings.com`
   - Password: (your choice)
5. After successful signup, go to Supabase **SQL Editor** and run:
   ```sql
   UPDATE profiles
   SET role = 'superAdmin'
   WHERE full_name = 'Braylon';
   ```

### Method B: Via Supabase UI
1. Go to Supabase → **Authentication > Users**
2. Click **"Add user"**
3. Email: `Braylon@astraeholdings.com`
4. Password: (your choice)
5. Create the user
6. Copy the user ID (from the user row)
7. Go to **SQL Editor** and run:
   ```sql
   INSERT INTO profiles (user_id, full_name, role, active)
   VALUES ('PASTE_USER_ID_HERE', 'Braylon', 'superAdmin', true);
   ```

## 5. Start Development Server

```bash
npm run dev
```

Visit: `http://localhost:5173`

Login with: `Braylon@astraeholdings.com` and your password

## 6. What You Can Do Now

### As SuperAdmin (Braylon)
✅ Access **Admin > User Management** dashboard
✅ View all users in the system
✅ Change user roles (staff → supervisor → admin → superAdmin)
✅ Toggle user active/inactive
✅ Access all other admin features

### Other Users Can
✅ Click **"Sign Up"** to create new accounts (auto-assigned as "staff")
✅ SuperAdmin can promote them to higher roles
✅ Use all staff features once assigned to a home

## 7. Key Features

| Feature | Access | Purpose |
|---------|--------|---------|
| User Management | SuperAdmin Only | Manage all users and roles |
| Dashboard | All Users | View real-time metrics |
| Clock In/Out | Staff+ | Time tracking |
| Daily Notes | Staff+ | Client documentation |
| MAR | Staff+ | Medication tracking |
| Admin Panel | Admin+ | Manage homes, staff, clients |
| Menu Planning | Staff+ | Schedule meals |
| Incident Reports | Staff+ | Document incidents |

## 8. Troubleshooting

### Can't log in?
- Verify email/password in Supabase Auth
- Check profile exists in profiles table

### Missing tables?
- Re-run the `supabase-schema.sql` file
- Check Supabase is in correct project

### Sign-up not working?
- Enable "Email" auth in Supabase → Authentication → Providers
- Check `.env` has correct SUPABASE_ANON_KEY

### Users can't see data?
- Verify RLS policies were created (check SQL execution completed without errors)
- Assign users to a home in profiles table

## 9. Next Steps

1. **Create test users**: Use Sign Up page to create a few test accounts
2. **Assign roles**: Use User Management to assign supervisor/admin roles
3. **Add clients**: Use Admin → Clients to add residential clients
4. **Add facilities**: Use Admin → Homes to manage Rising Hill locations
5. **Start using**: Begin clocking in, creating daily notes, etc.

## 10. Production Deployment

```bash
npm run build
```

Deploy the `dist/` folder to:
- Vercel (recommended)
- Netlify
- GitHub Pages
- Your own server

## Support

For issues:
1. Check browser console for errors (F12)
2. Check Supabase logs in dashboard
3. Verify all tables exist: `supabase-schema.sql` was fully executed

---

**You're all set! 🚀**

The portal is ready for development and testing. Begin with the User Management dashboard to add staff and start building your team.
