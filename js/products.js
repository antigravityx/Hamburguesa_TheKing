const BRAND_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="%230f111a" rx="20"/><circle cx="200" cy="200" r="140" fill="%23ffb703" opacity="0.1"/><g transform="translate(50,45)"><path d="M50 170C50 95, 250 95, 290 170Z" fill="%23d90429"/><path d="M30 130L60 75L90 105L120 55L150 115Z" fill="%23ffb703"/><ellipse cx="150" cy="120" rx="8" ry="4" fill="%23ffffff" transform="rotate(-15 150 120)"/><ellipse cx="200" cy="110" rx="8" ry="4" fill="%23ffffff" transform="rotate(-15 200 110)"/><ellipse cx="240" cy="135" rx="8" ry="4" fill="%23ffffff" transform="rotate(-15 240 135)"/><path d="M45 175L295 175L260 210L230 185L180 220L140 185Z" fill="%23ffb703"/><path d="M55 210C55 275, 285 275, 285 210Z" fill="%23b70425"/></g></svg>`;

const BURGER_PLACEHOLDER = BRAND_LOGO_SVG;
const LOGO_PLACEHOLDER = BRAND_LOGO_SVG;

const PRODUCTS = {
    "promos": [
        {
            "id": "promo-1",
            "name": "3 Hambur Gruesas Especiales",
            "desc": "Pan Brioche, Blend de Carne, Queso, Tomate, Huevo, Jamón, Mayonesa Casera. + Papas Fritas.",
            "price": 19000,
            "img": BURGER_PLACEHOLDER,
            "includesFries": true,
            "available": true
        },
        {
            "id": "promo-2",
            "name": "2 Bur Gruesas Cheese \"Doble!\"",
            "desc": "Pan Brioche, Blend de Carne, Queso Cheddar, Mayonesa Casera. + Papas Fritas.",
            "price": 18000,
            "img": BURGER_PLACEHOLDER,
            "includesFries": true,
            "available": true
        },
        {
            "id": "promo-3",
            "name": "2 Hambur Provolone Simple",
            "desc": "Pan Brioche, Blend de Carne, Queso Provolone, Mayonesa Casera. + Papas Fritas.",
            "price": 10000,
            "img": BURGER_PLACEHOLDER,
            "includesFries": true,
            "available": true
        },
        {
            "id": "promo-4",
            "name": "2 Provolone \"Doble!\"",
            "desc": "Pan Brioche, Blend de Carne, Queso Provolone, Mayonesa Casera. + Papas Fritas.",
            "price": 18000,
            "img": BURGER_PLACEHOLDER,
            "includesFries": true,
            "available": true
        },
        {
            "id": "promo-5",
            "name": "2 Cleopatra Simple",
            "desc": "Pan Brioche, Blend de Carne, Queso Cheddar, Panceta, Mayonesa Casera. + Papas Fritas.",
            "price": 12000,
            "img": BURGER_PLACEHOLDER,
            "includesFries": true,
            "available": true
        },
        {
            "id": "promo-6",
            "name": "2 Arturo Simple",
            "desc": "Pan Brioche, Blend de Carne, Queso Tybo, Mayonesa Casera. + Papas Fritas.",
            "price": 12000,
            "img": BURGER_PLACEHOLDER,
            "includesFries": true,
            "available": true
        }
    ],
    "premium": [
        {
            "id": "premium-arturo",
            "name": "Arturo",
            "desc": "Pan Brioche, Blend de Carne, Queso Tybo, Huevo, Mayonesa Casera.",
            "img": BURGER_PLACEHOLDER,
            "includesFries": true,
            "sizes": { "doble": 9000, "triple": 12000 },
            "available": true
        },
        {
            "id": "premium-alejandro",
            "name": "Alejandro Magno",
            "desc": "Pan Brioche, Blend de Carne, Queso Cheddar, Cebolla Caramelizada, Mayonesa Casera.",
            "img": BURGER_PLACEHOLDER,
            "includesFries": true,
            "sizes": { "doble": 9500, "triple": 13000 },
            "available": true
        },
        {
            "id": "premium-cleopatra",
            "name": "Cleopatra",
            "desc": "Pan Brioche, Blend de Carne, Queso Cheddar, Panceta, Mayonesa Casera.",
            "img": BURGER_PLACEHOLDER,
            "includesFries": true,
            "sizes": { "doble": 9500, "triple": 13000 },
            "available": true
        },
        {
            "id": "premium-leonidas",
            "name": "Leónidas",
            "desc": "Pan Brioche, Mayonesa Casera, Blend de Carne, Queso Tybo, Jamón y Morrones Ahumados.",
            "img": BURGER_PLACEHOLDER,
            "includesFries": true,
            "sizes": { "doble": 9500, "triple": 13000 },
            "available": true
        },
        {
            "id": "premium-ragnar",
            "name": "Ragnar",
            "desc": "Pan Brioche con Queso Parmesano, Blend de Carne, Queso Cheddar, Queso Tybo, Panceta, Huevo, Mayonesa Casera.",
            "img": BURGER_PLACEHOLDER,
            "includesFries": true,
            "sizes": { "doble": 10000, "triple": 14000 },
            "available": true
        },
        {
            "id": "premium-lathgertha",
            "name": "Lathgertha",
            "desc": "Pan Brioche con Queso Parmesano, Blend de Carne, Queso Tybo, Jamón Cocido, Huevo, Lechuga Repollada, Tomate, Mayonesa Casera.",
            "img": BURGER_PLACEHOLDER,
            "includesFries": true,
            "sizes": { "doble": 10000, "triple": 14000 },
            "available": true
        },
        {
            "id": "premium-marcus",
            "name": "Marcus Aurelius",
            "desc": "Pan Brioche con Queso Parmesano, Blend de Carne, Queso Cheddar x4, Panceta Ahumada, Pepinillos, Mayonesa Casera.",
            "img": BURGER_PLACEHOLDER,
            "includesFries": true,
            "sizes": { "doble": 10000, "triple": 14000 },
            "available": true
        }
    ],
    "clasicas": [
        {
            "id": "clasica-comun",
            "name": "Común",
            "desc": "Pan de papa, Mayonesa Casera, Blend de Carne, Queso, Tomate.",
            "price": 6500,
            "img": BURGER_PLACEHOLDER,
            "available": true
        },
        {
            "id": "clasica-especial",
            "name": "Especial",
            "desc": "Pan de papa, Mayonesa Casera, Blend de Carne, Queso, Jamón Cocido, Huevo, Tomate.",
            "price": 7000,
            "img": BURGER_PLACEHOLDER,
            "available": true
        }
    ],
    "pizzas": [
        {
            "id": "pizza-mozzarella",
            "name": "Pizza Mozzarella",
            "desc": "Masa casera, salsa, queso mozzarella, orégano, aceitunas.",
            "price": 8500,
            "img": LOGO_PLACEHOLDER,
            "available": true
        },
        {
            "id": "pizza-morrones",
            "name": "Pizza Morrones Ahumados",
            "desc": "Masa casera, salsa, queso mozzarella, jamón cocido, morrones ahumados, orégano, aceitunas.",
            "price": 9500,
            "img": LOGO_PLACEHOLDER,
            "available": true
        },
        {
            "id": "pizza-fugazzeta",
            "name": "Pizza Fugazzeta",
            "desc": "Masa casera, salsa, queso mozzarella, orégano, aceitunas, cebollas salteadas.",
            "price": 9000,
            "img": LOGO_PLACEHOLDER,
            "available": true
        },
        {
            "id": "pizza-calabresa",
            "name": "Pizza Calabresa",
            "desc": "Masa casera, salsa, queso mozzarella, orégano, calabresa.",
            "price": 9500,
            "img": LOGO_PLACEHOLDER,
            "available": true
        },
        {
            "id": "pizza-theking",
            "name": "Pizza The King",
            "desc": "Masa casera, salsa, queso mozzarella, tomates, orégano, huevos fritos.",
            "price": 10500,
            "img": LOGO_PLACEHOLDER,
            "available": true
        }
    ],
    "papas": [
        {
            "id": "papas-clasicas",
            "name": "Papas Clásicas",
            "desc": "Papas fritas clásicas bastón crujientes.",
            "price": 9000,
            "img": BURGER_PLACEHOLDER,
            "available": true
        },
        {
            "id": "papas-cheddar",
            "name": "Papas con Cheddar",
            "desc": "Papas fritas bastón bañadas con abundante queso cheddar fundido.",
            "price": 9500,
            "img": BURGER_PLACEHOLDER,
            "available": true
        },
        {
            "id": "papas-cheddar-panceta",
            "name": "Papas con Cheddar y Panceta",
            "desc": "Papas fritas bastón con queso cheddar fundido y panceta picada crujiente.",
            "price": 10500,
            "img": BURGER_PLACEHOLDER,
            "available": true
        }
    ],
    "bebidas": [
        {
            "id": "bebida-gaseosa",
            "name": "Gaseosa 500ml",
            "desc": "Línea Coca-Cola, Sprite o Fanta bien fría.",
            "price": 3500,
            "img": LOGO_PLACEHOLDER,
            "available": true
        },
        {
            "id": "bebida-cerveza",
            "name": "Cerveza en Lata",
            "desc": "Lata de cerveza 473ml bien helada.",
            "price": 4500,
            "img": LOGO_PLACEHOLDER,
            "available": true
        },
        {
            "id": "bebida-agua",
            "name": "Agua Mineral 500ml",
            "desc": "Agua mineral con o sin gas bien fría.",
            "price": 2500,
            "img": LOGO_PLACEHOLDER,
            "available": true
        }
    ]
};
