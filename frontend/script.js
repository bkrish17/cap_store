let products = [
  {id:'weekender',name:'The Weekender',category:'Everyday',price:899,color:'Moss green',tag:'Bestseller',image:'photo-1588850561407-ed78c282e89b',bg:'#d9dfcb'},
  {id:'field-day',name:'Field Day',category:'Sport',price:1099,color:'Washed olive',tag:'New',image:'photo-1521369909029-2afed882baee',bg:'#e9d8c4'},
  {id:'slow-morning',name:'Slow Morning',category:'Everyday',price:999,color:'Soft sand',tag:'Easy favorite',image:'photo-1588850561407-ed78c282e89b',bg:'#e7dfd2'},
  {id:'off-hours',name:'Off Hours',category:'Statement',price:1199,color:'Deep navy',tag:'Limited run',image:'photo-1523381210434-271e8be1f52b',bg:'#d9dfe1'},
  {id:'sideline',name:'Sideline',category:'Sport',price:949,color:'Classic blue',tag:'Everyday sport',image:'photo-1521369909029-2afed882baee',bg:'#dce3e2'},
  {id:'good-company',name:'Good Company',category:'Statement',price:1299,color:'Burnt orange',tag:'A little bold',image:'photo-1535713875002-d1d0cf377fde',bg:'#ead8c8'}
];
const money = amount => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(amount);
const photo = (id,w=700) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
const grid=document.querySelector('#product-grid');
let cart;
const isStaticHost = window.location.hostname.endsWith('github.io');
let publicDemo = isStaticHost;
try { cart=JSON.parse(localStorage.getItem('cap-store-cart')||'{}'); } catch { cart={}; }

function renderProducts(filter='All') {
  const shown=filter==='All'?products:products.filter(p=>p.category===filter);
  grid.innerHTML=shown.map(p=>`<article class="product-card"><div class="product-image" style="--product-bg:${p.background||p.bg}"><img loading="lazy" src="${photo(p.image)}" alt="${p.color} cap, ${p.name}" onerror="this.style.visibility='hidden'"><span class="product-tag">${p.tag}</span><button class="quick-add" data-add="${p.id}" aria-label="Add ${p.name} to bag">+</button></div><div class="product-meta"><span class="product-name">${p.name}</span><span class="product-price">${money(p.price)}</span></div><p class="product-sub">${p.color} · Adjustable fit</p></article>`).join('');
}
function renderCart() {
  const entries=Object.entries(cart).filter(([,qty])=>qty>0);
  const count=entries.reduce((sum,[,qty])=>sum+qty,0);
  const subtotal=entries.reduce((sum,[id,qty])=>sum+products.find(p=>p.id===id).price*qty,0);
  document.querySelector('#cart-count').textContent=count;
  document.querySelector('#drawer-count').textContent=`(${count})`;
  document.querySelector('#cart-subtotal').textContent=money(subtotal);
  document.querySelector('#cart-empty').classList.toggle('visible',count===0);
  document.querySelector('#cart-footer').classList.toggle('hidden',count===0);
  document.querySelector('#cart-items').innerHTML=entries.map(([id,qty])=>{const p=products.find(product=>product.id===id);return `<div class="cart-line"><img src="${photo(p.image,240)}" alt=""><div><h3>${p.name}</h3><p>${p.color}</p><div class="quantity"><button data-qty="${id}" data-change="-1" aria-label="Decrease quantity">−</button><span>${qty}</span><button data-qty="${id}" data-change="1" aria-label="Increase quantity">+</button></div><button class="remove-item" data-remove="${id}">Remove</button></div><span class="cart-line-price">${money(p.price*qty)}</span></div>`}).join('');
  localStorage.setItem('cap-store-cart',JSON.stringify(cart));
}
function addToCart(id){cart[id]=(cart[id]||0)+1;renderCart();document.body.classList.add('cart-open');document.querySelector('#cart-drawer').setAttribute('aria-hidden','false');}
function closeCart(){document.body.classList.remove('cart-open');document.querySelector('#cart-drawer').setAttribute('aria-hidden','true');}
renderProducts();renderCart();
if(isStaticHost){document.querySelector('#checkout-button').textContent='Checkout unavailable in preview'}else{
  fetch('/api/products').then(response=>{if(!response.ok)throw new Error('API unavailable');return response.json()}).then(apiProducts=>{if(Array.isArray(apiProducts)&&apiProducts.length){products=apiProducts;renderProducts(document.querySelector('.filter-chip.active').dataset.filter);renderCart()}}).catch(()=>console.info('Using the demo catalog. Start Flask to load products from SQLite.'));
  fetch('/api/config').then(response=>response.json()).then(config=>{publicDemo=Boolean(config.public_demo);if(publicDemo)document.querySelector('#checkout-button').textContent='Checkout unavailable in preview'}).catch(()=>{});
}
document.querySelectorAll('.filter-chip').forEach(button=>button.addEventListener('click',()=>{document.querySelector('.filter-chip.active').classList.remove('active');button.classList.add('active');renderProducts(button.dataset.filter)}));
grid.addEventListener('click',event=>{const button=event.target.closest('[data-add]');if(button)addToCart(button.dataset.add)});
document.querySelector('#cart-items').addEventListener('click',event=>{const qtyButton=event.target.closest('[data-qty]');const removeButton=event.target.closest('[data-remove]');if(qtyButton){const id=qtyButton.dataset.qty;cart[id]=(cart[id]||0)+Number(qtyButton.dataset.change);if(cart[id]<=0)delete cart[id];renderCart()}else if(removeButton){delete cart[removeButton.dataset.remove];renderCart()}});
document.querySelector('#cart-open').addEventListener('click',()=>{document.body.classList.add('cart-open');document.querySelector('#cart-drawer').setAttribute('aria-hidden','false')});
document.querySelector('#cart-close').addEventListener('click',closeCart);
document.querySelector('#drawer-backdrop').addEventListener('click',closeCart);
document.querySelector('#continue-shopping').addEventListener('click',closeCart);
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeCart()});
document.querySelector('#checkout-button').addEventListener('click',()=>{if(publicDemo){alert('This public preview is not accepting orders. Your contact and address details will not be requested or sent.');return}document.querySelector('#cart-footer').classList.add('hidden');document.querySelector('#cart-items').hidden=true;document.querySelector('#cart-empty').classList.remove('visible');document.querySelector('#checkout-form').hidden=false;document.querySelector('#drawer-title').innerHTML='Checkout';document.querySelector('#checkout-form [name="name"]').focus()});
document.querySelector('#checkout-back').addEventListener('click',()=>{document.querySelector('#checkout-form').hidden=true;document.querySelector('#cart-items').hidden=false;document.querySelector('#cart-footer').classList.remove('hidden');document.querySelector('#drawer-title').innerHTML=`Your bag <span id="drawer-count">(${Object.values(cart).reduce((a,b)=>a+b,0)})</span>`});
document.querySelector('#checkout-form').addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget;const error=document.querySelector('#checkout-error');const customerName=form.elements.name.value.trim().split(/\s+/)[0];error.textContent='';const submit=form.querySelector('[type="submit"]');submit.disabled=true;submit.textContent='Saving order…';try{const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...Object.fromEntries(new FormData(form).entries()),items:Object.entries(cart).map(([product_id,quantity])=>({product_id,quantity}))})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not save your order.');cart={};renderCart();form.reset();form.hidden=true;document.querySelector('#cart-items').hidden=false;document.querySelector('#cart-footer').classList.add('hidden');document.querySelector('#drawer-title').textContent='Order received';document.querySelector('#cart-empty').classList.add('visible');document.querySelector('#cart-empty').innerHTML=`<span>✳</span><h3>Thanks, ${customerName||'friend'}!</h3><p>Order #${result.order_id} is saved. Total: ${money(result.total)}</p><button class="button button-dark" id="continue-shopping">Keep looking <span>↘</span></button>`;document.querySelector('#continue-shopping').addEventListener('click',closeCart)}catch(err){error.textContent=err.message}finally{submit.disabled=false;submit.innerHTML='Place order <span>↗</span>'}});
document.querySelector('#newsletter-form').addEventListener('submit',event=>{event.preventDefault();document.querySelector('#newsletter-message').textContent='You’re on the list. Watch your inbox for a little sunshine.';event.currentTarget.reset()});
