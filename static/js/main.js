document.addEventListener('DOMContentLoaded', () => {
    const carGrid = document.getElementById('car-grid');
    const btnPrev = document.getElementById('car-prev');
    const btnNext = document.getElementById('car-next');

    if (btnPrev && btnNext && carGrid) {
        btnNext.addEventListener('click', () => {
            const scrollAmount = window.innerWidth > 1024 ? window.innerWidth / 3 : window.innerWidth * 0.85;
            carGrid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
        
        btnPrev.addEventListener('click', () => {
            const scrollAmount = window.innerWidth > 1024 ? window.innerWidth / 3 : window.innerWidth * 0.85;
            carGrid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
    }

    // Extract fetch logic to a global function so it can be called from search triggers
    window.fetchVehicles = function(queryString = '') {
        const carGrid = document.getElementById('car-grid');
        if (!carGrid) return;
        
        fetch(`/api/vehicles${queryString}`)
            .then(res => res.json())
            .then(vehicles => {
                if (vehicles.error) {
                    console.error("No Supabase configuration yet or an error occurred.");
                    // Render hardcoded as fallback for visual presentation
                    return;
                }
                
                if (vehicles.length === 0) {
                    carGrid.innerHTML = '<div class="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12"><p class="text-xl text-gray-500 font-medium">No se encontraron vehículos.</p></div>';
                    // We need to keep the grid style for the empty message
                    return; 
                }

                // Limpiar mockups y generar UI
                carGrid.innerHTML = '';
                vehicles.forEach(vehicle => {
                    const defaultImg = 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?q=80&w=800&auto=format&fit=crop';
                    const thumbImg = (vehicle.images && vehicle.images.length > 0) ? vehicle.images[0] : defaultImg;
                    const carouselImages = (vehicle.images && vehicle.images.length > 0) ? vehicle.images : [defaultImg];
                    
                    let statusClasses = 'bg-gc-orange text-white'; 
                    let statusText = 'DISPONIBLE';
                    if (vehicle.status === 'transit') {
                        statusClasses = 'bg-gc-blue text-white';
                        statusText = 'EN TRÁNSITO';
                    } else if (vehicle.status === 'sold') {
                        statusClasses = 'bg-gray-600 text-white';
                        statusText = 'VENDIDO';
                    }

                    const isCatalog = window.location.pathname === '/catalogo';
                    const baseClass = "bg-white rounded-[2rem] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_20px_50px_rgba(0,51,160,0.12)] hover:-translate-y-3 transition-all duration-500 group cursor-pointer relative flex flex-col";
                    const carouselClass = "min-w-[85vw] md:min-w-[45vw] lg:min-w-[calc(33.333%-1.4rem)] flex-shrink-0 snap-center";
                    const opacityClass = vehicle.status === 'sold' ? 'opacity-75' : '';
                    
                    const card = document.createElement('div');
                    card.className = isCatalog 
                        ? `${baseClass} w-full h-full ${opacityClass}` 
                        : `${baseClass} ${carouselClass} ${opacityClass}`;
                    
                    // Assign onclick to trigger the new image carousel
                    card.onclick = () => openVehicleCarousel(carouselImages);
                    
                    card.innerHTML = `
                        <div class="relative h-60 bg-gradient-to-b from-gray-50 to-gray-200 overflow-hidden w-full">
                            <img src="${thumbImg}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out ${vehicle.status === 'sold' ? 'grayscale' : ''}" alt="Car">
                            <div class="absolute top-5 right-5 ${statusClasses} text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg z-10 shadow-black/20">${statusText}</div>
                            <div class="absolute bottom-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#f0f0f0] to-transparent opacity-90 z-10"></div>
                        </div>
                        <div class="p-6 md:p-8 flex-grow flex flex-col justify-between relative bg-white">
                            <!-- Glow effects -->
                            <div class="absolute inset-x-0 h-10 top-0 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"></div>
                            
                            <div class="relative z-20">
                                <p class="text-sm font-bold text-gc-blue uppercase tracking-widest mb-1 opacity-80">${vehicle.make}</p>
                                <h3 class="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-5 group-hover:text-gc-blue transition-colors duration-300 line-clamp-2">${vehicle.model}</h3>
                                <div class="flex items-center space-x-3 text-sm text-gray-600 mb-6 font-semibold">
                                    <span class="bg-gray-100/80 px-4 py-1.5 rounded-lg border border-gray-200/50">${vehicle.year || '2026'}</span>
                                    <span class="bg-gray-100/80 px-4 py-1.5 rounded-lg border border-gray-200/50 text-ellipsis truncate max-w-[140px]">${vehicle.description || 'Consulta Detalles'}</span>
                                </div>
                            </div>
                            <div class="flex justify-between items-end border-t border-gray-100 pt-6 mt-auto relative z-20">
                                <div>
                                    <p class="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1.5">A partir de</p>
                                    <span class="text-3xl font-black text-gray-900 ${vehicle.status === 'sold' ? 'line-through text-gray-400' : ''}">$${vehicle.price.toLocaleString()}</span>
                                </div>
                                
                                <div class="flex flex-col items-center justify-center z-30" onclick="event.stopPropagation()">
                                    <button onclick="window.likeVehicle(event, '${vehicle.id}')" class="text-gray-300 hover:text-red-500 transition-colors outline-none cursor-pointer focus:outline-none flex items-center justify-center pt-1 group/btn" id="like-btn-${vehicle.id}">
                                        <svg class="w-7 h-7 drop-shadow-sm transition-transform group-hover/btn:scale-110 active:scale-95" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                                    </button>
                                    <span class="text-xs font-bold text-gray-500 mt-1" id="like-count-${vehicle.id}">${vehicle.likes || 0}</span>
                                </div>

                                <button class="w-14 h-14 bg-gray-50 text-gray-900 rounded-full flex items-center justify-center group-hover:bg-gc-blue group-hover:text-white transition-colors duration-500 border border-gray-200 group-hover:border-gc-blue outline-none shadow-sm group-hover:shadow-[0_10px_20px_rgba(0,51,160,0.3)]">
                                    <svg class="w-6 h-6 transform -rotate-45 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </button>
                            </div>
                        </div>
                    `;
                    carGrid.appendChild(card);
                });
            })
            .catch(err => console.error("Could not load vehicles:", err));
    };

    // Initial load
    if (carGrid) {
        // Only load a subset if we are on the homepage, and sort by likes
        if (window.location.pathname === '/' || window.location.pathname === '' || window.location.pathname === '/index.html') {
            window.fetchVehicles('?limit=8&featured=true');
        } else {
            // Check if we have URL parameters (like on the catalog page after a redirect)
            const urlParams = window.location.search;
            window.fetchVehicles(urlParams);
        }
    }

    // Expose likeVehicle function globally
    window.likeVehicle = function(event, vehicleId) {
        event.stopPropagation(); // Evitar abrir el modal del carrusel!
        
        fetch(`/api/vehicles/${vehicleId}/like`, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                const countElem = document.getElementById(`like-count-${vehicleId}`);
                const btnElem = document.getElementById(`like-btn-${vehicleId}`);
                
                if (data.likes !== undefined && countElem) {
                    countElem.textContent = data.likes;
                }
                
                if (btnElem) {
                    // Fill the heart to show it was liked
                    btnElem.innerHTML = `<svg class="w-7 h-7 drop-shadow-sm text-red-500 transition-transform scale-110" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
                }
            })
            .catch(err => console.error("Could not like vehicle:", err));
    };
    
    // Setup Search Bar Button
    const searchInput = document.getElementById('hero-search-input');
    const searchSelect = document.getElementById('hero-search-select');
    const searchButton = document.getElementById('hero-search-button');

    if (searchButton && searchInput && searchSelect) {
        searchButton.addEventListener('click', () => {
             const make = searchSelect.value;
             const searchTerm = searchInput.value;
             
             let queryParams = [];
             if (make) queryParams.push(`make=${encodeURIComponent(make)}`);
             if (searchTerm) queryParams.push(`search=${encodeURIComponent(searchTerm)}`);
             
             const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
             
             // If we are not on the catalog page, redirect to catalog page
             if (window.location.pathname !== '/catalogo') {
                 window.location.href = '/catalogo' + queryString;
                 return;
             }
             
             window.fetchVehicles(queryString);
        });

        // Add Enter key support for search input
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent accidental form submissions if any
                searchButton.click();
            }
        });
    }
    
    // Expose brand pill search globally
    window.searchByBrand = function(brand) {
        let queryParams = [];
        if (brand) queryParams.push(`make=${encodeURIComponent(brand)}`);
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

        if (window.location.pathname !== '/catalogo') {
            window.location.href = '/catalogo' + queryString;
            return;
        }
        
        // Sync the select dropdown if it exists (on catalog page)
        const selectElem = document.getElementById('hero-search-select');
        if (selectElem) {
            for (let i = 0; i < selectElem.options.length; i++) {
                if (selectElem.options[i].value.toLowerCase() === brand.toLowerCase()) {
                    selectElem.selectedIndex = i;
                    break;
                }
            }
        }
        
        if (window.fetchVehicles) {
            window.fetchVehicles(queryString);
        }
    };

    // Load dynamic settings (price lists)
    fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
            const renderCard = (num, url) => {
                if (!url) return;
                const imgElem = document.getElementById(`price-list-img-${num}`);
                const container = document.getElementById(`price-list-container-${num}`);
                if (!imgElem || !container) return;

                const isPdf = url.toLowerCase().includes('.pdf');
                
                if (isPdf) {
                    imgElem.outerHTML = `<iframe id="price-list-img-${num}" src="${url}#toolbar=0&navpanes=0&scrollbar=0" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none border-0 overflow-hidden" scrolling="no"></iframe>`;
                    container.setAttribute('onclick', `window.open('${url}', '_blank')`);
                } else {
                    if (imgElem.tagName === 'IFRAME') {
                        imgElem.outerHTML = `<img id="price-list-img-${num}" src="${url}" alt="Lista de Precios" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700">`;
                    } else {
                        imgElem.src = url;
                    }
                    container.setAttribute('onclick', `openImageModal('${url}')`);
                }
            };

            renderCard(1, data.price_list_1);
            renderCard(2, data.price_list_2);
        })
        .catch(err => console.error("Could not load settings:", err));

    // --- Hero Background Carousel Logic ---
    const heroSlides = document.querySelectorAll('.hero-slide');
    const heroDots = document.querySelectorAll('.hero-dot');
    let currentHeroSlide = 0;
    let heroCarouselInterval;

    if (heroSlides.length > 0 && heroDots.length > 0) {
        function showHeroSlide(index) {
            // Remove active classes
            heroSlides.forEach((slide, i) => {
                // Determine direction for slide effect
                if (i === index) {
                    slide.classList.remove('translate-x-full', '-translate-x-full', 'opacity-0');
                    slide.classList.add('translate-x-0', 'opacity-100');
                    slide.style.zIndex = '10';
                } else if (i < index) {
                    slide.classList.remove('translate-x-0', 'translate-x-full', 'opacity-100');
                    slide.classList.add('-translate-x-full', 'opacity-0');
                    slide.style.zIndex = '0';
                } else {
                    slide.classList.remove('translate-x-0', '-translate-x-full', 'opacity-100');
                    slide.classList.add('translate-x-full', 'opacity-0');
                    slide.style.zIndex = '0';
                }
            });

            // Update dots
            heroDots.forEach((dot, i) => {
                if (i === index) {
                    dot.classList.remove('w-6', 'bg-white/40', 'opacity-50');
                    dot.classList.add('w-12', 'bg-white', 'opacity-100');
                } else {
                    dot.classList.remove('w-12', 'bg-white', 'opacity-100');
                    dot.classList.add('w-6', 'bg-white/40', 'opacity-50');
                }
            });

            currentHeroSlide = index;
        }

        function nextHeroSlide() {
            let nextIndex = (currentHeroSlide + 1) % heroSlides.length;
            showHeroSlide(nextIndex);
        }

        // Start Auto Carousel
        function startHeroCarousel() {
            heroCarouselInterval = setInterval(nextHeroSlide, 6000); // Cambia cada 6 segundos
        }

        function resetHeroCarousel() {
            clearInterval(heroCarouselInterval);
            startHeroCarousel();
        }

        // Add Click events to dots
        heroDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showHeroSlide(index);
                resetHeroCarousel();
            });
        });

        // Initialize first slide and start
        showHeroSlide(0);
        startHeroCarousel();
    }
});

// --- UI Interaction Logic (Migrated from HTML) ---
document.addEventListener('DOMContentLoaded', () => {
    // Scroll effect
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('main-nav');
        if (nav) {
            if (window.scrollY > 20) {
                nav.classList.replace('py-4', 'py-1');
            } else {
                nav.classList.replace('py-1', 'py-4');
            }
        }
    });

    // Mobile Menu
    const mobileBtn = document.getElementById('mobile-menu-button');
    const closeMenuBtn = document.getElementById('close-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    function toggleMobileMenu() {
        if (!mobileMenu) return;
        if (mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.remove('hidden');
            mobileMenu.classList.add('flex');
            setTimeout(() => {
                mobileMenu.classList.remove('opacity-0');
                mobileMenu.classList.add('opacity-100');
            }, 10);
            document.body.style.overflow = 'hidden';
        } else {
            mobileMenu.classList.remove('opacity-100');
            mobileMenu.classList.add('opacity-0');
            setTimeout(() => {
                mobileMenu.classList.remove('flex');
                mobileMenu.classList.add('hidden');
            }, 300);
            document.body.style.overflow = '';
        }
    }

    if (mobileBtn) mobileBtn.addEventListener('click', toggleMobileMenu);
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', toggleMobileMenu);
    mobileLinks.forEach(link => {
        link.addEventListener('click', toggleMobileMenu);
    });

    // Handle search params on load (From catalogo.html/index.html)
    const urlParams = new URLSearchParams(window.location.search);
    const searchInput = document.getElementById('hero-search-input');
    const searchSelect = document.getElementById('hero-search-select');
    
    if (urlParams.has('search') && searchInput) {
        searchInput.value = urlParams.get('search');
    }
    
    if (urlParams.has('make') && searchSelect) {
        const makeValue = urlParams.get('make');
        if (searchSelect.options) {
            for (let i = 0; i < searchSelect.options.length; i++) {
                if (searchSelect.options[i].value.toLowerCase() === makeValue.toLowerCase()) {
                    searchSelect.selectedIndex = i;
                    break;
                }
            }
        }
    }
});

// Image modals
window.openImageModal = function(imageSrc) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    if (!modal || !modalImg) return;
    
    modalImg.src = imageSrc;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        modalImg.classList.remove('scale-95');
        modalImg.classList.add('scale-100');
    }, 10);
};

window.closeImageModal = function() {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    if (!modal || !modalImg) return;
    
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    modalImg.classList.remove('scale-100');
    modalImg.classList.add('scale-95');
    document.body.style.overflow = 'auto';
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
        modalImg.src = '';
    }, 300);
};

// Vehicle Carousel Modal Logic
let vcImages = [];
let vcCurrentIndex = 0;

window.openVehicleCarousel = function(images) {
    if (!images || images.length === 0) return;
    vcImages = images;
    vcCurrentIndex = 0;
    
    const vcModal = document.getElementById('vehicle-carousel-modal');
    if (!vcModal) return;
    
    window.updateVcView(true);
    
    vcModal.classList.remove('hidden');
    vcModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        vcModal.classList.remove('opacity-0');
        vcModal.classList.add('opacity-100');
    }, 10);
};

window.closeVehicleCarousel = function() {
    const vcModal = document.getElementById('vehicle-carousel-modal');
    const vcMainImage = document.getElementById('vc-main-image');
    if (!vcModal) return;
    
    vcModal.classList.remove('opacity-100');
    vcModal.classList.add('opacity-0');
    document.body.style.overflow = 'auto';
    
    setTimeout(() => {
        vcModal.classList.remove('flex');
        vcModal.classList.add('hidden');
        if (vcMainImage) vcMainImage.src = '';
        vcImages = [];
    }, 300);
};

window.updateVcView = function(instant = false) {
    const vcMainImage = document.getElementById('vc-main-image');
    const vcDotsContainer = document.getElementById('vc-dots-container');
    if (!vcMainImage || !vcDotsContainer) return;
    
    if (instant) {
        vcMainImage.src = vcImages[vcCurrentIndex];
        vcMainImage.style.opacity = '1';
    } else {
        vcMainImage.style.opacity = '0.3';
        setTimeout(() => {
            vcMainImage.src = vcImages[vcCurrentIndex];
            vcMainImage.style.opacity = '1';
        }, 100);
    }
    
    // Update dots
    vcDotsContainer.innerHTML = '';
    vcImages.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.className = `w-12 h-1.5 md:h-2 rounded-full transition-all duration-300 outline-none ${idx === vcCurrentIndex ? 'bg-gc-orange scale-x-125 shadow-[0_0_12px_rgba(255,102,0,1)]' : 'bg-white/40 hover:bg-white/80 border border-white/10'}`;
        dot.onclick = (e) => { e.stopPropagation(); window.goToVcImage(idx); };
        vcDotsContainer.appendChild(dot);
    });
};

window.vcNextImage = function(e) {
    if (e) e.stopPropagation();
    vcCurrentIndex = (vcCurrentIndex + 1) % vcImages.length;
    window.updateVcView();
};

window.vcPrevImage = function(e) {
    if (e) e.stopPropagation();
    vcCurrentIndex = (vcCurrentIndex - 1 + vcImages.length) % vcImages.length;
    window.updateVcView();
};

window.goToVcImage = function(idx) {
    vcCurrentIndex = idx;
    window.updateVcView();
};

// Swipe logic for touch devices
document.addEventListener('DOMContentLoaded', () => {
    let touchstartX = 0;
    let touchendX = 0;
    const vcTouchArea = document.getElementById('vc-touch-area');
    
    if (vcTouchArea) {
        vcTouchArea.addEventListener('touchstart', e => {
            touchstartX = e.changedTouches[0].screenX;
        }, {passive: true});
        
        vcTouchArea.addEventListener('touchend', e => {
            touchendX = e.changedTouches[0].screenX;
            handleSwipe();
        }, {passive: true});
    }
    
    function handleSwipe() {
        const diff = touchendX - touchstartX;
        if (Math.abs(diff) > 50) { // minimum threshold for swipe
            if (touchendX < touchstartX) { // swipe left (next)
                window.vcNextImage();
            }
            if (touchendX > touchstartX) { // swipe right (prev)
                window.vcPrevImage();
            }
        }
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
        const imgModal = document.getElementById('image-modal');
        if (imgModal && !imgModal.classList.contains('hidden')) {
            window.closeImageModal();
        }
        const vcModal = document.getElementById('vehicle-carousel-modal');
        if (vcModal && !vcModal.classList.contains('hidden')) {
            window.closeVehicleCarousel();
        }
    }
    
    const vcModal = document.getElementById('vehicle-carousel-modal');
    if (vcModal && !vcModal.classList.contains('hidden')) {
        if (event.key === "ArrowRight") window.vcNextImage();
        if (event.key === "ArrowLeft") window.vcPrevImage();
    }
});

// MARCAS DYNAMIC LOADING
window.fetchBrandsAndPopulate = function() {
    fetch('/api/marcas')
        .then(res => res.json())
        .then(marcas => {
            if (marcas.error || !Array.isArray(marcas)) return;

            // Update Selects (Hero & Catalog)
            const heroSelects = document.querySelectorAll('#hero-search-select');
            heroSelects.forEach(select => {
                const firstOption = select.options.length > 0 ? select.options[0] : new Option('Todas las Marcas', '');
                select.innerHTML = '';
                select.appendChild(firstOption);

                marcas.forEach(marca => {
                    const opt = document.createElement('option');
                    opt.className = 'text-black font-medium';
                    opt.value = marca.nombre;
                    opt.textContent = marca.nombre;
                    select.appendChild(opt);
                });

                // Auto-select based on URL
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.has('make')) {
                    const makeValue = urlParams.get('make');
                    for (let i = 0; i < select.options.length; i++) {
                        if (select.options[i].value.toLowerCase() === makeValue.toLowerCase()) {
                            select.selectedIndex = i;
                            break;
                        }
                    }
                }
            });

            // Update Pills (Catalog)
            const group1 = document.getElementById('brand-scroll-group-1');
            const group2 = document.getElementById('brand-scroll-group-2');
            if (group1 && group2) {
                let html = '';
                marcas.forEach(marca => {
                    html += `
                        <button onclick="window.searchByBrand('${marca.nombre}')" class="flex-shrink-0 bg-[#002f6c] hover:bg-[#ff6600] rounded-full border-[3px] border-[#0047b3] shadow-[0_0_0_3px_#ff6600,0_4px_10px_rgba(0,0,0,0.2)] flex items-center justify-center min-w-[170px] h-[60px] px-6 relative overflow-hidden transition-colors cursor-pointer group">
                            <div class="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-full"></div>
                            <span class="text-white font-black text-xl tracking-widest group-hover:scale-105 transition-transform uppercase">${marca.nombre}</span>
                        </button>
                    `;
                });
                group1.innerHTML = html;
                group2.innerHTML = html;
            }
        })
        .catch(err => console.error("Error loading brands:", err));
};

document.addEventListener('DOMContentLoaded', () => {
    window.fetchBrandsAndPopulate();

    // Auto-fill search input based on URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('search')) {
        const searchInput = document.getElementById('hero-search-input');
        if (searchInput) {
            searchInput.value = urlParams.get('search');
        }
    }
});

// ====== LOGICA DEL CHATBOT ======
document.addEventListener('DOMContentLoaded', () => {
    const chatBtn = document.getElementById('toggle-chat-btn');
    const closeBtn = document.getElementById('close-chat-btn');
    const chatWindow = document.getElementById('chat-window');
    const chatMessages = document.getElementById('chat-messages');

    if (!chatBtn || !chatWindow) return;

    function toggleChat() {
        const isHidden = chatWindow.classList.contains('hidden');
        if (isHidden) {
            chatWindow.classList.remove('hidden');
            // Timeout to allow display:block to apply before animating opacity/transform
            setTimeout(() => {
                chatWindow.classList.remove('scale-95', 'opacity-0');
                chatWindow.classList.add('scale-100', 'opacity-100');
            }, 10);
        } else {
            chatWindow.classList.remove('scale-100', 'opacity-100');
            chatWindow.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                chatWindow.classList.add('hidden');
            }, 300);
        }
    }

    chatBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    // Function to handle FAQ toggling (Accordion style)
    window.toggleFaq = function(faqId) {
        const content = document.getElementById(faqId);
        const icon = document.getElementById('icon-' + faqId);
        
        if (!content || !icon) return;
        
        const isHidden = content.classList.contains('hidden');
        
        // Opcional: Si queremos que solo haya una abierta a la vez, cerramos las demas:
        const allFaqs = ['faq-planes', 'faq-requisitos', 'faq-ubicacion'];
        allFaqs.forEach(id => {
            if (id !== faqId) {
                const otherContent = document.getElementById(id);
                const otherIcon = document.getElementById('icon-' + id);
                if (otherContent && !otherContent.classList.contains('hidden')) {
                    otherContent.classList.add('hidden');
                    if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
                }
            }
        });

        // Toggle la actul
        if (isHidden) {
            content.classList.remove('hidden');
            icon.style.transform = 'rotate(180deg)';
        } else {
            content.classList.add('hidden');
            icon.style.transform = 'rotate(0deg)';
        }
    };
});
