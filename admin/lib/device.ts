// Device fingerprinting and identification utility

/**
 * Generate a unique device ID based on available browser information
 * This uses a combination of user agent, screen properties, etc.
 * Note: This is a simple implementation. For production, consider using a library like fingerprintjs
 */
export async function getDeviceId(): Promise<string> {
    if (typeof window === 'undefined') {
      return 'server-side-render';
    }
  
    try {
      // Collect browser information
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const screenDepth = window.screen.colorDepth;
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const language = navigator.language;
      
      // Detect emulators or virtual devices by looking for common indicators
      const lowerUserAgent = userAgent.toLowerCase();
      const virtualDeviceIndicators = [
        'emulator',
        'android sdk',
        'generic',
        'google_sdk',
        'sdk_google',
        'sdk_x86',
        'vbox',
        'virtual',
        'samsung_rosemary',
        'genymotion'
      ];
      
      // Check if this is potentially a virtual device
      const isVirtualDevice = virtualDeviceIndicators.some(indicator => 
        lowerUserAgent.includes(indicator)
      );
      
      // Create a device fingerprint
      const components = [
        userAgent,
        platform,
        `${screenWidth}x${screenHeight}x${screenDepth}`,
        timeZone,
        language
      ];
      
      // Add virtual device flag if detected
      if (isVirtualDevice) {
        components.push('virtual_device');
      }
      
      // Create a string from the components and hash it
      const deviceString = components.join('||');
      
      // Use a basic hash function
      // In production, consider using a more robust hashing algorithm
      const hash = await hashString(deviceString);
      
      return hash;
    } catch (error) {
      console.error('Error generating device ID:', error);
      return 'unknown-device-' + Math.random().toString(36).substring(2, 15);
    }
  }
  
  /**
   * Simple hash function using crypto API if available
   */
  async function hashString(str: string): Promise<string> {
    if (window.crypto && window.crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        // Fallback if crypto API fails
        return fallbackHash(str);
      }
    } else {
      // Fallback for browsers without crypto API
      return fallbackHash(str);
    }
  }
  
  /**
   * Simple fallback hash function
   */
  function fallbackHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
  
  /**
   * Detect if the device is a virtual device or emulator
   * Returns true if it's likely a virtual device
   */
  export function isVirtualDevice(deviceId: string): boolean {
    // Check if the deviceId contains indicators of a virtual device
    const virtualIndicators = ['emulator', 'virtual', 'generic'];
    return virtualIndicators.some(indicator => deviceId.includes(indicator));
  }