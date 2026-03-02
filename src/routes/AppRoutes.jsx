import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import App from "../App";
import Receipt from "../pages/Receipt";
import Customer from "../Customer"; // ✅ YANGI PAGE

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/receipt" element={<Receipt />} />

            {/* ✅ Customer single page */}
            <Route path="/customer" element={<Customer />} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
