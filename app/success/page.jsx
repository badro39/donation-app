"use client";
// Next Components
import Link from "next/link";
import { useRouter } from "next/navigation";

// React hooks
import { useEffect } from "react";

export default function Success() {
  const { push } = useRouter();
  useEffect(() => {
    setInterval(() => {
      push(process.env.NEXT_PUBLIC_URL);
    }, 5000);
  }, []);
  return (
    <div style={{ backgroundColor: "#eee" }} className="vh-100 vw-100 d-flex">
      <div className="container text-center m-auto rounded-3 py-3 bg-white col-lg-5 col-md-6 col-sm-10 col-11">
        <i className="bi bi-check-circle-fill text-success text-center fs-1"></i>
        <h3 className="fw-bold">Payment Successful!</h3>
        <p className="text-muted">
          Thank you for your purchase. Your payment has been processed
          successfully.
        </p>
        <p className="text-muted" style={{ opacity: ".7", fontSize: ".9rem" }}>
          You will be automatically redirected to the website in a few seconds
        </p>
        <Link href={process.env.NEXT_PUBLIC_URL}>
          <button
            className="btn text-white"
            style={{ backgroundColor: "#3300cc" }}
          >
            Home Page
          </button>
        </Link>
      </div>
    </div>
  );
}
