'use client';

import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import './PrivacyTerms.css';

const SECTIONS = [
  { id: 'terms',    label: 'Terms of Service' },
  { id: 'privacy',  label: 'Privacy Policy' },
  { id: 'external', label: 'External Links' },
  { id: 'dmca',     label: 'DMCA Compliance' },
  { id: 'cookies',  label: 'Cookies & Ads' },
];

export default function PrivacyPage() {
  const [active, setActive] = useState('terms');

  return (
    <PageLayout>
      <div className="pt-page">
        <div className="container">
          <div className="pt-header">
            <div className="pt-badge">Legal</div>
            <h1 className="pt-title">Privacy &amp; Terms of Use</h1>
            <p className="pt-subtitle">Last updated: January 2025</p>
          </div>

          <div className="pt-layout">
            <aside className="pt-sidebar">
              {SECTIONS.map(s => (
                <button key={s.id} className={'pt-nav-btn' + (active === s.id ? ' active' : '')} onClick={() => setActive(s.id)}>
                  {s.label}
                </button>
              ))}
              <div className="pt-contact-box">
                <div className="pt-contact-label">Contact Us</div>
                <a href="mailto:idenwebstudio@gmail.com" className="pt-contact-email">idenwebstudio@gmail.com</a>
              </div>
            </aside>

            <main className="pt-content">
              {active === 'terms' && (
                <div className="pt-section">
                  <h2>Terms of Service</h2>
                  <p>Welcome to idenwebstudio. By accessing or using our website, you agree to be bound by these Terms of Service. Please read them carefully before using the site.</p>
                  <h3>Content</h3>
                  <p>All content available on idenwebstudio ("Content") is collected from publicly available sources on the internet and is provided free of charge to all members and visitors for personal, non-commercial reading purposes.</p>
                  <p>If you wish to share or reproduce any Content from this site, you must provide a visible source link crediting idenwebstudio. If you intend to use the Content for any commercial or business purpose, you are solely responsible for researching and obtaining the appropriate original copyright permissions.</p>
                  <p>Any copyright violation in any form is the full legal responsibility of the party committing the violation. idenwebstudio assumes no liability for misuse of Content by third parties.</p>
                  <h3>User Conduct</h3>
                  <p>Users agree not to post comments or content that is abusive, defamatory, obscene, hateful, or otherwise objectionable. idenwebstudio reserves the right to remove any content and suspend or terminate accounts that violate these terms without prior notice.</p>
                  <h3>Disclaimer</h3>
                  <p>idenwebstudio makes no warranties, expressed or implied, regarding the accuracy, completeness, or reliability of any Content on this site. Your use of the site is at your own risk.</p>
                </div>
              )}

              {active === 'privacy' && (
                <div className="pt-section">
                  <h2>Privacy Policy</h2>
                  <p>idenwebstudio respects your privacy. This Privacy Policy describes how we collect, use, and share information about you when you use our website.</p>
                  <h3>Information We Collect</h3>
                  <p>We collect information you provide directly to us, such as when you create an account, post a comment, or contact us. This may include your name, email address, and any other information you choose to provide.</p>
                  <p>We also automatically collect certain information when you use our site, including log data (such as your IP address, browser type, and pages visited) and cookie data.</p>
                  <h3>How We Use Your Information</h3>
                  <p>We use the information we collect to operate and improve our services, personalize your experience, send you updates, and respond to your inquiries. We do not sell your personal information to third parties.</p>
                  <h3>Google Sign-In</h3>
                  <p>If you sign in using Google, we receive your name, email address, and profile picture from Google. This information is used solely to create and manage your account on idenwebstudio.</p>
                </div>
              )}

              {active === 'external' && (
                <div className="pt-section">
                  <h2>External Links</h2>
                  <p>idenwebstudio may contain links to third-party websites. These links are provided for your convenience only. We have no control over the content of those sites and accept no responsibility for them or for any loss or damage that may arise from your use of them.</p>
                  <p>When you access a third-party website via a link on idenwebstudio, we encourage you to read the privacy policy of that website so that you can understand how that website collects, uses, and shares your information.</p>
                </div>
              )}

              {active === 'dmca' && (
                <div className="pt-section">
                  <h2>DMCA Compliance</h2>
                  <p>idenwebstudio respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act of 1998 ("DMCA"), we will respond promptly to claims of copyright infringement committed using our site if such claims are reported to our designated copyright agent.</p>
                  <h3>Reporting Infringement</h3>
                  <p>If you believe that content available on idenwebstudio infringes one or more of your copyrights, please notify us by email at idenwebstudio@gmail.com with the following information: a description of the copyrighted work claimed to have been infringed; the URL where the allegedly infringing content appears; your contact information; a statement that you have a good faith belief that use of the material is not authorized; and a statement, made under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on behalf of the owner.</p>
                </div>
              )}

              {active === 'cookies' && (
                <div className="pt-section">
                  <h2>Cookies &amp; Advertising</h2>
                  <p>idenwebstudio uses cookies to enhance your experience. Cookies are small data files stored on your device. They help us remember your preferences (such as reading font and theme settings) and understand how you use the site.</p>
                  <h3>Google AdSense</h3>
                  <p>We use Google AdSense to display advertisements. Google may use cookies to serve ads based on your prior visits to our website or other websites. You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{color:'var(--accent-purple)'}}>Google Ads Settings</a>.</p>
                  <h3>Managing Cookies</h3>
                  <p>You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, some portions of our site may not function properly.</p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
