import { useState, useEffect } from 'react';
import Head from 'next/head';

// Bulletproof fallback SVG generator for products
const getProductFallback = (title, brand) => {
  const bg = brand === 'Apple' ? '#000000' : brand === 'Samsung' ? '#1428a0' : brand === 'Sony' ? '#222222' : brand === 'Nike' ? '#ff4500' : '#2874f0';
  const label = encodeURIComponent((title || 'Product').split('(')[0].trim().slice(0, 22));
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23f8f9fa"/><rect x="25" y="25" width="250" height="250" rx="16" fill="${encodeURIComponent(bg)}"/><text x="150" y="140" fill="white" font-size="22" font-family="sans-serif" font-weight="bold" text-anchor="middle">${encodeURIComponent(brand || 'Flipkart')}</text><text x="150" y="175" fill="%23ffe500" font-size="14" font-family="sans-serif" font-weight="bold" text-anchor="middle">${label}</text><text x="150" y="210" fill="white" font-size="12" font-family="sans-serif" text-anchor="middle">⚡ F-Assured</text></svg>`;
};

export default function Home({ initialProducts }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [filteredProducts, setFilteredProducts] = useState(initialProducts || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortOption, setSortOption] = useState('relevance');

  // User Auth State
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authUsername, setAuthUsername] = useState('rahul_sharma');
  const [authPassword, setAuthPassword] = useState('secret123');

  // Cart State (In-Memory Redis backend)
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

  const executeSearch = async (queryToSearch) => {
    const q = queryToSearch !== undefined ? queryToSearch : searchQuery;
    setShowSuggestions(false);
    if (!q.trim()) {
      setFilteredProducts(products);
      return;
    }
    try {
      const res = await fetch(`/api/v1/search/query?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setFilteredProducts(data.results || []);
      }
    } catch (e) {
      console.error('Search error:', e);
    }
  };

  const filterByCategory = (catSlug) => {
    setActiveCategory(catSlug);
    if (catSlug === 'all') {
      setFilteredProducts(products);
    } else if (catSlug === 'mobiles') {
      setFilteredProducts(products.filter(p => p.brand === 'Apple' || p.brand === 'Samsung' || p.brand === 'OnePlus'));
    } else if (catSlug === 'electronics') {
      setFilteredProducts(products.filter(p => p.brand === 'Sony' || (p.specifications && p.specifications.Chip)));
    } else if (catSlug === 'fashion') {
      setFilteredProducts(products.filter(p => p.brand === 'Nike'));
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
      sorted.sort((a, b) => Number(b.rating) - Number(a.rating));
    }
    setFilteredProducts(sorted);
  };

  const addToCart = async (product, qty = 1) => {
    const uid = user ? user.id : 'usr-guest-84';
    try {
      await fetch(`/api/v1/cart/${uid}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          title: product.title,
          price: product.price,
          image: (product.images && product.images[0]) || getProductFallback(product.title, product.brand),
          quantity: qty,
        })
      });
      fetchCart();
      showToast(`🛒 "${product.title}" added to cart!`);
    } catch (e) {
      showToast('Item added to cart!');
    }
  };

  const updateCartItemQty = async (item, delta) => {
    const newQty = item.quantity + delta;
    const uid = user ? user.id : 'usr-guest-84';
    if (newQty <= 0) {
      await fetch(`/api/v1/cart/${uid}/items/${item.productId}`, { method: 'DELETE' });
    } else {
      await fetch(`/api/v1/cart/${uid}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          title: item.title,
          price: item.price,
          image: item.image,
          quantity: newQty,
        })
      });
    }
    fetchCart();
  };

  const removeCartItem = async (productId) => {
    const uid = user ? user.id : 'usr-guest-84';
    await fetch(`/api/v1/cart/${uid}/items/${productId}`, { method: 'DELETE' });
    fetchCart();
    showToast('Item removed from cart.');
  };

  const openProductModal = async (product) => {
    setSelectedProduct(product);
    setPincodeResult(null);
    try {
      const res = await fetch(`/api/v1/reviews/product/${product.id}`);
      if (res.ok) {
        const data = await res.json();
        setProductReviews(data.reviews || []);
      }
    } catch (e) {
      setProductReviews([]);
    }
  };

  const checkEkartPincode = async () => {
    if (!pincode || pincode.length !== 6) {
      alert('Please enter a valid 6-digit PIN code.');
      return;
    }
    try {
      const res = await fetch(`/api/v1/delivery/check-pincode?pincode=${pincode}`);
      if (res.ok) {
        const data = await res.json();
        setPincodeResult(data);
      }
    } catch (e) {
      alert('Ekart check completed.');
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
          product_id: selectedProduct.id,
          user_id: user ? user.id : 'usr-guest-84',
          user_name: user ? user.username : 'Flipkart Verified Shopper',
          rating: Number(newReviewRating),
          title: 'Verified Customer Review',
          comment: newReviewComment || 'Excellent product delivered on time!',
          is_verified_buyer: true,
        })
      });
      if (res.ok) {
        showToast('⭐ Review submitted!');
        setNewReviewComment('');
        openProductModal(selectedProduct);
      }
    } catch (e) {
      showToast('Review recorded.');
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const newUser = {
      id: 'usr-' + Math.floor(Math.random() * 89999 + 10000),
      username: authUsername || 'Shopper',
      superCoins: 200
    };
    setUser(newUser);
    localStorage.setItem('fk_user', JSON.stringify(newUser));
    setShowAuthModal(false);
    showToast(`Welcome, ${newUser.username}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('fk_user');
    setUser(null);
    showToast('Logged out successfully.');
  };

  const handlePlaceOrder = async () => {
    const uid = user ? user.id : 'usr-guest-84';
    const amount = checkoutProduct ? Number(checkoutProduct.price) : cartTotal;

    try {
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

  return (
    <div>
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

      {/* RESPONSIVE HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="header-top-row">
            <div className="logo-area" onClick={() => { setSearchQuery(''); filterByCategory('all'); }}>
              <span className="logo-title">Flipkart</span>
              <span className="logo-sub">Explore <span className="plus">Plus ✨</span></span>
            </div>

            {/* Mobile Header Actions (Visible on small screens) */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {user ? (
                <span
                  onClick={() => setShowAuthModal(true)}
                  style={{ fontSize: 12, fontWeight: 700, background: '#1259c7', color: 'white', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}
                >
                  👤 {user.username.split(' ')[0]}
                </span>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  style={{ background: 'white', color: '#2874f0', border: 'none', padding: '4px 12px', borderRadius: 2, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                >
                  Login
                </button>
              )}

              <span
                onClick={() => setShowCartDrawer(true)}
                style={{ cursor: 'pointer', background: '#fb641b', color: 'white', padding: '4px 10px', borderRadius: 14, fontWeight: 800, fontSize: 12 }}
              >
                🛒 {cartCount}
              </span>
            </div>
          </div>

          {/* Search Box */}
          <div className="search-container">
            <form className="search-box" onSubmit={(e) => { e.preventDefault(); executeSearch(); }}>
              <input
                type="text"
                placeholder="Search for Products, Brands and More"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              />
              <button type="submit">🔍</button>
            </form>

            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    className="suggestion-item"
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

          {/* Desktop Nav Actions */}
          <div className="nav-actions">
            <a href="http://localhost:4100" target="_blank" rel="noreferrer" className="nav-link" title="Open Seller Portal">
              🏪 Seller Hub (4100)
            </a>
            <a href="http://localhost:4200" target="_blank" rel="noreferrer" className="nav-link" title="Open SuperAdmin Console">
              🛡️ Admin (4200)
            </a>
            <span className="nav-link" onClick={openOrdersModal}>
              📦 Orders
            </span>
            <div className="cart-pill" onClick={() => setShowCartDrawer(true)}>
              🛒 Cart ({cartCount})
            </div>
          </div>
        </div>
      </header>

      {/* FLIPKART MOBILE CATEGORY CIRCLES STRIP */}
      <div className="category-strip">
        <div className={`cat-bubble ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => filterByCategory('all')}>
          <div className="cat-icon-circle">🏷️</div>
          <span className="cat-label">All Offers</span>
        </div>
        <div className={`cat-bubble ${activeCategory === 'mobiles' ? 'active' : ''}`} onClick={() => filterByCategory('mobiles')}>
          <div className="cat-icon-circle">📱</div>
          <span className="cat-label">Mobiles</span>
        </div>
        <div className={`cat-bubble ${activeCategory === 'electronics' ? 'active' : ''}`} onClick={() => filterByCategory('electronics')}>
          <div className="cat-icon-circle">💻</div>
          <span className="cat-label">Laptops</span>
        </div>
        <div className={`cat-bubble ${activeCategory === 'fashion' ? 'active' : ''}`} onClick={() => filterByCategory('fashion')}>
          <div className="cat-icon-circle">👟</div>
          <span className="cat-label">Fashion</span>
        </div>
        <div className="cat-bubble" onClick={() => filterByCategory('electronics')}>
          <div className="cat-icon-circle">🎧</div>
          <span className="cat-label">Audio</span>
        </div>
        <div className="cat-bubble" onClick={() => filterByCategory('all')}>
          <div className="cat-icon-circle">📺</div>
          <span className="cat-label">Appliances</span>
        </div>
      </div>

      {/* HERO OFFER BANNER */}
      <div className="banner-container">
        <div className="hero-banner">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>⚡ Big Billion Days -- Super Value Live!</h2>
            <p style={{ fontSize: 12, color: '#e0edff', marginTop: 3 }}>
              Fast Delivery by Ekart | 100% Genuine Guaranteed
            </p>
          </div>
          <button className="hero-btn" onClick={() => filterByCategory('mobiles')}>
            Explore →
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="main-wrapper">
        {/* Sort & Filter Chips */}
        <div className="filter-bar">
          <div style={{ fontWeight: 700, fontSize: 13, color: '#555' }}>
            {filteredProducts.length} Items Available
          </div>

          <div className="sort-chips">
            <button className={`sort-chip ${sortOption === 'relevance' ? 'active' : ''}`} onClick={() => handleSort('relevance')}>
              Popularity
            </button>
            <button className={`sort-chip ${sortOption === 'price_asc' ? 'active' : ''}`} onClick={() => handleSort('price_asc')}>
              Price: Low to High
            </button>
            <button className={`sort-chip ${sortOption === 'price_desc' ? 'active' : ''}`} onClick={() => handleSort('price_desc')}>
              Price: High to Low
            </button>
            <button className={`sort-chip ${sortOption === 'rating' ? 'active' : ''}`} onClick={() => handleSort('rating')}>
              Customer Rating
            </button>
          </div>
        </div>

        {/* 2-COLUMN MOBILE & 4-COLUMN DESKTOP PRODUCT GRID */}
        <div className="product-grid">
          {filteredProducts.map((p) => {
            const fallbackSrc = getProductFallback(p.title, p.brand);
            const imageSrc = (p.images && p.images[0]) || fallbackSrc;

            return (
              <div key={p.id} className="product-card">
                <div>
                  <div className="card-img-wrapper" onClick={() => openProductModal(p)}>
                    <img
                      src={imageSrc}
                      alt={p.title}
                      className="product-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = fallbackSrc;
                      }}
                    />
                  </div>

                  <div className="product-title" onClick={() => openProductModal(p)}>
                    {p.title}
                  </div>

                  <div className="badge-assured">⚡ F-Assured</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}>
                    <div className="rating-pill">★ {p.rating || 4.5}</div>
                    <span style={{ color: '#878787', fontSize: 11 }}>({p.rating_count || 120})</span>
                  </div>

                  <div className="price-row">
                    <span className="current-price">₹{Number(p.price).toLocaleString('en-IN')}</span>
                    {p.discount_percentage > 0 && (
                      <span className="discount-tag">{p.discount_percentage}% off</span>
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="btn-group">
                  <button className="btn-add-cart" onClick={() => addToCart(p)}>
                    + Add
                  </button>
                  <button
                    className="btn-buy-now"
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
      </main>

      {/* FLIPKART MOBILE BOTTOM NAVIGATION BAR */}
      <div className="bottom-nav">
        <div className="bottom-nav-item active" onClick={() => { setSearchQuery(''); filterByCategory('all'); }}>
          <span className="bottom-nav-icon">🏠</span>
          <span>Home</span>
        </div>

        <div className="bottom-nav-item" onClick={() => filterByCategory('mobiles')}>
          <span className="bottom-nav-icon">📁</span>
          <span>Categories</span>
        </div>

        <a href="http://10.195.18.98:4100" target="_blank" rel="noreferrer" className="bottom-nav-item">
          <span className="bottom-nav-icon">🏪</span>
          <span>Seller (4100)</span>
        </a>

        <a href="http://10.195.18.98:4200" target="_blank" rel="noreferrer" className="bottom-nav-item">
          <span className="bottom-nav-icon">🛡️</span>
          <span>Admin (4200)</span>
        </a>

        <div className="bottom-nav-item" onClick={() => setShowCartDrawer(true)}>
          <span className="bottom-nav-icon">🛒</span>
          {cartCount > 0 && <span className="mobile-cart-badge">{cartCount}</span>}
          <span>Cart</span>
        </div>
      </div>

      {/* CART DRAWER */}
      {showCartDrawer && (
        <div className="drawer-overlay" onClick={() => setShowCartDrawer(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Shopping Cart ({cartCount})</h3>
              <button onClick={() => setShowCartDrawer(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: 24, cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div className="drawer-body">
              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 0', color: '#888' }}>
                  <p style={{ fontSize: 44, marginBottom: 12 }}>🛒</p>
                  <p style={{ fontWeight: 700, fontSize: 16 }}>Your cart is empty!</p>
                  <p style={{ fontSize: 13, marginTop: 4 }}>Add products to view them here.</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.productId} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #eee' }}>
                    <img
                      src={item.image || getProductFallback(item.title, 'Item')}
                      style={{ width: 64, height: 64, objectFit: 'contain' }}
                      alt={item.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getProductFallback(item.title, 'Item');
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</div>
                      <div style={{ fontWeight: 800, margin: '4px 0', fontSize: 14 }}>₹{Number(item.price).toLocaleString('en-IN')}</div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                        <button style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #ccc', background: 'white', fontWeight: 700, cursor: 'pointer' }} onClick={() => updateCartItemQty(item, -1)}>-</button>
                        <span style={{ fontWeight: 700 }}>{item.quantity}</span>
                        <button style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #ccc', background: 'white', fontWeight: 700, cursor: 'pointer' }} onClick={() => updateCartItemQty(item, 1)}>+</button>
                        <button
                          onClick={() => removeCartItem(item.productId)}
                          style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
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
              <div className="drawer-footer">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span>Delivery Charges:</span>
                  <span style={{ color: '#388e3c', fontWeight: 700 }}>FREE (Ekart Logistics)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontWeight: 800, fontSize: 17 }}>
                  <span>Total Payable:</span>
                  <span style={{ color: '#2874f0' }}>₹{Number(cartTotal).toLocaleString('en-IN')}</span>
                </div>
                <button
                  className="btn-checkout"
                  onClick={() => {
                    setCheckoutProduct(null);
                    setShowCheckoutModal(true);
                  }}
                >
                  Proceed to Checkout ({cartCount} Items) →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRODUCT DETAILS MODAL */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)}>✕</button>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <img
                src={(selectedProduct.images && selectedProduct.images[0]) || getProductFallback(selectedProduct.title, selectedProduct.brand)}
                alt={selectedProduct.title}
                style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getProductFallback(selectedProduct.title, selectedProduct.brand);
                }}
              />
            </div>

            <div>
              <h2 style={{ fontSize: 16, lineHeight: 1.4 }}>{selectedProduct.title}</h2>
              <div style={{ color: '#878787', margin: '4px 0', fontSize: 12 }}>Brand: <strong>{selectedProduct.brand}</strong></div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0' }}>
                <div className="rating-pill">★ {selectedProduct.rating || 4.5}</div>
                <span style={{ color: '#878787', fontSize: 12 }}>({selectedProduct.rating_count || 120} Ratings)</span>
              </div>

              <div className="price-row">
                <span className="current-price" style={{ fontSize: 22 }}>₹{Number(selectedProduct.price).toLocaleString('en-IN')}</span>
                <span className="discount-tag">{selectedProduct.discount_percentage}% off</span>
              </div>

              <p style={{ color: '#555', fontSize: 13, margin: '10px 0', lineHeight: 1.4 }}>
                {selectedProduct.description}
              </p>

              {/* Ekart Pincode Checker */}
              <div style={{ background: '#f8f9fa', border: '1px dashed #2874f0', borderRadius: 6, padding: 12, margin: '12px 0' }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#2874f0' }}>🚚 Check Ekart Delivery Speed:</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <input
                    type="text"
                    placeholder="Enter 6-digit PIN"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    style={{ flex: 1, padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13 }}
                  />
                  <button type="button" onClick={checkEkartPincode} style={{ background: '#2874f0', color: 'white', border: 'none', padding: '7px 14px', borderRadius: 4, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    Check
                  </button>
                </div>

                {pincodeResult && (
                  <div style={{ marginTop: 6, fontSize: 12, color: '#388e3c', fontWeight: 700 }}>
                    ✓ {pincodeResult.delivery_speed} by {pincodeResult.courier}! Arrival: <strong>{pincodeResult.estimated_delivery}</strong>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="btn-group" style={{ marginTop: 12 }}>
                <button className="btn-add-cart" onClick={() => addToCart(selectedProduct)}>
                  Add to Cart
                </button>
                <button
                  className="btn-buy-now"
                  onClick={() => {
                    setCheckoutProduct(selectedProduct);
                    setShowCheckoutModal(true);
                  }}
                >
                  Buy Now
                </button>
              </div>
            </div>

            {/* Specifications */}
            {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
              <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 14 }}>
                <h3 style={{ fontSize: 14 }}>Specifications</h3>
                <table style={{ width: '100%', marginTop: 6, borderCollapse: 'collapse', fontSize: 12 }}>
                  <tbody>
                    {Object.entries(selectedProduct.specifications).map(([key, val]) => (
                      <tr key={key} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '6px 0', color: '#777', width: '40%' }}>{key}</td>
                        <td style={{ padding: '6px 0', fontWeight: 600 }}>{String(val)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {showCheckoutModal && (
        <div className="modal-overlay" onClick={() => setShowCheckoutModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <button className="modal-close" onClick={() => setShowCheckoutModal(false)}>✕</button>

            <h3 style={{ fontSize: 16 }}>Complete Checkout</h3>
            <p style={{ color: '#777', fontSize: 12, marginTop: 4 }}>
              Delivering to: <strong>Rahul Sharma, HSR Layout, Bangalore - 560102</strong>
            </p>

            <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 6, margin: '14px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{checkoutProduct ? checkoutProduct.title : `Cart Items (${cartCount})`}</span>
                <strong>₹{(checkoutProduct ? Number(checkoutProduct.price) : cartTotal).toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ borderTop: '1px solid #ddd', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                <span>Total Amount:</span>
                <span style={{ color: '#2874f0', fontSize: 18 }}>
                  ₹{(checkoutProduct ? Number(checkoutProduct.price) : cartTotal).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 700, fontSize: 12, display: 'block', marginBottom: 6 }}>Payment Mode:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                  <input type="radio" name="pay" value="UPI" checked={paymentMode === 'UPI'} onChange={() => setPaymentMode('UPI')} />
                  <span>⚡ Instant UPI (PhonePe / GPay)</span>
                </label>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                  <input type="radio" name="pay" value="CARD" checked={paymentMode === 'CARD'} onChange={() => setPaymentMode('CARD')} />
                  <span>💳 Credit / Debit Card</span>
                </label>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                  <input type="radio" name="pay" value="COD" checked={paymentMode === 'COD'} onChange={() => setPaymentMode('COD')} />
                  <span>💵 Cash on Delivery</span>
                </label>
              </div>
            </div>

            <button
              className="btn-checkout"
              onClick={handlePlaceOrder}
              style={{ background: '#388e3c' }}
            >
              Confirm Order (₹{(checkoutProduct ? Number(checkoutProduct.price) : cartTotal).toLocaleString('en-IN')})
            </button>
          </div>
        </div>
      )}

      {/* ORDER SUCCESS POPUP */}
      {orderSuccess && (
        <div className="modal-overlay" onClick={() => setOrderSuccess(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <p style={{ fontSize: 44, marginBottom: 6 }}>🎉</p>
            <h2 style={{ color: '#388e3c', fontSize: 18 }}>Order Confirmed!</h2>
            <p style={{ fontSize: 13, color: '#555', margin: '6px 0' }}>
              Handed to <strong>Ekart Logistics</strong>.
            </p>

            <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 6, margin: '12px 0', textAlign: 'left', fontSize: 12 }}>
              <div><strong>Order ID:</strong> {orderSuccess.orderId}</div>
              <div style={{ margin: '3px 0' }}><strong>Ekart Tracking:</strong> <span style={{ color: '#2874f0', fontWeight: 800 }}>{orderSuccess.trackingNumber}</span></div>
              <div><strong>Payment:</strong> {orderSuccess.paymentMode}</div>
              <div style={{ margin: '3px 0' }}><strong>Amount:</strong> ₹{Number(orderSuccess.amount).toLocaleString('en-IN')}</div>
            </div>

            <button
              onClick={() => setOrderSuccess(null)}
              style={{ background: '#2874f0', color: 'white', border: 'none', padding: '9px 20px', borderRadius: 4, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* MY ORDERS MODAL */}
      {showOrdersModal && (
        <div className="modal-overlay" onClick={() => setShowOrdersModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <button className="modal-close" onClick={() => setShowOrdersModal(false)}>✕</button>
            <h3 style={{ fontSize: 16 }}>My Orders</h3>
            <p style={{ color: '#777', fontSize: 12, marginBottom: 12 }}>Past placed orders</p>

            {userOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#888', fontSize: 13 }}>
                <p>No past orders recorded yet.</p>
              </div>
            ) : (
              userOrders.map((ord) => (
                <div key={ord.id} style={{ border: '1px solid #eee', padding: 10, borderRadius: 6, marginBottom: 10, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>Order #{ord.id.slice(0, 8)}...</span>
                    <span style={{ color: '#388e3c' }}>{ord.status}</span>
                  </div>
                  <div style={{ color: '#666', margin: '3px 0' }}>
                    Ekart Tracking: <strong>{ord.trackingNumber}</strong>
                  </div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>
                    Total: ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <button className="modal-close" onClick={() => setShowAuthModal(false)}>✕</button>

            <h3 style={{ marginBottom: 4, fontSize: 16 }}>{authMode === 'login' ? 'Login to Flipkart' : 'Create an Account'}</h3>
            <p style={{ color: '#777', fontSize: 12, marginBottom: 12 }}>
              Get access to Orders, Wishlist, and SuperCoins
            </p>

            <form onSubmit={handleAuthSubmit}>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 3 }}>
                  Username / Mobile:
                </label>
                <input
                  type="text"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13 }}
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 3 }}>
                  Password:
                </label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13 }}
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

            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#2874f0', cursor: 'pointer' }} onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
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
