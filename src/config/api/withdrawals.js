import { supabase } from '../supabase';

export const withdrawalsApi = {
  async submit({ name, email, orderRef, items, note, language }) {
    const { data, error } = await supabase.rpc('pipesan_submit_withdrawal', {
      p_name: name, p_email: email, p_order_ref: orderRef, p_items: items, p_note: note, p_language: language,
    });
    if (error) {
      const code = /too_many_requests/.test(error.message) ? 'limit' : /invalid_withdrawal/.test(error.message) ? 'invalid' : 'generic';
      throw Object.assign(new Error(error.message), { code });
    }
    return data;
  },

  async list() {
    const { data, error } = await supabase.from('pipesan_withdrawal_requests').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    return data;
  },

  async update(id, patch) {
    const { error } = await supabase.from('pipesan_withdrawal_requests').update(patch).eq('id', id);
    if (error) throw error;
  },
};
