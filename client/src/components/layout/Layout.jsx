import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X } from 'lucide-react';

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [showMenuHint, setShowMenuHint] = useState(true);
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

  // Enhanced mobile menu management with touch gestures
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isMobileMenuOpen && !event.target.closest('.sidebar-container') && !event.target.closest('.mobile-menu-btn')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isMobileMenuOpen]);

  // Touch gesture handlers for smooth mobile interactions
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isRightSwipe && !isMobileMenuOpen && isMobile) {
      toggleMobileMenu();
      setShowMenuHint(false);
    }
    if (isLeftSwipe && isMobileMenuOpen && isMobile) {
      toggleMobileMenu();
    }
  };

  // Enhanced mobile menu toggle with animations
  const toggleMobileMenu = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Hide menu hint after first interaction
  useEffect(() => {
    if (isMobileMenuOpen) {
      setShowMenuHint(false);
    }
  }, [isMobileMenuOpen]);

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
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Enhanced Mobile Menu Button with Smooth Animations */}
      {isMobile && (
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <motion.button
            onClick={toggleMobileMenu}
            disabled={isAnimating}
            className="mobile-menu-btn p-3 bg-gradient-to-br from-white to-gray-50 rounded-2xl mobile-shadow-xl border border-gray-200/50 touch-manipulation overflow-hidden relative"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <motion.div
              animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </motion.div>
            
            {/* Ripple effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/10 to-purple-400/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            
            {/* Pulse indicator for first time users */}
            {showMenuHint && !isMobileMenuOpen && (
              <div className="absolute -inset-2 rounded-2xl border-2 border-blue-400/30 animate-pulse"></div>
            )}
          </motion.button>
        </div>
      )}

      {/* Enhanced Mobile Overlay with Smooth Animations */}
      {isMobile && (
        <motion.div
          className="fixed inset-0 z-30 lg:hidden pointer-events-none"
          initial={false}
          animate={{
            opacity: isMobileMenuOpen ? 1 : 0,
            backdropFilter: isMobileMenuOpen ? 'blur(8px)' : 'blur(0px)'
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            background: isMobileMenuOpen 
              ? 'linear-gradient(45deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)'
              : 'transparent',
            pointerEvents: isMobileMenuOpen ? 'auto' : 'none'
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 opacity-20"></div>
        </motion.div>
      )}

      {/* Sidebar */}
      <div className={`sidebar-container flex-shrink-0 ${
        isMobile 
          ? `fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : ''
      }`}>
        <Sidebar 
          isCollapsed={isMobile ? false : isCollapsed} 
          setIsCollapsed={setIsCollapsed}
          isMobile={isMobile}
          closeMobileMenu={() => setIsMobileMenuOpen(false)}
        />
      </div>
      
      {/* Enhanced Main Content with Smooth Mobile Animations */}
      <motion.div
        initial={false}
        animate={{ 
          width: isMobile ? '100%' : `calc(100% - ${isCollapsed ? 80 : 300}px)`
        }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex-1 h-screen overflow-y-auto overflow-x-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <main className={`min-h-full w-full relative ${
          isMobile ? 'pt-20' : '' // Add top padding on mobile for menu button
        }`}>
          <div className="w-full max-w-full relative">
            {/* Content with smooth fade in animation */}
            <motion.div
              key={children?.key || 'main-content'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full"
            >
              {children}
            </motion.div>
          </div>
          
          {/* Mobile Navigation Hint */}
          {isMobile && showMenuHint && !isMobileMenuOpen && (
            <motion.div
              className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 mobile-shadow-lg border border-gray-200/50 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600 font-medium">
                  Swipe right to open menu →
                </span>
              </div>
            </motion.div>
          )}
        </main>
      </motion.div>
    </div>
  );
};

export default Layout;
