import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { PopcornIcon, CupSodaIcon, SandwichIcon, CandyIcon, SparklesIcon } from "lucide-react";
import { useAppContext } from "../../context/useAppContext";
import { useBookingFlow } from "../../context/BookingFlowContext";
import StepHeader from "../../components/cinematic/StepHeader";
import StepNav from "../../components/cinematic/StepNav";

const currency = import.meta.env.VITE_CURRENCY;

const CATEGORY_RULES = [
  { key: "popcorn", label: "Popcorn", icon: PopcornIcon, match: /popcorn/i },
  { key: "drinks", label: "Drinks", icon: CupSodaIcon, match: /coke|pepsi|soda|drink|juice|water|coffee|tea|shake/i },
  { key: "combos", label: "Combos", icon: SandwichIcon, match: /combo|meal|burger|sandwich|pizza|nachos|fries/i },
  { key: "snacks", label: "Snacks", icon: CandyIcon, match: /.*/ },
];

const categorize = (item) => CATEGORY_RULES.find((c) => c.match.test(item.name))?.key || "snacks";

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
    const nextQty = Math.max(0, (state.snackQuantities[itemId] || 0) + delta);
    const updated = { ...state.snackQuantities };
    if (nextQty === 0) delete updated[itemId];
    else updated[itemId] = nextQty;
    patch({ snackQuantities: updated });
  };

  const grouped = useMemo(() => {
    const groups = {};
    state.menuItems.forEach((item) => {
      const key = categorize(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [state.menuItems]);

  const combo = useMemo(() => {
    const popcorn = grouped.popcorn?.[0];
    const drink = grouped.drinks?.[0];
    if (!popcorn || !drink) return null;
    const bundlePrice = popcorn.price + drink.price * 2;
    const savings = Math.round(bundlePrice * 0.15);
    return { popcorn, drink, bundlePrice: bundlePrice - savings, savings };
  }, [grouped]);

  const applyCombo = () => {
    if (!combo) return;
    changeQuantity(combo.popcorn._id, 1);
    changeQuantity(combo.drink._id, 2);
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
        <>
          {combo && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-5 mb-8 max-w-2xl flex items-center justify-between gap-4 flex-wrap border-primary/30"
              style={{ boxShadow: "0 0 30px -12px rgba(248,69,101,0.5)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                  <SparklesIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Movie Combo</p>
                  <p className="text-xs text-gray-400 mt-0.5">{combo.popcorn.name} + 2x {combo.drink.name}</p>
                  <p className="text-xs text-nebula-cyan mt-0.5">Save {currency}{combo.savings}</p>
                </div>
              </div>
              <button
                onClick={applyCombo}
                className="px-5 py-2.5 text-xs font-medium bg-primary hover:bg-primary-dull transition-colors rounded-full cursor-pointer shrink-0"
              >
                Add Combo · {currency}{combo.bundlePrice}
              </button>
            </motion.div>
          )}

          <div className="flex flex-col gap-8 max-w-3xl">
            {CATEGORY_RULES.map(({ key, label, icon: Icon }) => {
              const items = grouped[key];
              if (!items || items.length === 0) return null;
              return (
                <div key={key}>
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary" /> {label}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.map((item) => (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel glass-panel-hover p-4 flex items-center gap-4"
                      >
                        <div className="w-14 h-14 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Icon className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{currency}{item.price}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
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
                </div>
              );
            })}
          </div>
        </>
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
