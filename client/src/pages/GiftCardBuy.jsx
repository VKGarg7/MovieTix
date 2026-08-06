import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { GiftIcon, ArrowRightIcon } from "lucide-react";
import BlurCircle from "../components/BlurCircle";
import PageHeader from "../components/cinematic/PageHeader";
import PillOptionSelector from "../components/PillOptionSelector";
import { useAppContext } from "../context/useAppContext";

const FIXED_AMOUNTS = [10, 25, 50, 100];

const GiftCardBuy = () => {
  const { axios, getToken, user } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [amount, setAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedAmount = customAmount ? Number(customAmount) : amount;

  const handleAmountPill = (value) => {
    setAmount(value);
    setCustomAmount("");
  };

  const purchase = async () => {
    if (!user) return toast.error("Please login to buy a gift card");
    if (!recipientEmail.trim()) return toast.error("Enter a recipient email");
    if (!Number.isFinite(selectedAmount) || selectedAmount < 5 || selectedAmount > 500) {
      return toast.error("Amount must be between 5 and 500");
    }

    setSubmitting(true);
    try {
      const { data } = await axios.post(
        "/api/gift-card/purchase",
        { amount: selectedAmount, recipientEmail: recipientEmail.trim(), message },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        window.location.href = data.url;
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="relative flex flex-col items-center px-6 md:px-16 lg:px-40 pt-36 pb-24 md:pt-52 min-h-[80vh]">
      <BlurCircle top="-100px" left="-100px" />
      <BlurCircle bottom="0px" right="0px" />

      <PageHeader eyebrow="Give a movie night" title="Buy a Gift Card" className="mb-8 text-center" />

      <div className="glass-panel w-full max-w-md p-6 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
          <PillOptionSelector options={FIXED_AMOUNTS} value={amount} onChange={handleAmountPill} renderLabel={(v) => `${currency}${v}`} />
          <input
            type="number"
            min="5"
            max="500"
            placeholder="Custom amount"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="w-full glass-input mt-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Recipient's email</label>
          <input
            type="email"
            placeholder="friend@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="w-full glass-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Message (optional)</label>
          <textarea
            rows={3}
            placeholder="Happy birthday! Go watch something great."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full glass-input resize-none"
          />
        </div>

        <button
          onClick={purchase}
          disabled={submitting}
          className="btn-glow flex items-center justify-center gap-2 mt-2 px-6 py-3 text-sm rounded-full font-medium bg-primary cursor-pointer disabled:opacity-50"
        >
          <GiftIcon className="w-4 h-4" />
          {submitting ? "Processing..." : `Send ${currency}${selectedAmount || 0} Gift Card`}
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default GiftCardBuy;
