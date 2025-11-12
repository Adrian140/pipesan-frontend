import { supabase } from '../supabase';
import { handleDatabaseError } from './health';

export const invoicesApi = {
  getAll: async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Not authenticated');

        const { data: userProfile, error: profileError } = await supabase
          .from('users').select('id').eq('auth_id', user.id).single();
        
        if (profileError) {
          await handleDatabaseError(profileError, 'get user for invoices', retries);
          retries--;
          continue;
        }

        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          await handleDatabaseError(error, 'get invoices', retries);
          retries--;
          continue;
        }
        
        return (data || []).map(invoice => ({
          id: invoice.id,
          number: invoice.invoice_number,
          status: invoice.status,
          amount: invoice.total_amount,
          vatAmount: invoice.tax_amount,
          date: invoice.date,
          dueDate: invoice.due_date,
          description: `Invoice ${invoice.invoice_number}`,
        }));
      } catch (error) {
        const result = await handleDatabaseError(error, 'get invoices', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  download: async (invoiceId) => {
    const blob = new Blob(['Mock PDF Content'], { type: 'application/pdf' });
    return blob;
  },

  view: async (invoiceId) => {
    const blob = new Blob(['Mock PDF Content'], { type: 'application/pdf' });
    return blob;
  },
};
