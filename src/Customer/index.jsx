import React from "react";
import CustomerTabs from "./CustomerTabs";
import "./styles/Customer.css";        // ✅ Customer.css ni shu yerga ko‘chir
import "./styles/customerTabs.css";    // ✅ bottom menu css

export default function Customer() {
    return <CustomerTabs />;
}