import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { PopcornIcon } from "lucide-react";
import { useAppContext } from "../../context/useAppContext";
import { useBookingFlow } from "../../context/BookingFlowContext";
import StepHeader from "../../components/cinematic/StepHeader";
import StepNav from "../../components/cinematic/StepNav";

const currency = import.meta.env.VITE_CURRENCY;

const FoodStep = () => {
  const { axios, selectedTheater } = useAppContext();
  const { state, patch, next, back } = useBookingFlow();

  useEffect(() => {
    const load = async () => {
      if (!selectedTheater?._id) return;
      try {
        const { data } = await axios.get("/api/menu", { params: { theaterId: selectedTheater._id } });
        if (data.success) patch({ menuItems: data.items });
      } catch (error) {
        console.log(error);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTheater]);

  const changeQuantity = (itemId, delta) => {
    const next = Math.max(0, (state.snackQuantities[itemId] || 0) + delta);
    const updated = { ...state.snackQuantities };
    if (next === 0) delete updated[itemId];
    else updated[itemId] = next;
    patch({ snackQuantities: updated });
  };

  const snacksTotal = state.menuItems
    .filter((item) => state.snackQuantities[item._id] > 0)
    .reduce((sum, item) => sum + item.price * state.snackQuantities[item._id], 0);

  return (
    <div>
      <StepHeader step={5} title="Add Snacks & Drinks" />

      {state.menuItems.length === 0 ? (
        <div className="glass-panel p-8 max-w-md flex flex-col items-center text-center gap-2">
          <PopcornIcon className="w-8 h-8 text-gray-500" />
          <p className="text-gray-400 text-sm font-light">No concessions menu available at this theater — you can skip straight to payment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          {state.menuItems.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-4 flex items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{currency}{item.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeQuantity(item._id, -1)}
                  disabled={!state.snackQuantities[item._id]}
                  className="w-7 h-7 rounded-full border border-white/15 cursor-pointer disabled:opacity-30 hover:bg-white/5 transition-colors"
                >
                  -
                </button>
                <span className="w-5 text-center text-sm">{state.snackQuantities[item._id] || 0}</span>
                <button
                  onClick={() => changeQuantity(item._id, 1)}
                  className="w-7 h-7 rounded-full border border-white/15 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  +
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {snacksTotal > 0 && (
        <p className="mt-6 text-sm text-gray-300">
          Snacks total: <span className="font-medium text-white">{currency}{snacksTotal}</span>
        </p>
      )}

      <StepNav onBack={back} onContinue={next} continueLabel="Continue to Payment" />
    </div>
  );
};

export default FoodStep;
