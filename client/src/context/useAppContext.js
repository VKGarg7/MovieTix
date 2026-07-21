import { useContext } from "react";
import { AppContext } from "./appContextObject";

export const useAppContext = () => useContext(AppContext);
