import { useState, useEffect } from "react";

const shops = [
  {
    name: "AutoFix Garage",
    location: "123 Main St, Anytown",
    services: ["Brake Repair", "Oil Change", "Tire Rotation"],
    rating: 4.5,
  },
  {
    name: "Speedy Motors",
    location: "456 Elm St, Anytown",
    services: ["Engine Tuning", "Transmission Repair"],
    rating: 4.7,
  },
  // Add more shops as needed
];

export default function Marketplace() {
  return (
    <div className="max-w-[1200px] mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Marketplace</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {shops.map((shop, index) => (
          <div key={index} className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{shop.name}</h2>
            <p className="text-gray-600">{shop.location}</p>
            <p className="text-gray-800 mt-2">Services:</p>
            <ul className="list-disc list-inside">
              {shop.services.map((service, idx) => (
                <li key={idx}>{service}</li>
              ))}
            </ul>
            <p className="text-yellow-500 mt-2">Rating: {shop.rating} ⭐</p>
          </div>
        ))}
      </div>
    </div>
  );
}