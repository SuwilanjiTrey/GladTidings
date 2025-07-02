import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './style/Contact.css';

const Contact = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="contact-container">
      <div className="contact-header">
        <h1 className="contact-title">Contact Gladtidings Software Ltd</h1>
        <p className="contact-subtitle">Get in touch with us - We're here to help you shape your future</p>
      </div>

      <div className="contact-content">
        {/* Contact Information */}
        <section className="contact-info-section">
          <div className="contact-info-grid">
            <div className="contact-info-card">
              <div className="info-icon">📍</div>
              <h3 className="info-title">Address</h3>
              <p className="info-details">
                25/26 Nkwazi Rd, Second Floor<br />
                Techzam Building<br />
                P.O Box 35324, Lusaka<br />
                Zambia
              </p>
            </div>

            <div className="contact-info-card">
              <div className="info-icon">📞</div>
              <h3 className="info-title">Phone</h3>
              <p className="info-details">
                <a href="tel:+260978966774">+260 978 966774</a><br />
                <a href="tel:+260955441447">+260 955 441447</a>
              </p>
            </div>

            <div className="contact-info-card">
              <div className="info-icon">✉️</div>
              <h3 className="info-title">Email</h3>
              <p className="info-details">
                <a href="mailto:info@gladtidingszm.com">info@gladtidingszm.com</a><br />
                <a href="mailto:cto@zamlib.com">cto@zamlib.com</a>
              </p>
            </div>

            <div className="contact-info-card">
              <div className="info-icon">🌐</div>
              <h3 className="info-title">Website</h3>
              <p className="info-details">
                <a href="https://www.gladtidingszm.com" target="_blank" rel="noopener noreferrer">
                  www.gladtidingszm.com
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="contact-form-section">
          <h2 className="form-title">Send Us a Message</h2>
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name" className="form-label">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="subject" className="form-label">Subject *</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="form-input"
                required
                placeholder="What is this regarding?"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message" className="form-label">Message *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                className="form-textarea"
                required
                rows="5"
                placeholder="Please provide details about your inquiry..."
              ></textarea>
            </div>

            <button type="submit" className="submit-button">
              Send Message
            </button>
          </form>
        </section>

        {/* Company Registration */}
        <section className="company-details">
          <div className="company-reg">
            <h3>Company Information</h3>
            <p><strong>Company Registration Number:</strong> 83402</p>
            <p><strong>Registered with:</strong> PACRA (Patents and Companies Registration Agency)</p>
            <p><strong>Established:</strong> 2010</p>
          </div>
        </section>

        {/* Business Hours */}
        <section className="business-hours">
          <h3>Business Hours</h3>
          <div className="hours-grid">
            <div className="hours-item">
              <span className="day">Monday - Friday</span>
              <span className="time">08:00 - 17:00</span>
            </div>
            <div className="hours-item">
              <span className="day">Saturday</span>
              <span className="time">08:00 - 12:00</span>
            </div>
            <div className="hours-item">
              <span className="day">Sunday</span>
              <span className="time">Closed</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contact;