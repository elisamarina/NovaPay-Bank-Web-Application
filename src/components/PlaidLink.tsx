import React from "react";

interface PlaidLinkProps {
  user?: any;
  variant?: "primary" | "ghost";
}

const PlaidLink: React.FC<PlaidLinkProps> = ({ user, variant = "primary" }) => {
  return (
    <div className="plaid-link-container">
      {/* Plaid integration will go here */}
      {user ? (
        <p>Plaid account linked for {user.email}</p>
      ) : (
        <p>Link your bank account with Plaid</p>
      )}
    </div>
  );
};

export default PlaidLink;
