# Debugging Guide - Rising Hill Staff Portal

## Quick Logging Features

The app now has **comprehensive logging** to help debug any issues, especially login failures.

### 🔍 How to View Logs

#### Method 1: In-App Logs Viewer (Recommended)
1. Click the **📋 Logs** button in the left sidebar
2. View real-time logs with color-coded levels
3. Filter by log type (Errors, Warnings, Success, Info)
4. Expand log details to see error messages and data
5. Export logs as JSON for sharing

#### Method 2: Browser Console
Press **F12** or **Ctrl+Shift+I** to open Developer Tools:
- Go to **Console** tab
- All logs appear with color coding and timestamps
- Error logs appear in red
- Success logs appear in green

## Common Issues & How to Debug

### Login Not Working

**Step 1: Open the Logs page**
- Click **📋 Logs** in navigation
- Filter to **"Errors Only"** to see what went wrong

**Step 2: Look for these error messages:**

| Error | Cause | Fix |
|-------|-------|-----|
| `Invalid login credentials` | Wrong email/password | Check credentials, ensure user exists |
| `Failed to get session` | Supabase connection issue | Check VITE_SUPABASE_URL and key in .env |
| `Failed to fetch profile` | Profile table issue | Run supabase-schema.sql again |
| `User not found` | Profile doesn't exist in DB | Create profile manually or via signup |

### Sign-Up Not Working

**Check the Logs page for:**
- `Sign up failed` - Email already registered or password too short
- `Missing "./base" specifier` - CSS/Tailwind issue (should be fixed)
- `User created, creating profile` followed by profile error - Database schema issue

### Lost in the App

**At any time, click Logs to see:**
- Current user: Look for `Session found for user` or `No active session`
- Current page: Each log shows the URL path
- Recent actions: Last 50 logs show what happened

## Log Levels Explained

```
🔵 INFO     - General information (signin started, profile loading)
🟢 SUCCESS  - Operation completed (signin successful, profile loaded)
🟡 WARN     - Something unexpected but not critical
🔴 ERROR    - Something failed (signin failed, profile not found)
⚪ DEBUG    - Detailed info for developers (dev mode only)
```

## Exporting Logs for Support

If you need help:

1. Go to **Logs page**
2. Click **📥 Export** button
3. Save the JSON file
4. Send to development team

The JSON file contains:
- Timestamps of every action
- Error messages and codes
- User IDs and emails (non-sensitive)
- API response details

## Example: Debugging a Login Failure

### Scenario: "Failed to sign in" error

**Step 1: Open Logs**
- Click 📋 Logs

**Step 2: Look for ERROR entries**
- Find the red error entries
- Expand the error to see details

**Step 3: Read the error message**
```
ERROR: Sign in failed
{
  "email": "user@example.com",
  "error": "Invalid login credentials",
  "code": 400,
  "status": 400
}
```

**Step 4: Interpret the error**
- `Invalid login credentials` = Wrong password or user doesn't exist
- **Fix**: Verify email/password are correct, or sign up first

### Scenario: "Failed to fetch profile"

**Step 1: Look at the error details**
```
ERROR: Failed to fetch profile
{
  "userId": "abc123...",
  "error": "relation \"profiles\" does not exist",
  "code": "42P01"
}
```

**Step 2: This means:**
- The profiles table doesn't exist in the database

**Step 3: Fix:**
- Go to Supabase SQL Editor
- Run `supabase-schema.sql` again

## Real-Time Monitoring

**Auto-refresh enabled by default:**
- Logs update automatically every second
- Watch as you interact with the app
- Perfect for live debugging

**Disable auto-refresh:**
- Click the checkbox to stop auto-updating
- Useful for studying specific logs

## Storage & Persistence

- **Last 500 logs** are saved in your browser
- **Persists across page refreshes**
- **Cleared when you click "Clear" button**
- Different per browser/device

## Integration with Supabase

The logs include:
- Supabase error codes and messages
- HTTP status codes (401, 404, 500, etc.)
- Database operation details
- Authentication state changes

## Tips

✅ **DO:**
- Check logs first when something fails
- Look for the first ERROR in the sequence
- Export logs if asking for help
- Note the timestamp of the issue

❌ **DON'T:**
- Trust only error messages - read the full context
- Assume the first error is always the cause (look for chains)
- Clear logs right after an error (save them first!)

## Example Log Flow - Successful Login

```
INFO: Checking authentication status...
INFO: No active session found
INFO: Login form submitted { email: "user@example.com" }
INFO: Attempting sign in... { email: "user@example.com" }
SUCCESS: Sign in successful { userId: "abc123...", email: "user@example.com" }
INFO: Auth state changed: { event: "SIGNED_IN", userId: "abc123..." }
INFO: Fetching user profile... { userId: "abc123..." }
SUCCESS: Profile loaded successfully {
  profileId: "xyz789...",
  name: "John Doe",
  role: "staff"
}
SUCCESS: Login successful, redirecting to dashboard
```

## Example Log Flow - Failed Login

```
INFO: Login form submitted { email: "wrong@example.com" }
INFO: Attempting sign in... { email: "wrong@example.com" }
ERROR: Sign in failed {
  email: "wrong@example.com",
  error: "Invalid login credentials",
  code: 400
}
ERROR: Login failed: Invalid login credentials
```

## Getting Help

When reporting a bug:

1. **Screenshot the Logs page** showing the error
2. **Export the logs** (📥 Export button)
3. **Note the timestamp** of when it happened
4. **Describe what you were doing** when it failed

This helps us identify and fix issues quickly!
