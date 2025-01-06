import React from "react";
import "./Card.css";

const Card = ({ name, image }) => {
  return (
    <div className="card">
      <img src={image} alt={name} className="card-image" />
      <p className="card-name">{name}</p>
    </div>
  );
};

export default Card;