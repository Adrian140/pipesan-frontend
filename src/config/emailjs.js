import { apiClient } from './api';
// Legacy contact-form adapter. Delivery requires an explicitly configured endpoint.
export async function sendContactEmail(formData) {
  try { await apiClient.contact.send(formData); return {success:true,message:'Message sent.'}; }
  catch(error) { return {success:false,error:error.message}; }
}
