import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import "./Gifting.css";

const InvitationsPage = () => {
    const [invites, setInvites] = useState([]);

    useEffect(() => {
        const fetchStationery = async () => {
            try {
                const stationeryCollection = collection(db, "invitations");
                const snapshot = await getDocs(stationeryCollection);
                const items = snapshot.docs.map((doc) => doc.data());
                setInvites(items);
            } catch (error) {
                console.error("Error fetching premium stationery items:", error);
            }
        };

        fetchStationery();
    }, []);

    return (
        <div className="stationery-container">
            <Navbar></Navbar>
            <div className="stationery-page">
                <div className="stationery-title">
                    Invitations
                </div>
                <div className="stationery-grid">
                    {invites.map((item, index) => (
                        <Card key={index} name={item.name} image={item.img} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InvitationsPage;