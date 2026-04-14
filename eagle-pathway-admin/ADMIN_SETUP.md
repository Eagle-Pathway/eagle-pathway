# Initial Admin Setup

The Eagle Pathway Admin Portal requires a user to have the `admin` role in the `users` table to gain access. Since the first admin cannot be created through the portal itself, you must set it up manually in Supabase.

## Option 1: Promote an Existing User (Recommended)

If you have already signed up through the mobile app or any other method, you can promote that user to an admin using the following SQL in the Supabase SQL Editor:

```sql
-- Replace 'YOUR_USER_EMAIL' with the email of the user you want to promote
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'YOUR_USER_EMAIL';
```

## Option 2: Create a New Admin Manually

If you don't have a user yet, follow these steps:

1.  Go to **Authentication -> Users** in the Supabase Dashboard.
2.  Click **Add User -> Create New User**.
3.  Enter the email and password for the admin.
4.  Once created, copy the **User ID (UUID)**.
5.  Go to the **SQL Editor** and run:

```sql
-- Replace 'USER_UUID_HERE' with the ID you copied
-- Replace 'ADMIN_EMAIL' and 'ADMIN_PHONE' with the actual values
INSERT INTO public.users (id, full_name, email, phone, role)
VALUES (
  'USER_UUID_HERE', 
  'Initial Admin', 
  'ADMIN_EMAIL', 
  'ADMIN_PHONE', 
  'admin'
)
ON CONFLICT (id) DO UPDATE 
SET role = 'admin';
```

## Verification

After running the SQL, you should be able to log in at the [Admin Portal](http://localhost:3000/login) using your credentials.
