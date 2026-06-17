import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://utfkeqkxdfnkssghmcdd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mwAuxSiHiaxP-bltx7VSCw_zQerjIoA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
