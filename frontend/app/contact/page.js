"use client";

import { useState } from "react";

import "./contact.css";
import { apiFetch } from "../components/apiFetch";
export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
  event.preventDefault();

  try {
    const response = await apiFetch("/contact/messages/", {
      method: "POST",
      body: JSON.stringify(formData),
    });

    console.log("STATUS:", response.status);
    console.log("URL:", response.url);

    const contentType = response.headers.get("content-type");
    console.log("CONTENT TYPE:", contentType);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", errorText);
      return;
    }

    const data = await response.json();

    console.log("Message saved:", data);

    setSubmitted(true);

    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });

    setTimeout(() => {
      setSubmitted(false);
    }, 4000);

  } catch (error) {
    console.error("Failed to send message:", error);
  }
};
  return (
    <>

      <main className="contact-page">

        {/* =========================
            HERO
        ========================= */}

        <section className="contact-hero">

          <div className="contact-hero-content">

            <span className="contact-label">
              GET IN TOUCH
            </span>

            <h1>
              Contact <span>Us</span>
            </h1>

            <p>
              Have a question, suggestion, or need help?
              Our team is here to help you.
            </p>

          </div>

        </section>


        {/* =========================
            CONTACT CONTENT
        ========================= */}

        <section className="contact-section">

          <div className="contact-container">

            {/* =========================
                CONTACT INFORMATION
            ========================= */}

            <div className="contact-info">

              <span className="section-label">
                CONTACT INFORMATION
              </span>

              <h2>
                We’d Love to Hear From You
              </h2>

              <p className="contact-description">
                Whether you have a question about our
                products, an order, or anything else,
                feel free to reach out to us.
              </p>


              {/* EMAIL */}

              <div className="contact-info-card">

                <div className="contact-icon">
                  ✉
                </div>

                <div>
                  <h3>
                    Email Us
                  </h3>

                  <p>
                    support@shopease.com
                  </p>
                </div>

              </div>


              {/* PHONE */}

              <div className="contact-info-card">

                <div className="contact-icon">
                  ☎
                </div>

                <div>
                  <h3>
                    Call Us
                  </h3>

                  <p>
                    +92 300 1234567
                  </p>
                </div>

              </div>


              {/* ADDRESS */}

              <div className="contact-info-card">

                <div className="contact-icon">
                  📍
                </div>

                <div>
                  <h3>
                    Our Location
                  </h3>

                  <p>
                    Lahore, Pakistan
                  </p>
                </div>

              </div>


              {/* WORKING HOURS */}

              <div className="contact-info-card">

                <div className="contact-icon">
                  🕐
                </div>

                <div>
                  <h3>
                    Working Hours
                  </h3>

                  <p>
                    Monday - Saturday
                  </p>

                  <span>
                    9:00 AM - 6:00 PM
                  </span>
                </div>

              </div>

            </div>


            {/* =========================
                CONTACT FORM
            ========================= */}

            <div className="contact-form-wrapper">

              <div className="form-header">

                <span className="section-label">
                  SEND A MESSAGE
                </span>

                <h2>
                  How Can We Help?
                </h2>

                <p>
                  Fill out the form below and we’ll
                  get back to you as soon as possible.
                </p>

              </div>


              {submitted && (
                <div className="success-message">

                  <span className="success-icon">
                    ✓
                  </span>

                  <div>
                    <strong>
                      Message Sent Successfully
                    </strong>

                    <p>
                      Thank you for contacting us.
                      We’ll get back to you soon.
                    </p>
                  </div>

                </div>
              )}


              <form
                className="contact-form"
                onSubmit={handleSubmit}
              >

                {/* NAME */}

                <div className="form-group">

                  <label htmlFor="name">
                    Your Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* EMAIL */}

                <div className="form-group">

                  <label htmlFor="email">
                    Email Address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* SUBJECT */}

                <div className="form-group">

                  <label htmlFor="subject">
                    Subject
                  </label>

                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    placeholder="What is this regarding?"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* MESSAGE */}

                <div className="form-group">

                  <label htmlFor="message">
                    Message
                  </label>

                  <textarea
                    id="message"
                    name="message"
                    placeholder="Write your message here..."
                    rows="6"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* SUBMIT */}

                <button
                  type="submit"
                  className="contact-submit-button"
                >
                  Send Message
                  <span>→</span>
                </button>

              </form>

            </div>

          </div>

        </section>


        {/* =========================
            FAQ CTA
        ========================= */}

        <section className="contact-cta">

          <div className="contact-cta-content">

            <div className="cta-icon">
              ?
            </div>

            <div>
              <h2>
                Looking for Quick Answers?
              </h2>

              <p>
                Check our frequently asked questions
                for quick solutions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/faq";
              }}
            >
              Visit FAQ
              <span>→</span>
            </button>

          </div>

        </section>

      </main>
    </>
  );
}