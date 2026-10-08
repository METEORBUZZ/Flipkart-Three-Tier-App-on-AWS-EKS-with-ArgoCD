import { useState, useEffect } from 'react';
import Head from 'next/head';

// Bulletproof fallback SVG generator for products
const getProductFallback = (title, brand) => {
  const bg = brand === 'Apple' ? '#000000' : brand === 'Samsung' ? '#1428a0' : brand === 'Sony' ? '#222222' : brand === 'Nike' ? '#ff4500' : '#2874f0';
  const label = encodeURIComponent((title || 'Product').split('(')[0].trim().slice(0, 22));
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23f8f9fa"/><rect x="25" y="25" width="250" height="250" rx="16" fill="${encodeURIComponent(bg)}"/><text x="150" y="140" fill="white" font-size="22" font-family="sans-serif" font-weight="bold" text-anchor="middle">${encodeURIComponent(brand || 'Flipkart')}</text><text x="150" y="175" fill="%23ffe500" font-size="14" font-family="sans-serif" font-weight="bold" text-anchor="middle">${label}</text><text x="150" y="210" fill="white" font-size="12" font-family="sans-serif" text-anchor="middle">⚡ F-Assured</text></svg>`;
};

// Curated 2-row category tiles data matching Flipkart screenshot
const CURATED_TILES_ROW1 = [
  { id: 'top50', label: 'Top-50', icon: '🔥', bg: '#ffebee' },
  { id: 'shirts', label: 'Shirts', icon: '👔', bg: '#e8f5e9' },
  { id: 'jeans', label: 'Jeans', icon: '👖', bg: '#e3f2fd' },
  { id: 'sports_shoes', label: 'Sports shoes', icon: '👟', bg: '#fff3e0' },
  { id: 'watches', label: 'Watches', icon: '⌚', bg: '#f3e5f5' },
];

const CURATED_TILES_ROW2 = [
  { id: 'korean_store', label: 'Korean Store', icon: '✨', bg: '#fce4ec' },
  { id: 'kurta_sets', label: 'Kurta sets', icon: '👗', bg: '#fffde7' },
  { id: 'dresses', label: 'Dresses', icon: '🥻', bg: '#ede7f6' },
  { id: 'casual_shoes', label: 'Casual shoes', icon: '👞', bg: '#e0f2f1' },
  { id: 'jewellery', label: 'Jewellery', icon: '💍', bg: '#fff8e1' },
];

export default function Home({ initialProducts }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [filteredProducts, setFilteredProducts] = useState(initialProducts || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState('fashion'); // 'foryou', 'fashion', 'mobiles', 'electronics', 'beauty', 'home'
  const [activeBrandPill, setActiveBrandPill] = useState('flipkart');
  const [sortOption, setSortOption] = useState('relevance');

  // Countdown Timer state: 1 Hr 46 Min 09 Sec
  const [timeLeft, setTimeLeft] = useState({ hrs: 1, mins: 46, secs: 9 });

  // Address State
  const [currentAddress, setCurrentAddress] = useState('HOME N G hostel A, Gangotri, Visnagar Road...');
  const [showAddressModal, setShowAddressModal] = useState(false);

  // User Auth State
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authUsername, setAuthUsername] = useState('rahul_sharma');
  const [authPassword, setAuthPassword] = useState('secret123');

  // Cart State (Redis backend)
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // Selected Product Detail Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [pincode, setPincode] = useState('560001');
  const [pincodeResult, setPincodeResult] = useState(null);
  const [productReviews, setProductReviews] = useState([]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');

  // Checkout & Order State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [orderSuccess, setOrderSuccess] = useState(null);

  // User Orders History Modal
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [userOrders, setUserOrders] = useState([]);

  // Toast
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: prev.mins - 1, secs: 59 };
        if (prev.hrs > 0) return { hrs: prev.hrs - 1, mins: 59, secs: 59 };
        return { hrs: 2, mins: 0, secs: 0 }; // reset
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('fk_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      const defaultUser = { id: 'usr-guest-84', username: 'Rahul Sharma', superCoins: 150 };
      setUser(defaultUser);
    }

    if (!initialProducts || initialProducts.length === 0) {
      fetchProducts();
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/v1/catalog/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        setFilteredProducts(data);
      }
    } catch (e) {
      console.error('Error fetching catalog:', e);
    }
  };

  const fetchCart = async () => {
    try {
      const uid = user ? user.id : 'usr-guest-84';
      const res = await fetch(`/api/v1/cart/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.items || []);
        setCartCount(data.totalItems || 0);
        setCartTotal(data.totalPrice || 0);
      }
    } catch (e) {
      console.error('Error fetching cart:', e);
    }
  };

  const handleSearchInput = async (text) => {
    setSearchQuery(text);
    if (text.length >= 2) {
      try {
        const res = await fetch(`/api/v1/search/suggestions?q=${encodeURIComponent(text)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        }
      } catch (e) {
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const executeSearch = async (term) => {
    const query = term !== undefined ? term : searchQuery;
    setShowSuggestions(false);
    if (!query.trim()) {
      setFilteredProducts(products);
      return;
    }
    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setFilteredProducts(data.results || []);
      }
    } catch (e) {
      const fallbackFiltered = products.filter(p =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(fallbackFiltered);
    }
  };

  const switchPurpleTab = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'foryou' || tabId === 'fashion') {
      setFilteredProducts(products);
    } else if (tabId === 'mobiles') {
      setFilteredProducts(products.filter(p => p.category.toLowerCase() === 'mobiles'));
    } else if (tabId === 'electronics') {
      setFilteredProducts(products.filter(p => p.category.toLowerCase() === 'electronics' || p.category.toLowerCase() === 'laptops'));
    } else if (tabId === 'beauty' || tabId === 'home') {
      setFilteredProducts(products.filter(p => p.category.toLowerCase().includes(tabId)));
    } else {
      setFilteredProducts(products);
    }
  };

  const handleSort = (type) => {
    setSortOption(type);
    let sorted = [...filteredProducts];
    if (type === 'price_asc') {
      sorted.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (type === 'price_desc') {
      sorted.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (type === 'rating') {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      sorted = [...products];
    }
    setFilteredProducts(sorted);
  };

  const addToCart = async (product) => {
    try {
      const uid = user ? user.id : 'usr-guest-84';
      const fallbackSrc = getProductFallback(product.title, product.brand);
      const res = await fetch(`/api/v1/cart/${uid}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          title: product.title,
          price: product.price,
          quantity: 1,
          image: (product.images && product.images[0]) || fallbackSrc
        })
      });

      if (res.ok) {
        showToast(`✓ Added "${product.title.slice(0, 18)}..." to cart`);
        fetchCart();
      }
    } catch (e) {
      showToast('✓ Added to cart');
    }
  };

  const updateCartItemQty = async (item, delta) => {
    const uid = user ? user.id : 'usr-guest-84';
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeCartItem(item.productId);
      return;
    }
    try {
      await fetch(`/api/v1/cart/${uid}/items/${item.productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty })
      });
      fetchCart();
    } catch (e) {
      console.error(e);
    }
  };

  const removeCartItem = async (productId) => {
    const uid = user ? user.id : 'usr-guest-84';
    try {
      await fetch(`/api/v1/cart/${uid}/items/${productId}`, { method: 'DELETE' });
      fetchCart();
      showToast('Item removed from cart');
    } catch (e) {
      console.error(e);
    }
  };

  const openProductModal = async (product) => {
    setSelectedProduct(product);
    setPincodeResult(null);
    try {
      const res = await fetch(`/api/v1/reviews/product/${product.id}`);
      if (res.ok) {
        const data = await res.json();
        setProductReviews(data);
      }
    } catch (e) {
      setProductReviews([]);
    }
  };

  const checkEkartPincode = async () => {
    if (!pincode || pincode.length !== 6) {
      showToast('Please enter a valid 6-digit Pincode');
      return;
    }
    try {
      const res = await fetch(`/api/v1/delivery/check?pincode=${pincode}`);
      if (res.ok) {
        const data = await res.json();
        setPincodeResult(data);
      }
    } catch (e) {
      setPincodeResult({
        serviceable: true,
        estimated_delivery: 'Tomorrow, by 9 PM',
        delivery_speed: 'Standard',
        courier: 'Ekart Logistics'
      });
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const res = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          userId: user ? user.id : 'usr-guest-84',
          userName: user ? user.username : 'Flipkart Customer',
          rating: newReviewRating,
          comment: newReviewComment,
          verifiedBuyer: true
        })
      });
      if (res.ok) {
        const saved = await res.json();
        setProductReviews([saved, ...productReviews]);
        setNewReviewComment('');
        showToast('✓ Review submitted successfully');
      }
    } catch (e) {
      showToast('✓ Review saved');
    }
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const newUser = {
      id: 'usr-' + Date.now().toString(36),
      username: authUsername,
      superCoins: 150
    };
    setUser(newUser);
    localStorage.setItem('fk_user', JSON.stringify(newUser));
    setShowAuthModal(false);
    showToast(`Welcome back, ${authUsername}!`);
  };

  const handlePlaceOrder = async () => {
    try {
      const uid = user ? user.id : 'usr-guest-84';
      const amount = checkoutProduct ? Number(checkoutProduct.price) : cartTotal;
      const orderPayload = {
        userId: uid,
        totalAmount: amount,
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        items: checkoutProduct
          ? [{ productId: checkoutProduct.id, productTitle: checkoutProduct.title, price: checkoutProduct.price, quantity: 1 }]
          : cartItems.map(item => ({ productId: item.productId, productTitle: item.title, price: item.price, quantity: item.quantity })),
      };

      const orderRes = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const orderData = await orderRes.json();

      await fetch('/api/v1/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderData.id || 'ORD-' + Date.now(),
          user_id: uid,
          amount: amount,
          payment_mode: paymentMode
        })
      });

      if (!checkoutProduct) {
        await fetch(`/api/v1/cart/${uid}`, { method: 'DELETE' });
        fetchCart();
      }

      setOrderSuccess({
        orderId: orderData.id || 'FK-' + Date.now(),
        trackingNumber: orderData.trackingNumber || 'FMPL' + Math.floor(Math.random() * 899999 + 100000),
        amount: amount,
        paymentMode: paymentMode,
      });

      setShowCheckoutModal(false);
      setShowCartDrawer(false);
    } catch (e) {
      showToast('Order confirmed! Ekart shipment assigned.');
      setShowCheckoutModal(false);
      setShowCartDrawer(false);
    }
  };

  const openOrdersModal = async () => {
    setShowOrdersModal(true);
    const uid = user ? user.id : 'usr-guest-84';
    try {
      const res = await fetch(`/api/v1/orders/user/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setUserOrders(data);
      }
    } catch (e) {
      setUserOrders([]);
    }
  };

  // Format 2-digit number
  const pad2 = (n) => String(n).padStart(2, '0');

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', background: '#f1f2f4', minHeight: '100vh', position: 'relative' }}>
      <Head>
        <title>Flipkart Online Shopping App | Mobiles, Fashion, Electronics</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 74,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#2874f0',
          color: 'white',
          padding: '10px 20px',
          borderRadius: 25,
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          zIndex: 9999,
          fontWeight: 700,
          fontSize: 13,
          whiteSpace: 'nowrap'
        }}>
          {toastMessage}
        </div>
      )}

      {/* =======================================================
          TOP PURPLE HEADER SECTION (FLIPKART OFFICIAL APP UI)
          ======================================================= */}
      <header className="app-top-section">
        {/* 1. Quick Switcher Pills */}
        <div className="brand-pills-row">
          <div
            className={`pill-card ${activeBrandPill === 'flipkart' ? 'pill-flipkart' : 'pill-white'}`}
            onClick={() => setActiveBrandPill('flipkart')}
          >
            <span>🛍️</span>
            <span>Flipkart</span>
          </div>

          <div
            className={`pill-card ${activeBrandPill === 'value365' ? 'pill-flipkart' : 'pill-white'}`}
            onClick={() => {
              setActiveBrandPill('value365');
              showToast('Switched to Value 365 store');
            }}
          >
            <span>🥬</span>
            <span>Value 365</span>
          </div>

          <div
            className={`pill-card ${activeBrandPill === 'travel' ? 'pill-flipkart' : 'pill-white'}`}
            onClick={() => {
              setActiveBrandPill('travel');
              showToast('Flipkart Flights & Hotels Booking');
            }}
          >
            <span>✈️</span>
            <span>Travel</span>
          </div>

          <div
            className={`pill-card ${activeBrandPill === 'grocery' ? 'pill-flipkart' : 'pill-white'}`}
            onClick={() => {
              setActiveBrandPill('grocery');
              showToast('Flipkart Supermarket Grocery');
            }}
          >
            <span>🧺</span>
            <span>Grocery</span>
          </div>
        </div>

        {/* 2. Delivery Address Bar & SuperCoins Indicator */}
        <div className="address-coins-row">
          <div className="address-box" onClick={() => setShowAddressModal(true)} title="Change delivery location">
            <span style={{ fontSize: 14 }}>🏠</span>
            <span style={{ fontWeight: 800 }}>HOME</span>
            <span style={{ color: '#e0d4ff', fontSize: 11 }}>{currentAddress.slice(4, 34)}...</span>
            <span style={{ fontSize: 10 }}>⌄</span>
          </div>

          <div className="coins-badge" onClick={() => showToast('You have 150 Flipkart SuperCoins!')} title="Flipkart SuperCoins">
            <span>⚡ {user ? user.superCoins || 150 : 150}</span>
            <span style={{ fontSize: 14 }}>🪙</span>
          </div>
        </div>

        {/* 3. Flipkart App Search Bar with Mic & Lens */}
        <div className="app-search-box">
          <span style={{ color: '#777', fontSize: 16 }}>🔍</span>
          <input
            type="text"
            placeholder="Search for Products, Brands and More"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') executeSearch(); }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          />
          <div className="search-icons-group">
            <span style={{ cursor: 'pointer' }} onClick={() => showToast('🎤 Voice Search listening...')} title="Voice Search">🎤</span>
            <span style={{ cursor: 'pointer' }} onClick={() => showToast('📷 Flipkart Visual Lens activated')} title="Visual Camera Lens">📷</span>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-dropdown">
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="search-dropdown-item"
                  onClick={() => {
                    setSearchQuery(item);
                    executeSearch(item);
                  }}
                >
                  🔍 {item}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Purple Category Navigation Tabs */}
        <div className="purple-tabs-row">
          <div
            className={`purple-tab ${activeTab === 'foryou' ? 'active' : ''}`}
            onClick={() => switchPurpleTab('foryou')}
          >
            <span className="purple-tab-icon">✨</span>
            <span>For You</span>
          </div>

          <div
            className={`purple-tab ${activeTab === 'fashion' ? 'active' : ''}`}
            onClick={() => switchPurpleTab('fashion')}
          >
            <span className="purple-tab-icon">👗</span>
            <span>Fashion</span>
          </div>

          <div
            className={`purple-tab ${activeTab === 'mobiles' ? 'active' : ''}`}
            onClick={() => switchPurpleTab('mobiles')}
          >
            <span className="purple-tab-icon">📱</span>
            <span>Mobiles</span>
          </div>

          <div
            className={`purple-tab ${activeTab === 'electronics' ? 'active' : ''}`}
            onClick={() => switchPurpleTab('electronics')}
          >
            <span className="purple-tab-icon">💻</span>
            <span>Electronics</span>
          </div>

          <div
            className={`purple-tab ${activeTab === 'beauty' ? 'active' : ''}`}
            onClick={() => switchPurpleTab('beauty')}
          >
            <span className="purple-tab-icon">💄</span>
            <span>Beauty</span>
          </div>

          <div
            className={`purple-tab ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => switchPurpleTab('home')}
          >
            <span className="purple-tab-icon">🛋️</span>
            <span>Home</span>
          </div>
        </div>
      </header>

      {/* =======================================================
          BIG BILLION DAYS HERO BANNER
          ======================================================= */}
      <div className="hero-banner-card" onClick={() => switchPurpleTab('fashion')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className="bbd-badge">⚡ BIG BILLION DAYS</span>
            <h2 style={{ fontSize: 17, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              India's Fashion Capital
            </h2>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#ffe500', margin: '4px 0 6px 0' }}>
              50-80% OFF
            </div>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 12px' }}>
            <span style={{ fontSize: 32 }}>👗</span>
            <div style={{ fontSize: 10, fontWeight: 800, marginTop: 2 }}>Trending</div>
          </div>
        </div>

        {/* Bank Offer Strip inside Hero Card */}
        <div style={{
          marginTop: 10,
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 6,
          padding: '6px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11
        }}>
          <span>💳 <strong>HDFC Bank</strong> | 10% Instant Discount*</span>
          <span style={{ color: '#ffe500', fontWeight: 800 }}>T&C Apply &gt;</span>
        </div>

        {/* Pagination Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffe500' }}></span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }}></span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }}></span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }}></span>
        </div>
      </div>

      {/* =======================================================
          LIVE COUNTDOWN FLASH SALE STRIP
          ======================================================= */}
      <div className="countdown-strip">
        <span style={{ fontSize: 15 }}>⏰</span>
        <span>Starts in</span>
        <span className="timer-box">{pad2(timeLeft.hrs)}</span>
        <span style={{ fontWeight: 800 }}>Hr :</span>
        <span className="timer-box">{pad2(timeLeft.mins)}</span>
        <span style={{ fontWeight: 800 }}>Min :</span>
        <span className="timer-box">{pad2(timeLeft.secs)}</span>
        <span style={{ fontWeight: 800 }}>Sec</span>
      </div>

      {/* =======================================================
          2-ROW HORIZONTAL SCROLL CURATED SHOPPING TILES
          ======================================================= */}
      <div className="curated-categories-wrapper">
        <div className="curated-grid-scroll">
          {CURATED_TILES_ROW1.map((item) => (
            <div key={item.id} className="curated-item" onClick={() => executeSearch(item.label)}>
              <div className="curated-img-box" style={{ background: item.bg }}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
              </div>
              <span className="curated-label">{item.label}</span>
            </div>
          ))}

          {CURATED_TILES_ROW2.map((item) => (
            <div key={item.id} className="curated-item" onClick={() => executeSearch(item.label)}>
              <div className="curated-img-box" style={{ background: item.bg }}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
              </div>
              <span className="curated-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* =======================================================
          SPECIAL OFFERS / "SHOPPING FOR OTHERS?" BANNER
          ======================================================= */}
      <div style={{
        background: '#ffffff',
        margin: '8px 12px',
        padding: '12px 14px',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24, background: '#eef2ff', padding: 8, borderRadius: 8 }}>🎁</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#111' }}>Shopping for someone else?</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Save address & send gift packs with Ekart</div>
          </div>
        </div>
        <button
          onClick={() => setShowAddressModal(true)}
          style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px 12px', borderRadius: 6, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
        >
          Add +
        </button>
      </div>

      {/* =======================================================
          PRODUCT SECTION HEADER & SORT CHIPS
          ======================================================= */}
      <div className="section-header">
        <div>
          <span className="section-title">Trending Catalog</span>
          <span style={{ fontSize: 12, color: '#777', marginLeft: 8 }}>({filteredProducts.length} items)</span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => handleSort('relevance')}
            style={{
              background: sortOption === 'relevance' ? '#2874f0' : 'white',
              color: sortOption === 'relevance' ? 'white' : '#555',
              border: '1px solid #ddd',
              padding: '4px 8px',
              borderRadius: 14,
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Popular
          </button>
          <button
            onClick={() => handleSort('price_asc')}
            style={{
              background: sortOption === 'price_asc' ? '#2874f0' : 'white',
              color: sortOption === 'price_asc' ? 'white' : '#555',
              border: '1px solid #ddd',
              padding: '4px 8px',
              borderRadius: 14,
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Price ⬇
          </button>
          <button
            onClick={() => handleSort('rating')}
            style={{
              background: sortOption === 'rating' ? '#2874f0' : 'white',
              color: sortOption === 'rating' ? 'white' : '#555',
              border: '1px solid #ddd',
              padding: '4px 8px',
              borderRadius: 14,
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ★ 4.0+
          </button>
        </div>
      </div>

      {/* =======================================================
          2-COLUMN MOBILE NATIVE PRODUCT GRID
          ======================================================= */}
      <div className="product-grid-mobile">
        {filteredProducts.map((p) => {
          const fallbackSrc = getProductFallback(p.title, p.brand);
          const imageSrc = (p.images && p.images[0]) || fallbackSrc;

          return (
            <div key={p.id} className="product-card-mobile">
              <div>
                <div className="img-container" onClick={() => openProductModal(p)}>
                  <img
                    src={imageSrc}
                    alt={p.title}
                    className="prod-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = fallbackSrc;
                    }}
                  />
                </div>

                <div className="prod-title" onClick={() => openProductModal(p)}>
                  {p.title}
                </div>

                <div className="badge-assured">⚡ F-Assured</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '2px 0' }}>
                  <span className="rating-badge">★ {p.rating || 4.5}</span>
                  <span style={{ fontSize: 10, color: '#888' }}>({p.rating_count || 140})</span>
                </div>

                <div className="price-container">
                  <span className="price-val">₹{Number(p.price).toLocaleString('en-IN')}</span>
                  {p.discount_percentage > 0 && (
                    <span className="discount-val">{p.discount_percentage}% off</span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Add & Buy */}
              <div className="btn-card-group">
                <button className="btn-card-add" onClick={() => addToCart(p)}>
                  + Add
                </button>
                <button
                  className="btn-card-buy"
                  onClick={() => {
                    setCheckoutProduct(p);
                    setShowCheckoutModal(true);
                  }}
                >
                  Buy
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* =======================================================
          FLIPKART OFFICIAL APP BOTTOM NAVIGATION BAR
          ======================================================= */}
      <nav className="flipkart-app-bottombar">
        <div
          className={`bottom-tab ${activeTab === 'fashion' || activeTab === 'foryou' ? 'active' : ''}`}
          onClick={() => {
            setSearchQuery('');
            switchPurpleTab('foryou');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <span className="bottom-tab-icon">🏠</span>
          <span>Home</span>
        </div>

        <div
          className="bottom-tab"
          onClick={() => {
            switchPurpleTab('fashion');
            showToast('Opening Flipkart Video & Play');
          }}
        >
          <span className="bottom-tab-icon">▶️</span>
          <span>Play</span>
        </div>

        <div
          className={`bottom-tab ${activeTab === 'mobiles' || activeTab === 'electronics' ? 'active' : ''}`}
          onClick={() => {
            switchPurpleTab('mobiles');
            showToast('Showing All Flipkart Categories');
          }}
        >
          <span className="bottom-tab-icon">🔲</span>
          <span>Categories</span>
        </div>

        <div
          className="bottom-tab"
          onClick={() => {
            if (user) {
              openOrdersModal();
            } else {
              setShowAuthModal(true);
            }
          }}
        >
          <span className="bottom-tab-icon">👤</span>
          <span>Account</span>
        </div>

        <div className="bottom-tab" onClick={() => setShowCartDrawer(true)}>
          <span className="bottom-tab-icon">🛒</span>
          {cartCount > 0 && <span className="cart-counter-dot">{cartCount}</span>}
          <span>Cart</span>
        </div>
      </nav>

      {/* QUICK FLOATING PILL FOR SELLER (4100) & ADMIN (4200) */}
      <div style={{
        position: 'fixed',
        top: 10,
        right: 12,
        zIndex: 2500,
        display: 'flex',
        gap: 6
      }}>
        <a
          href="http://10.195.18.98:4100"
          target="_blank"
          rel="noreferrer"
          style={{
            background: 'rgba(0,0,0,0.7)',
            color: '#ffe500',
            textDecoration: 'none',
            fontSize: 10,
            fontWeight: 800,
            padding: '4px 8px',
            borderRadius: 12,
            backdropFilter: 'blur(4px)'
          }}
          title="Open Seller Portal (Port 4100)"
        >
          🏪 Seller (4100)
        </a>
        <a
          href="http://10.195.18.98:4200"
          target="_blank"
          rel="noreferrer"
          style={{
            background: 'rgba(0,0,0,0.7)',
            color: '#38bdf8',
            textDecoration: 'none',
            fontSize: 10,
            fontWeight: 800,
            padding: '4px 8px',
            borderRadius: 12,
            backdropFilter: 'blur(4px)'
          }}
          title="Open Admin Console (Port 4200)"
        >
          🛡️ Admin (4200)
        </a>
      </div>

      {/* =======================================================
          DELIVERY ADDRESS MODAL
          ======================================================= */}
      {showAddressModal && (
        <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowAddressModal(false)}>✕</button>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Select Delivery Address</h3>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 14 }}>
              Choose or add a delivery location for faster shipping estimates
            </p>

            <div
              style={{
                border: '2px solid #2874f0',
                background: '#f0f7ff',
                borderRadius: 8,
                padding: 12,
                marginBottom: 10,
                cursor: 'pointer'
              }}
              onClick={() => {
                setCurrentAddress('HOME N G hostel A, Gangotri, Visnagar Road, Mehsana - 384001');
                setShowAddressModal(false);
                showToast('Primary address selected');
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: '#2874f0' }}>🏠 HOME (Default)</span>
                <span style={{ fontSize: 12, color: '#2874f0', fontWeight: 800 }}>✓ Selected</span>
              </div>
              <div style={{ fontSize: 12, color: '#333', marginTop: 4 }}>
                N G hostel A, Gangotri, Visnagar Road, Mehsana, Gujarat - 384001
              </div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>Mobile: +91 98765 43210</div>
            </div>

            <div
              style={{
                border: '1px solid #ddd',
                background: 'white',
                borderRadius: 8,
                padding: 12,
                marginBottom: 14,
                cursor: 'pointer'
              }}
              onClick={() => {
                setCurrentAddress('OFFICE Flipkart Tech Park, Outer Ring Road, Bangalore - 560103');
                setShowAddressModal(false);
                showToast('Office address selected');
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 13 }}>🏢 WORK / OFFICE</div>
              <div style={{ fontSize: 12, color: '#333', marginTop: 4 }}>
                Flipkart Tech Park, Outer Ring Road, Bangalore, Karnataka - 560103
              </div>
            </div>

            <button
              onClick={() => {
                setShowAddressModal(false);
                showToast('Address updated!');
              }}
              style={{
                width: '100%',
                background: '#fb641b',
                color: 'white',
                border: 'none',
                padding: 12,
                borderRadius: 6,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              + Add New Address
            </button>
          </div>
        </div>
      )}

      {/* =======================================================
          CART DRAWER / SHEET
          ======================================================= */}
      {showCartDrawer && (
        <div className="modal-overlay" onClick={() => setShowCartDrawer(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowCartDrawer(false)}>✕</button>

            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Shopping Cart ({cartCount})</h3>

            <div style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 12 }}>
              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
                  <p style={{ fontSize: 44, marginBottom: 10 }}>🛒</p>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>Your cart is empty!</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>Add products from the catalog to start shopping.</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.productId} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #eee' }}>
                    <img
                      src={item.image || getProductFallback(item.title, 'Item')}
                      style={{ width: 56, height: 56, objectFit: 'contain' }}
                      alt={item.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getProductFallback(item.title, 'Item');
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: '#222' }}>{item.title}</div>
                      <div style={{ fontWeight: 800, margin: '2px 0', fontSize: 13 }}>₹{Number(item.price).toLocaleString('en-IN')}</div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <button
                          style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid #ccc', background: 'white', fontWeight: 700, cursor: 'pointer' }}
                          onClick={() => updateCartItemQty(item, -1)}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 800, fontSize: 12 }}>{item.quantity}</span>
                        <button
                          style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid #ccc', background: 'white', fontWeight: 700, cursor: 'pointer' }}
                          onClick={() => updateCartItemQty(item, 1)}
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeCartItem(item.productId)}
                          style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                  <span>Delivery Charges:</span>
                  <span style={{ color: '#388e3c', fontWeight: 700 }}>FREE (Ekart Logistics)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontWeight: 900, fontSize: 16 }}>
                  <span>Total Payable:</span>
                  <span style={{ color: '#2874f0' }}>₹{Number(cartTotal).toLocaleString('en-IN')}</span>
                </div>
                <button
                  onClick={() => {
                    setCheckoutProduct(null);
                    setShowCheckoutModal(true);
                  }}
                  style={{
                    width: '100%',
                    background: '#fb641b',
                    color: 'white',
                    border: 'none',
                    padding: 12,
                    borderRadius: 6,
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  Proceed to Checkout ({cartCount} Items) →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================
          PRODUCT DETAILS SHEET
          ======================================================= */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedProduct(null)}>✕</button>

            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <img
                src={(selectedProduct.images && selectedProduct.images[0]) || getProductFallback(selectedProduct.title, selectedProduct.brand)}
                alt={selectedProduct.title}
                style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getProductFallback(selectedProduct.title, selectedProduct.brand);
                }}
              />
            </div>

            <div>
              <h2 style={{ fontSize: 15, lineHeight: 1.4, fontWeight: 700 }}>{selectedProduct.title}</h2>
              <div style={{ color: '#878787', margin: '4px 0', fontSize: 11 }}>
                Brand: <strong>{selectedProduct.brand}</strong> | Category: <strong>{selectedProduct.category}</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0' }}>
                <span className="rating-badge">★ {selectedProduct.rating || 4.5}</span>
                <span style={{ color: '#878787', fontSize: 11 }}>({selectedProduct.rating_count || 120} Ratings)</span>
                <span className="badge-assured" style={{ marginLeft: 6 }}>⚡ F-Assured</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '6px 0' }}>
                <span style={{ fontSize: 20, fontWeight: 900 }}>₹{Number(selectedProduct.price).toLocaleString('en-IN')}</span>
                <span style={{ color: '#388e3c', fontWeight: 800, fontSize: 12 }}>{selectedProduct.discount_percentage}% off</span>
              </div>

              <p style={{ color: '#555', fontSize: 12, margin: '8px 0', lineHeight: 1.4 }}>
                {selectedProduct.description}
              </p>

              {/* Ekart Pincode Checker */}
              <div style={{ background: '#f8f9fa', border: '1px dashed #2874f0', borderRadius: 6, padding: 10, margin: '10px 0' }}>
                <div style={{ fontWeight: 700, fontSize: 11, color: '#2874f0' }}>🚚 Check Ekart Delivery Speed:</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <input
                    type="text"
                    placeholder="Enter 6-digit PIN"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    style={{ flex: 1, padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4, fontSize: 12 }}
                  />
                  <button
                    type="button"
                    onClick={checkEkartPincode}
                    style={{ background: '#2874f0', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                  >
                    Check
                  </button>
                </div>

                {pincodeResult && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#388e3c', fontWeight: 700 }}>
                    ✓ {pincodeResult.delivery_speed} by {pincodeResult.courier}! Arrival: <strong>{pincodeResult.estimated_delivery}</strong>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  className="btn-card-add"
                  style={{ padding: 10, fontSize: 13 }}
                  onClick={() => addToCart(selectedProduct)}
                >
                  Add to Cart
                </button>
                <button
                  className="btn-card-buy"
                  style={{ padding: 10, fontSize: 13 }}
                  onClick={() => {
                    setCheckoutProduct(selectedProduct);
                    setShowCheckoutModal(true);
                  }}
                >
                  Buy Now
                </button>
              </div>
            </div>

            {/* Customer Reviews Section */}
            <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 12 }}>
              <h4 style={{ fontSize: 13, marginBottom: 8 }}>Customer Ratings & Reviews</h4>
              <form onSubmit={submitReview} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <select
                    value={newReviewRating}
                    onChange={(e) => setNewReviewRating(Number(e.target.value))}
                    style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', fontSize: 11 }}
                  >
                    <option value={5}>★★★★★ (5 Stars)</option>
                    <option value={4}>★★★★☆ (4 Stars)</option>
                    <option value={3}>★★★☆☆ (3 Stars)</option>
                    <option value={2}>★★☆☆☆ (2 Stars)</option>
                    <option value={1}>★☆☆☆☆ (1 Star)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Write your review..."
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    style={{ flex: 1, padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, fontSize: 11 }}
                    required
                  />
                  <button type="submit" style={{ background: '#2874f0', color: 'white', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                    Post
                  </button>
                </div>
              </form>

              {productReviews.length > 0 ? (
                productReviews.map((rev) => (
                  <div key={rev.id} style={{ background: '#f9f9f9', padding: 8, borderRadius: 4, marginBottom: 6, fontSize: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span>★ {rev.rating} - {rev.userName || 'Verified Buyer'}</span>
                      <span style={{ color: '#388e3c' }}>✓ Certified Buyer</span>
                    </div>
                    <div style={{ color: '#444', marginTop: 2 }}>{rev.comment}</div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 11, color: '#888' }}>No reviews yet. Be the first to review!</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          CHECKOUT MODAL
          ======================================================= */}
      {showCheckoutModal && (
        <div className="modal-overlay" onClick={() => setShowCheckoutModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowCheckoutModal(false)}>✕</button>

            <h3 style={{ fontSize: 15, marginBottom: 6 }}>Order Summary & Payment</h3>
            <p style={{ color: '#666', fontSize: 11, marginBottom: 10 }}>
              Delivering to: <strong>{currentAddress}</strong>
            </p>

            <div style={{ background: '#f8f9fa', padding: 10, borderRadius: 6, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span>{checkoutProduct ? checkoutProduct.title : `Cart Items (${cartCount})`}</span>
                <strong>₹{(checkoutProduct ? Number(checkoutProduct.price) : cartTotal).toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ borderTop: '1px solid #ddd', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}>
                <span>Total Amount:</span>
                <span style={{ color: '#2874f0', fontSize: 16 }}>
                  ₹{(checkoutProduct ? Number(checkoutProduct.price) : cartTotal).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 800, fontSize: 11, display: 'block', marginBottom: 4 }}>Select Payment Method:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                  <input type="radio" name="pay" value="UPI" checked={paymentMode === 'UPI'} onChange={() => setPaymentMode('UPI')} />
                  <span>⚡ Instant UPI (PhonePe / Google Pay / Paytm)</span>
                </label>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                  <input type="radio" name="pay" value="CARD" checked={paymentMode === 'CARD'} onChange={() => setPaymentMode('CARD')} />
                  <span>💳 Credit / Debit Card (Visa / Mastercard / Rupay)</span>
                </label>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                  <input type="radio" name="pay" value="COD" checked={paymentMode === 'COD'} onChange={() => setPaymentMode('COD')} />
                  <span>💵 Cash on Delivery</span>
                </label>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              style={{
                width: '100%',
                background: '#388e3c',
                color: 'white',
                border: 'none',
                padding: 12,
                borderRadius: 6,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Confirm Order (₹{(checkoutProduct ? Number(checkoutProduct.price) : cartTotal).toLocaleString('en-IN')})
            </button>
          </div>
        </div>
      )}

      {/* =======================================================
          ORDER SUCCESS POPUP
          ======================================================= */}
      {orderSuccess && (
        <div className="modal-overlay" onClick={() => setOrderSuccess(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 44, marginBottom: 4 }}>🎉</p>
            <h2 style={{ color: '#388e3c', fontSize: 17 }}>Order Confirmed!</h2>
            <p style={{ fontSize: 12, color: '#555', margin: '4px 0' }}>
              Handed over to <strong>Ekart Logistics</strong>.
            </p>

            <div style={{ background: '#f8f9fa', padding: 10, borderRadius: 6, margin: '10px 0', textAlign: 'left', fontSize: 11 }}>
              <div><strong>Order ID:</strong> {orderSuccess.orderId}</div>
              <div style={{ margin: '2px 0' }}><strong>Ekart Tracking:</strong> <span style={{ color: '#2874f0', fontWeight: 800 }}>{orderSuccess.trackingNumber}</span></div>
              <div><strong>Payment:</strong> {orderSuccess.paymentMode}</div>
              <div style={{ margin: '2px 0' }}><strong>Amount:</strong> ₹{Number(orderSuccess.amount).toLocaleString('en-IN')}</div>
            </div>

            <button
              onClick={() => setOrderSuccess(null)}
              style={{ background: '#2874f0', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 4, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* =======================================================
          MY ORDERS MODAL
          ======================================================= */}
      {showOrdersModal && (
        <div className="modal-overlay" onClick={() => setShowOrdersModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowOrdersModal(false)}>✕</button>
            <h3 style={{ fontSize: 15, marginBottom: 4 }}>My Orders</h3>
            <p style={{ color: '#777', fontSize: 11, marginBottom: 10 }}>Past orders placed on Flipkart</p>

            {userOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#888', fontSize: 12 }}>
                <p>No past orders recorded yet.</p>
              </div>
            ) : (
              userOrders.map((ord) => (
                <div key={ord.id} style={{ border: '1px solid #eee', padding: 8, borderRadius: 6, marginBottom: 8, fontSize: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>Order #{ord.id.slice(0, 8)}...</span>
                    <span style={{ color: '#388e3c' }}>{ord.status}</span>
                  </div>
                  <div style={{ color: '#666', margin: '2px 0' }}>
                    Ekart Tracking: <strong>{ord.trackingNumber}</strong>
                  </div>
                  <div style={{ fontWeight: 800, marginTop: 4 }}>
                    Total: ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =======================================================
          USER AUTH MODAL
          ======================================================= */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowAuthModal(false)}>✕</button>

            <h3 style={{ marginBottom: 4, fontSize: 15 }}>{authMode === 'login' ? 'Login to Flipkart' : 'Create an Account'}</h3>
            <p style={{ color: '#777', fontSize: 11, marginBottom: 12 }}>
              Access your Orders, Wishlist, and SuperCoins
            </p>

            <form onSubmit={handleAuthSubmit}>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 2 }}>
                  Username / Mobile:
                </label>
                <input
                  type="text"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 12 }}
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 2 }}>
                  Password:
                </label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 12 }}
                  required
                />
              </div>

              <button
                type="submit"
                style={{ width: '100%', background: '#fb641b', color: 'white', border: 'none', padding: 10, borderRadius: 4, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                {authMode === 'login' ? 'Continue / Login' : 'Sign Up'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: '#2874f0', cursor: 'pointer' }} onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
              {authMode === 'login' ? 'New to Flipkart? Create an account' : 'Existing user? Log in'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Server-Side Pre-render from Gateway
export async function getServerSideProps() {
  try {
    const res = await fetch('http://api-gateway:8000/api/v1/catalog/products');
    if (res.ok) {
      const initialProducts = await res.json();
      return { props: { initialProducts } };
    }
  } catch (e) {
    console.error('ServerSideProps fetch error:', e.message);
  }
  return { props: { initialProducts: [] } };
}
