
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aojdexqulkuwmxzhrkyt.supabase.co';  // Ganti dengan URL Supabase Anda
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvamRleHF1bGt1d214emhya3l0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA1NzAxMywiZXhwIjoyMDc2NjMzMDEzfQ.7EjICnCHwkChRcoYHIlnhdcLNFkZqMqCDZglj7DcGKs';  // Ganti dengan API Key Supabase Anda

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
    