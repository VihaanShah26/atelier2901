import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import "./Stationery.css";

const StationeryPage = () => {
  const [stationeryItems, setStationeryItems] = useState([]);

  useEffect(() => {
    const fetchStationery = async () => {
      try {
        const stationeryCollection = collection(db, "stationery");
        const snapshot = await getDocs(stationeryCollection);
        const items = snapshot.docs.map((doc) => doc.data());
        setStationeryItems(items);
      } catch (error) {
        console.error("Error fetching stationery items:", error);
      }
    };

    fetchStationery();
  }, []);

  return (
    <div className="stationery-container">
        <Navbar></Navbar>
        <div className="stationery-page">
        <div className="stationery-grid">
            {stationeryItems.map((item, index) => (
            <Card key={index} name={item.name} image={item.img} />
            ))}
        </div>
        </div>
    </div>
  );
};

export default StationeryPage;