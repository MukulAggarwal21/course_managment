const geoip = require('geoip-lite');

const BLACKLISTED_COUNTRIES = ['CN', 'KP', 'IR']; // China, North Korea, Iran

const CURRENCY_RATES = {
  'USD': { rate: 1, symbol: '$' },
  'INR': { rate: 83.12, symbol: '₹' },
  'EUR': { rate: 0.85, symbol: '€' },
  'GBP': { rate: 0.79, symbol: '£' },
  'CAD': { rate: 1.36, symbol: 'C$' },
  'AUD': { rate: 1.52, symbol: 'A$' }
};

const LOCATION_MULTIPLIERS = {
  'India': { multiplier: 0.3, currency: 'INR' },
  'USA': { multiplier: 1.5, currency: 'USD' },
  'UK': { multiplier: 1.2, currency: 'GBP' },
  'Canada': { multiplier: 1.1, currency: 'CAD' },
  'Australia': { multiplier: 1.15, currency: 'AUD' },
  'Germany': { multiplier: 1.1, currency: 'EUR' },
  'France': { multiplier: 1.1, currency: 'EUR' },
  'Other': { multiplier: 1, currency: 'USD' }
};

const applyLocationPricing = (req, res, next) => {
  try {
    let userLocation = req.query.location || req.headers['x-user-location'];
    
    if (!userLocation) {
      // Try to get location from IP address
      const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      const geo = geoip.lookup(clientIP);
      
      if (geo && geo.country) {
        if (BLACKLISTED_COUNTRIES.includes(geo.country)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied for your location'
          });
        }
        
        const countryMap = {
          'IN': 'India',
          'US': 'USA',
          'GB': 'UK',
          'CA': 'Canada',
          'AU': 'Australia',
          'DE': 'Germany',
          'FR': 'France'
        };
        
        userLocation = countryMap[geo.country] || 'Other';
      }
    }
    
    userLocation = userLocation || 'Other';
    
    req.userLocation = userLocation;
    req.pricingConfig = LOCATION_MULTIPLIERS[userLocation] || LOCATION_MULTIPLIERS['Other'];
    
    next();
  } catch (error) {
    console.error('Location pricing error:', error);
    // Continue with default pricing if location detection fails
    req.userLocation = 'Other';
    req.pricingConfig = LOCATION_MULTIPLIERS['Other'];
    next();
  }
};

const calculateLocalizedPrice = (basePrice, pricingConfig) => {
  const { multiplier, currency } = pricingConfig;
  const adjustedPrice = basePrice * multiplier;
  const rate = CURRENCY_RATES[currency]?.rate || 1;
  const localPrice = adjustedPrice * rate;
  const symbol = CURRENCY_RATES[currency]?.symbol || '$';
  
  return {
    originalPrice: basePrice,
    localizedPrice: Math.round(localPrice * 100) / 100,
    currency,
    symbol,
    multiplier
  };
};

module.exports = {
  applyLocationPricing,
  calculateLocalizedPrice
};
