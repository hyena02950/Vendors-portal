
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export const useResponsiveSidebar = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    isMobile,
  };
};
