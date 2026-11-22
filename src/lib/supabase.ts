import { createClient } from '@supabase/supabase-js'

// Optional backend. If the two variables are missing, the app still works;
// it just hides the "Save and get share code" button.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase = url && key ? createClient(url, key) : null
