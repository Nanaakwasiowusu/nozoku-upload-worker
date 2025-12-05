// src/pages/Terms.jsx
import React from "react";

function Terms() {
  return (
    <div style={{ maxWidth: "900px", margin: "40px auto", padding: "10px", color: "#eee", fontFamily: "sans-serif" }}>
      <h1 style={{ borderBottom: "2px solid #ff69b4", paddingBottom: "10px" }}>
        Nozoku — Terms & Rules
      </h1>

      <p style={{ marginTop: "15px", color: "#aaa" }}>
        Last updated: {new Date().toLocaleDateString()}
      </p>

      {/* GENERAL RULES */}
      <section>
        <h2>General Platform Rules</h2>
        <ul>
          <li>Users are responsible for their account security and activity.</li>
          <li>Accounts must use truthful and accurate information.</li>
          <li>Impersonation of any person, brand, or organization is prohibited.</li>
          <li>Scams, fraud, threats, and abusive behavior are not allowed.</li>
          <li>Destroying user experience through spam or automation is forbidden.</li>
        </ul>
      </section>

      {/* CONTENT RULES */}
      <section>
        <h2>Content Guidelines</h2>
        <ul>
          <li>You may only upload content you own or are authorized to use.</li>
          <li>Copyrighted or stolen content will be removed.</li>
          <li>No misleading titles, previews, or descriptions.</li>
          <li>Non-consensual or exploitative material is strictly forbidden.</li>
          <li>Extremely violent or graphic content is not allowed.</li>
          <li>Personal data of others may not be shared without permission.</li>
        </ul>
      </section>

      {/* CREATOR RULES */}
      <section>
        <h2>Monetization & Creator Rules</h2>
        <ul>
          <li>Identity verification is required before monetization.</li>
          <li>Fake or stolen documents result in permanent bans.</li>
          <li>Nozoku may approve, deny, or revoke monetization at any time.</li>
          <li>Fake engagement, bots, or money manipulation are prohibited.</li>
          <li>Withdrawals may be delayed if verification or settings are incomplete.</li>
        </ul>
      </section>

      {/* PRIVACY */}
      <section>
        <h2>Privacy & Security</h2>
        <ul>
          <li>User wallets and transactions are private.</li>
          <li>Activity may be monitored to prevent fraud.</li>
          <li>Security violations lead to account action without warning.</li>
        </ul>
      </section>

      {/* ENFORCEMENT */}
      <section>
        <h2>Rule Enforcement</h2>
        <ul>
          <li>Violations may result in warnings or removal.</li>
          <li>Creators may lose monetization for breaking rules.</li>
          <li>Accounts may be suspended or banned without notice.</li>
          <li>No refunds are provided for banned accounts.</li>
        </ul>
      </section>

      {/* LEGAL */}
      <section>
        <h2>Legal Disclaimer</h2>
        <ul>
          <li>Nozoku is not responsible for user-generated content.</li>
          <li>Creators are responsible for their own earnings and conduct.</li>
          <li>The service is used at your own risk.</li>
        </ul>
      </section>

      {/* ACCEPTANCE */}
      <section style={{ marginTop: "30px", paddingTop: "15px", borderTop: "1px solid #555", color: "#ccc" }}>
        <h2>Acceptance</h2>
        <p>
          By using Nozoku or enabling monetization, you agree to follow all rules
          in this policy. Violations may result in loss of account privileges
          or permanent suspension.
        </p>
      </section>
    </div>
  );
}

export default Terms;
