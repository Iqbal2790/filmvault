import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://gtzkkefjaqnpluxvmkvx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0emtrZWZqYXFucGx1eHZta3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NTM5MzksImV4cCI6MjA5ODEyOTkzOX0.WjGeemfxB9vPL6arVKT7aZ0aJyddu50SYOAG0RTkcy4';

export const supabase = createClient(supabaseUrl, supabaseKey);
