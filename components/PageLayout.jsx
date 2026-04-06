'use client';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PageLayout({ children, hideFooter = false }) {
  return (
    <>
      <Navbar />
      <main style={{ position: 'relative', zIndex: 1 }}>{children}</main>
      {!hideFooter && <Footer />}
    </>
  );
}
