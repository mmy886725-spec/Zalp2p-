import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabase = createClient(
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm',   // ← بدّل هذا
  'sb_publishable_bpdYGWB-ijZStcFYuprIYA_Lp2-Y8kn'                        // ← بدّل هذا
)

export default supabase