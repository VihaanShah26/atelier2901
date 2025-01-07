import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import "./Stationery.css";

const StationeryPage = () => {
    const [premiumStationeryItems, setPremiumStationeryItems] = useState([]);
    const [essentialStationeryItems, setEssentialStationeryItems] = useState([]);

    useEffect(() => {
        const fetchStationery = async () => {
            try {
                const stationeryCollection = collection(db, "stationery_premium");
                const snapshot = await getDocs(stationeryCollection);
                const items = snapshot.docs.map((doc) => doc.data());
                setPremiumStationeryItems(items);
            } catch (error) {
                console.error("Error fetching premium stationery items:", error);
            }
        };

        fetchStationery();
    }, []);

    useEffect(() => {
        const fetchStationery = async () => {
            try {
                const stationeryCollection = collection(db, "stationery_essential");
                const snapshot = await getDocs(stationeryCollection);
                const items = snapshot.docs.map((doc) => doc.data());
                setEssentialStationeryItems(items);
            } catch (error) {
                console.error("Error fetching essential stationery items:", error);
            }
        };

        fetchStationery();
    }, []);

    return (
        <div className="stationery-container">
            <Navbar></Navbar>
            <div className="stationery-page">
                <div className="stationery-title">
                    Premium Cards and Envelopes
                </div>
                <div className="stationery-grid">
                    {premiumStationeryItems.map((item, index) => (
                        <Card key={index} name={item.name} image={item.img} />
                    ))}
                </div>
                <div className="stationery-title">
                    Essential Cards and Envelopes
                </div>
                <div className="stationery-grid">
                    {essentialStationeryItems.map((item, index) => (
                        <Card key={index} name={item.name} image={item.img} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StationeryPage;