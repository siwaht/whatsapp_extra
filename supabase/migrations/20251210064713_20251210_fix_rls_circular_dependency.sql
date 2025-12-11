/*
  # Fix RLS Circular Dependency Issue
  
  The "Admins can view all profiles" and "Admins can insert profiles" policies
  create a circular dependency where the RLS policy tries to query the same
  protected table during authentication, causing "Database error querying schema".
  
  Solution: Remove the admin-based policies that cause circular dependencies.
  Keep simple ownership-based policies that don't have circular references.
  
  Changes:
  1. Drop the problematic admin policies
  2. Keep simple policies for users viewing/updating their own profiles
  3. Allow the trigger to auto-create profiles on signup
*/

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);