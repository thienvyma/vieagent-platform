// Debugging z-index issues script
// Run this in browser console to diagnose overlay problems

function debugZIndex() {
  console.log('🔍 DEBUGGING Z-INDEX ISSUES...');
  
  // Check for modal overlays
  const overlays = document.querySelectorAll('[class*="fixed"][class*="inset-0"]');
  console.log('📋 Found overlays:', overlays.length);
  
  overlays.forEach((overlay, index) => {
    const computedStyle = window.getComputedStyle(overlay);
    const zIndex = computedStyle.zIndex;
    const display = computedStyle.display;
    const visibility = computedStyle.visibility;
    const opacity = computedStyle.opacity;
    const className = overlay.className;
    
    console.log(`Overlay ${index + 1}:`, {
      element: overlay,
      zIndex,
      display,
      visibility,
      opacity,
      className: className.substring(0, 100) + (className.length > 100 ? '...' : '')
    });
    
    // Highlight problematic overlays
    if (display !== 'none' && visibility !== 'hidden' && opacity !== '0') {
      overlay.style.border = '3px solid red';
      overlay.style.boxShadow = '0 0 10px red';
      console.warn('⚠️ Active overlay found!', overlay);
    }
  });
  
  // Check notification modals specifically
  const notificationModals = document.querySelectorAll('[class*="z-\\[55\\]"], [class*="z-55"]');
  console.log('🔔 Notification modals found:', notificationModals.length);
  
  notificationModals.forEach((modal, index) => {
    console.log(`Modal ${index + 1}:`, {
      element: modal,
      display: window.getComputedStyle(modal).display,
      className: modal.className
    });
  });
  
  // Test button interactivity
  const buttons = document.querySelectorAll('button');
  console.log('🔘 Found buttons:', buttons.length);
  
  let blockedButtons = 0;
  buttons.forEach((button, index) => {
    const rect = button.getBoundingClientRect();
    const elementAtPoint = document.elementFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
    
    if (elementAtPoint !== button && !button.contains(elementAtPoint)) {
      console.warn(`❌ Button ${index + 1} is blocked:`, {
        button,
        blocker: elementAtPoint,
        buttonText: button.textContent?.trim().substring(0, 50)
      });
      blockedButtons++;
      
      // Highlight blocked button
      button.style.border = '2px solid orange';
      button.style.boxShadow = '0 0 5px orange';
    }
  });
  
  console.log(`📊 Summary: ${blockedButtons} blocked buttons out of ${buttons.length} total`);
  
  // Check specific z-index values
  const zIndexElements = [];
  document.querySelectorAll('*').forEach(el => {
    const zIndex = window.getComputedStyle(el).zIndex;
    if (zIndex !== 'auto' && parseInt(zIndex) > 0) {
      zIndexElements.push({
        element: el,
        zIndex: parseInt(zIndex),
        className: el.className.substring(0, 80)
      });
    }
  });
  
  zIndexElements.sort((a, b) => b.zIndex - a.zIndex);
  console.log('📈 Z-index hierarchy (top 10):');
  zIndexElements.slice(0, 10).forEach((item, index) => {
    console.log(`${index + 1}. z-index: ${item.zIndex} - ${item.className}`);
  });
  
  // Suggestions
  console.log('\n💡 SUGGESTIONS:');
  console.log('1. Check if NotificationModal isOpen prop is stuck as true');
  console.log('2. Look for invisible overlays with high z-index');
  console.log('3. Verify modal state management in DashboardLayout');
  console.log('4. Test with React Developer Tools to check component props');
}

// Auto-run when script loads
if (typeof window !== 'undefined') {
  console.log('🔧 Z-Index Debug Script Loaded');
  console.log('💻 Run debugZIndex() in console to start debugging');
  
  // Auto-run after 2 seconds
  setTimeout(debugZIndex, 2000);
} else {
  // Node.js environment
  console.log('🚀 Z-Index Debug Script for Browser Console');
  console.log('📋 Copy and paste debugZIndex() function in browser');
} 