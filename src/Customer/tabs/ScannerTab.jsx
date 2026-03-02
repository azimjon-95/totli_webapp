import React, { useState } from "react";
import "../styles/scannerTab.css";

const CATEGORIES = [
    "Katta tortlar",
    "Mini tortlar",
    "Bentolar",
    "Perojniylar",
    "To‘y tortlari"
];

const CAKES = [
    // Katta tortlar
    {
        id: 1, title: "Shokolad Katta Tort", price: "140 000 so'm", category: "Katta tortlar",
        img: "https://images.unsplash.com/photo-1601979031925-8b6e74d4e1d0?w=400&q=80"
    },
    {
        id: 2, title: "Karamel Katta Tort", price: "150 000 so'm", category: "Katta tortlar",
        img: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=400&q=80"
    },
    {
        id: 3, title: "Vanilya Katta Tort", price: "130 000 so'm", category: "Katta tortlar",
        img: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400&q=80"
    },
    {
        id: 4, title: "Qizil Baxmal Tort", price: "160 000 so'm", category: "Katta tortlar",
        img: "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=400&q=80"
    },
    {
        id: 5, title: "Limon Katta Tort", price: "135 000 so'm", category: "Katta tortlar",
        img: "https://images.unsplash.com/photo-1519869325930-281384150729?w=400&q=80"
    },
    {
        id: 6, title: "Mango Katta Tort", price: "145 000 so'm", category: "Katta tortlar",
        img: "https://images.unsplash.com/photo-1562440499-64c9a111f713?w=400&q=80"
    },
    // Mini tortlar
    {
        id: 7, title: "Qulupnay Mini Tort", price: "70 000 so'm", category: "Mini tortlar",
        img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80"
    },
    {
        id: 8, title: "Shokolad Mini Tort", price: "65 000 so'm", category: "Mini tortlar",
        img: "https://images.unsplash.com/photo-1611293388250-580b08c4a145?w=400&q=80"
    },
    {
        id: 9, title: "Malina Mini Tort", price: "72 000 so'm", category: "Mini tortlar",
        img: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80"
    },
    {
        id: 10, title: "Limon Mini Tort", price: "68 000 so'm", category: "Mini tortlar",
        img: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&q=80"
    },
    {
        id: 11, title: "Banan Mini Tort", price: "66 000 so'm", category: "Mini tortlar",
        img: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&q=80"
    },
    {
        id: 12, title: "Gilos Mini Tort", price: "74 000 so'm", category: "Mini tortlar",
        img: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&q=80"
    },
    // Bentolar
    {
        id: 13, title: "Bento Tort", price: "70 000 so'm", category: "Bentolar",
        img: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80"
    },
    {
        id: 14, title: "Matvey Bento", price: "75 000 so'm", category: "Bentolar",
        img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80"
    },
    {
        id: 15, title: "Gulchambar Bento", price: "80 000 so'm", category: "Bentolar",
        img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80"
    },
    {
        id: 16, title: "Shokolad Bento", price: "72 000 so'm", category: "Bentolar",
        img: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80"
    },
    {
        id: 17, title: "Karamel Bento", price: "78 000 so'm", category: "Bentolar",
        img: "https://images.unsplash.com/photo-1600326145552-327f74b9e584?w=400&q=80"
    },
    {
        id: 18, title: "Meva Bento", price: "76 000 so'm", category: "Bentolar",
        img: "https://images.unsplash.com/photo-1562440499-64c9a111f713?w=400&q=80"
    },
    // Perojniylar
    {
        id: 19, title: "Perojniy", price: "20 000 so'm", category: "Perojniylar",
        img: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=400&q=80"
    },
    {
        id: 20, title: "Qulupnay Perojniy", price: "22 000 so'm", category: "Perojniylar",
        img: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&q=80"
    },
    {
        id: 21, title: "Shokolad Perojniy", price: "24 000 so'm", category: "Perojniylar",
        img: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&q=80"
    },
    {
        id: 22, title: "Karamel Perojniy", price: "23 000 so'm", category: "Perojniylar",
        img: "https://images.unsplash.com/photo-1519869325930-281384150729?w=400&q=80"
    },
    {
        id: 23, title: "Limon Perojniy", price: "21 000 so'm", category: "Perojniylar",
        img: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&q=80"
    },
    {
        id: 24, title: "Malina Perojniy", price: "25 000 so'm", category: "Perojniylar",
        img: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&q=80"
    },
];

export default function CakesTab() {
    const [active, setActive] = useState("Katta tortlar");
    const [selected, setSelected] = useState(null);
    const [zoomImg, setZoomImg] = useState(null);
    const [form, setForm] = useState({ name: "", phone: "" });

    const filtered = CAKES.filter(c => c.category === active);

    const handleOrder = () => {
        if (!form.name || !form.phone) return alert("Ism va telefon kiriting");

        const data = {
            cake: selected.title,
            price: selected.price,
            name: form.name,
            phone: form.phone,
            img: selected.img
        };

        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.sendData(JSON.stringify(data));
        } else {
            alert("Telegram ichida oching");
        }
    };

    return (
        <div className="cake-root">

            {/* FILTER BUTTONS */}
            <div className="cake-filters">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        className={`filter-btn ${active === cat ? "active" : ""}`}
                        onClick={() => setActive(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>


            {/* CARDS */}
            <div className="cake-grid">
                {filtered.map(cake => (
                    <div key={cake.id} className="cake-card">
                        <img
                            src={cake.img}
                            alt=""
                            onClick={() => setZoomImg(cake.img)}
                        />
                        <div className="cake-info">
                            <h4>{cake.title}</h4>
                            <p>{cake.price}</p>
                            <button onClick={() => setSelected(cake)}>Zakaz berish</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* IMAGE ZOOM */}
            {zoomImg && (
                <div className="zoom-modal" onClick={() => setZoomImg(null)}>
                    <img src={zoomImg} alt="" />
                </div>
            )}

            {/* ORDER MODAL */}
            {selected && (
                <div className="order-modal">
                    <div className="order-box">
                        <h3>{selected.title}</h3>
                        <input
                            placeholder="Ismingiz"
                            onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                        <input
                            placeholder="Telefon raqamingiz"
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                        />
                        <button onClick={() => setSelected(null)}>Bekor qilish</button>
                        <button onClick={handleOrder}>Yuborish</button>
                    </div>
                </div>
            )}

        </div>
    );
}