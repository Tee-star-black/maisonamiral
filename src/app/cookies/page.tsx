export const metadata = {
  title: "Cookie Policy",
  description: "Maison Amiral cookie policy and information about how the website uses browser storage and related technologies.",
};

const sections = [
  ["01", "What cookies are", "Cookies are small pieces of data stored by your browser. They can help a website remember preferences, maintain a shopping session and understand how the site is being used."],
  ["02", "How Maison Amiral uses them", "We may use essential cookies or browser storage for core functions such as the shopping bag, checkout continuity and site preferences. These technologies are used to support the operation of the store rather than to create unnecessary tracking."],
  ["03", "Analytics", "If analytics tools are enabled, they may collect limited information about visits, page performance and interactions so we can improve the experience. Where consent is required, non-essential analytics should only operate after consent is provided."],
  ["04", "Third-party services", "Some functions may rely on third-party providers such as payment, email, hosting or analytics services. Those providers may set their own cookies or process technical information according to their respective privacy policies."],
  ["05", "Managing cookies", "You can control or delete cookies through your browser settings. Disabling essential storage may affect functions such as the shopping bag or checkout."],
  ["06", "Contact", "For questions about this policy or the way Maison Amiral handles website data, contact support@maisonamiral.co.za."],
] as const;

export default function CookiePolicyPage() {
  return (
    <main className="legal-page">
      <div className="legal-page-shell">
        <aside className="legal-page-index">
          MAISON AMIRAL<br />LEGAL / 003<br />UPDATED 2026
        </aside>
        <article className="legal-page-content">
          <h1>Cookie<br />Policy.</h1>
          {sections.map(([number, title, copy]) => (
            <section className="legal-section" key={number}>
              <span>{number}</span>
              <div>
                <h2>{title}</h2>
                <p>{copy}</p>
              </div>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
