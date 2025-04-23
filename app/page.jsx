"use client";
// styles
import styles from "./page.module.css";

// react
import { useState } from "react";

// stripe
import { loadStripe } from '@stripe/stripe-js';

// Next
import Image from "next/image";
import { useRouter } from "next/navigation";

const Currencies = ["DZD", "EUR", "USD"];

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState(1);
  const [currency, setCurrency] = useState("DZD");
  const [donationMethod, setDonationMethod] = useState(null);
  const router = useRouter();

  // functions
  const handleClick = async (e, name, fnc) => {
    const form = e.target.closest("form");
    if (!form.checkValidity()) {
      form.reportValidity(); // This shows the native validation messages
      return;
    }
    setDonationMethod(name);
    const donationId = await addDonation(name);
    await fnc(donationId);
  };

  const addDonation = async (donationMethod) => {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/addDonation`;
    const headers = {
      "Content-Type": "application/json",
    };
    const payload = {
      name,
      email,
      amount: Number(amount),
      currency,
      method: donationMethod,
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data?.success) {
        throw new Error("Failed to create donation");
      }
      return data.donationId;
    } catch (err) {
      console.error(err);
    }
  };

  const ChargilyPay = async (donationId) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/extra/chargily`, {
        method: "POST",
        headers: {'Content-Type': "application/json"},
        body: JSON.stringify({amount, currency: currency.toLowerCase(), donationId})
      })
      const data = await res.json()
      
      if(!data?.checkoutUrl){
        throw new Error("Couldn't get checkout url")
      }
      router.push(data.checkoutUrl);
      setDonationMethod(null);
    } catch (err) {
      console.error(err);
    }
  };

  const StripePay = async (donationId) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/extra/stripe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({amount, currency, donationId}),
        }
      );
      const data = await res.json()
      if(!data?.sessionId){
        throw new Error("payment operation failed")
      }
      const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISH_KEY);
      const stripe = await stripePromise;
      stripe.redirectToCheckout({ sessionId: data.sessionId });
      setDonationMethod(null);
    } catch (err) {
      console.error(err);
    }
  };

  const convertedAmount = currency == "DZD" ? 140 : 0.5;
  const DonationMethods = [
    {
      name: "Chargily",
      icon: "/chargily.webp",
      condition: currency == "DZD" && amount > 75,
      fnc: ChargilyPay,
    },
    {
      name: "Stripe",
      icon: "/stripe.webp",
      condition: amount >= convertedAmount,
      fnc: StripePay,
    },
  ];

  return (
    <main className={styles.page}>
      <div
        className={`col-lg-6 col-md-9 col-sm-10 col-11 m-auto d-flex align-items-center rounded-3 ${styles.card}`}
      >
        <div className="container text-center">
          <h1>Support Gaza Relief Efforts</h1>
          <p className="py-1" style={{ opacity: ".8" }}>
            Your donation helps deliver vital aid, medical supplies, and relief
            to families affected by the crisis in Gaza. Every contribution
            counts.
          </p>
          <form className="my-4" onSubmit={async (e) => e.preventDefault()}>
            <label
              className="w-100 text-start fs-5 my-2"
              style={{ opacity: ".8" }}
            >
              Full name :
            </label>
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-100 py-2 px-3 rounded-2 ${styles.input}`}
              required
            />
            <label
              className="w-100 text-start fs-5 my-2"
              style={{ opacity: ".8" }}
            >
              Email :
            </label>
            <input
              type="email"
              name="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-100 py-2 px-3 rounded-2 ${styles.input}`}
              required
            />
            <label
              className="w-100 text-start fs-5 my-2"
              style={{ opacity: ".8" }}
            >
              donation amount:
            </label>
            <div className="d-flex">
              <select
                className="rounded-2 px-2"
                style={{ marginRight: "10px" }}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {Currencies.map((currency, index) => (
                  <option key={index} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Enter amount"
                className={`w-100 py-2 px-3 rounded-2 ${styles.input}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={donationMethod == "Chargily" ? 75 : 1}
                required
              />
            </div>
            <p
              className="text-start mt-2"
              style={{ fontSize: ".85rem", opacity: ".8" }}
            >
              ⚠️ Chargily only accepts payments in <strong>DZD</strong> and the
              amount must be greater than <strong>75 DZD</strong>.
            </p>
            <p
              className="text-start mt-2"
              style={{ fontSize: ".85rem", opacity: ".8" }}
            >
              ⚠️ Stripe only accepts payments greater than{" "}
              <strong>
                {convertedAmount} {currency}
              </strong>
              .
            </p>
            <h4 className="my-4">Select a payment method :</h4>
            <div className="d-flex flex-md-row flex-column justify-content-between">
              {DonationMethods.map(({ name, icon, fnc, condition }, index) => (
                <button
                  type="submit"
                  className={`rounded-5 fw-medium px-1 py-2 mb-md-0 mb-2 w-100 mx-2 text-white ${styles.button} `}
                  key={index}
                  style={{ border: "none" }}
                  onClick={(e) => {
                    if (name === "stripe") condition = false;
                    handleClick(e, name, fnc);
                  }}
                  disabled={!condition || donationMethod == name}
                >
                  {donationMethod == name ? (
                    <div className="d-flex justify-content-center align-items-center py-1">
                      <div
                        className="spinner-border spinner-border-sm text-white"
                        role="status"
                      ></div>
                      <div className="mx-2">Loading...</div>
                    </div>
                  ) : (
                    <>
                      <Image
                        src={icon}
                        alt={name}
                        width={30}
                        height={30}
                        className="mx-1"
                      />
                      <span>Donate with {name}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
