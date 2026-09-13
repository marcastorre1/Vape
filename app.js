const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// ============================================
// ⚠️ НАСТРОЙКИ
// ============================================
const MANAGER_USERNAME = 'pizdezix'; // без @
const EUR_RATE = 19.9;                // 1 EUR = 19.9 MDL

// ============================================
// ТОВАРЫ
// price: 0 → "Под заказ"
// ============================================
const products = [
    { id: 1, name: 'Жидкость Blueberry Ice 30мл', price: 250, category: 'Жидкости',
      img: ['https://images.unsplash.com/photo-1567696911980-2eed69a46042?w=500'] },
    { id: 2, name: 'Одноразка Elf Bar 5000', price: 350, category: 'Одноразки',
      img: ['https://images.unsplash.com/photo-1610461888750-10bfc601b874?w=500'] },
    { id: 3, name: 'Под Voopoo Drag', price: 890, category: 'Поды',
      img: ['https://images.unsplash.com/photo-1567721913486-6585f069b332?w=500'] },
    { id: 4, name: 'Картридж для Pod', price: 180, category: 'Картриджи',
      img: ['https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500'] },
    { id: 5, name: 'Испаритель 0.6 Ohm', price: 120, category: 'Аксессуары',
      img: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500'] },
    { id: 6, name: 'Жидкость Mango 60мл', price: 420, category: 'Жидкости',
      img: ['https://images.unsplash.com/photo-1567696153798-9111f9cd3d0d?w=500'] },
];

let cart = {};
let currentCategory = 'Все';
const INITIAL_LIMIT = 4;
let showAll = false;

// ============================================
// ПОМОЩНИКИ
// ============================================
function getImages(p) {
    return Array.isArray(p.img) ? p.img : [p.img];
}
function toEur(mdl) {
    return (mdl / EUR_RATE).toFixed(0);
}

// ============================================
// ШАБЛОН КАРТОЧКИ
// ============================================
function cardTemplate(p) {
    const firstImg = getImages(p)[0];
    const priceHtml = p.price > 0
        ? `<div class="price">${p.price} MDL</div>
           <div class="price-eur">~${toEur(p.price)} €</div>`
        : `<div class="price">Под заказ</div>
           <div class="price-eur">Цена по запросу</div>`;
    return `
        <div class="card-img-wrap">
            <img src="${firstImg}" alt="${p.name}" loading="lazy"
                 onerror="this.src='https://via.placeholder.com/400x400/161616/888?text=no+image'">
            <button class="card-add" data-id="${p.id}">+</button>
        </div>
        <div class="card-info">
            <h3>${p.name}</h3>
            ${priceHtml}
        </div>
    `;
}

// ============================================
// НОВИНКИ
// ============================================
const newEl = document.getElementById('newProducts');
products.slice(0, 6).forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = cardTemplate(p);
    newEl.appendChild(card);
});

// ============================================
// КАТЕГОРИИ
// ============================================
const categories = ['Все', ...new Set(products.map(p => p.category))];
const categoriesEl = document.getElementById('categories');

categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn' + (cat === currentCategory ? ' active' : '');
    btn.innerText = cat;
    btn.dataset.cat = cat;
    categoriesEl.appendChild(btn);
});

categoriesEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('cat-btn')) {
        currentCategory = e.target.dataset.cat;
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        showAll = false;
        renderProducts();
    }
});

// ============================================
// ВСЕ ТОВАРЫ
// ============================================
const productsEl = document.getElementById('products');
const viewAllWrap = document.getElementById('viewAllWrap');

function renderProducts() {
    productsEl.innerHTML = '';
    const filtered = currentCategory === 'Все'
        ? products
        : products.filter(p => p.category === currentCategory);

    const visible = showAll ? filtered : filtered.slice(0, INITIAL_LIMIT);
    visible.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = cardTemplate(p);
        productsEl.appendChild(card);
    });

    viewAllWrap.style.display = (!showAll && filtered.length > INITIAL_LIMIT) ? 'block' : 'none';
}

document.getElementById('viewAllBtn').addEventListener('click', () => {
    showAll = true;
    renderProducts();
});

renderProducts();

// ============================================
// ДОБАВЛЕНИЕ В КОРЗИНУ
// ============================================
document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.card-add');
    if (btn) {
        e.stopPropagation();
        const id = Number(btn.dataset.id);
        cart[id] = (cart[id] || 0) + 1;
        updateCart();
        tg.HapticFeedback?.impactOccurred('light');
    }
});

// ============================================
// КОРЗИНА
// ============================================
function updateCart() {
    let count = 0, total = 0;
    let hasOnOrder = false;

    for (const id in cart) {
        const p = products.find(prod => prod.id === Number(id));
        count += cart[id];
        if (p.price > 0) total += p.price * cart[id];
        else hasOnOrder = true;
    }
    const eurTotal = toEur(total);

    document.getElementById('cartBadge').innerText = count;
    document.getElementById('barCount').innerText = count;

    let barText;
    if (total > 0 && hasOnOrder) barText = `${total} MDL + под заказ`;
    else if (total > 0) barText = `${total} MDL (~${eurTotal} €)`;
    else barText = 'Под заказ';
    document.getElementById('barTotal').innerText = barText;

    if (total > 0 && hasOnOrder) {
        document.getElementById('modalTotal').innerHTML = `${total} MDL<br><span style="font-size:12px;opacity:0.6;font-weight:500;">+ товары под заказ</span>`;
    } else if (total > 0) {
        document.getElementById('modalTotal').innerHTML = `${total} MDL<br><span style="font-size:13px;opacity:0.6;font-weight:500;">~${eurTotal} €</span>`;
    } else {
        document.getElementById('modalTotal').innerHTML = 'Под заказ';
    }

    renderCartItems();
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    container.innerHTML = '';
    if (Object.keys(cart).length === 0) {
        container.innerHTML = '<p style="opacity:0.5;padding:24px 0;text-align:center;">Корзина пуста</p>';
        return;
    }
    for (const id in cart) {
        const p = products.find(prod => prod.id === Number(id));
        const firstImg = getImages(p)[0];
        const priceText = p.price > 0
            ? `${p.price} MDL · ~${toEur(p.price)} €`
            : 'Под заказ';
        const item = document.createElement('div');
        item.className = 'cart-item';
        item.innerHTML = `
            <img src="${firstImg}" alt="${p.name}">
            <div class="cart-item-info">
                <h4>${p.name}</h4>
                <span>${priceText}</span>
            </div>
            <div class="qty-controls">
                <button data-action="minus" data-id="${p.id}">−</button>
                <span>${cart[id]}</span>
                <button data-action="plus" data-id="${p.id}">+</button>
            </div>
        `;
        container.appendChild(item);
    }
}

document.getElementById('cartItems').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === 'plus') cart[id]++;
    else if (btn.dataset.action === 'minus') {
        cart[id]--;
        if (cart[id] <= 0) delete cart[id];
    }
    updateCart();
});

// ============================================
// МОДАЛКИ
// ============================================
const cartModal = document.getElementById('cartModal');
const managerModal = document.getElementById('managerModal');

document.getElementById('openCartBtn').addEventListener('click', () => {
    renderCartItems();
    cartModal.classList.add('open');
});
document.getElementById('cartIconBtn').addEventListener('click', () => {
    renderCartItems();
    cartModal.classList.add('open');
});
document.getElementById('closeCartBtn').addEventListener('click', () => cartModal.classList.remove('open'));
cartModal.addEventListener('click', (e) => { if (e.target === cartModal) cartModal.classList.remove('open'); });

document.getElementById('closeManagerBtn').addEventListener('click', () => managerModal.classList.remove('open'));
managerModal.addEventListener('click', (e) => { if (e.target === managerModal) managerModal.classList.remove('open'); });

// ============================================
// ОФОРМЛЕНИЕ
// ============================================
document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (Object.keys(cart).length === 0) {
        tg.showAlert('Корзина пуста!');
        return;
    }

    const order = [];
    let total = 0, hasOnOrder = false;

    for (const id in cart) {
        const p = products.find(prod => prod.id === Number(id));
        order.push({ name: p.name, price: p.price, qty: cart[id], sum: p.price * cart[id] });
        if (p.price > 0) total += p.price * cart[id];
        else hasOnOrder = true;
    }

    const eurTotal = toEur(total);
    const orderText = order.map(i =>
        i.price > 0
            ? `• ${i.name} × ${i.qty} — ${i.sum} MDL (~${toEur(i.sum)} €)`
            : `• ${i.name} × ${i.qty} — Под заказ`
    ).join('\n');

    let totalText;
    if (total > 0 && hasOnOrder) totalText = `${total} MDL (~${eurTotal} €) + товары под заказ`;
    else if (total > 0) totalText = `${total} MDL (~${eurTotal} €)`;
    else totalText = 'Всё под заказ';

    const message = `Здравствуйте! Хочу оформить заказ:\n\n${orderText}\n\nИтого: ${totalText}`;

    cartModal.classList.remove('open');
    managerModal.classList.add('open');

    document.getElementById('writeManagerBtn').onclick = () => {
        const url = `https://t.me/${MANAGER_USERNAME}?text=${encodeURIComponent(message)}`;
        tg.openTelegramLink(url);
        managerModal.classList.remove('open');
        tg.close();
    };
});

// ============================================
// 18+ ПОДТВЕРЖДЕНИЕ
// ============================================
function confirmAge() {
    localStorage.setItem('ageConfirmed', 'yes');
    document.getElementById('ageGate').classList.add('hidden');
}
function denyAge() {
    tg.close();
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#fff;font-family:sans-serif;text-align:center;padding:20px;"><div><h2>Доступ запрещён</h2><p style="margin-top:12px;opacity:0.6;">Сайт доступен только лицам старше 18 лет.</p></div></div>';
}
// Проверка при загрузке
if (localStorage.getItem('ageConfirmed') === 'yes') {
    document.getElementById('ageGate').classList.add('hidden');
}
