import React from "react";

const ORDINALS = ["One", "Two", "Three", "Four", "Five", "Six"];

const StepHeader = ({ step, title }) => (
  <>
    <p className="section-eyebrow mb-2">Step {ORDINALS[step - 1] || step}</p>
    <h1 className="text-3xl md:text-4xl font-display font-medium mb-8">{title}</h1>
  </>
);

export default StepHeader;
