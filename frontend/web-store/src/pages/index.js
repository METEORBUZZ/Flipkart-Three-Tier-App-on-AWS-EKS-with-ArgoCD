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

// Desktop Horizontal Category Ribbon items
const DESKTOP_CATEGORIES = [
  { id: 'top_offers', label: 'Top Offers', icon: '🏷️' },
  { id: 'mobiles', label: 'Mobiles', icon: '📱' },
  { id: 'electronics', label: 'Electronics', icon: '💻' },
  { id: 'fashion', label: 'Fashion', icon: '👔' },
  { id: 'home', label: 'Home & Furniture', icon: '🛋️' },
  { id: 'appliances', label: 'Appliances', icon: '📺' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'beauty', label: 'Beauty, Toys & More', icon: '🧸' },
];

// Interactive Play / Reels Video Feed Data
const PLAY_REELS_DATA = [
  {
    id: 'reel-1',
    creator: '@TechGuruIndia ⚡',
    title: 'Apple iPhone 15 Blue Unboxing & Camera Test!',
    desc: 'Dynamic island in action, 48MP main sensor takes crisp low-light photos. Available on Big Billion Days with HDFC 10% discount!',
    productId: 'b0000000-0000-0000-0000-000000000001',
    productTitle: 'Apple iPhone 15 (Blue, 128 GB)',
    price: 71999,
    likes: 1240,
    comments: 88,
    bgGrad: 'linear-gradient(180deg, #1e1b4b 0%, #1e3a8a 60%, #0f172a 100%)',
    icon: '📱',
  },
  {
    id: 'reel-2',
    creator: '@AudiophileReviews 🎧',
    title: 'Sony WH-1000XM5: The King of Noise Cancelling?',
    desc: 'Tested inside busy metro station. Dual processor V1 eliminates ambient rumbling completely. 30 hours battery life is unbelievable!',
    productId: 'b0000000-0000-0000-0000-000000000003',
    productTitle: 'Sony WH-1000XM5 Wireless Headphones',
    price: 29990,
    likes: 890,
    comments: 42,
    bgGrad: 'linear-gradient(180deg, #311042 0%, #4c1d95 60%, #1e1b4b 100%)',
    icon: '🎧',
  },
  {
    id: 'reel-3',
    creator: '@SneakerHeadsDelhi 👟',
    title: 'Nike Air Force 1 07: How to Style with Casuals',
    desc: 'The timeless classic white leather sneaker. Premium cushioning and stitched overlays. Must-have for your wardrobe this season.',
    productId: 'b0000000-0000-0000-0000-000000000006',
    productTitle: 'Nike Air Force 1 07 Casual Sneakers',
    price: 7495,
    likes: 2150,
    comments: 115,
    bgGrad: 'linear-gradient(180deg, #371b04 0%, #7c2d12 60%, #1c1917 100%)',
    icon: '👟',
  },
];

// Complete Flipkart Category Directory Tree
const CATEGORY_TREE_DATA = [
  {
    id: 'cat-mobiles',
    name: 'Mobiles & Tablets',
    icon: '📱',
    subcategories: ['5G Smartphones', 'Apple iPhones', 'Samsung Galaxy', 'Gaming Phones', 'Refurbished Mobiles', 'Tablets & iPads']
  },
  {
    id: 'cat-electronics',
    name: 'Electronics & Laptops',
    icon: '💻',
    subcategories: ['Thin & Light Laptops', 'Gaming Laptops', 'Smartwatches & Bands', 'Headphones & Audio', 'Computer Accessories', 'DSLR & Action Cameras']
  },
  {
    id: 'cat-fashion',
    name: 'Fashion & Footwear',
    icon: '👗',
    subcategories: ["Men's Casual Shirts", "Women's Ethnic Kurta Sets", 'Denim Jeans', 'Sports & Running Shoes', 'Analog & Smart Watches', 'Fashion Jewellery']
  },
  {
    id: 'cat-appliances',
    name: 'TVs & Appliances',
    icon: '📺',
    subcategories: ['4K Smart TVs', 'Inverter Air Conditioners', 'Double Door Refrigerators', 'Front Load Washing Machines', 'Microwave Ovens', 'Air Purifiers']
  },
  {
    id: 'cat-beauty',
    name: 'Beauty & Personal Care',
    icon: '💄',
    subcategories: ['Luxury Perfumes & Deos', 'Skincare & Sunscreens', "Men's Beard Grooming", 'Hair Styling & Dryers', 'Lipsticks & Makeup', 'Ayurvedic Wellness']
  },
  {
    id: 'cat-home',
    name: 'Home & Living',
    icon: '🛋️',
    subcategories: ['Living Room Sofas', 'Memory Foam Mattresses', 'Kitchen Cookware Sets', 'Curtains & Bedding', 'Home Decor Lighting', 'Storage & Wardrobes']
  }
];

export default function Home({ initialProducts }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [filteredProducts, setFilteredProducts] = useState(initialProducts || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState('fashion');
  const [activeBrandPill, setActiveBrandPill] = useState('flipkart');
  const [sortOption, setSortOption] = useState('relevance');

  // Mobile App Active View: 'home' | 'play' | 'categories' | 'account'
  const [mobileAppView, setMobileAppView] = useState('home');

  // Play Reels Likes State
  const [reelLikes, setReelLikes] = useState({ 'reel-1': 1240, 'reel-2': 890, 'reel-3': 2150 });
  const [likedReels, setLikedReels] = useState({});

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

  // Customer Q&A State
  const [productQuestions, setProductQuestions] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [replyingQId, setReplyingQId] = useState(null);
  const [newAnswerText, setNewAnswerText] = useState('');

  // Buyer-to-Seller Live Chat State
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatProduct, setChatProduct] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

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
        return { hrs: 2, mins: 0, secs: 0 };
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
      fetchUserOrders();
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

  const fetchUserOrders = async () => {
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
    setMobileAppView('home');
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
    setMobileAppView('home');
    if (tabId === 'foryou' || tabId === 'fashion' || tabId === 'top_offers') {
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
    setProductReviews([]);
    setProductQuestions([]);

    try {
      const res = await fetch(`/api/v1/reviews/product/${product.id}`);
      if (res.ok) {
        const data = await res.json();
        setProductReviews(data.reviews || []);
      }
    } catch (e) {
      setProductReviews([]);
    }

    try {
      const qaRes = await fetch(`/api/v1/reviews/qa/product/${product.id}`);
      if (qaRes.ok) {
        const qaData = await qaRes.json();
        setProductQuestions(qaData.questions || []);
      }
    } catch (e) {
      setProductQuestions([]);
    }
  };

  const markReviewHelpful = async (reviewId) => {
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/helpful`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setProductReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpful_count: updated.helpful_count } : r));
        showToast('✓ Marked review as helpful');
      }
    } catch (e) {
      showToast('✓ Marked helpful');
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
          user_name: user ? user.username : 'Flipkart Customer',
          rating: newReviewRating,
          comment: newReviewComment,
          is_verified_buyer: true
        })
      });
      if (res.ok) {
        const saved = await res.json();
        setProductReviews([saved, ...productReviews]);
        setNewReviewComment('');
        showToast('✓ Review posted successfully');
      }
    } catch (e) {
      showToast('✓ Review saved');
    }
  };

  const handlePostQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !selectedProduct) return;
    try {
      const res = await fetch('/api/v1/reviews/qa/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          user_id: user ? user.id : 'usr-guest-84',
          user_name: user ? user.username : 'Flipkart Customer',
          question: newQuestionText.trim()
        })
      });
      if (res.ok) {
        const created = await res.json();
        setProductQuestions([created, ...productQuestions]);
        setNewQuestionText('');
        showToast('✓ Question posted! Community & seller notified.');
      }
    } catch (e) {
      showToast('Question submitted');
    }
  };

  const handlePostAnswer = async (questionId) => {
    if (!newAnswerText.trim()) return;
    try {
      const res = await fetch('/api/v1/reviews/qa/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          user_id: user ? user.id : 'usr-guest-84',
          user_name: user ? user.username : 'Flipkart Customer',
          is_seller: false,
          answer: newAnswerText.trim()
        })
      });
      if (res.ok) {
        const createdAns = await res.json();
        setProductQuestions(prev => prev.map(q => {
          if (q.id === questionId) {
            const currentAnswers = q.answers || [];
            return { ...q, answers: [...currentAnswers, createdAns] };
          }
          return q;
        }));
        setReplyingQId(null);
        setNewAnswerText('');
        showToast('✓ Answer posted to community!');
      }
    } catch (e) {
      showToast('Answer submitted');
    }
  };

  const openSellerChat = async (product) => {
    setChatProduct(product);
    setShowChatModal(true);
    setChatMessages([]);
    const uid = user ? user.id : 'usr-guest-84';
    try {
      const res = await fetch(`/api/v1/reviews/chat/${product.id}/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages || []);
      }
    } catch (e) {
      setChatMessages([]);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInputText.trim() || !chatProduct || isSendingChat) return;
    const msg = chatInputText.trim();
    setChatInputText('');
    setIsSendingChat(true);

    const uid = user ? user.id : 'usr-guest-84';
    const tempBuyerMsg = {
      id: 'tmp-' + Date.now(),
      sender_type: 'buyer',
      sender_name: user ? user.username : 'You',
      message: msg,
      created_at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, tempBuyerMsg]);

    try {
      const res = await fetch('/api/v1/reviews/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: chatProduct.id,
          user_id: uid,
          sender_type: 'buyer',
          sender_name: user ? user.username : 'Rahul Sharma',
          message: msg
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.auto_reply) {
          setTimeout(() => {
            setChatMessages(prev => [...prev, data.auto_reply]);
          }, 600);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleLikeReel = (reelId) => {
    const isLiked = likedReels[reelId];
    setLikedReels(prev => ({ ...prev, [reelId]: !isLiked }));
    setReelLikes(prev => ({
      ...prev,
      [reelId]: isLiked ? prev[reelId] - 1 : prev[reelId] + 1
    }));
    showToast(isLiked ? 'Unliked video' : '❤️ Liked video! Added to your Favorites');
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
      fetchUserOrders();
    } catch (e) {
      showToast('Order confirmed! Ekart shipment assigned.');
      setShowCheckoutModal(false);
      setShowCartDrawer(false);
    }
  };

  const pad2 = (n) => String(n).padStart(2, '0');

  return (
    <div style={{ minHeight: '100vh', background: '#f1f2f4' }}>
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

      {/* =========================================================================
          DESKTOP & TABLET VIEW (AUTO-ACTIVATED ON SCREENS >= 768px VIA CSS)
          Full-width Flipkart Desktop Website Layout
          ========================================================================= */}
      <div className="desktop-only-view">
        {/* FLIPKART OFFICIAL BLUE DESKTOP HEADER */}
        <header className="desktop-header">
          <div className="desktop-header-inner">
            {/* Logo */}
            <div className="desktop-logo-area" onClick={() => { setSearchQuery(''); switchPurpleTab('top_offers'); }}>
              <span className="desktop-logo-title">Flipkart</span>
              <span className="desktop-logo-sub">Explore <span className="plus">Plus ✨</span></span>
            </div>

            {/* Desktop Search Bar */}
            <div className="desktop-search-container">
              <form className="desktop-search-box" onSubmit={(e) => { e.preventDefault(); executeSearch(); }}>
                <input
                  type="text"
                  placeholder="Search for Products, Brands and More"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                />
                <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>🔍</button>
              </form>

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

            {/* Desktop Actions */}
            <div className="desktop-nav-actions">
              {user ? (
                <div
                  onClick={() => setShowAuthModal(true)}
                  className="desktop-nav-link"
                  style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: 4 }}
                >
                  👤 {user.username} (⚡ {user.superCoins || 150})
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  style={{ background: 'white', color: '#2874f0', border: 'none', padding: '6px 20px', borderRadius: 2, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
                >
                  Login
                </button>
              )}

              <a href="http://10.195.18.98:4100" target="_blank" rel="noreferrer" className="desktop-nav-link" title="Open Seller Portal">
                🏪 Become a Seller
              </a>

              <a href="http://10.195.18.98:4200" target="_blank" rel="noreferrer" className="desktop-nav-link" title="Open SuperAdmin Console">
                🛡️ Admin Console
              </a>

              <div className="desktop-nav-link" onClick={() => setShowOrdersModal(true)}>
                📦 Orders ({userOrders.length})
              </div>

              <div className="desktop-cart-pill" onClick={() => setShowCartDrawer(true)}>
                🛒 Cart ({cartCount})
              </div>
            </div>
          </div>
        </header>

        {/* DESKTOP CATEGORIES RIBBON BAR */}
        <nav className="desktop-cat-ribbon">
          <div className="desktop-cat-inner">
            {DESKTOP_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="desktop-cat-item"
                onClick={() => switchPurpleTab(cat.id)}
              >
                <span className="desktop-cat-icon">{cat.icon}</span>
                <span className="desktop-cat-label">{cat.label}</span>
              </div>
            ))}
          </div>
        </nav>

        {/* DESKTOP MAIN CONTAINER */}
        <main className="content-wrapper">
          {/* HERO BIG BILLION DAYS BANNER (WIDE LAPTOP/DESKTOP BANNER) */}
          <div className="hero-banner-card" onClick={() => switchPurpleTab('fashion')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="bbd-badge">⚡ BIG BILLION DAYS - LIVE NOW</span>
                <h1 style={{ fontSize: 26, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  India's Fashion & Electronics Capital
                </h1>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#ffe500', margin: '6px 0 10px 0' }}>
                  UP TO 50-80% OFF
                </div>
                <div style={{ fontSize: 13, color: '#e0edff' }}>
                  100% Genuine Brands • Free & Fast Ekart Logistics Delivery • Verified Warranties
                </div>
              </div>

              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '16px 24px', backdropFilter: 'blur(8px)' }}>
                <span style={{ fontSize: 50 }}>👗 📱</span>
                <div style={{ fontSize: 13, fontWeight: 800, marginTop: 4 }}>Trending Deals</div>
              </div>
            </div>

            {/* Bank Offer Strip inside Hero Card */}
            <div style={{
              marginTop: 16,
              background: 'rgba(0,0,0,0.35)',
              borderRadius: 8,
              padding: '10px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 13
            }}>
              <span>💳 <strong>HDFC Bank & SBI Cards</strong> | 10% Instant Discount on All Electronics & Fashion*</span>
              <span style={{ color: '#ffe500', fontWeight: 800, cursor: 'pointer' }}>View All Offers &gt;</span>
            </div>
          </div>

          {/* LIVE COUNTDOWN FLASH SALE STRIP */}
          <div className="countdown-strip">
            <span style={{ fontSize: 18 }}>⏰</span>
            <span style={{ fontSize: 15 }}>Flash Sale Starts in</span>
            <span className="timer-box">{pad2(timeLeft.hrs)}</span>
            <span style={{ fontWeight: 800 }}>Hr :</span>
            <span className="timer-box">{pad2(timeLeft.mins)}</span>
            <span style={{ fontWeight: 800 }}>Min :</span>
            <span className="timer-box">{pad2(timeLeft.secs)}</span>
            <span style={{ fontWeight: 800 }}>Sec</span>
            <span style={{ marginLeft: 16, color: '#2563eb', fontWeight: 800, cursor: 'pointer' }} onClick={() => showToast('Reminders set for flash deals!')}>
              🔔 Set Reminder
            </span>
          </div>

          {/* CURATED CATEGORIES HORIZONTAL ROW */}
          <div className="curated-categories-wrapper" style={{ background: 'white', padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12, color: '#1e293b' }}>
              Featured Collections
            </div>
            <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 6 }}>
              {[...CURATED_TILES_ROW1, ...CURATED_TILES_ROW2].map((item) => (
                <div key={item.id} className="curated-item" onClick={() => executeSearch(item.label)}>
                  <div className="curated-img-box" style={{ background: item.bg }}>
                    <span style={{ fontSize: 28 }}>{item.icon}</span>
                  </div>
                  <span className="curated-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PRODUCT CATALOG HEADER & SORT CHIPS */}
          <div className="section-header">
            <div>
              <span className="section-title">Trending Deals Catalog</span>
              <span style={{ fontSize: 14, color: '#64748b', marginLeft: 10 }}>({filteredProducts.length} items available)</span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleSort('relevance')}
                style={{
                  background: sortOption === 'relevance' ? '#2874f0' : 'white',
                  color: sortOption === 'relevance' ? 'white' : '#555',
                  border: '1px solid #ddd',
                  padding: '6px 14px',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Popularity
              </button>
              <button
                onClick={() => handleSort('price_asc')}
                style={{
                  background: sortOption === 'price_asc' ? '#2874f0' : 'white',
                  color: sortOption === 'price_asc' ? 'white' : '#555',
                  border: '1px solid #ddd',
                  padding: '6px 14px',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Price: Low to High
              </button>
              <button
                onClick={() => handleSort('price_desc')}
                style={{
                  background: sortOption === 'price_desc' ? '#2874f0' : 'white',
                  color: sortOption === 'price_desc' ? 'white' : '#555',
                  border: '1px solid #ddd',
                  padding: '6px 14px',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Price: High to Low
              </button>
              <button
                onClick={() => handleSort('rating')}
                style={{
                  background: sortOption === 'rating' ? '#2874f0' : 'white',
                  color: sortOption === 'rating' ? 'white' : '#555',
                  border: '1px solid #ddd',
                  padding: '6px 14px',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ★ 4.0+ Customer Rating
              </button>
            </div>
          </div>

          {/* RESPONSIVE PRODUCT GRID (4 COLS ON LAPTOP, 3 ON TABLET) */}
          <div className="product-grid-responsive">
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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
                      <span className="badge-assured">⚡ F-Assured</span>
                      <span
                        onClick={() => openSellerChat(p)}
                        style={{ fontSize: 11, color: '#2874f0', fontWeight: 800, cursor: 'pointer' }}
                        title="Chat with Seller"
                      >
                        💬 Chat with Seller
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}>
                      <span className="rating-badge">★ {p.rating || 4.5}</span>
                      <span style={{ fontSize: 11, color: '#888' }}>({p.rating_count || 140} ratings)</span>
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
                      + Add to Cart
                    </button>
                    <button
                      className="btn-card-buy"
                      onClick={() => {
                        setCheckoutProduct(p);
                        setShowCheckoutModal(true);
                      }}
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* DESKTOP FOOTER */}
        <footer className="desktop-footer">
          <div className="desktop-footer-inner">
            <div>
              <div className="footer-col-title">About</div>
              <ul className="footer-links">
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Flipkart Stories</a></li>
                <li><a href="#">Press</a></li>
              </ul>
            </div>

            <div>
              <div className="footer-col-title">Help</div>
              <ul className="footer-links">
                <li><a href="#">Payments</a></li>
                <li><a href="#">Shipping by Ekart</a></li>
                <li><a href="#">Cancellation & Returns</a></li>
                <li><a href="#">FAQ</a></li>
              </ul>
            </div>

            <div>
              <div className="footer-col-title">Consumer Policy</div>
              <ul className="footer-links">
                <li><a href="#">Return Policy</a></li>
                <li><a href="#">Terms Of Use</a></li>
                <li><a href="#">Security</a></li>
                <li><a href="#">Privacy</a></li>
              </ul>
            </div>

            <div>
              <div className="footer-col-title">MNC Microservices Architecture</div>
              <p style={{ color: '#cbd5e1', lineHeight: 1.6, fontSize: 12 }}>
                Powered by 9 decoupled Docker microservices, Ekart Logistics engine, PostgreSQL 16 catalog, Redis 7 fast cart caching, and Go payment gateway.
              </p>
              <div style={{ marginTop: 10 }}>
                <a href="http://10.195.18.98:4100" target="_blank" rel="noreferrer" style={{ color: '#ffe500', fontWeight: 800 }}>
                  🏪 Open Seller Portal (Port 4100) &gt;
                </a>
              </div>
            </div>
          </div>

          <div className="footer-bottom-row">
            <div>© 2026 Flipkart Clone. All rights reserved. Built for MNC pair testing.</div>
            <div style={{ display: 'flex', gap: 14 }}>
              <span>⚡ Ekart Verified</span>
              <span>🛡️ PCI-DSS Compliant</span>
              <span>⭐ 100% Genuine Guarantee</span>
            </div>
          </div>
        </footer>
      </div>

      {/* =========================================================================
          MOBILE VIEW (AUTO-ACTIVATED ON SCREENS < 768px VIA CSS)
          Exact Flipkart Mobile App UI
          ========================================================================= */}
      <div className="mobile-only-view" style={{ maxWidth: 640, margin: '0 auto', background: '#f1f2f4', minHeight: '100vh', position: 'relative' }}>
        {/* Mobile Purple Top Bar */}
        <header className="app-top-section">
          {/* Quick Switcher Pills */}
          <div className="brand-pills-row">
            <div
              className={`pill-card ${activeBrandPill === 'flipkart' ? 'pill-flipkart' : 'pill-white'}`}
              onClick={() => { setActiveBrandPill('flipkart'); setMobileAppView('home'); }}
            >
              <span>🛍️</span>
              <span>Flipkart</span>
            </div>

            <div
              className={`pill-card ${activeBrandPill === 'value365' ? 'pill-flipkart' : 'pill-white'}`}
              onClick={() => {
                setActiveBrandPill('value365');
                setMobileAppView('home');
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

          {/* Address & SuperCoins */}
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

          {/* Mobile Search Box */}
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

          {/* Purple Category Navigation Tabs */}
          {mobileAppView === 'home' && (
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
          )}
        </header>

        {/* MOBILE VIEW: HOME VIEW */}
        {mobileAppView === 'home' && (
          <main style={{ paddingBottom: 64 }}>
            {/* Hero Banner */}
            <div className="hero-banner-card" onClick={() => switchPurpleTab('fashion')} style={{ margin: '8px 12px' }}>
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

              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffe500' }}></span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }}></span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }}></span>
              </div>
            </div>

            {/* Countdown */}
            <div className="countdown-strip" style={{ margin: '8px 12px' }}>
              <span style={{ fontSize: 15 }}>⏰</span>
              <span>Starts in</span>
              <span className="timer-box">{pad2(timeLeft.hrs)}</span>
              <span style={{ fontWeight: 800 }}>Hr :</span>
              <span className="timer-box">{pad2(timeLeft.mins)}</span>
              <span style={{ fontWeight: 800 }}>Min :</span>
              <span className="timer-box">{pad2(timeLeft.secs)}</span>
              <span style={{ fontWeight: 800 }}>Sec</span>
            </div>

            {/* 2-Row Curated Category Tiles */}
            <div className="curated-categories-wrapper" style={{ padding: '6px 12px' }}>
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

            {/* Product Header */}
            <div className="section-header" style={{ padding: '8px 12px' }}>
              <div>
                <span className="section-title">Trending Catalog</span>
                <span style={{ fontSize: 11, color: '#777', marginLeft: 6 }}>({filteredProducts.length} items)</span>
              </div>

              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => handleSort('relevance')}
                  style={{ background: sortOption === 'relevance' ? '#2874f0' : 'white', color: sortOption === 'relevance' ? 'white' : '#555', border: '1px solid #ddd', padding: '3px 6px', borderRadius: 12, fontSize: 10, fontWeight: 700 }}
                >
                  Popular
                </button>
                <button
                  onClick={() => handleSort('price_asc')}
                  style={{ background: sortOption === 'price_asc' ? '#2874f0' : 'white', color: sortOption === 'price_asc' ? 'white' : '#555', border: '1px solid #ddd', padding: '3px 6px', borderRadius: 12, fontSize: 10, fontWeight: 700 }}
                >
                  Price ⬇
                </button>
                <button
                  onClick={() => handleSort('rating')}
                  style={{ background: sortOption === 'rating' ? '#2874f0' : 'white', color: sortOption === 'rating' ? 'white' : '#555', border: '1px solid #ddd', padding: '3px 6px', borderRadius: 12, fontSize: 10, fontWeight: 700 }}
                >
                  ★ 4.0+
                </button>
              </div>
            </div>

            {/* 2-Column Mobile Product Grid */}
            <div className="product-grid-responsive" style={{ padding: '0 10px', gridTemplateColumns: 'repeat(2, 1fr)' }}>
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

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '3px 0' }}>
                        <span className="badge-assured">⚡ F-Assured</span>
                        <span
                          onClick={() => openSellerChat(p)}
                          style={{ fontSize: 10, color: '#2874f0', fontWeight: 800, cursor: 'pointer' }}
                          title="Chat with Seller"
                        >
                          💬 Chat
                        </span>
                      </div>

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
          </main>
        )}

        {/* MOBILE VIEW: PLAY REELS */}
        {mobileAppView === 'play' && (
          <section className="reels-container" style={{ padding: '10px 14px 70px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#111' }}>▶️ Flipkart Video & Deals Live</h2>
              <span style={{ fontSize: 11, background: '#fee2e2', color: '#b91c1c', fontWeight: 800, padding: '3px 8px', borderRadius: 12 }}>
                🔴 3.4k Watching
              </span>
            </div>

            {PLAY_REELS_DATA.map((reel) => {
              const isLiked = likedReels[reel.id];
              return (
                <div key={reel.id} className="reel-card">
                  <div className="reel-video-placeholder" style={{ background: reel.bgGrad }}>
                    <div className="reel-live-tag">● LIVE DEMO</div>

                    <div className="reel-actions-column">
                      <button
                        className="reel-action-btn"
                        onClick={() => handleLikeReel(reel.id)}
                        style={{ color: isLiked ? '#ef4444' : 'white' }}
                      >
                        <span>{isLiked ? '❤️' : '🤍'}</span>
                        <span className="reel-action-label">{reelLikes[reel.id]}</span>
                      </button>

                      <button
                        className="reel-action-btn"
                        onClick={() => {
                          const prod = products.find(p => p.id === reel.productId) || { id: reel.productId, title: reel.productTitle, price: reel.price };
                          openSellerChat(prod);
                        }}
                      >
                        <span>💬</span>
                        <span className="reel-action-label">{reel.comments}</span>
                      </button>

                      <button
                        className="reel-action-btn"
                        onClick={() => {
                          navigator.clipboard?.writeText(window.location.href);
                          showToast('🔗 Video deal link copied!');
                        }}
                      >
                        <span>🔗</span>
                        <span className="reel-action-label">Share</span>
                      </button>
                    </div>

                    <div className="reel-info-bottom">
                      <div style={{ fontSize: 36, marginBottom: 8 }}>{reel.icon}</div>
                      <div className="reel-creator">{reel.creator}</div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{reel.title}</h3>
                      <p className="reel-desc">{reel.desc}</p>
                    </div>
                  </div>

                  <div className="reel-buy-bar">
                    <div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>Featured Deal</div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: 'white' }}>₹{Number(reel.price).toLocaleString('en-IN')}</div>
                    </div>

                    <button
                      className="reel-buy-btn"
                      onClick={() => {
                        const prod = products.find(p => p.id === reel.productId) || { id: reel.productId, title: reel.productTitle, price: reel.price };
                        setCheckoutProduct(prod);
                        setShowCheckoutModal(true);
                      }}
                    >
                      ⚡ Buy Now
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* MOBILE VIEW: CATEGORIES DIRECTORY */}
        {mobileAppView === 'categories' && (
          <section className="cat-directory-container" style={{ padding: '10px 14px 70px 14px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 12, color: '#111' }}>🔲 All Categories</h2>

            {CATEGORY_TREE_DATA.map((cat) => (
              <div key={cat.id} className="cat-directory-card">
                <div
                  className="cat-directory-header"
                  onClick={() => executeSearch(cat.name.split(' ')[0])}
                >
                  <div className="cat-icon-badge">{cat.icon}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{cat.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Explore top deals</div>
                  </div>
                </div>

                <div className="cat-chips-list">
                  {cat.subcategories.map((sub, idx) => (
                    <span
                      key={idx}
                      className="cat-chip-tag"
                      onClick={() => executeSearch(sub)}
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* MOBILE VIEW: ACCOUNT */}
        {mobileAppView === 'account' && (
          <section className="account-container" style={{ padding: '10px 14px 70px 14px' }}>
            <div className="account-header-card">
              <div className="account-avatar">
                {user ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{user ? user.username : 'Guest User'}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>+91 98765 43210 • Verified</div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>
                    ⚡ Flipkart Plus Member
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowAuthModal(true)}
                style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                Switch
              </button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              color: 'white',
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14
            }}>
              <div>
                <div style={{ fontSize: 11, opacity: 0.9 }}>Available Balance</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fde047' }}>⚡ {user ? user.superCoins || 150 : 150} SuperCoins</div>
              </div>
              <button
                onClick={() => showToast('SuperCoins applied for discount')}
                style={{ background: '#fde047', color: '#1e3a8a', border: 'none', padding: '6px 12px', borderRadius: 6, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
              >
                Use Coins
              </button>
            </div>

            <div className="account-quick-grid">
              <div className="account-nav-card" onClick={fetchUserOrders}>
                <span style={{ fontSize: 22 }}>📦</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>Orders</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{userOrders.length} placed</div>
                </div>
              </div>

              <div className="account-nav-card" onClick={() => setShowAddressModal(true)}>
                <span style={{ fontSize: 22 }}>🏠</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>Addresses</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>2 saved</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Past Orders</h3>
              {userOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#888', fontSize: 12 }}>
                  <p>No orders recorded.</p>
                </div>
              ) : (
                userOrders.slice(0, 3).map((ord) => (
                  <div key={ord.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 10, marginBottom: 10, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                      <span>Order #{ord.id.slice(0, 8)}...</span>
                      <span style={{ color: '#16a34a' }}>✓ {ord.status}</span>
                    </div>
                    <div style={{ color: '#64748b', margin: '2px 0' }}>
                      Ekart Tracking: <strong style={{ color: '#2563eb' }}>{ord.trackingNumber}</strong>
                    </div>
                    <div style={{ fontWeight: 800, marginTop: 4 }}>
                      Total: ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Portal links in Mobile Account Tab */}
            <div style={{ background: 'white', borderRadius: 12, padding: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>MNC Partner Portals</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a
                  href="http://10.195.18.98:4100"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: 10, borderRadius: 8, textDecoration: 'none', color: '#1e293b', fontSize: 12, fontWeight: 700 }}
                >
                  <span>🏪 Seller Portal (Port 4100)</span>
                  <span style={{ color: '#2563eb' }}>Open →</span>
                </a>
                <a
                  href="http://10.195.18.98:4200"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: 10, borderRadius: 8, textDecoration: 'none', color: '#1e293b', fontSize: 12, fontWeight: 700 }}
                >
                  <span>🛡️ SuperAdmin Console (Port 4200)</span>
                  <span style={{ color: '#2563eb' }}>Open →</span>
                </a>
              </div>
            </div>
          </section>
        )}

        {/* FIXED BOTTOM APP NAVIGATION BAR (SCOPED TO MOBILE ONLY) */}
        <nav className="flipkart-app-bottombar">
          <div
            className={`bottom-tab ${mobileAppView === 'home' ? 'active' : ''}`}
            onClick={() => {
              setMobileAppView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="bottom-tab-icon">🏠</span>
            <span>Home</span>
          </div>

          <div
            className={`bottom-tab ${mobileAppView === 'play' ? 'active' : ''}`}
            onClick={() => {
              setMobileAppView('play');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="bottom-tab-icon">▶️</span>
            <span>Play</span>
          </div>

          <div
            className={`bottom-tab ${mobileAppView === 'categories' ? 'active' : ''}`}
            onClick={() => {
              setMobileAppView('categories');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="bottom-tab-icon">🔲</span>
            <span>Categories</span>
          </div>

          <div
            className={`bottom-tab ${mobileAppView === 'account' ? 'active' : ''}`}
            onClick={() => {
              setMobileAppView('account');
              window.scrollTo({ top: 0, behavior: 'smooth' });
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
      </div>

      {/* =======================================================
          BUYER-TO-SELLER LIVE CHAT DRAWER (SHARED)
          ======================================================= */}
      {showChatModal && chatProduct && (
        <div className="modal-overlay" onClick={() => setShowChatModal(false)}>
          <div className="chat-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="chat-header">
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>💬 Brand Seller Support</div>
                <div style={{ fontSize: 11, opacity: 0.9 }}>Product: {chatProduct.title.slice(0, 24)}...</div>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: 22, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="chat-body-messages">
              <div style={{ textAlign: 'center', margin: '6px 0', fontSize: 11, color: '#94a3b8' }}>
                Chatting with Verified Brand Seller • End-to-end encrypted
              </div>

              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b', fontSize: 12 }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>💬</p>
                  <p style={{ fontWeight: 700 }}>Have questions for the seller?</p>
                  <p style={{ marginTop: 4 }}>Ask about warranty, stock availability, or delivery timeframe!</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`chat-bubble ${msg.sender_type === 'buyer' ? 'bubble-buyer' : 'bubble-seller'}`}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, marginBottom: 2 }}>
                      {msg.sender_name}
                    </div>
                    <div>{msg.message}</div>
                  </div>
                ))
              )}
            </div>

            <form className="chat-input-bar" onSubmit={handleSendChatMessage}>
              <input
                type="text"
                className="chat-input-field"
                placeholder="Type your message to seller..."
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
              />
              <button type="submit" className="chat-send-btn" disabled={isSendingChat}>
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          DELIVERY ADDRESS MODAL (SHARED)
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
          CART DRAWER / SHEET (SHARED)
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
          PRODUCT DETAILS SHEET WITH REVIEWS & CUSTOMER Q&A (SHARED)
          ======================================================= */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedProduct(null)}>✕</button>

            <div style={{ textAlign: 'center', marginBottom: 12 }}>
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
              <h2 style={{ fontSize: 16, lineHeight: 1.4, fontWeight: 700 }}>{selectedProduct.title}</h2>
              <div style={{ color: '#878787', margin: '4px 0', fontSize: 12 }}>
                Brand: <strong>{selectedProduct.brand}</strong> | Category: <strong>{selectedProduct.category}</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0' }}>
                <span className="rating-badge">★ {selectedProduct.rating || 4.5}</span>
                <span style={{ color: '#878787', fontSize: 12 }}>({selectedProduct.rating_count || 120} Ratings)</span>
                <span className="badge-assured" style={{ marginLeft: 6 }}>⚡ F-Assured</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '6px 0' }}>
                <span style={{ fontSize: 22, fontWeight: 900 }}>₹{Number(selectedProduct.price).toLocaleString('en-IN')}</span>
                <span style={{ color: '#388e3c', fontWeight: 800, fontSize: 13 }}>{selectedProduct.discount_percentage}% off</span>
              </div>

              <p style={{ color: '#555', fontSize: 12, margin: '8px 0', lineHeight: 1.4 }}>
                {selectedProduct.description}
              </p>

              {/* Ekart Pincode Checker */}
              <div style={{ background: '#f8f9fa', border: '1px dashed #2874f0', borderRadius: 6, padding: 10, margin: '10px 0' }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#2874f0' }}>🚚 Check Ekart Delivery Speed:</div>
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

              {/* Chat with Seller Button */}
              <button
                onClick={() => openSellerChat(selectedProduct)}
                style={{
                  width: '100%',
                  background: '#f0f7ff',
                  border: '1px solid #2874f0',
                  color: '#2874f0',
                  padding: 10,
                  borderRadius: 6,
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: 'pointer',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <span>💬</span>
                <span>Chat with Official Brand Seller (Live Support)</span>
              </button>

              {/* Primary Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-card-add"
                  style={{ padding: 12, fontSize: 13 }}
                  onClick={() => addToCart(selectedProduct)}
                >
                  Add to Cart
                </button>
                <button
                  className="btn-card-buy"
                  style={{ padding: 12, fontSize: 13 }}
                  onClick={() => {
                    setCheckoutProduct(selectedProduct);
                    setShowCheckoutModal(true);
                  }}
                >
                  Buy Now
                </button>
              </div>
            </div>

            {/* CUSTOMER PRODUCT Q&A */}
            <div className="qa-wrapper">
              <h4 style={{ fontSize: 14, marginBottom: 6, fontWeight: 800 }}>❓ Customer Questions & Answers</h4>
              <p style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>Have a question? Ask other buyers & the seller</p>

              <form onSubmit={handlePostQuestion} style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Ask a question about this item..."
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 12 }}
                  required
                />
                <button type="submit" style={{ background: '#2874f0', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 4, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  Ask
                </button>
              </form>

              {productQuestions.length === 0 ? (
                <div style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>No questions asked yet. Post the first question above!</div>
              ) : (
                productQuestions.map((q) => (
                  <div key={q.id} className="qa-card">
                    <div className="qa-q-row">
                      <span style={{ color: '#2563eb' }}>Q:</span>
                      <span style={{ flex: 1 }}>{q.question}</span>
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>by {q.user_name}</span>
                    </div>

                    {q.answers && q.answers.length > 0 ? (
                      q.answers.map((ans, aidx) => (
                        <div key={aidx} className="qa-a-row">
                          <strong style={{ color: '#16a34a' }}>A:</strong> {ans.answer}
                          {ans.is_seller && <span className="qa-seller-badge">Seller</span>}
                          <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 6 }}>— {ans.user_name}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, paddingLeft: 18 }}>
                        No answers yet.
                      </div>
                    )}

                    {replyingQId === q.id ? (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, paddingLeft: 18 }}>
                        <input
                          type="text"
                          placeholder="Write your answer..."
                          value={newAnswerText}
                          onChange={(e) => setNewAnswerText(e.target.value)}
                          style={{ flex: 1, padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, fontSize: 11 }}
                        />
                        <button
                          onClick={() => handlePostAnswer(q.id)}
                          style={{ background: '#16a34a', color: 'white', border: 'none', padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Submit
                        </button>
                        <button
                          onClick={() => setReplyingQId(null)}
                          style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '4px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ paddingLeft: 18, marginTop: 4 }}>
                        <span
                          onClick={() => setReplyingQId(q.id)}
                          style={{ fontSize: 11, color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}
                        >
                          + Answer this question
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* CUSTOMER REVIEWS */}
            <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 12 }}>
              <h4 style={{ fontSize: 14, marginBottom: 8, fontWeight: 800 }}>⭐ Customer Ratings & Reviews</h4>
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
                  <button type="submit" style={{ background: '#2874f0', color: 'white', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    Post
                  </button>
                </div>
              </form>

              {productReviews.length > 0 ? (
                productReviews.map((rev) => (
                  <div key={rev.id} style={{ background: '#f9f9f9', padding: 10, borderRadius: 6, marginBottom: 8, fontSize: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span>★ {rev.rating} - {rev.user_name || 'Verified Buyer'}</span>
                      <span style={{ color: '#388e3c' }}>✓ Certified Buyer</span>
                    </div>
                    <div style={{ color: '#444', margin: '4px 0 6px 0' }}>{rev.comment}</div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="helpful-btn"
                        onClick={() => markReviewHelpful(rev.id)}
                      >
                        👍 Helpful ({rev.helpful_count || 0})
                      </button>
                    </div>
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
          CHECKOUT MODAL (SHARED)
          ======================================================= */}
      {showCheckoutModal && (
        <div className="modal-overlay" onClick={() => setShowCheckoutModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowCheckoutModal(false)}>✕</button>

            <h3 style={{ fontSize: 16, marginBottom: 6 }}>Order Summary & Payment</h3>
            <p style={{ color: '#666', fontSize: 12, marginBottom: 10 }}>
              Delivering to: <strong>{currentAddress}</strong>
            </p>

            <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 6, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{checkoutProduct ? checkoutProduct.title : `Cart Items (${cartCount})`}</span>
                <strong>₹{(checkoutProduct ? Number(checkoutProduct.price) : cartTotal).toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ borderTop: '1px solid #ddd', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}>
                <span>Total Amount:</span>
                <span style={{ color: '#2874f0', fontSize: 18 }}>
                  ₹{(checkoutProduct ? Number(checkoutProduct.price) : cartTotal).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 800, fontSize: 12, display: 'block', marginBottom: 6 }}>Select Payment Method:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                  <input type="radio" name="pay" value="UPI" checked={paymentMode === 'UPI'} onChange={() => setPaymentMode('UPI')} />
                  <span>⚡ Instant UPI (PhonePe / Google Pay / Paytm)</span>
                </label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                  <input type="radio" name="pay" value="CARD" checked={paymentMode === 'CARD'} onChange={() => setPaymentMode('CARD')} />
                  <span>💳 Credit / Debit Card (Visa / Mastercard / Rupay)</span>
                </label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
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
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Confirm Order (₹{(checkoutProduct ? Number(checkoutProduct.price) : cartTotal).toLocaleString('en-IN')})
            </button>
          </div>
        </div>
      )}

      {/* =======================================================
          ORDER SUCCESS POPUP (SHARED)
          ======================================================= */}
      {orderSuccess && (
        <div className="modal-overlay" onClick={() => setOrderSuccess(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 44, marginBottom: 4 }}>🎉</p>
            <h2 style={{ color: '#388e3c', fontSize: 18 }}>Order Confirmed!</h2>
            <p style={{ fontSize: 13, color: '#555', margin: '6px 0' }}>
              Handed over to <strong>Ekart Logistics</strong>.
            </p>

            <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 6, margin: '12px 0', textAlign: 'left', fontSize: 12 }}>
              <div><strong>Order ID:</strong> {orderSuccess.orderId}</div>
              <div style={{ margin: '3px 0' }}><strong>Ekart Tracking:</strong> <span style={{ color: '#2874f0', fontWeight: 800 }}>{orderSuccess.trackingNumber}</span></div>
              <div><strong>Payment:</strong> {orderSuccess.paymentMode}</div>
              <div style={{ margin: '3px 0' }}><strong>Amount:</strong> ₹{Number(orderSuccess.amount).toLocaleString('en-IN')}</div>
            </div>

            <button
              onClick={() => setOrderSuccess(null)}
              style={{ background: '#2874f0', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 4, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* =======================================================
          USER AUTH MODAL (SHARED)
          ======================================================= */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <button className="modal-close-btn" onClick={() => setShowAuthModal(false)}>✕</button>

            <h3 style={{ marginBottom: 4, fontSize: 16 }}>{authMode === 'login' ? 'Login to Flipkart' : 'Create an Account'}</h3>
            <p style={{ color: '#777', fontSize: 12, marginBottom: 14 }}>
              Access your Orders, Wishlist, and SuperCoins
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

              <div style={{ marginBottom: 14 }}>
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
                style={{ width: '100%', background: '#fb641b', color: 'white', border: 'none', padding: 10, borderRadius: 4, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
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
