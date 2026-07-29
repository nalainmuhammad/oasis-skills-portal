"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        
        <div className="mb-16 max-w-2xl">
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            Contact <span className="text-oasis-emerald">Support</span>
          </h1>
          <p className="text-lg text-oasis-muted">
            Have a question, feedback, or need help with your courses? Our team is here to assist you. Fill out the form below or reach out via email.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-oasis-emerald/10 flex items-center justify-center shrink-0 border border-oasis-emerald/20">
                <Mail className="w-6 h-6 text-oasis-emerald" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-1">Email Us</h3>
                <p className="text-oasis-muted mb-2">Our friendly team is here to help.</p>
                <a href="mailto:support@oasisfoundation.org" className="text-oasis-emerald hover:text-oasis-gold transition-colors">
                  support@oasisfoundation.org
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-oasis-emerald/10 flex items-center justify-center shrink-0 border border-oasis-emerald/20">
                <MapPin className="w-6 h-6 text-oasis-emerald" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-1">Office</h3>
                <p className="text-oasis-muted mb-2">Come say hello at our headquarters.</p>
                <p className="text-foreground">
                  123 Innovation Drive<br />
                  Tech District, Islamabad<br />
                  Pakistan
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-oasis-emerald/10 flex items-center justify-center shrink-0 border border-oasis-emerald/20">
                <Phone className="w-6 h-6 text-oasis-emerald" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-1">Phone</h3>
                <p className="text-oasis-muted mb-2">Mon-Fri from 9am to 5pm.</p>
                <a href="tel:+923001234567" className="text-foreground hover:text-oasis-emerald transition-colors">
                  +92 300 123 4567
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-8 backdrop-blur-sm">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-oasis-emerald/10 border border-oasis-emerald/20 flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-10 h-10 text-oasis-emerald" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-foreground mb-2">Message Sent!</h3>
                  <p className="text-oasis-muted mb-8 max-w-md mx-auto">
                    Thanks for reaching out! Our support team has received your message and will get back to you within 24 hours.
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-3 bg-foreground/10 hover:bg-foreground/20 text-foreground font-medium rounded-full transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="first-name" className="text-sm font-medium text-foreground">First name</label>
                      <input 
                        type="text" 
                        id="first-name" 
                        required
                        className="w-full bg-background/50 border border-foreground/10 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-oasis-emerald/50 focus:border-oasis-emerald/50 transition-all"
                        placeholder="First name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="last-name" className="text-sm font-medium text-foreground">Last name</label>
                      <input 
                        type="text" 
                        id="last-name" 
                        required
                        className="w-full bg-background/50 border border-foreground/10 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-oasis-emerald/50 focus:border-oasis-emerald/50 transition-all"
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      required
                      className="w-full bg-background/50 border border-foreground/10 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-oasis-emerald/50 focus:border-oasis-emerald/50 transition-all"
                      placeholder="you@company.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium text-foreground">Subject</label>
                    <input 
                      type="text" 
                      id="subject" 
                      required
                      className="w-full bg-background/50 border border-foreground/10 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-oasis-emerald/50 focus:border-oasis-emerald/50 transition-all"
                      placeholder="How can we help?"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-foreground">Message</label>
                    <textarea 
                      id="message" 
                      rows={5}
                      required
                      className="w-full bg-background/50 border border-foreground/10 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-oasis-emerald/50 focus:border-oasis-emerald/50 transition-all resize-none"
                      placeholder="Tell us a little about your issue..."
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-4 bg-oasis-emerald hover:bg-oasis-gold text-black font-semibold rounded-xl transition-colors shadow-[0_0_20px_rgba(0,212,126,0.2)] hover:shadow-[0_0_20px_rgba(255,184,0,0.3)]"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
