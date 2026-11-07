// ==========================================
// Supabase Configuration
// ZAL P2P
// ==========================================

// 1. ربط المفاتيح بالنافذة (window) لكي تقرأها باقي الملفات
window.SUPABASE_URL = "https://ocrkyftwzsqumkebythf.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_bpdYGWB-ijZStcFYuprIYA_Lp2-Y8kn";

// 2. التحقق من تحميل المكتبة وإنشاء العميل
if (typeof window.supabase !== "undefined" && typeof window.supabase.createClient === "function") {
    
    if (!window.supabaseClient) {
        window.supabaseClient = window.supabase.createClient(
            window.SUPABASE_URL,
            window.SUPABASE_ANON_KEY,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true,
                    storage: window.localStorage
                }
            }
        );
        window.sb = window.supabaseClient; // اختصار إضافي
    }
} else {
    console.error("مكتبة Supabase لم يتم تحميلها. تأكد من وضع رابط المكتبة قبل ملف الإعدادات.");
}
