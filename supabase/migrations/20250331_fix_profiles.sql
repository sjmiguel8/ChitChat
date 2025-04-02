-- First, update existing null usernames with default values
UPDATE public.profiles 
SET username = 'user_' || substr(id::text, 1, 8)
WHERE username IS NULL;

-- Drop the constraint if it exists
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_username'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT unique_username;
    END IF;
END $$;

-- Now make username required and unique
ALTER TABLE public.profiles
ALTER COLUMN username SET NOT NULL;

ALTER TABLE public.profiles
ADD CONSTRAINT unique_username UNIQUE (username);

-- Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
begin
  INSERT INTO public.profiles (id, username)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'username',
      'user_' || substr(new.id::text, 1, 8)
    )
  );
  return new;
end;
$$ language plpgsql security definer;
