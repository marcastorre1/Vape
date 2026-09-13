const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// ============================================
// ⚠️ НАСТРОЙКИ
// ============================================
const MANAGER_USERNAME = 'pizdezix';
const EUR_RATE = 19.9;

// ============================================
// ТОВАРЫ
// price: 0 → "Под заказ"
// ============================================
const products = [
    { id: 1, name: 'Sauvage Elixir', price: 2490, category: 'Мужские',
      img: ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=600'] },
    { id: 2, name: 'La Vie Est Belle', price: 2190, category: 'Женские',
      img: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600'] },
    { id: 3, name: 'Bleu de Chanel', price: 2890, category: 'Мужские',
      img: ['https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=600'] },
    { id: 4, name: 'Black Opium', price: 2350, category: 'Женские',
      img: ['https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=600'] },
    { id: 5, name: 'Baccarat Rouge 540', price: 5990, category: 'Нишевые',
      img: ['https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=600'] },
    { id: 6, name: 'Oud Wood', price: 4290, category: 'Унисекс',
      img: ['https://images.unsplash.com/photo-1619994403073-2cec844b8e63?w=600'] },
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
           <div class="price-eur">~ ${toEur(p.price)} €</div>`
        : `<div class="price">Под заказ</div>
           <div class="price-eur">Цена по запросу</div>`;
    return `
        <div class="card-img-wrap">
            <img src="${firstImg}" alt="${p.name}" loading="lazy"
                 onerror="this.src='https://via.placeholder.com/400x533/1a1815/c9a961?text=ESSENCE'">
            <button class="card-add" data-id="${p.id}">+</button>
        </div>
        <div class="card-info">
            <h3>${p.name}</h3>
            ${priceHtml}
        </div>
    `;
}

// ============================================
// НОВИНКИ (карусель)
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
    if (total > 0 && hasOnOrder) barText = `${total} + заказ`;
    else if (total > 0) barText = `${total}`;
    else barText = 'Под заказ';
    document.getElementById('barTotal').innerText = barText;

    if (total > 0 && hasOnOrder) {
        document.getElementById('modalTotal').innerHTML =
            `${total} MDL<br><span style="font-size:11px;opacity:0.6;font-weight:400;">+ товары под заказ</span>`;
    } else if (total > 0) {
        document.getElementById('modalTotal').innerHTML =
            `${total} MDL<br><span style="font-size:13px;opacity:0.5;font-weight:400;">~ ${eurTotal} €</span>`;
    } else {
        document.getElementById('modalTotal').innerHTML = 'Под заказ';
    }

    renderCartItems();

    const badge = document.getElementById('cartBadge');
    badge.classList.remove('pop');
    void badge.offsetWidth;
    badge.classList.add('pop');
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    container.innerHTML = '';
    if (Object.keys(cart).length === 0) {
        container.innerHTML = '<p style="opacity:0.4;padding:30px 0;text-align:center;font-family:Cormorant Garamond, serif;font-style:italic;font-size:15px;">Корзина пуста</p>';
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
// ОФОРМЛЕНИЕ ЗАКАЗА
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

    const message = `Здравствуйте! Хочу оформить заказ в Essence:\n\n${orderText}\n\nИтого: ${totalText}`;

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
// ПАРАЛЛАКС БАННЕРА
// ============================================
const heroImg = document.querySelector('.hero img');
if (heroImg) {
    let rafId;
    window.addEventListener('scroll', () => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            const scrolled = window.scrollY;
            if (scrolled < 600) {
                heroImg.style.transform = `translateY(${scrolled * 0.25}px) scale(1.1)`;
            }
            rafId = null;
        });
    }, { passive: true });
}

// ============================================
// ПЛАВНОЕ ПОЯВЛЕНИЕ СЕКЦИЙ ПРИ ПРОКРУТКЕ
// ============================================
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            sectionObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.08 });

document.querySelectorAll('.section').forEach(sec => {
    sec.style.opacity = '0';
    sec.style.transform = 'translateY(40px)';
    sec.style.transition = 'opacity 1s cubic-bezier(0.2, 0.8, 0.2, 1), transform 1s cubic-bezier(0.2, 0.8, 0.2, 1)';
    sectionObserver.observe(sec);
});
