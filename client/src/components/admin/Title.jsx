import React from "react";

const Title = ({ text1, text2 }) => {
  return (
    <h1 className="font-semibold text-3xl tracking-tight">
      {text1} <span className="text-primary">{text2}</span>
    </h1>
  );
};

export default Title;
