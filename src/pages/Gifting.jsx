import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import "./Gifting.css";

const GiftingPage = () => {
    const [coasters, setCoasters] = useState([]);
    const [wine, setWine] = useState([]);
    const [travel, setTravel] = useState([]);
    // const [essentialStationeryItems, setEssentialStationeryItems] = useState([]);

    useEffect(() => {
        const fetchStationery = async () => {
            try {
                const stationeryCollection = collection(db, "gifting_coasters");
                const snapshot = await getDocs(stationeryCollection);
                const items = snapshot.docs.map((doc) => doc.data());
                setCoasters(items);
            } catch (error) {
                console.error("Error fetching premium stationery items:", error);
            }
        };

        fetchStationery();
    }, []);

    useEffect(() => {
        const fetchStationery = async () => {
            try {
                const stationeryCollection = collection(db, "gifting_wine");
                const snapshot = await getDocs(stationeryCollection);
                const items = snapshot.docs.map((doc) => doc.data());
                setWine(items);
            } catch (error) {
                console.error("Error fetching essential stationery items:", error);
            }
        };

        fetchStationery();
    }, []);

    useEffect(() => {
        const fetchStationery = async () => {
            try {
                const stationeryCollection = collection(db, "gifting_travel");
                const snapshot = await getDocs(stationeryCollection);
                const items = snapshot.docs.map((doc) => doc.data());
                setTravel(items);
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
                    Coasters
                </div>
                <div className="stationery-grid">
                    {coasters.map((item, index) => (
                        <Card key={index} name={item.name} image={item.img} />
                    ))}
                </div>
                <div className="stationery-title">
                    Wine Bags
                </div>
                <div className="stationery-grid">
                    {wine.map((item, index) => (
                        <Card key={index} name={item.name} image={item.img} />
                    ))}
                </div>
                <div className="stationery-title">
                    Travel Accessories
                </div>
                <div className="stationery-grid">
                    {travel.map((item, index) => (
                        <Card key={index} name={item.name} image={item.img} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GiftingPage;