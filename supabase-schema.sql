-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Homes table
CREATE TABLE IF NOT EXISTS homes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  license_number TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Profiles (staff) table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  home_id UUID REFERENCES homes(id),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff', -- 'superAdmin', 'admin', 'supervisor', 'staff'
  position TEXT, -- 'direct support', 'supervisor', 'manager', etc
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob DATE,
  support_level TEXT, -- 'low', 'medium', 'high'
  medical_notes TEXT,
  behavioral_notes TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Clock records table
CREATE TABLE IF NOT EXISTS clock_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shift_type TEXT NOT NULL, -- 'day', 'swing', 'grave'
  action TEXT NOT NULL, -- 'arrived', 'left', 'break start', 'break end'
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Daily notes table
CREATE TABLE IF NOT EXISTS daily_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meals JSONB DEFAULT '{}', -- {breakfast, lunch, dinner, snack}
  medications_given TEXT,
  activities TEXT,
  behaviors TEXT,
  medical_appointments TEXT,
  clothing_log TEXT,
  supervisor_review_status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'approved'
  supervisor_id UUID REFERENCES profiles(id),
  supervisor_signed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Medications table
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT, -- 'once daily', 'twice daily', 'as needed', etc
  prescriber TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- MAR (Medication Administration Records) table
CREATE TABLE IF NOT EXISTS mar_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id UUID REFERENCES medications(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  administered_at TIMESTAMP NOT NULL,
  status TEXT NOT NULL, -- 'given', 'refused', 'pending', 'prn'
  administered_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  incident_type TEXT NOT NULL, -- 'behavioral', 'medical', 'environmental', 'allegation'
  severity TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
  occurred_at TIMESTAMP NOT NULL,
  narrative TEXT NOT NULL,
  follow_up TEXT,
  sir_number TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Cleaning logs table
CREATE TABLE IF NOT EXISTS clean_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  shift TEXT NOT NULL, -- 'day', 'swing', 'night'
  date DATE NOT NULL,
  tasks JSONB DEFAULT '{}', -- {area: {completed, time}, ...}
  staff_initials TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Menus table
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  breakfast TEXT,
  lunch TEXT,
  dinner TEXT,
  snack TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  start_time TIME,
  end_time TIME,
  attendees TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Grocery items table
CREATE TABLE IF NOT EXISTS grocery_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'other', -- 'produce', 'dairy', 'meat', 'pantry', 'frozen', 'beverages', 'household', 'other'
  quantity TEXT,
  unit TEXT, -- 'lb', 'oz', 'count', etc
  purchased BOOLEAN DEFAULT false,
  week_of DATE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Helper function to check if user is superAdmin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'superAdmin'
    FROM profiles
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin or superAdmin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'superAdmin')
    FROM profiles
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is supervisor or above
CREATE OR REPLACE FUNCTION is_supervisor_or_above()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('supervisor', 'admin', 'superAdmin')
    FROM profiles
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clock_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE mar_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE clean_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for homes
CREATE POLICY "Authenticated users can read homes" ON homes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage homes" ON homes
  FOR ALL USING (is_admin());

-- RLS Policies for profiles
CREATE POLICY "Users can read profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage profiles" ON profiles
  FOR ALL USING (is_admin());

-- RLS Policies for clients
CREATE POLICY "Staff can read clients in their home" ON clients
  FOR SELECT USING (
    home_id IN (
      SELECT home_id FROM profiles WHERE user_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "Admin can manage clients" ON clients
  FOR ALL USING (is_admin());

-- RLS Policies for clock_records
CREATE POLICY "Staff can insert clock records in their home" ON clock_records
  FOR INSERT WITH CHECK (
    home_id IN (
      SELECT home_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can read clock records in their home" ON clock_records
  FOR SELECT USING (
    home_id IN (
      SELECT home_id FROM profiles WHERE user_id = auth.uid()
    ) OR is_admin()
  );

-- RLS Policies for daily_notes
CREATE POLICY "Staff can insert daily notes in their home" ON daily_notes
  FOR INSERT WITH CHECK (
    home_id IN (
      SELECT home_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can read daily notes in their home" ON daily_notes
  FOR SELECT USING (
    home_id IN (
      SELECT home_id FROM profiles WHERE user_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "Supervisors can update daily notes" ON daily_notes
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('supervisor', 'admin')
  );

-- RLS Policies for medications
CREATE POLICY "Staff can read medications in their home" ON medications
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE home_id IN (
        SELECT home_id FROM profiles WHERE user_id = auth.uid()
      )
    ) OR is_admin()
  );

-- RLS Policies for mar_records
CREATE POLICY "Staff can insert mar records in their home" ON mar_records
  FOR INSERT WITH CHECK (
    home_id IN (
      SELECT home_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can read mar records in their home" ON mar_records
  FOR SELECT USING (
    home_id IN (
      SELECT home_id FROM profiles WHERE user_id = auth.uid()
    ) OR is_admin()
  );

-- RLS Policies for incidents
CREATE POLICY "Staff can insert incidents in their home" ON incidents
  FOR INSERT WITH CHECK (
    home_id IN (
      SELECT home_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can read incidents in their home" ON incidents
  FOR SELECT USING (
    home_id IN (
      SELECT home_id FROM profiles WHERE user_id = auth.uid()
    ) OR is_admin()
  );

-- RLS Policies for clean_logs
CREATE POLICY "Staff can insert clean logs in their home" ON clean_logs
  FOR INSERT WITH CHECK (
    home_id IN (
      SELECT home_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can read clean logs in their home" ON clean_logs
  FOR SELECT USING (
    home_id IN (
      SELECT home_id FROM profiles WHERE user_id = auth.uid()
    ) OR is_admin()
  );

-- RLS Policies for menus
CREATE POLICY "Staff can insert menus in their home" ON menus
  FOR INSERT WITH CHECK (
    home_id IN (
      SELECT home_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can read menus in their home" ON menus
  FOR SELECT USING (
    home_id IN (
      SELECT home_id FROM profiles WHERE user_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "Staff can update menus in their home" ON menus
  FOR UPDATE USING (
    home_id IN (
      SELECT home_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for activities
CREATE POLICY "Staff can insert activities in their home" ON activities
  FOR INSERT WITH CHECK (
    home_id IN (
      SELECT home_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can read activities in their home" ON activities
  FOR SELECT USING (
    home_id IN (
      SELECT home_id FROM profiles WHERE user_id = auth.uid()
    ) OR is_admin()
  );

-- RLS Policies for grocery_items
CREATE POLICY "Staff can insert grocery items in their home" ON grocery_items
  FOR INSERT WITH CHECK (
    home_id IN (
      SELECT home_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can read grocery items in their home" ON grocery_items
  FOR SELECT USING (
    home_id IN (
      SELECT home_id FROM profiles WHERE user_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "Staff can update grocery items in their home" ON grocery_items
  FOR UPDATE USING (
    home_id IN (
      SELECT home_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_home_id ON profiles(home_id);
CREATE INDEX idx_clients_home_id ON clients(home_id);
CREATE INDEX idx_clock_records_home_id ON clock_records(home_id);
CREATE INDEX idx_clock_records_profile_id ON clock_records(profile_id);
CREATE INDEX idx_daily_notes_home_id ON daily_notes(home_id);
CREATE INDEX idx_daily_notes_client_id ON daily_notes(client_id);
CREATE INDEX idx_daily_notes_date ON daily_notes(date);
CREATE INDEX idx_medications_client_id ON medications(client_id);
CREATE INDEX idx_mar_records_client_id ON mar_records(client_id);
CREATE INDEX idx_mar_records_medication_id ON mar_records(medication_id);
CREATE INDEX idx_incidents_home_id ON incidents(home_id);
CREATE INDEX idx_incidents_client_id ON incidents(client_id);
CREATE INDEX idx_clean_logs_home_id ON clean_logs(home_id);
CREATE INDEX idx_menus_home_id ON menus(home_id);
CREATE INDEX idx_menus_date ON menus(date);
CREATE INDEX idx_activities_home_id ON activities(home_id);
CREATE INDEX idx_activities_date ON activities(date);
CREATE INDEX idx_grocery_items_home_id ON grocery_items(home_id);
CREATE INDEX idx_grocery_items_week_of ON grocery_items(week_of);

-- Insert sample data (optional)
INSERT INTO homes (id, name, address, license_number) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Rising Hill Main', '123 Oak Street', 'RH-001'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Rising Hill Annex', '456 Maple Avenue', 'RH-002')
ON CONFLICT DO NOTHING;

-- IMPORTANT: After creating the master admin user in Supabase Auth (Braylon@astraeholdings.com),
-- insert their profile with superAdmin role:
-- INSERT INTO profiles (user_id, full_name, role, active) VALUES
--   ('UUID_FROM_AUTH_USERS_TABLE', 'Braylon', 'superAdmin', true);
