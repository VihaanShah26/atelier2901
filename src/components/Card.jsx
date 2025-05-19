import React, { useState } from "react";
import "./Card.css";

const Card = ({ name, image }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="card" onClick={openModal}>
        <img src={image} alt={name} className="card-image" />
        <p className="card-name">{name}</p>
      </div>

      {/* Modal */}
      <div
        className={`${isModalOpen ? "modal-show" : "modal"}`}
        onClick={(evt) => {
          if (evt.target === evt.currentTarget) closeModal();
        }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{name}</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={closeModal}
              />
            </div>
            <div className="modal-body">
              <div className="modal-body-content">
                {/* Image on the left */}
                <div className="modal-image">
                  <img src={image} alt={name} />
                </div>
                {/* Name and Button on the right */}
                <div className="modal-info">
                  <a href="/contact"><button className="modal-order-btn">Order Now</button></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Card;