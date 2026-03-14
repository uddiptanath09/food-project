// CART STATE
let cart = [];
let toastTimeout;

// Ensure cart UI is loaded before updating it (cart is fetched via fetch())
let cartLoaded = false;
let cartLoadResolve;
const cartLoadedPromise = new Promise((resolve) => {
  cartLoadResolve = resolve;
});

async function ensureCartLoaded() {
  if (cartLoaded) return;
  await cartLoadedPromise;
}

// ADD TO CART - Simple function only for cart
async function addToCart(productId, productName, productPrice, imageUrl) {
  await ensureCartLoaded();

  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: productId,
      name: productName,
      priceINR: productPrice,
      imageUrl: imageUrl,
      quantity: 1,
    });
  }

  renderCart();
  updateCartBadge();
  showToast(`${productName} added to cart`);
}

// UPDATE CART BADGE
function updateCartBadge() {
  const cartToggle = document.getElementById("cartToggle");
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (totalItems > 0) {
    cartToggle.innerHTML = `🛒 Cart <span class="cart-badge">${totalItems}</span>`;
  } else {
    cartToggle.innerHTML = "🛒 Cart";
  }
}

// RENDER CART
function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const cartTotalPrice = document.getElementById("cartTotalPrice");

  if (!cartItems || !cartTotalPrice) {
    // Cart section not yet loaded (e.g., before cart.html fetch completes)
    return;
  }

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    cartTotalPrice.textContent = "₹0";
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <div class="cart-item-image">
        <img src="${item.imageUrl}" alt="${item.name}">
      </div>
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p class="cart-item-price">₹${item.priceINR}</p>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn minus-btn" onclick="decrementCart('${item.id}')">−</button>
        <span class="cart-qty">${item.quantity}</span>
        <button class="qty-btn plus-btn" onclick="incrementCart('${item.id}')">+</button>
      </div>
      <button class="remove-btn" onclick="removeFromCart('${item.id}')">🗑️</button>
    </div>
  `,
    )
    .join("");

  let totalINR = 0;
  cart.forEach((item) => {
    totalINR += item.priceINR * item.quantity;
  });
  cartTotalPrice.textContent = "₹" + totalINR;
}

// INCREMENT CART ITEM
function incrementCart(productId) {
  const item = cart.find((item) => item.id === productId);
  if (item) {
    item.quantity += 1;
    renderCart();
    updateCartBadge();
  }
}

// DECREMENT CART ITEM
function decrementCart(productId) {
  const item = cart.find((item) => item.id === productId);
  if (item) {
    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      removeFromCart(productId);
      return;
    }
    renderCart();
    updateCartBadge();
  }
}

// REMOVE FROM CART
function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  renderCart();
  updateCartBadge();
}

// OPEN CART
async function openCart() {
  await ensureCartLoaded();

  const cartSidebar = document.getElementById("cartSidebar");
  const cartOverlay = document.getElementById("cartOverlay");
  if (!cartSidebar || !cartOverlay) return;
  cartSidebar.classList.add("active");
  cartOverlay.classList.add("active");
}

// CLOSE CART
function closeCart() {
  const cartSidebar = document.getElementById("cartSidebar");
  const cartOverlay = document.getElementById("cartOverlay");
  if (!cartSidebar || !cartOverlay) return;
  cartSidebar.classList.remove("active");
  cartOverlay.classList.remove("active");
}

// LOAD CART SECTION
async function loadCartSection() {
  const cartRoot = document.getElementById("cartRoot");
  if (!cartRoot) return;

  try {
    const response = await fetch("cart.html");
    if (!response.ok) throw new Error("Failed to load cart section");
    cartRoot.innerHTML = await response.text();

    // Attach cart event listeners after cart HTML is loaded
    const closeCartBtn = document.getElementById("closeCart");
    const cartOverlay = document.getElementById("cartOverlay");
    if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);
    if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

    // Mark cart as loaded so addToCart can safely render and show notifications
    cartLoaded = true;
    cartLoadResolve?.();

    // Render cart after cart markup is available
    renderCart();
  } catch (error) {
    console.warn(error);
    // Ensure any awaiting addToCart calls can proceed
    cartLoaded = true;
    cartLoadResolve?.();
  }
}

// TOAST NOTIFICATION
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

// CATEGORY FILTER - Using CSS to show/hide cards
function filterCategory(category, event) {
  const cards = document.querySelectorAll(".product-card");
  cards.forEach((card) => {
    const cardCategories = card.getAttribute("data-category").split(" ");
    if (cardCategories.includes(category) || category === "all") {
      card.style.display = "flex";
    } else {
      card.style.display = "none";
    }
  });

  // Update active button
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  const targetBtn = event?.currentTarget || event?.target;
  if (targetBtn) {
    targetBtn.classList.add("active");
  }
}

// EVENT LISTENERS
document.addEventListener("DOMContentLoaded", function () {
  // Category buttons
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.addEventListener("click", function (event) {
      filterCategory(this.getAttribute("data-category"), event);
    });
  });

  // Cart buttons
  document.getElementById("cartToggle").addEventListener("click", openCart);

  // Load cart section (sidebar + overlay + toast)
  loadCartSection();

  // Initialize cart badge
  updateCartBadge();
});
