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

  // Detect mobile screen size - Lower breakpoint for better mobile detection
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768; // md breakpoint - better for tablets like iPad Mini
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
    const newState = !isMobileMenuOpen;
    console.log('[Layout] Toggling mobile menu:', { from: isMobileMenuOpen, to: newState });
    setIsMobileMenuOpen(newState);
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
    <div className="h-screen bg-gray-50 overflow-hidden overflow-x-hidden relative">
      {/* Mobile Top Navbar with Hamburger Menu */}
      {isMobile && (
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm" style={{ pointerEvents: 'auto' }}>
          <div className="flex items-center justify-between px-4 py-3">
            {/* Hamburger Menu Button */}
            <motion.button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Layout] Hamburger clicked, current state:', isMobileMenuOpen);
                toggleMobileMenu();
              }}
              disabled={isAnimating}
              className="mobile-menu-btn p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-md border border-gray-200/50 touch-manipulation overflow-hidden relative min-w-[56px] min-h-[56px] cursor-pointer active:scale-95"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{ WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto' }}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <motion.div
                animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex items-center justify-center"
              >
                {isMobileMenuOpen ? (
                  <X className="h-7 w-7 text-gray-700" />
                ) : (
                  <Menu className="h-7 w-7 text-gray-700" />
                )}
              </motion.div>
              
              {/* Pulse indicator for first time users */}
              {showMenuHint && !isMobileMenuOpen && (
                <div className="absolute -inset-1 rounded-xl border-2 border-blue-400/30 animate-pulse"></div>
              )}
            </motion.button>

            {/* App Title/Logo */}
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <img 
                src="/logo.jpg" 
                alt="Confine Logo" 
                className="h-8 w-8 object-contain"
              />
              <h1 className="text-lg font-bold text-gray-800">Confine</h1>
            </motion.div>

            {/* Spacer for balance */}
            <div className="w-10"></div>
          </div>
        </div>
      )}

      {/* Mobile Backdrop Overlay - REMOVED: Handled by Sidebar component */}

      {/* Main Layout Container */}
      <div className={`h-full ${isMobile ? 'pt-[73px]' : 'flex'}`}>
        {/* Sidebar - Different positioning for Mobile vs Desktop */}
        {isMobile ? (
          /* Mobile: Fixed positioning, only render when open or animating */
          (isMobileMenuOpen || isAnimating) && (
            <div className="fixed inset-0 z-50">
              <Sidebar
                isCollapsed={false}
                setIsCollapsed={setIsCollapsed}
                isMobile={true}
                isMobileMenuOpen={isMobileMenuOpen}
                closeMobileMenu={() => {
                  console.log('[Layout] Closing mobile menu');
                  setIsMobileMenuOpen(false);
                }}
              />
            </div>
          )
        ) : (
          /* Desktop: Flex item in layout */
          <div className="flex-shrink-0 h-full">
            <Sidebar 
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              isMobile={false}
              isMobileMenuOpen={false}
              closeMobileMenu={() => {}}
            />
          </div>
        )}
        
        {/* Main Content Area - Full Width on Mobile, Flex-1 on Desktop */}
        <motion.div
          initial={false}
          className={`h-full overflow-y-auto overflow-x-hidden relative ${
            isMobile ? 'w-full z-0' : 'flex-1 z-0'
          }`}
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchMove={isMobile ? handleTouchMove : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
          style={{ pointerEvents: 'auto' }}
        >
          <main className={`w-full ${isMobile ? 'pb-4' : 'pb-6'}`}>
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
          </main>
          
          {/* Mobile Navigation Hint */}
          {isMobile && showMenuHint && !isMobileMenuOpen && (
            <motion.div
              className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200/50 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600 font-medium">
                  Tap menu to get started →
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Layout;
