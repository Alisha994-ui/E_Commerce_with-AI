"""
Demo catalogue used by `python manage.py seed_store`.

Structure: category -> description, subcategories -> products
Product tuple: (name, price_in_rupees, stock, description)
"""

CATALOGUE = {
    "Shoes": {
        "description": "Sneakers, formal shoes, sandals and sports footwear.",
        "subcategories": {
            "Sneakers": [
                ("Urban Stride Classic Sneaker", 6499, 40, "Low-top canvas sneaker with a cushioned insole for all-day wear."),
                ("Urban Stride Leather Sneaker", 8999, 25, "White leather sneaker with a padded collar and rubber cupsole."),
                ("Kora Knit Slip-On", 5499, 35, "Breathable knit upper that slips on easily, ideal for daily errands."),
                ("Retro High-Top Sneaker", 7499, 18, "High-top silhouette with ankle support and a vintage gum sole."),
            ],
            "Running Shoes": [
                ("Swift Run Pro", 11999, 30, "Lightweight running shoe with responsive foam for road running."),
                ("Swift Run Trail", 13499, 15, "Grippy outsole and toe guard for trail and off-road runs."),
                ("Pace Lite Trainer", 8499, 45, "Everyday trainer for gym sessions and short runs."),
            ],
            "Formal Shoes": [
                ("Oxford Leather Shoe", 12999, 20, "Polished cow-leather oxford with a stitched leather sole."),
                ("Classic Derby Shoe", 10999, 22, "Comfortable derby shoe for office wear and formal events."),
                ("Suede Loafer", 9499, 16, "Soft suede loafer with a cushioned footbed."),
            ],
            "Sandals & Chappals": [
                ("Peshawari Chappal", 4499, 50, "Handcrafted leather Peshawari chappal with a tyre sole."),
                ("Comfort Slide", 1999, 80, "Soft EVA slide for home and casual outings."),
                ("Strap Sandal", 3499, 40, "Adjustable strap sandal with an anti-slip sole."),
            ],
        },
    },
    "Clothing": {
        "description": "Everyday wear, traditional outfits and winter clothing.",
        "subcategories": {
            "T-Shirts": [
                ("Essential Cotton Tee", 1499, 120, "100% combed cotton crew-neck t-shirt in a regular fit."),
                ("Graphic Print Tee", 1899, 90, "Soft cotton t-shirt with a screen-printed graphic."),
                ("Polo Shirt", 2499, 70, "Pique cotton polo with a ribbed collar."),
                ("Oversized Tee", 2199, 60, "Relaxed oversized fit with dropped shoulders."),
            ],
            "Shirts": [
                ("Oxford Button-Down Shirt", 3499, 50, "Crisp oxford cotton shirt for office and casual wear."),
                ("Linen Summer Shirt", 3999, 40, "Breathable linen-blend shirt for hot days."),
                ("Checked Flannel Shirt", 3299, 35, "Warm brushed flannel shirt in a classic check."),
            ],
            "Jeans & Trousers": [
                ("Slim Fit Denim Jeans", 4499, 55, "Stretch denim jeans with a slim, tapered leg."),
                ("Chino Trousers", 3799, 45, "Cotton twill chinos with a comfortable mid-rise."),
                ("Cargo Pants", 4199, 30, "Utility cargo pants with six pockets."),
            ],
            "Kurta & Shalwar Kameez": [
                ("Cotton Kurta", 3299, 60, "Lightweight cotton kurta for everyday and Friday wear."),
                ("Embroidered Kurta", 5499, 25, "Kurta with neckline embroidery for festive occasions."),
                ("Wash & Wear Shalwar Kameez", 4999, 40, "Easy-care wash & wear suit that stays crease-free."),
            ],
            "Winter Wear": [
                ("Fleece Hoodie", 3999, 45, "Warm brushed fleece hoodie with a kangaroo pocket."),
                ("Puffer Jacket", 8999, 20, "Lightweight insulated puffer jacket for cold evenings."),
                ("Wool Sweater", 4999, 30, "Knitted wool-blend crew-neck sweater."),
            ],
        },
    },
    "Bags": {
        "description": "Backpacks, handbags, travel and laptop bags.",
        "subcategories": {
            "Backpacks": [
                ("Daily Commute Backpack", 4999, 40, "20L backpack with a padded laptop sleeve and water-resistant fabric."),
                ("Leather Backpack", 11999, 15, "Full-grain leather backpack with brass hardware."),
                ("School Backpack", 2999, 70, "Durable backpack with multiple compartments for books."),
            ],
            "Handbags": [
                ("Structured Tote Bag", 5999, 25, "Spacious tote with an inner zip pocket."),
                ("Crossbody Bag", 3999, 35, "Compact crossbody bag with an adjustable strap."),
                ("Clutch Purse", 2799, 30, "Evening clutch with a detachable chain."),
            ],
            "Travel Bags": [
                ("Cabin Trolley Bag", 14999, 18, "Hard-shell 20-inch cabin trolley with spinner wheels."),
                ("Weekender Duffel", 6999, 22, "Canvas duffel bag for short trips."),
                ("Travel Organizer Pouch", 1499, 60, "Set of packing pouches to keep luggage tidy."),
            ],
            "Laptop Bags": [
                ("Slim Laptop Sleeve", 2499, 50, "Padded sleeve for 13 to 15-inch laptops."),
                ("Office Laptop Bag", 5499, 30, "Briefcase-style bag with a shoulder strap."),
            ],
        },
    },
    "Electronics": {
        "description": "Audio, mobile accessories, smart devices and computer gear.",
        "subcategories": {
            "Headphones & Earbuds": [
                ("Wireless Earbuds Pro", 7999, 40, "True wireless earbuds with noise reduction and a charging case."),
                ("Over-Ear Bluetooth Headphones", 11999, 25, "Foldable headphones with 30-hour battery life."),
                ("Wired Earphones", 999, 120, "In-ear earphones with an inline microphone."),
            ],
            "Speakers": [
                ("Portable Bluetooth Speaker", 6499, 35, "Water-resistant speaker with 12-hour playtime."),
                ("Soundbar 2.1", 24999, 10, "Soundbar with a wireless subwoofer for TV and movies."),
            ],
            "Mobile Accessories": [
                ("20W Fast Charger", 2499, 80, "USB-C fast charger compatible with most phones."),
                ("10000mAh Power Bank", 4499, 60, "Slim power bank with dual USB output."),
                ("Braided USB-C Cable", 899, 150, "1.5m nylon-braided charging cable."),
                ("Phone Tripod Stand", 1999, 45, "Adjustable tripod with a Bluetooth remote."),
            ],
            "Smart Watches": [
                ("Fitness Smart Watch", 8999, 30, "Heart-rate, sleep and step tracking with a 7-day battery."),
                ("AMOLED Smart Watch", 15999, 15, "Bright AMOLED display with call notifications."),
            ],
            "Computer Accessories": [
                ("Wireless Mouse", 1799, 70, "Silent-click wireless mouse with a USB receiver."),
                ("Mechanical Keyboard", 8499, 20, "RGB mechanical keyboard with blue switches."),
                ("1080p Webcam", 5999, 25, "Full HD webcam with a built-in microphone."),
            ],
        },
    },
    "Home & Kitchen": {
        "description": "Cookware, appliances, bedding and home décor.",
        "subcategories": {
            "Cookware": [
                ("Non-Stick Frying Pan 28cm", 3499, 40, "Granite-coated non-stick pan with a heat-resistant handle."),
                ("Pressure Cooker 5L", 6999, 25, "Aluminium pressure cooker with a safety valve."),
                ("Stainless Steel Pot Set", 9999, 15, "Set of three stainless steel cooking pots with lids."),
            ],
            "Kitchen Appliances": [
                ("Electric Kettle 1.7L", 3999, 35, "Fast-boil kettle with auto shut-off."),
                ("Juicer Blender", 7499, 25, "Two-jar blender for juices, chutneys and grinding."),
                ("Air Fryer 4L", 18999, 12, "Oil-free air fryer with digital controls."),
            ],
            "Bedding": [
                ("Cotton Bedsheet Set", 4999, 30, "King-size cotton bedsheet with two pillow covers."),
                ("Microfibre Pillow", 1499, 60, "Soft, hypoallergenic pillow."),
                ("Winter Quilt", 7999, 18, "Warm quilt with a cotton cover."),
            ],
            "Home Décor": [
                ("Ceramic Vase", 2499, 25, "Matte ceramic vase for fresh or dried flowers."),
                ("Wall Clock", 2999, 30, "Silent-sweep wall clock with a wooden frame."),
                ("LED Table Lamp", 3499, 28, "Dimmable table lamp with a USB charging port."),
            ],
        },
    },
    "Beauty & Personal Care": {
        "description": "Skincare, hair care, fragrances and grooming.",
        "subcategories": {
            "Skincare": [
                ("Vitamin C Face Serum", 2499, 50, "Brightening serum for daily use."),
                ("Daily Moisturizer SPF 30", 1899, 60, "Lightweight moisturizer with sun protection."),
                ("Gentle Face Wash", 999, 90, "Foaming cleanser for all skin types."),
            ],
            "Hair Care": [
                ("Argan Oil Shampoo", 1299, 70, "Nourishing shampoo for dry and frizzy hair."),
                ("Hair Dryer 2000W", 5999, 20, "Hair dryer with two speeds and a cool-shot button."),
                ("Hair Straightener", 4999, 22, "Ceramic plates with adjustable temperature."),
            ],
            "Fragrances": [
                ("Oud Eau de Parfum 100ml", 6999, 25, "Long-lasting woody fragrance."),
                ("Fresh Citrus Body Mist", 1599, 50, "Light, refreshing everyday body mist."),
            ],
            "Grooming": [
                ("Beard Trimmer", 4499, 35, "Rechargeable trimmer with 20 length settings."),
                ("Grooming Kit", 3499, 25, "Travel kit with nail clipper, scissors and tweezers."),
            ],
        },
    },
    "Sports & Fitness": {
        "description": "Gym equipment, cricket gear, cycling and outdoor sports.",
        "subcategories": {
            "Gym Equipment": [
                ("Adjustable Dumbbell Set 20kg", 14999, 12, "Pair of dumbbells with removable plates."),
                ("Yoga Mat 6mm", 2499, 50, "Non-slip yoga mat with a carry strap."),
                ("Resistance Band Set", 1999, 45, "Five resistance levels for home workouts."),
            ],
            "Cricket": [
                ("English Willow Cricket Bat", 17999, 10, "Grade 2 English willow bat for hard-ball cricket."),
                ("Tape Ball Bat", 2999, 40, "Lightweight bat for tape-ball cricket."),
                ("Cricket Batting Gloves", 3499, 25, "Padded batting gloves with a leather palm."),
            ],
            "Outdoor & Cycling": [
                ("Cycling Helmet", 4999, 20, "Ventilated helmet with an adjustable fit."),
                ("Insulated Water Bottle 1L", 1999, 60, "Keeps drinks cold for 24 hours."),
                ("Camping Tent 2-Person", 11999, 10, "Waterproof dome tent with easy setup."),
            ],
        },
    },
    "Watches & Accessories": {
        "description": "Watches, sunglasses, wallets and belts.",
        "subcategories": {
            "Watches": [
                ("Classic Analog Watch", 6999, 25, "Stainless steel case with a leather strap."),
                ("Chronograph Watch", 12999, 12, "Sporty chronograph with a metal bracelet."),
                ("Minimalist Watch", 5499, 30, "Slim dial with a mesh strap."),
            ],
            "Sunglasses": [
                ("Polarized Aviator Sunglasses", 3999, 35, "UV400 polarized lenses with a metal frame."),
                ("Square Frame Sunglasses", 2999, 40, "Lightweight acetate frame."),
            ],
            "Wallets & Belts": [
                ("Leather Bi-Fold Wallet", 2499, 50, "Genuine leather wallet with RFID protection."),
                ("Reversible Leather Belt", 2999, 40, "Black and brown reversible belt."),
                ("Card Holder", 1299, 60, "Slim card holder for six cards."),
            ],
        },
    },
}

CATEGORY_COLOURS = {
    "Shoes": ("#e4f0ec", "#0f5c55"),
    "Clothing": ("#fdf1d2", "#8a5a00"),
    "Bags": ("#f3e6dc", "#7a3e1d"),
    "Electronics": ("#e3e9f3", "#23406b"),
    "Home & Kitchen": ("#eef3e2", "#4d6a1b"),
    "Beauty & Personal Care": ("#f7e4e8", "#8b2c45"),
    "Sports & Fitness": ("#e2f1f6", "#145f78"),
    "Watches & Accessories": ("#ece8f4", "#4b3a7a"),
}

DEMO_CUSTOMERS = [
    ("ayesha", "Ayesha", "Khan", "ayesha@example.com"),
    ("bilal", "Bilal", "Ahmed", "bilal@example.com"),
    ("sana", "Sana", "Malik", "sana@example.com"),
    ("usman", "Usman", "Raza", "usman@example.com"),
]

DEMO_ADDRESSES = [
    "House 12, Street 4, DHA Phase 5, Lahore",
    "Flat 3B, Block 7, Gulshan-e-Iqbal, Karachi",
    "House 45, Sector F-10/2, Islamabad",
    "Street 9, Satellite Town, Rawalpindi",
]
