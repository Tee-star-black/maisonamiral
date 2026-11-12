"use client";
import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useCallback, useRef } from "react";
import { transitions } from "@/lib/admin/validation";
import s from "./admin.module.css";
type Product = {
  expectedUpdatedAt?: string;
  slug: string;
  name: string;
  price: number;
  category: "apparel" | "accessory";
  edition: string;
  artMark: string;
  shortDescription: string;
  description: string;
  tone: string;
  ink: string;
  images: string[];
  imageLabels: string[];
  status: "draft" | "published" | "archived";
  stock: Record<string, number>;
};
type Row = {
  id: string;
  slug: string;
  data: Product;
  status: Product["status"];
  stock: Record<string, number>;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  consent_at: string;
  total_cents: number;
  notification_status: string;
  tracking: string;
  phone: string;
  address: string;
  suburb: string;
  city: string;
  province: string;
  postal_code: string;
  items: Array<{ name: string; size: string; quantity: number }>;
  event_type: string;
  recipient: string;
  sender: string;
  subject: string;
  body_text: string;
  action: string;
  target: string;
  details: unknown;
};
const sections = [
  "Overview",
  "Products",
  "Orders",
  "Subscribers",
  "Emails",
  "Audit",
] as const;
type Section = (typeof sections)[number];
const empty: Product = {
  slug: "",
  name: "",
  price: 0,
  category: "apparel",
  edition: "Edition 001",
  artMark: "MA",
  shortDescription: "",
  description: "",
  tone: "#151515",
  ink: "#ffffff",
  images: [],
  imageLabels: [],
  status: "draft",
  stock: { S: 0, M: 0, L: 0, XL: 0 },
};
async function api(path: string, body?: unknown) {
  const response = await fetch("/api/admin/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "Request failed");
  return data;
}
const money = (cents: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(
    cents / 100,
  );
const date = (v: string) =>
  new Date(v).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });
const ref = (id: string) =>
  "MA-" + id.replaceAll("-", "").slice(0, 12).toUpperCase();
export function AdminApp() {
  const requestSequence = useRef(0);
  const [session, setSession] = useState<{
    email: string;
    role: string;
  } | null>(null);
  const [checking, setChecking] = useState(true);
  const [section, setSection] = useState<Section>("Overview");
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);
  const [nextStatus, setNextStatus] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [tracking, setTracking] = useState("");
  const [overview, setOverview] = useState<{
    paid_cents: number;
    awaiting: number;
    low_stock: number;
  } | null>(null);
  useEffect(() => {
    api("auth")
      .then(setSession)
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);
  const load = useCallback(async () => {
    if (!session) return;
    const run = ++requestSequence.current;
    setBusy(true);
    setError("");
    try {
      if (section === "Overview") {
        const value = await api("overview");
        if (run !== requestSequence.current) return;
        setOverview(value);
      } else {
        const data = await api(
          section.toLowerCase() +
            "?page=" +
            page +
            "&search=" +
            encodeURIComponent(query),
        );
        if (run !== requestSequence.current) return;
        setRows(data.rows);
        setCount(data.count);
      }
    } catch (e) {
      if (run === requestSequence.current) setError((e as Error).message);
    } finally {
      if (run === requestSequence.current) setBusy(false);
    }
  }, [session, section, page, query]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Fetch external records when the selected section or page changes.
    void load();
  }, [load]);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (checking)
    return (
      <main className={s.shell}>
        <div className={s.login}>Opening store management…</div>
      </main>
    );
  if (!session)
    return (
      <Login
        onLogin={async () => {
          setSession(await api("auth"));
        }}
      />
    );
  const owner = session.role === "owner";
  return (
    <main className={s.shell}>
      <div className={s.layout}>
        <aside className={s.sidebar}>
          <div className={s.brand}>
            MAISON
            <br />
            AMIRAL
          </div>
          <p className={s.sub}>STORE MANAGEMENT</p>
          <nav className={s.nav} aria-label="Store management">
            {sections.map((item) => (
              <button
                key={item}
                aria-current={section === item}
                onClick={() => {
                  requestSequence.current++;
                  setRows([]);
                  setCount(0);
                  setSection(item);
                  setProduct(null);
                  setSelected(null);
                  setPage(0);
                  setQuery("");
                  setSearch("");
                  setMessage("");
                  setError("");
                }}
              >
                {item}
              </button>
            ))}
          </nav>
          <p className={s.quiet}>
            {session.email}
            <br />
            {session.role} · Two-factor protected
          </p>
          <button
            className={s.ghost}
            disabled={busy}
            onClick={() =>
              void action(async () => {
                await api("auth", { action: "logout" });
                setSession(null);
              })
            }
          >
            Sign out
          </button>
          <p>
            <Link href="/shop">Open storefront ↗</Link>
          </p>
        </aside>
        <section className={s.content}>
          <header className={s.header}>
            <div>
              <span className={s.eyebrow}>
                THE HOUSE / {section.toUpperCase()}
              </span>
              <h1>
                {product
                  ? editing
                    ? "Edit product."
                    : "A new piece."
                  : section + "."}
              </h1>
              <p className={s.quiet}>
                Manage the details. Keep the house moving.
              </p>
            </div>
            {section === "Products" && owner && !product && (
              <button
                className={s.primary}
                onClick={() => {
                  setEditing(false);
                  setProduct(structuredClone(empty));
                }}
              >
                Add product +
              </button>
            )}
            <button
              className={s.ghost}
              disabled={busy}
              onClick={() => void load()}
            >
              Refresh
            </button>
          </header>
          {error && (
            <p className={`${s.message} ${s.error}`} role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className={s.message} role="status">
              {message}
            </p>
          )}
          {busy && <p role="status">Working…</p>}
          {section === "Overview" && overview && (
            <>
              <div className={s.stats}>
                <article className={s.panel}>
                  Paid sales · all time
                  <strong>{money(overview.paid_cents)}</strong>
                </article>
                <article className={s.panel}>
                  Orders awaiting EFT<strong>{overview.awaiting}</strong>
                </article>
                <article className={s.panel}>
                  Products with low stock<strong>{overview.low_stock}</strong>
                </article>
              </div>
              <div className={s.panel}>
                <h2>Today’s operations</h2>
                <p>
                  Verify bank receipts before marking orders paid. Stock is
                  deducted when payment is confirmed.
                </p>
                <p>
                  Unpaid EFT orders do not reserve stock. Check availability
                  before asking a customer to pay.
                </p>
                <p>
                  Email delivery events and received replies appear once the
                  Resend webhook and receiving address are connected.
                </p>
              </div>
            </>
          )}
          {product && (
            <form
              className={s.panel}
              onSubmit={(e) => {
                e.preventDefault();
                void action(async () => {
                  await api("products", product);
                  setProduct(null);
                  setMessage(
                    "Product saved. Published changes appear in the shop.",
                  );
                  await load();
                });
              }}
            >
              <div className={s.form}>
                <label>
                  Product name
                  <input
                    required
                    maxLength={120}
                    value={product.name}
                    onChange={(e) =>
                      setProduct({
                        ...product,
                        name: e.target.value,
                        slug: editing
                          ? product.slug
                          : e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/^-|-$/g, ""),
                      })
                    }
                  />
                </label>
                <label>
                  Product address / slug
                  <input
                    required
                    disabled={editing}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    value={product.slug}
                    onChange={(e) =>
                      setProduct({ ...product, slug: e.target.value })
                    }
                  />
                </label>
                <label>
                  Price · ZAR
                  <input
                    required
                    type="number"
                    min="0.01"
                    max="50000"
                    step="0.01"
                    value={product.price || ""}
                    onChange={(e) =>
                      setProduct({ ...product, price: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Category
                  <select
                    value={product.category}
                    onChange={(e) => {
                      const category = e.target.value as Product["category"];
                      setProduct({
                        ...product,
                        category,
                        stock:
                          category === "accessory"
                            ? { "ONE SIZE": 0 }
                            : { S: 0, M: 0, L: 0, XL: 0 },
                      });
                    }}
                  >
                    <option value="apparel">Clothing</option>
                    <option value="accessory">Accessory</option>
                  </select>
                </label>
                <label>
                  Collection / edition
                  <input
                    required
                    maxLength={80}
                    value={product.edition}
                    onChange={(e) =>
                      setProduct({ ...product, edition: e.target.value })
                    }
                  />
                </label>
                <label>
                  Visibility
                  <select
                    value={product.status}
                    onChange={(e) =>
                      setProduct({
                        ...product,
                        status: e.target.value as Product["status"],
                      })
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <label className={s.wide}>
                  Short description
                  <textarea
                    maxLength={300}
                    value={product.shortDescription}
                    onChange={(e) =>
                      setProduct({
                        ...product,
                        shortDescription: e.target.value,
                      })
                    }
                  />
                </label>
                <label className={s.wide}>
                  Full description
                  <textarea
                    maxLength={5000}
                    value={product.description}
                    onChange={(e) =>
                      setProduct({ ...product, description: e.target.value })
                    }
                  />
                </label>
                <div className={s.wide}>
                  <h3>Stock by size</h3>
                  <div className={s.form}>
                    {Object.entries(product.stock).map(([size, quantity]) => (
                      <label key={size}>
                        {size}
                        <input
                          required
                          type="number"
                          min="0"
                          max="100000"
                          step="1"
                          value={quantity}
                          onChange={(e) =>
                            setProduct({
                              ...product,
                              stock: {
                                ...product.stock,
                                [size]: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <div className={s.wide}>
                  <h3>Product gallery</h3>
                  <p className={s.quiet}>
                    The first photograph is the cover. JPEG, PNG or WebP · 8 MB
                    maximum each.
                  </p>
                  <div className={s.images}>
                    {product.images.map((image, index) => (
                      <div className={s.photo} key={image}>
                        <img
                          src={image}
                          alt={
                            product.imageLabels[index] || "Product photograph"
                          }
                        />
                        <label>
                          Image description
                          <input
                            maxLength={120}
                            value={product.imageLabels[index] || ""}
                            onChange={(e) => {
                              const labels = [...product.imageLabels];
                              labels[index] = e.target.value;
                              setProduct({ ...product, imageLabels: labels });
                            }}
                          />
                        </label>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const images = [...product.images],
                                labels = [...product.imageLabels];
                              [images[index - 1], images[index]] = [
                                images[index],
                                images[index - 1],
                              ];
                              [labels[index - 1], labels[index]] = [
                                labels[index],
                                labels[index - 1],
                              ];
                              setProduct({
                                ...product,
                                images,
                                imageLabels: labels,
                              });
                            }}
                          >
                            Move earlier
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setProduct({
                              ...product,
                              images: product.images.filter(
                                (_, i) => i !== index,
                              ),
                              imageLabels: product.imageLabels.filter(
                                (_, i) => i !== index,
                              ),
                            })
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <label style={{ marginTop: 20 }}>
                    Add photographs
                    <input
                      disabled={busy || product.images.length >= 12}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        e.target.value = "";
                        void action(async () => {
                          if (files.length + product.images.length > 12)
                            throw Error("Use a maximum of 12 images.");
                          const added: string[] = [];
                          for (const file of files) {
                            if (file.size > 8 * 1024 * 1024)
                              throw Error("Each image must be under 8 MB.");
                            const response = await fetch("/api/admin/uploads", {
                              method: "POST",
                              headers: { "Content-Type": file.type },
                              body: file,
                            });
                            const value = await response.json();
                            if (!response.ok) throw Error(value.error);
                            added.push(value.url);
                          }
                          setProduct({
                            ...product,
                            images: [...product.images, ...added],
                            imageLabels: [
                              ...product.imageLabels,
                              ...added.map(() => "Product photograph"),
                            ],
                          });
                        });
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className={s.footer}>
                <button
                  className={s.ghost}
                  type="button"
                  disabled={busy}
                  onClick={() => setProduct(null)}
                >
                  Back to products
                </button>
                <button className={s.primary} disabled={busy}>
                  Save{" "}
                  {product.status === "published" ? "and publish" : "product"}
                </button>
              </div>
            </form>
          )}
          {section !== "Overview" && !product && (
            <>
              <form
                className={s.toolbar}
                onSubmit={(e) => {
                  e.preventDefault();
                  setPage(0);
                  setQuery(search);
                }}
              >
                {["Products", "Orders", "Subscribers"].includes(section) && (
                  <>
                    <input
                      aria-label="Search records"
                      placeholder={
                        section === "Products"
                          ? "Search product slug…"
                          : "Search email…"
                      }
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <button className={s.ghost}>Search</button>
                  </>
                )}
              </form>
              <div className={`${s.panel} ${s.scroll}`}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      {(section === "Products"
                        ? ["Piece", "Price", "Stock", "Visibility", ""]
                        : section === "Orders"
                          ? ["Reference", "Customer", "Amount", "Status", ""]
                          : section === "Subscribers"
                            ? ["Email", "Consent recorded", ""]
                            : section === "Emails"
                              ? [
                                  "Event",
                                  "Recipient",
                                  "Subject",
                                  "Received",
                                  "",
                                ]
                              : ["Action", "Record", "When"]
                      ).map((v, i) => (
                        <th key={i}>{v}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id || row.slug || row.email}>
                        {section === "Products" ? (
                          <>
                            <td>
                              {row.data.name}
                              <br />
                              <span className={s.quiet}>{row.slug}</span>
                            </td>
                            <td>{money(row.data.price * 100)}</td>
                            <td>
                              {Object.entries(row.stock)
                                .map(([k, v]) => k + ": " + v)
                                .join(" / ")}
                            </td>
                            <td>
                              <span className={s.tag}>{row.status}</span>
                            </td>
                            <td>
                              {owner && (
                                <button
                                  onClick={() => {
                                    setEditing(true);
                                    setProduct({
                                      ...empty,
                                      ...row.data,
                                      status: row.status,
                                      stock: row.stock,
                                      expectedUpdatedAt: row.updated_at,
                                    });
                                  }}
                                >
                                  Edit
                                </button>
                              )}
                            </td>
                          </>
                        ) : section === "Orders" ? (
                          <>
                            <td>
                              {ref(row.id)}
                              <br />
                              <span className={s.quiet}>
                                {date(row.created_at)}
                              </span>
                            </td>
                            <td>
                              {row.first_name} {row.last_name}
                              <br />
                              {row.email}
                            </td>
                            <td>{money(row.total_cents)}</td>
                            <td>
                              <span className={s.tag}>
                                {row.status.replaceAll("_", " ")}
                              </span>
                              <br />
                              <span className={s.quiet}>
                                Email: {row.notification_status}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => {
                                  setSelected(row);
                                  setNextStatus("");
                                  setPaymentConfirmed(false);
                                  setTracking(row.tracking || "");
                                }}
                              >
                                View order
                              </button>
                            </td>
                          </>
                        ) : section === "Subscribers" ? (
                          <>
                            <td>{row.email}</td>
                            <td>{date(row.consent_at)}</td>
                            <td>
                              {owner && (
                                <button onClick={() => setSelected(row)}>
                                  Unsubscribe
                                </button>
                              )}
                            </td>
                          </>
                        ) : section === "Emails" ? (
                          <>
                            <td>{row.event_type}</td>
                            <td>{row.recipient}</td>
                            <td>{row.subject || "—"}</td>
                            <td>{date(row.created_at)}</td>
                            <td>
                              <button onClick={() => setSelected(row)}>
                                Read
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{row.action}</td>
                            <td>{row.target}</td>
                            <td>{date(row.created_at)}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!rows.length && !busy && <p>No records found.</p>}
              </div>
              <footer className={s.footer}>
                <span className={s.quiet}>
                  {count} records · Page {page + 1}
                </span>
                <div>
                  <button
                    className={s.ghost}
                    disabled={page === 0 || busy}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </button>{" "}
                  <button
                    className={s.ghost}
                    disabled={(page + 1) * 50 >= count || busy}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </footer>
            </>
          )}
          {selected && (
            <div
              className={s.modal}
              role="dialog"
              aria-modal="true"
              aria-label={
                section === "Orders"
                  ? "Order details"
                  : section === "Subscribers"
                    ? "Unsubscribe customer"
                    : "Email details"
              }
              onKeyDown={(e) => {
                if (e.key === "Escape") setSelected(null);
                if (e.key === "Tab") {
                  const nodes = e.currentTarget.querySelectorAll<HTMLElement>(
                    "button:not(:disabled),input,select,textarea,a[href]",
                  );
                  const first = nodes[0],
                    last = nodes[nodes.length - 1];
                  if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last?.focus();
                  } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first?.focus();
                  }
                }
              }}
            >
              <section>
                <button
                  autoFocus
                  className={s.ghost}
                  disabled={busy}
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
                {section === "Orders" ? (
                  <>
                    <h2>{ref(selected.id)}</h2>
                    <p>
                      {selected.first_name} {selected.last_name}
                      <br />
                      {selected.email}
                      <br />
                      {selected.phone}
                    </p>
                    <p>
                      {selected.address}, {selected.suburb}
                      <br />
                      {selected.city}, {selected.province}{" "}
                      {selected.postal_code}
                    </p>
                    {selected.items?.map((item, i) => (
                      <p key={i}>
                        {item.quantity} × {item.name} · {item.size}
                      </p>
                    ))}
                    <strong>{money(selected.total_cents)}</strong>
                    <p>Status: {selected.status}</p>
                    {selected.tracking && <p>Tracking: {selected.tracking}</p>}
                    {owner && transitions[selected.status]?.length > 0 && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          void action(async () => {
                            await api("orders", {
                              id: selected.id,
                              from: selected.status,
                              status: nextStatus,
                              paymentConfirmed,
                              tracking,
                            });
                            setSelected(null);
                            setMessage("Order updated.");
                            await load();
                          });
                        }}
                      >
                        <label>
                          Change status
                          <select
                            required
                            value={nextStatus}
                            onChange={(e) => setNextStatus(e.target.value)}
                          >
                            <option value="">Select next step</option>
                            {transitions[selected.status].map((status) => (
                              <option key={status}>{status}</option>
                            ))}
                          </select>
                        </label>
                        {nextStatus === "paid" && (
                          <label style={{ display: "block", margin: "20px 0" }}>
                            <input
                              type="checkbox"
                              required
                              checked={paymentConfirmed}
                              onChange={(e) =>
                                setPaymentConfirmed(e.target.checked)
                              }
                            />{" "}
                            I checked the bank account and confirmed the full
                            payment has cleared.
                          </label>
                        )}
                        {nextStatus === "shipped" && (
                          <label>
                            Courier and tracking reference
                            <input
                              required
                              maxLength={200}
                              value={tracking}
                              onChange={(e) => setTracking(e.target.value)}
                            />
                          </label>
                        )}
                        <button
                          className={s.primary}
                          style={{ marginTop: 20 }}
                          disabled={busy || !nextStatus}
                        >
                          Confirm change
                        </button>
                      </form>
                    )}
                  </>
                ) : section === "Subscribers" ? (
                  <>
                    <h2>Unsubscribe this address?</h2>
                    <p>{selected.email}</p>
                    <p>
                      This removes the address from the active mailing list. The
                      action is recorded.
                    </p>
                    <button
                      className={s.primary}
                      disabled={busy}
                      onClick={() =>
                        void action(async () => {
                          await api("subscribers", { email: selected.email });
                          setSelected(null);
                          setMessage("Subscriber removed.");
                          await load();
                        })
                      }
                    >
                      Confirm unsubscribe
                    </button>
                  </>
                ) : (
                  <>
                    <h2>{selected.subject || selected.event_type}</h2>
                    <p>
                      {selected.sender || selected.recipient} ·{" "}
                      {date(selected.created_at)}
                    </p>
                    <div className={s.body}>
                      {selected.body_text ||
                        "Delivery event. No message body is included."}
                    </div>
                  </>
                )}
              </section>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
function Login({ onLogin }: { onLogin: () => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [factor, setFactor] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (factor) {
        await api("auth", { action: "verify", factorId: factor, code });
        await onLogin();
      } else {
        const data = await api("auth", { action: "login", email, password });
        setPassword("");
        if (data.needsEnrollment) {
          const enrollment = await api("auth", { action: "enroll" });
          setFactor(enrollment.factorId);
          setQr(enrollment.qr);
          setSecret(enrollment.secret);
        } else setFactor(data.factorId);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={s.shell}>
      <section className={s.login}>
        <div className={s.brand}>MAISON AMIRAL</div>
        <p className={s.eyebrow}>PRIVATE STORE MANAGEMENT</p>
        <h1>{factor ? "Verify it’s you." : "Welcome to the house."}</h1>
        <p className={s.quiet}>
          {factor
            ? "Enter the six-digit code from your authenticator."
            : "Sign in with your approved owner or staff account."}
        </p>
        {error && (
          <p role="alert" className={`${s.message} ${s.error}`}>
            {error}
          </p>
        )}
        {qr && (
          <>
            <p>
              Scan this code with your authenticator app. Save the setup key
              securely.
            </p>
            <img
              src={
                qr.startsWith("data:")
                  ? qr
                  : "data:image/svg+xml;charset=utf-8," + encodeURIComponent(qr)
              }
              width={220}
              height={220}
              alt="Authenticator setup QR code"
            />
            <p style={{ overflowWrap: "anywhere" }}>{secret}</p>
          </>
        )}
        <form onSubmit={submit}>
          {factor ? (
            <label>
              Authenticator code
              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
          ) : (
            <>
              <label>
                Email address
                <input
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  required
                  maxLength={200}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            </>
          )}
          <button className={s.primary} disabled={busy}>
            {busy
              ? "Please wait…"
              : factor
                ? "Verify and open dashboard"
                : "Continue securely"}
          </button>
        </form>
        <p className={s.quiet}>
          Accounts are provisioned by the store administrator. Sessions expire
          after one hour.
        </p>
        <Link href="/shop">Return to the shop</Link>
      </section>
    </main>
  );
}
