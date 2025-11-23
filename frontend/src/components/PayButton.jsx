import { toast } from 'react-toastify';
import api from '../supabase/axios';

export default function PayButton({ orderNumber }) {
  const payNow = async () => {
    try {
      const { data } = await api.post(
        "/api/payments/create-order",
        { order_number: orderNumber },
        { withCredentials: true }
      );

      const { key, rzp } = data;

      const options = {
        key,
        amount: rzp.amount,
        currency: rzp.currency,
        name: "Shahu Mumbai",
        description: `Order ${orderNumber}`,
        order_id: rzp.order_id,
        handler: async (response) => {
          const verifyRes = await api.post(
            "/api/payments/verify",
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            },
            { withCredentials: true }
          );
          alert("Payment Success!");
        },
        theme: {color: "#000000"}
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (err) {
    toast.error(err.response?.data?.message || "Payment initiation failed");
    }
  };

  return (
    <button onClick={payNow}>Pay Now</button>
  );
}



//usage: <PayButton orderNumber="ORD-TEST-2001" />
