import React from 'react';
import { useTranslation } from 'react-i18next';
import './style/About.css';

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="about-container">
      <div className="about-header">
        <h1 className="about-title">About Gladtidings Software Ltd</h1>
        <p className="about-tagline">Helping you shape your future</p>
      </div>

      <div className="about-content">
        {/* Company Background */}
        <section className="about-section">
          <h2 className="section-title">Our Story</h2>
          <p className="section-text">
            Gladtidings Software Ltd is a leading Software Development Company established and 
            registered with PACRA in 2010 (Company Registration Number: 83402). We specialize 
            in developing custom software solutions based on a range of technologies and offer 
            comprehensive IT consultancy services including in-house training.
          </p>
        </section>

        {/* Vision & Mission */}
        <section className="about-section">
          <h2 className="section-title">Our Vision</h2>
          <p className="section-text vision-text">
            To be a leading Software development firm that shapes the future of businesses and 
            institutions by combining leading-edge business strategy and IT knowledge, to develop 
            efficient and effective solutions that keep them one-step ahead.
          </p>
        </section>

        <section className="about-section">
          <h2 className="section-title">Our Mission</h2>
          <p className="section-text">
            Our mission is to make technology an asset for our clients, not a problem. We aim at 
            being the providers of Software Development strategies and IT services which deliver 
            long term commercial benefits, based upon our clients' key business requirements. 
            The strategies evolved should be economical, efficient, durable, and flexible and 
            allow us to respond rapidly to both market and customer needs.
          </p>
        </section>

        {/* Core Values */}
        <section className="about-section">
          <h2 className="section-title">Our Core Values</h2>
          <div className="values-grid">
            <div className="value-item">
              <h3 className="value-title">Integrity</h3>
              <p className="value-description">Open and upfront with our clients</p>
            </div>
            <div className="value-item">
              <h3 className="value-title">Service</h3>
              <p className="value-description">Seek to empower our clients</p>
            </div>
            <div className="value-item">
              <h3 className="value-title">Competence</h3>
              <p className="value-description">Benchmark with the best in the business and always trying new things</p>
            </div>
            <div className="value-item">
              <h3 className="value-title">Kindness</h3>
              <p className="value-description">Go an extra mile to deliver more than is expected of us</p>
            </div>
            <div className="value-item">
              <h3 className="value-title">Growth</h3>
              <p className="value-description">Success is a journey to us, not a destination</p>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="about-section">
          <h2 className="section-title">Our Services</h2>
          <div className="services-list">
            <div className="service-item">
              <h3 className="service-title">Custom Software Development</h3>
              <p className="service-description">
                We develop software programs based on customer requirements, including website development.
              </p>
            </div>
            <div className="service-item">
              <h3 className="service-title">IT Training & Consultancy</h3>
              <p className="service-description">
                We offer in-house training in Web development, Programming (C# & Java), Databases, 
                Mobile Development, Microsoft Office Packages and Statistical Packages such as R or SPSS.
              </p>
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="about-section">
          <h2 className="section-title">Our Flagship Products</h2>
          <div className="products-grid">
            <div className="product-item">
              <h3 className="product-title">Gladtidings eSchool</h3>
              <p className="product-description">
                An information management system for Primary and Secondary Schools in Zambia. 
                Manages enrollments, results, payments, and communication with parents through 
                SMS and email. Used by more than 310 schools country-wide and endorsed by the 
                Ministry of Education.
              </p>
            </div>
            <div className="product-item">
              <h3 className="product-title">Coinfomas</h3>
              <p className="product-description">
                A web-based College Information Management System with applications portal, 
                administrative portal, and mobile app. Currently serving four institutions 
                including Lusaka College of Nursing and Midwifery.
              </p>
            </div>
            <div className="product-item">
              <h3 className="product-title">Zamlib</h3>
              <p className="product-description">
                A comprehensive digital library with over 40,000 resources covering all key 
                academic areas. Content from over 6,000 providers, available on web and mobile 
                with offline access capabilities.
              </p>
            </div>
          </div>
        </section>

        {/* Key Personnel */}
        <section className="about-section">
          <h2 className="section-title">Key Personnel</h2>
          <div className="personnel-list">
            <div className="personnel-item">
              <h3 className="personnel-name">Mr. Dumisani Ncube</h3>
              <p className="personnel-role">Chief Executive Officer</p>
            </div>
            <div className="personnel-item">
              <h3 className="personnel-name">Dr. Mukelabai Mukelabai (PhD)</h3>
              <p className="personnel-role">Chief Technology Officer</p>
            </div>
            <div className="personnel-item">
              <h3 className="personnel-name">Mr. Alphose Habanyati</h3>
              <p className="personnel-role">Marketing</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;