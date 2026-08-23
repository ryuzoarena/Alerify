-- Restrict song deletion to admins and allow admin edits
DROP POLICY IF EXISTS "Authenticated users can delete songs" ON public.songs;

CREATE POLICY "Only admins can delete songs"
ON public.songs FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update songs"
ON public.songs FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Artist profiles managed by admins
CREATE TABLE public.artist_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_name text NOT NULL UNIQUE,
  display_name text,
  bio text,
  image_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.artist_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artist_profiles TO authenticated;
GRANT ALL ON public.artist_profiles TO service_role;

ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read artist profiles"
ON public.artist_profiles FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Admins can insert artist profiles"
ON public.artist_profiles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update artist profiles"
ON public.artist_profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete artist profiles"
ON public.artist_profiles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_artist_profiles_updated_at
BEFORE UPDATE ON public.artist_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();