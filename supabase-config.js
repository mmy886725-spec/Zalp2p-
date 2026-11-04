/*
  ZALP2P - Supabase Central Connection
*/

(function () {
  "use strict";

  // ضع بيانات مشروعك هنا
  const SUPABASE_URL = "https://ocrkyftwzsqumkebythf.supabase.co/rest/v1/";
  const SUPABASE_ANON_KEY = "sb_publishable_bpdYGWB-ijZStcFYuprIYA_Lp2-Y8kn";

  if (!window.supabase) {
    console.error("Supabase library is not loaded.");
    return;
  }

  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  const ZAL_SUPABASE = {

    client,

    // الحصول على جلسة المستخدم
    async getSession() {
      const { data, error } =
        await client.auth.getSession();

      if (error) throw error;

      return data.session;
    },

    // الحصول على المستخدم الحالي
    async getCurrentUser() {
      const { data, error } =
        await client.auth.getUser();

      if (error) throw error;

      return data.user;
    },

    // إنشاء حساب
    async signUp(email, password, extra = {}) {
      const { data, error } =
        await client.auth.signUp({
          email,
          password,
          options: {
            data: extra
          }
        });

      if (error) throw error;

      return data;
    },

    // تسجيل الدخول
    async signIn(email, password) {
      const { data, error } =
        await client.auth.signInWithPassword({
          email,
          password
        });

      if (error) throw error;

      return data;
    },

    // تسجيل الخروج
    async signOut() {
      const { error } =
        await client.auth.signOut();

      if (error) throw error;
    },

    // قراءة البيانات
    async select(table, columns = "*", options = {}) {
      let query = client
        .from(table)
        .select(columns);

      if (options.filters) {
        Object.entries(options.filters).forEach(
          ([column, value]) => {
            query = query.eq(column, value);
          }
        );
      }

      if (options.orderBy) {
        query = query.order(
          options.orderBy,
          {
            ascending: options.ascending ?? true
          }
        );
      }

      if (Number.isInteger(options.limit)) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;
    },

    // إضافة بيانات
    async insert(table, values) {
      const { data, error } =
        await client
          .from(table)
          .insert(values)
          .select();

      if (error) throw error;

      return data;
    },

    // تعديل بيانات
    async update(table, values, filters) {
      let query = client
        .from(table)
        .update(values);

      Object.entries(filters || {}).forEach(
        ([column, value]) => {
          query = query.eq(column, value);
        }
      );

      const { data, error } =
        await query.select();

      if (error) throw error;

      return data;
    },

    // حذف بيانات
    async remove(table, filters) {
      let query = client
        .from(table)
        .delete();

      Object.entries(filters || {}).forEach(
        ([column, value]) => {
          query = query.eq(column, value);
        }
      );

      const { data, error } =
        await query.select();

      if (error) throw error;

      return data;
    },

    // متابعة تغييرات تسجيل الدخول
    onAuthStateChange(callback) {
      return client.auth.onAuthStateChange(callback);
    }

  };

  // إتاحة الملف لجميع الواجهات
  window.ZAL_SUPABASE = ZAL_SUPABASE;

})();
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabase = createClient(
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm',   // ← بدّل هذا
  'sb_publishable_bpdYGWB-ijZStcFYuprIYA_Lp2-Y8kn'                        // ← بدّل هذا
)

export default supabase