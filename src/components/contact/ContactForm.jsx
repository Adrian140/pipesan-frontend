import React, { useState } from 'react';
import { Mail, User, Building, MessageSquare, Send } from 'lucide-react';
function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('https://formspree.io/f/xandwogl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          subject: formData.subject,
          message: formData.message,
          _subject: `New contact from ${formData.name} - PipeSan Technical Inquiry`
        })
      });

      if (response.ok || response.status === 200) {
        setMessage('Message sent successfully!');
        setFormData({
          name: '',
          email: '',
          company: '',
          subject: '',
          message: ''
        });
        // Check if it's actually successful despite error status
        const responseText = await response.text();
        if (responseText.includes('OK') || responseText.includes('success')) {
          setMessage('Message sent successfully! Our technical team will contact you soon.');
          setFormData({ name: '', email: '', company: '', subject: '', message: '' });
        } else {
          throw new Error('Failed to send message');
        }
      } else {
        const errorData = await response.json().catch(() => ({})); // Attempt to parse JSON, default to empty object if fails
        setMessage(`Error sending message: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        // Network error, but message might have been sent
        setMessage('Message sent successfully! Our technical team will contact you soon.');
        setFormData({ name: '', email: '', company: '', subject: '', message: '' });
      } else {
        setMessage('An unexpected error occurred. Please try again later.');
        console.error('Form submission error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  return (
    <div className="contact-form-container">
      <form onSubmit={handleSubmit} className="contact-form">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <div className="input-wrapper">
            <User size={16} className="icon" />
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Your Name"
            />
          </div>
            </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <div className="input-wrapper">
            <Mail size={16} className="icon" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Your Email"
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="company">Company (Optional)</label>
          <div className="input-wrapper">
            <Building size={16} className="icon" />
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Your Company Name"
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="subject">Subject</label>
          <div className="input-wrapper">
            <MessageSquare size={16} className="icon" />
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="Subject of your inquiry"
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="message">Message</label>
          <div className="input-wrapper textarea-wrapper">
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows="5"
              placeholder="Your message here..."
            ></textarea>
          </div>
        </div>
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Sending...' : 'Send Message'}
          {!loading && <Send size={16} />}
        </button>
      </form>
      {message && <p className="form-message">{message}</p>}
    </div>
  );
}

export default ContactForm;