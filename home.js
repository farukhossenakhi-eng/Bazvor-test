import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {

    apiKey: "AIzaSyCc1q9_ta8S8b-T3FxQmQ12BajjBgvtcmyM",

    authDomain: "bazvor-da3c4.firebaseapp.com",

    projectId: "bazvor-da3c4",

    storageBucket: "bazvor-da3c4.firebasestorage.app",

    messagingSenderId: "59852021286",

    appId: "1:59852021286:web:b6ad6eba476f853b1710e7",

    measurementId: "G-L6JFCT5RDD"

};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);


/* =========================================================
   HELPERS
========================================================= */

const $ = selector =>
    document.querySelector(selector);

const $$ = selector =>
    document.querySelectorAll(selector);


const escapeHTML = value =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");


/* =========================================================
   ELEMENTS
========================================================= */

const searchInput =
    $("#searchInput");

const categoryButtons =
    $$(".top-category");

const exploreCategories =
    $$(".explore-category");

const promoSlider =
    $("#promoSlider");

const bannerDots =
    $("#bannerDots");

const productGrid =
    $("#productGrid");

const flashProducts =
    $("#flashProducts");

const flashSeeAll =
    $("#flashSeeAll");

const cartBadges =
    $$(".cart-badge");


/* =========================================================
   STATE
========================================================= */

let allProducts = [];

let currentCategory = "All";

let currentSearch = "";

let cartItems =
    JSON.parse(localStorage.getItem("bazvor_cart")) || [];

let wishlistItems =
    JSON.parse(localStorage.getItem("bazvor_wishlist")) || [];


let currentSlide = 0;

let promoTimer = null;

let touchStartX = 0;


/* =========================================================
   BANNER
========================================================= */

function getPromoSlides() {

    return $$(".promo-slide");

}


function renderBannerDots() {

    if (!bannerDots) return;

    const slides =
        getPromoSlides();

    bannerDots.innerHTML =
        Array.from(slides)
            .map((_, i) => `
                <span class="banner-dot ${
                    i === currentSlide
                        ? "active"
                        : ""
                }"></span>
            `)
            .join("");

}


function showPromoSlide(index) {

    const slides =
        getPromoSlides();

    if (!slides.length) return;

    currentSlide =
        index >= slides.length
            ? 0
            : index < 0
                ? slides.length - 1
                : index;


    slides.forEach((slide, i) => {

        slide.classList.toggle(
            "active",
            i === currentSlide
        );

    });


    renderBannerDots();

}


function startPromoSlider() {

    clearInterval(promoTimer);

    promoTimer =
        setInterval(() => {

            showPromoSlide(
                currentSlide + 1
            );

        }, 5000);

}


/* =========================================================
   BANNER EVENTS
========================================================= */

function openPromoTarget(type, value) {

    if (!value) return;

    type =
        String(type || "category")
            .toLowerCase();

    value =
        String(value || "")
            .trim();


    if (type === "category") {

        currentSearch = "";

        if (searchInput) {
            searchInput.value = "";
        }


        currentCategory = value;


        categoryButtons.forEach(button => {

            button.classList.toggle(
                "active",

                String(
                    button.dataset.category
                ).toLowerCase()
                ===
                value.toLowerCase()
            );

        });


        renderFilteredProducts();


        $(".all-products-section")
            ?.scrollIntoView({
                behavior: "smooth"
            });

    }

}


function attachPromoEvents() {

    getPromoSlides()
        .forEach(slide => {

            slide.addEventListener(
                "click",
                () => {

                    openPromoTarget(
                        slide.dataset.targetType,
                        slide.dataset.targetValue
                    );

                }
            );

        });

}


/* =========================================================
   BANNER SWIPE
========================================================= */

promoSlider?.addEventListener(
    "touchstart",
    event => {

        touchStartX =
            event.changedTouches[0].screenX;

    },
    { passive: true }
);


promoSlider?.addEventListener(
    "touchend",
    event => {

        const distance =
            touchStartX -
            event.changedTouches[0].screenX;


        if (Math.abs(distance) < 50)
            return;


        showPromoSlide(
            distance > 0
                ? currentSlide + 1
                : currentSlide - 1
        );


        startPromoSlider();

    },
    { passive: true }
);


/* =========================================================
   CATEGORY
========================================================= */

function setCategory(category) {

    currentCategory = category;

    categoryButtons.forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.category === category
        );

    });


    renderFilteredProducts();

}


categoryButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => setCategory(
            button.dataset.category
        )
    );

});


exploreCategories.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const category =
                button.dataset.category;


            if (category === "More") {

                window.location.href =
                    "categories.html";

                return;

            }


            setCategory(category);


            $(".all-products-section")
                ?.scrollIntoView({
                    behavior: "smooth"
                });

        }
    );

});


/* =========================================================
   SEARCH
========================================================= */

searchInput?.addEventListener(
    "input",
    event => {

        currentSearch =
            event.target.value
                .toLowerCase()
                .trim();


        renderFilteredProducts();

    }
);


/* =========================================================
   PRODUCT IMAGE
========================================================= */

function getProductImage(product) {

    if (
        typeof product.mainImage === "string" &&
        product.mainImage.trim()
    ) {

        return product.mainImage;

    }


    if (Array.isArray(product.images)) {

        const image =
            product.images.find(
                item =>
                    typeof item === "string" &&
                    item.trim()
            );


        if (image) return image;

    }


    if (Array.isArray(product.media)) {

        const media =
            product.media.find(
                item =>
                    item &&
                    (
                        item.type === "image" ||
                        typeof item === "string"
                    )
            );


        if (media) {

            return typeof media === "string"
                ? media
                : media.url || "";

        }

    }


    if (
        typeof product.image === "string" &&
        product.image.trim()
    ) {

        return product.image;

    }


    return "https://via.placeholder.com/500x500?text=No+Image";

}


/* =========================================================
   PRODUCT DATA
========================================================= */

function getProductPrice(product) {

    return Number(
        product.price ??
        product.salePrice ??
        product.discountPrice ??
        0
    ) || 0;

}


function getOldPrice(product) {

    return Number(
        product.oldPrice ??
        product.regularPrice ??
        0
    ) || 0;

}


function getDiscount(product) {

    const price =
        getProductPrice(product);

    const old =
        getOldPrice(product);


    if (
        old > price &&
        price > 0
    ) {

        return Math.round(
            ((old - price) / old) * 100
        );

    }


    return 0;

}


function getShippingText(product) {

    const shipping =
        product.shipping;

    if (!shipping) return "";


    if (
        shipping.freeDelivery === true
    ) {

        return "Free Delivery";

    }


    if (shipping.deliveryTime) {

        return shipping.deliveryTime;

    }


    if (shipping.deliveryCharge) {

        return `Delivery ৳${
            Number(
                shipping.deliveryCharge
            ).toLocaleString()
        }`;

    }


    return "";

}


function isFlashProduct(product) {

    return (

        product.type === "flash" ||

        product.type === "Flash Sell" ||

        product.flashSale === true ||

        product.isFlashSale === true ||

        product.flashSell === true ||

        product.productType === "flash" ||

        product.productType === "Flash Sell"

    );

}


function isVerifiedProduct(product) {

    return (

        product.verified === true ||

        product.isVerified === true ||

        product.sellerVerified === true ||

        product.bazvorVerified === true

    );

}


/* =========================================================
   NORMAL PRODUCT CARD
========================================================= */

function createProductCard(product) {

    const image =
        getProductImage(product);

    const price =
        getProductPrice(product);

    const old =
        getOldPrice(product);

    const discount =
        getDiscount(product);

    const rating =
        Number(product.rating || 0);

    const reviews =
        Number(
            product.reviews ??
            product.reviewsCount ??
            product.reviewCount ??
            0
        );

    const verified =
        isVerifiedProduct(product);

    const wished =
        wishlistItems.includes(
            product.id
        );

    const shipping =
        getShippingText(product);


    return `

        <article
            class="product-card"
            data-product-id="${escapeHTML(product.id)}"
        >

            <div class="product-image-wrap">

                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(product.name || "Product")}"
                    class="product-image"
                    loading="lazy"
                    onerror="this.src='https://via.placeholder.com/500x500?text=No+Image'"
                >


                ${
                    discount
                        ? `
                            <span
                                class="discount-badge"
                                style="
                                    position:absolute;
                                    top:7px;
                                    left:7px;
                                "
                            >
                                -${discount}%
                            </span>
                        `
                        : ""
                }


                <button
                    class="product-wishlist ${
                        wished ? "active" : ""
                    }"
                    data-wishlist="${escapeHTML(product.id)}"
                    type="button"
                >

                    <i class="${
                        wished
                            ? "fa-solid"
                            : "fa-regular"
                    } fa-heart"></i>

                </button>

            </div>


            <div class="product-info">

                <h3 class="product-name">

                    ${escapeHTML(
                        product.name ||
                        "Unnamed Product"
                    )}

                </h3>


                <div class="product-seller">

                    ${
                        verified
                            ? `
                                <span class="verified-badge">

                                    <i class="fa-solid fa-circle-check"></i>

                                    Bazvor Verified

                                </span>
                            `
                            : ""
                    }

                </div>


                <div class="product-rating">

                    <span>★</span>

                    <b>
                        ${rating.toFixed(1)}
                    </b>

                    <small>
                        (${reviews})
                    </small>

                </div>


                <div class="product-price-row">

                    <strong>
                        ৳${price.toLocaleString()}
                    </strong>


                    ${
                        old > 0
                            ? `
                                <del>
                                    ৳${old.toLocaleString()}
                                </del>
                            `
                            : ""
                    }


                    ${
                        discount
                            ? `
                                <span class="discount-badge">
                                    -${discount}%
                                </span>
                            `
                            : ""
                    }

                </div>


                <div class="product-extra-info">

                    ${
                        Number(product.stock) > 0
                            ? `
                                <span>
                                    Stock:
                                    ${Number(
                                        product.stock
                                    ).toLocaleString()}
                                </span>
                            `
                            : ""
                    }


                    ${
                        shipping
                            ? `
                                <span>

                                    <i class="fa-solid fa-truck-fast"></i>

                                    ${escapeHTML(shipping)}

                                </span>
                            `
                            : ""
                    }

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   FLASH PRODUCT CARD
========================================================= */

function createFlashProductCard(product) {

    const image =
        getProductImage(product);

    const price =
        getProductPrice(product);

    const old =
        getOldPrice(product);

    const discount =
        getDiscount(product);

    const wished =
        wishlistItems.includes(
            product.id
        );


    return `

        <article
            class="flash-product-card"
            data-product-id="${escapeHTML(product.id)}"
        >

            <div class="flash-image-wrap">

                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(
                        product.name ||
                        "Flash Sell Product"
                    )}"
                    loading="lazy"
                    onerror="this.src='https://via.placeholder.com/500x500?text=No+Image'"
                >


                ${
                    discount
                        ? `
                            <span class="flash-discount">
                                -${discount}%
                            </span>
                        `
                        : ""
                }


                <button
                    class="flash-wishlist ${
                        wished ? "active" : ""
                    }"
                    data-wishlist="${escapeHTML(product.id)}"
                    type="button"
                >

                    <i class="${
                        wished
                            ? "fa-solid"
                            : "fa-regular"
                    } fa-heart"></i>

                </button>

            </div>


            <div class="flash-product-info">

                <h3 class="flash-product-name">

                    ${escapeHTML(
                        product.name ||
                        "Unnamed Product"
                    )}

                </h3>


                <div class="flash-price-row">

                    <strong class="flash-price">

                        ৳${price.toLocaleString()}

                    </strong>


                    ${
                        old > price
                            ? `
                                <del class="flash-old-price">
                                    ৳${old.toLocaleString()}
                                </del>
                            `
                            : ""
                    }

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   FILTER
========================================================= */

function getFilteredProducts() {

    return allProducts.filter(product => {

        if (
            product.status &&
            product.status !== "published"
        ) {

            return false;

        }


        if (
            isFlashProduct(product)
        ) {

            return false;

        }


        if (
            currentCategory !== "All" &&
            !String(
                product.category || ""
            )
            .toLowerCase()
            .includes(
                currentCategory.toLowerCase()
            )
        ) {

            return false;

        }


        if (currentSearch) {

            const searchable = [

                product.name,

                product.brand,

                product.brandName,

                product.category,

                product.shortDescription,

                product.description

            ]
            .map(value =>
                String(value || "")
                    .toLowerCase()
            )
            .join(" ");


            if (
                !searchable.includes(
                    currentSearch
                )
            ) {

                return false;

            }

        }


        return true;

    });

}


function renderFilteredProducts() {

    renderProducts(
        getFilteredProducts()
    );

}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts(products) {

    if (!productGrid) return;


    if (!products.length) {

        productGrid.innerHTML = `

            <div
                style="
                    grid-column:1/-1;
                    text-align:center;
                    padding:40px 20px;
                    color:#888;
                "
            >

                <i
                    class="fa-solid fa-box-open"
                    style="
                        display:block;
                        font-size:35px;
                        margin-bottom:10px;
                        color:#e5006d;
                    "
                ></i>

                <p>No products found</p>

            </div>

        `;

        return;

    }


    productGrid.innerHTML =
        products
            .map(createProductCard)
            .join("");


    attachProductEvents();

}


/* =========================================================
   PRODUCT EVENTS
========================================================= */

function attachProductEvents() {

    $$(".product-card, .flash-product-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                event => {

                    if (
                        event.target.closest(
                            "[data-wishlist]"
                        )
                    ) {

                        return;

                    }


                    const id =
                        card.dataset.productId;


                    if (id) {

                        window.location.href =
                            `product.html?id=${encodeURIComponent(id)}`;

                    }

                }
            );

        });


    $$("[data-wishlist]")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    toggleWishlist(
                        button.dataset.wishlist
                    );

                }
            );

        });

}


/* =========================================================
   WISHLIST
========================================================= */

function toggleWishlist(id) {

    wishlistItems =
        wishlistItems.includes(id)

            ? wishlistItems.filter(
                item => item !== id
            )

            : [
                ...wishlistItems,
                id
            ];


    localStorage.setItem(
        "bazvor_wishlist",
        JSON.stringify(wishlistItems)
    );


    renderFilteredProducts();

    renderFlashSale(
        allProducts
    );

}


/* =========================================================
   FIRESTORE PRODUCTS
========================================================= */

const productsRef =
    collection(db, "products");


onSnapshot(
    productsRef,

    snapshot => {

        allProducts = [];


        snapshot.forEach(docSnap => {

            allProducts.push({

                id: docSnap.id,

                ...docSnap.data()

            });

        });


        renderFilteredProducts();

        renderFlashSale(
            allProducts
        );

    },

    error => {

        console.error(
            "BAZVOR FIRESTORE ERROR:",
            error
        );


        if (productGrid) {

            productGrid.innerHTML = `

                <div
                    style="
                        grid-column:1/-1;
                        padding:30px;
                        text-align:center;
                        color:#d00;
                    "
                >

                    <strong>
                        Products could not be loaded.
                    </strong>

                    <p
                        style="
                            margin-top:8px;
                            font-size:12px;
                        "
                    >
                        ${escapeHTML(
                            error.message ||
                            "Firestore error"
                        )}
                    </p>

                </div>

            `;

        }

    }

);


/* =========================================================
   HOME BANNERS
========================================================= */

function getBannerImage(item) {

    return (
        item.image ||
        item.imageUrl ||
        item.bannerImage ||
        item.url ||
        ""
    );

}


function renderOwnerBanners(items) {

    if (!promoSlider) return;


    if (!items.length) {

        showPromoSlide(0);

        attachPromoEvents();

        startPromoSlider();

        return;

    }


    promoSlider.innerHTML =
        items
            .map((item, index) => {

                const image =
                    getBannerImage(item);


                if (!image) return "";


                return `

                    <article
                        class="
                            promo-slide
                            ${index === 0 ? "active" : ""}
                        "
                        data-target-type="${
                            escapeHTML(
                                item.targetType ||
                                "category"
                            )
                        }"
                        data-target-value="${
                            escapeHTML(
                                item.targetValue ||
                                ""
                            )
                        }"
                    >

                        <img
                            src="${escapeHTML(image)}"
                            alt="Bazvor Banner"
                            loading="${
                                index === 0
                                    ? "eager"
                                    : "lazy"
                            }"
                            onerror="this.style.display='none'"
                        >

                    </article>

                `;

            })
            .join("");


    currentSlide = 0;

    showPromoSlide(0);

    attachPromoEvents();

    startPromoSlider();

}


/* =========================================================
   FIRESTORE BANNERS
========================================================= */

onSnapshot(

    collection(db, "homeBanners"),

    snapshot => {

        const items = [];


        snapshot.forEach(docSnap => {

            const data =
                docSnap.data();


            if (
                data.status &&
                data.status !== "published"
            ) {

                return;

            }


            items.push({

                id: docSnap.id,

                ...data

            });

        });


        items.sort(
            (a, b) =>
                Number(a.order || 0) -
                Number(b.order || 0)
        );


        renderOwnerBanners(
            items
        );

    },

    error => {

        console.warn(
            "Bazvor homeBanners unavailable:",
            error.message
        );

    }

);


/* =========================================================
   FLASH SALE
========================================================= */

function renderFlashSale(products) {

    if (!flashProducts) return;


    const flash =
        products.filter(product => {

            if (
                product.status &&
                product.status !== "published"
            ) {

                return false;

            }


            return isFlashProduct(
                product
            );

        });


    if (!flash.length) {

        flashProducts.innerHTML = `

            <div class="flash-empty">

                <i
                    class="fa-solid fa-bolt"
                    style="
                        display:block;
                        font-size:22px;
                        margin-bottom:7px;
                        color:#e5006d;
                    "
                ></i>

                No Flash Sell products right now.

            </div>

        `;

        return;

    }


    flashProducts.innerHTML =
        flash
            .slice(0, 4)
            .map(createFlashProductCard)
            .join("");


    attachProductEvents();

}


/* =========================================================
   BUTTONS
========================================================= */

flashSeeAll?.addEventListener(
    "click",
    () => {

        window.location.href =
            "flash-sale.html?type=flash";

    }
);


$("#cameraButton")
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "visual-search.html";

        }
    );


$("#headerWishlist")
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "wishlist.html";

        }
    );


$("#headerNotification")
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "notifications.html";

        }
    );


/* =========================================================
   FLASH COUNTDOWN
========================================================= */

let flashSeconds =
    8 * 60 * 60;


function updateFlashTimer() {

    const hours =
        Math.floor(
            flashSeconds / 3600
        );


    const minutes =
        Math.floor(
            (flashSeconds % 3600) / 60
        );


    const seconds =
        flashSeconds % 60;


    if ($("#flashHours")) {

        $("#flashHours").textContent =
            String(hours).padStart(2, "0");

    }


    if ($("#flashMinutes")) {

        $("#flashMinutes").textContent =
            String(minutes).padStart(2, "0");

    }


    if ($("#flashSeconds")) {

        $("#flashSeconds").textContent =
            String(seconds).padStart(2, "0");

    }


    flashSeconds--;


    if (flashSeconds < 0) {

        flashSeconds =
            8 * 60 * 60;

    }

}


setInterval(
    updateFlashTimer,
    1000
);

updateFlashTimer();


/* =========================================================
   CART BADGE
========================================================= */

function updateCartBadge() {

    cartBadges.forEach(
        badge => {

            badge.textContent =
                cartItems.length;

        }
    );

}


updateCartBadge();


/* =========================================================
   BOTTOM NAV
========================================================= */

$$(".bottom-nav-item")
    .forEach(item => {

        item.addEventListener(
            "click",
            () => {

                const page =
                    item.dataset.page;


                if (page) {

                    window.location.href =
                        page;

                }

            }
        );

    });


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    user => {

        console.log(
            user
                ? "BAZVOR logged in: " + user.email
                : "BAZVOR guest user"
        );

    }
);


/* =========================================================
   START
========================================================= */

showPromoSlide(0);

attachPromoEvents();

startPromoSlider();


console.log(
    "BAZVOR HOME — UPDATED PREMIUM UI"
);

console.log(
    "Explore Categories: 7 ITEMS"
);

console.log(
    "Flash Sell: 4 CARDS"
);

console.log(
    "Recommended: 2 COLUMNS"
);