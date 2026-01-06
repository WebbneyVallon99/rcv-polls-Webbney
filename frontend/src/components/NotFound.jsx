import React from "react";
import "./NotFoundStyles.css";

const NotFound = () => {
  return (
    <div className="not-found-container">
      <h1>404 - Page Not Found</h1>
      <img className="coyote-404" src="/coyote-404.png" alt="Coyote 404" />
    </div>
  );
};

export default NotFound;
