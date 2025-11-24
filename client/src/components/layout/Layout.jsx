import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X } from 'lucide-react';

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();

  // Detect mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(false); // Always show full sidebar on mobile when open
        setIsMobileMenuOpen(false); // Close mobile menu on resize
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isMobileMenuOpen && !event.target.closest('.sidebar-container') && !event.target.closest('.mobile-menu-btn')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isMobileMenuOpen]);

  // Only show sidebar for roles that need it
  const showSidebar = ['admin', 'manager', 'technician'].includes(user?.role);

  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Mobile Menu Button */}
      {isMobile && (
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-menu-btn p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" />
      )}

      {/* Sidebar */}
      <div className={`sidebar-container ${
        isMobile 
          ? `fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'fixed'
      }`}>
        <Sidebar 
          isCollapsed={isMobile ? false : isCollapsed} 
          setIsCollapsed={setIsCollapsed}
          isMobile={isMobile}
          closeMobileMenu={() => setIsMobileMenuOpen(false)}
        />
      </div>
      
      {/* Main Content */}
      <motion.div
        initial={false}
        animate={{ 
          marginLeft: isMobile ? 0 : (isCollapsed ? 80 : 300)
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`transition-all duration-300 min-h-screen ${
          isMobile ? 'w-full' : ''
        }`}
      >
        <main className={`min-h-screen w-full ${
          isMobile ? 'pt-20' : '' // Add top padding on mobile for menu button
        }`}>
          <div className="w-full max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </motion.div>
    </div>
  );
};

export default Layout;
