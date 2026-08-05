const BlurCircle = ({
  top = "auto",
  left = "auto",
  right = "auto",
  bottom = "auto",
}) => {
  return (
    <div
      className="absolute -z-10 h-72 w-72 aspect-square rounded-full bg-gradient-to-br from-primary/25 via-nebula-violet/20 to-transparent blur-3xl"
      style={{ top, left, right, bottom }}
    ></div>
  );
};

export default BlurCircle;
