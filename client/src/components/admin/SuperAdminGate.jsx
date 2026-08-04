import React from "react";
import Title from "./Title";

const SuperAdminGate = ({ adminRole, text1, text2, message, children }) => {
  if (adminRole !== "superAdmin") {
    return (
      <>
        <Title text1={text1} text2={text2} />
        <p className="text-gray-400 mt-6">{message}</p>
      </>
    );
  }

  return children;
};

export default SuperAdminGate;
