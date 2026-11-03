import { useState, useEffect, useRef } from "react";
import { initialData, transact, status, money } from "./domain";
import "./App.css";
import { Icon, ProductIcon, StatusBadge } from "./Icons";
import { navIcons, actionIcon } from "./iconNames";
const KEY = "any-boutique-demo-v1";
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { data: structuredClone(initialData) };
    const data = JSON.parse(raw);
    if (
      data.version !== 1 ||
      !["products", "suppliers", "sales", "orders", "movements"].every((k) =>
        Array.isArray(data[k]),
      ) ||
      !data.settings
    )
      throw Error();
    return { data };
  } catch {
    return {
      data: structuredClone(initialData),
      error:
        "No se pudieron leer los datos guardados. No se sobrescribirán hasta que confirmes una operación.",
    };
  }
}
function Button({ children, primary = false, ...props }) {
  return (
    <button className={primary ? "primary" : ""} {...props}>
      <Icon name={actionIcon(typeof children === "string" ? children : "")} />{children}
    </button>
  );
}
function Field({ label, children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children || <input {...props} />}
    </label>
  );
}
function Table({ headers, rows }) {
  return (
    <div className="panel table-wrap">
      <table className={headers.length === 11 ? "inventory-table" : undefined}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="empty">No hay registros para mostrar.</p>}
      <p className="muted table-footer">{rows.length} registros</p>
    </div>
  );
}
const titles = {
  Inventario: "Inventario de productos",
  Ventas: "Gestión de ventas",
  Compras: "Gestión de compras",
  Reportes: "Reportes e indicadores",
  Alertas: "Centro de alertas",
  Configuración: "Configuración del sistema",
  Movimientos: "Historial de movimientos",
};
function App() {
  const [loaded] = useState(load),
    [data, setData] = useState(loaded.data),
    [page, setPage] = useState("Inventario"),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [size, setSize] = useState(""),
    [state, setState] = useState(""),
    [modal, setModal] = useState(null),
    [form, setForm] = useState(null),
    [notice, setNotice] = useState(loaded.error || ""),
    [error, setError] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const dialogRef = useRef(null);
  useEffect(() => {
    if (modal && dialogRef.current && !dialogRef.current.open)
      dialogRef.current.showModal();
  }, [modal]);
  const alerts = data.products.filter((p) => status(p) !== "Disponible");
  function go(p) {
    setPage(p);
    setQuery("");
    setForm(null);
    setError("");
  }
  function commit(action) {
    try {
      const next = transact(data, action);
      localStorage.setItem(KEY, JSON.stringify(next));
      setData(next);
      setNotice(
        "Operación completada. Los datos se guardaron en este navegador.",
      );
      setError("");
      setModal(null);
      setForm(null);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "any-boutique-respaldo.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const matches = (s) => String(s).toLowerCase().includes(query.toLowerCase());
  const products = data.products.filter(
    (p) =>
      matches(`${p.name} ${p.sku} ${p.color}`) &&
      (!category || p.category === category) &&
      (!size || p.size === size) &&
      (!state || status(p) === state),
  );
  const activeSales = data.sales.filter(
    (s) =>
      s.state === "Confirmada" &&
      (!from || s.date.slice(0, 10) >= from) &&
      (!to || s.date.slice(0, 10) <= to),
  );
  const salesTotal = activeSales.reduce((s, x) => s + x.total, 0);
  function newOrder(p) {
    go("Compras");
    setForm({
      type: "order",
      lines: p ? [{ sku: p.sku, qty: Math.max(1, p.max - p.stock) }] : [],
    });
  }
  return (
    <div className="app-shell">
      <aside>
        <div className="brand">
          <span className="brand-mark"><Icon name="bag" size={23} /></span>
          <strong>Any Boutique</strong>
        </div>
        <p className="tagline">Moda que te hace brillar</p>
        <nav aria-label="Menú principal">
          {[
            "Inventario",
            "Ventas",
            "Compras",
            "Reportes",
            "Alertas",
            "Movimientos",
            "Configuración",
          ].map((p) => (
            <button
              key={p}
              className={p === page ? "active" : ""}
              onClick={() => go(p)}
            >
              <Icon name={navIcons[p]} size={20} />
              {p}
            </button>
          ))}
        </nav>
        <div className="sidebar-alert">
          <p>
            {alerts.filter((p) => p.stock <= p.min).length} productos necesitan
            reposición
          </p>
          <button onClick={() => go("Alertas")}>Revisar alertas</button>
        </div>
        <p className="demo-label">
          Demostración local
          <br />
          Sin conexión a Supabase
        </p>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <label className="global-search">
            <Icon name="search" size={18} />
            <input
              aria-label="Buscar en inventario"
              placeholder="Buscar productos…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage("Inventario");
                setForm(null);
              }}
            />
          </label>
          <button
            className="notification"
            aria-label="Ver alertas"
            onClick={() => go("Alertas")}
          >
            <Icon name="bell" size={22} />
            {alerts.length}
          </button>
          <div className="profile">
            <span className="avatar">AB</span>
            <div>
              Sesión de demostración<small>Administración local</small>
            </div>
          </div>
        </header>
        <main>
          <p className="breadcrumb">ANY BOUTIQUE / {page.toUpperCase()}</p>
          <div className="heading">
            <div>
              <h1>
                {form
                  ? form.type === "sale"
                    ? "Registrar nueva venta"
                    : form.type === "order"
                      ? "Nueva orden de compra"
                      : "Nuevo proveedor"
                  : titles[page]}
              </h1>
              <p className="muted">Gestiona tu boutique desde un solo lugar.</p>
            </div>
            {!form && page === "Inventario" && (
              <Button
                primary
                onClick={() => {
                  setError("");
                  setModal({ type: "product" });
                }}
              >
                Agregar producto
              </Button>
            )}
            {!form && page === "Ventas" && (
              <Button
                primary
                onClick={() => setForm({ type: "sale", lines: [] })}
              >
                Nueva venta
              </Button>
            )}
            {!form && page === "Compras" && (
              <div className="actions">
                <Button onClick={() => setForm({ type: "supplier" })}>
                  Nuevo proveedor
                </Button>
                <Button primary onClick={() => newOrder()}>
                  Nueva compra
                </Button>
              </div>
            )}
            {page === "Alertas" && (
              <Button primary onClick={() => go("Inventario")}>
                Ver inventario
              </Button>
            )}
            {page === "Reportes" && (
              <Button onClick={exportData}>Exportar datos</Button>
            )}
          </div>
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button aria-label="Cerrar aviso" onClick={() => setNotice("")}>
                ×
              </button>
            </div>
          )}
          {error && !modal && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {form ? (
            form.type === "supplier" ? (
              <SupplierForm
                onCancel={() => setForm(null)}
                onSave={(supplier) => commit({ type: "supplier", supplier })}
              />
            ) : (
              <TransactionForm
                key={`${form.type}-${page}`}
                type={form.type}
                initialLines={form.lines}
                data={data}
                onCancel={() => setForm(null)}
                onSave={commit}
              />
            )
          ) : (
            <>
              {page === "Inventario" && (
                <>
                  <div className="panel filters">
                    <input
                      aria-label="Buscar producto o código"
                      placeholder="Buscar producto o código"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <select
                      aria-label="Categoría"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">Todas las categorías</option>
                      {[...new Set(data.products.map((p) => p.category))].map(
                        (c) => (
                          <option key={c}>{c}</option>
                        ),
                      )}
                    </select>
                    <select
                      aria-label="Talla"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                    >
                      <option value="">Todas las tallas</option>
                      {[...new Set(data.products.map((p) => p.size))].map(
                        (s) => (
                          <option key={s}>{s}</option>
                        ),
                      )}
                    </select>
                    <select
                      aria-label="Estado"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    >
                      <option value="">Todos los estados</option>
                      {["Disponible", "Stock bajo", "Agotado", "Exceso"].map(
                        (s) => (
                          <option key={s}>{s}</option>
                        ),
                      )}
                    </select>
                    <Button
                      onClick={() => {
                        setQuery("");
                        setCategory("");
                        setSize("");
                        setState("");
                      }}
                    >
                      Limpiar
                    </Button>
                  </div>
                  <Table
                    headers={[
                      "Producto",
                      "Código",
                      "Categoría",
                      "Talla",
                      "Color",
                      "Compra",
                      "Venta",
                      "Disponible",
                      "Stock mín.",
                      "Estado",
                      "Acciones",
                    ]}
                    rows={products.map((p) => [
                      <span key="product" className="product-cell">
                        <ProductIcon product={p} />
                        {p.name}
                      </span>,
                      p.sku,
                      p.category,
                      p.size,
                      p.color,
                      money(p.cost),
                      money(p.price),
                      p.stock,
                      p.min,
                      <StatusBadge key="status" value={status(p)} />,
                      <div key="actions" className="row-actions">
                        <button
                          title="Ver detalle"
                          aria-label={`Ver ${p.name}`}
                          onClick={() =>
                            setModal({ type: "detail", product: p })
                          }
                        >
                          <Icon name="eye" />
                        </button>
                        <button
                          title="Editar producto"
                          aria-label={`Editar ${p.name}`}
                          onClick={() =>
                            setModal({ type: "product", product: p })
                          }
                        >
                          <Icon name="edit" />
                        </button>
                        <button
                          title="Conteo físico"
                          aria-label={`Contar ${p.name}`}
                          onClick={() =>
                            setModal({ type: "count", product: p })
                          }
                        >
                          <Icon name="clipboard" />
                        </button>
                      </div>,
                    ])}
                  />
                </>
              )}
              {page === "Ventas" && (
                <>
                  <div className="panel filters">
                    <input
                      aria-label="Buscar venta"
                      placeholder="Buscar venta o cliente"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <Table
                    headers={[
                      "N.º venta",
                      "Fecha",
                      "Cliente",
                      "Productos",
                      "Total",
                      "Método de pago",
                      "Estado",
                      "Acciones",
                    ]}
                    rows={data.sales
                      .filter((s) => matches(`${s.reference} ${s.customer}`))
                      .map((s) => [
                        s.reference,
                        new Date(s.date).toLocaleDateString("es-NI"),
                        s.customer,
                        s.lines.map((l) => `${l.name} × ${l.qty}`).join(", "),
                        money(s.total),
                        s.payment,
                        <StatusBadge key="status" value={s.state} />,
                        <div key="actions" className="actions">
                          <Button
                            onClick={() =>
                              setModal({ type: "transaction", record: s })
                            }
                          >
                            Ver
                          </Button>
                          {s.state === "Confirmada" && (
                            <Button
                              onClick={() =>
                                setModal({ type: "cancelSale", record: s })
                              }
                            >
                              Anular
                            </Button>
                          )}
                        </div>,
                      ])}
                  />
                </>
              )}
              {page === "Compras" && (
                <>
                  <div className="panel filters">
                    <input
                      aria-label="Buscar orden"
                      placeholder="Buscar orden"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <Table
                    headers={[
                      "N.º orden",
                      "Proveedor",
                      "Fecha",
                      "Productos",
                      "Total",
                      "Estado",
                      "Acciones",
                    ]}
                    rows={data.orders
                      .filter((o) => matches(o.reference))
                      .map((o) => [
                        o.reference,
                        data.suppliers.find((s) => s.id === o.supplier)?.name,
                        new Date(o.date).toLocaleDateString("es-NI"),
                        o.lines.reduce((s, l) => s + l.qty, 0) + " prendas",
                        money(o.total),
                        <StatusBadge key="status" value={o.state} />,
                        <div key="actions" className="actions">
                          <Button
                            onClick={() =>
                              setModal({ type: "transaction", record: o })
                            }
                          >
                            Ver
                          </Button>
                          {o.state === "Pendiente" && (
                            <>
                              <Button
                                onClick={() =>
                                  commit({ type: "approve", id: o.id })
                                }
                              >
                                Aprobar
                              </Button>
                              <Button
                                onClick={() =>
                                  commit({ type: "reject", id: o.id })
                                }
                              >
                                Rechazar
                              </Button>
                            </>
                          )}
                          {o.state === "Aprobada" && (
                            <Button
                              onClick={() =>
                                setModal({ type: "receive", record: o })
                              }
                            >
                              Recibir
                            </Button>
                          )}
                        </div>,
                      ])}
                  />
                  <section className="panel">
                    <h2>Proveedores disponibles</h2>
                    {data.suppliers.map((s) => (
                      <p key={s.id}>
                        <strong>{s.name}</strong> · {s.contact} ·{" "}
                        {s.phone || "Sin teléfono"}
                      </p>
                    ))}
                  </section>
                </>
              )}
              {page === "Alertas" && (
                <>
                  <p>
                    {alerts.length} variantes requieren revisión ·{" "}
                    {data.orders.filter((o) => o.state === "Pendiente").length}{" "}
                    compras pendientes
                  </p>
                  {alerts.map((p) => (
                    <section className="panel alert-card" key={p.sku}>
                      <ProductIcon product={p} size={40} />
                      <div>
                        <p className="muted">
                          {status(p)} · {p.sku}
                        </p>
                        <h2>{p.name}</h2>
                        <p>
                          Talla {p.size} · {p.color} · Disponible: {p.stock} ·
                          Mínimo: {p.min} · Máximo: {p.max}
                        </p>
                        <p>
                          {p.stock > p.max
                            ? "Revisar rotación antes de comprar más."
                            : "Recomendación: evaluar el reabastecimiento."}
                        </p>
                      </div>
                      <div className="alert-actions">
                        <Button
                          onClick={() =>
                            setModal({ type: "detail", product: p })
                          }
                        >
                          Ver producto
                        </Button>
                        {p.stock <= p.min && (
                          <Button primary onClick={() => newOrder(p)}>
                            Crear orden de compra
                          </Button>
                        )}
                      </div>
                    </section>
                  ))}
                  {!alerts.length && (
                    <p className="panel">No hay alertas de existencias.</p>
                  )}
                </>
              )}
              {page === "Movimientos" && (
                <Table
                  headers={[
                    "Fecha",
                    "Código",
                    "Tipo",
                    "Cambio",
                    "Saldo",
                    "Referencia",
                    "Motivo",
                    "Responsable",
                  ]}
                  rows={data.movements.map((m) => [
                    new Date(m.date).toLocaleString("es-NI"),
                    m.sku,
                    m.type,
                    m.delta > 0 ? `+${m.delta}` : m.delta,
                    m.balance,
                    m.reference,
                    m.reason,
                    m.actor,
                  ])}
                />
              )}
              {page === "Reportes" && (
                <>
                  <div className="panel filters">
                    <Field label="Desde">
                      <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                      />
                    </Field>
                    <Field label="Hasta">
                      <input
                        type="date"
                        min={from}
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                      />
                    </Field>
                    <Button
                      onClick={() => {
                        setFrom("");
                        setTo("");
                      }}
                    >
                      Todo el período
                    </Button>
                  </div>
                  <div className="stats">
                    {[
                      ["Total de ventas", money(salesTotal)],
                      [
                        "Productos vendidos",
                        activeSales.reduce(
                          (s, x) => s + x.lines.reduce((n, l) => n + l.qty, 0),
                          0,
                        ),
                      ],
                      [
                        "Pocas existencias",
                        data.products.filter((p) => p.stock <= p.min).length,
                      ],
                      [
                        "Exceso de inventario",
                        data.products.filter((p) => p.stock > p.max).length,
                      ],
                    ].map(([label, value]) => (
                      <section className="panel stat" key={label}>
                        <span className="stat-icon"><Icon name={label === "Total de ventas" ? "money" : label === "Productos vendidos" ? "bag" : "box"} size={22}/></span>
                        <div>
                          <p>{label}</p>
                          <strong>{value}</strong>
                        </div>
                      </section>
                    ))}
                  </div>
                  <div className="report-grid">
                    <section className="panel">
                      <h2>Productos más vendidos</h2>
                      {data.products
                        .map((p) => ({
                          ...p,
                          sold: activeSales
                            .flatMap((s) => s.lines)
                            .filter((l) => l.sku === p.sku)
                            .reduce((s, l) => s + l.qty, 0),
                        }))
                        .sort((a, b) => b.sold - a.sold)
                        .map((p) => (
                          <div className="bar-row" key={p.sku}>
                            <span>{p.name}</span>
                            <meter
                              min="0"
                              max={Math.max(
                                1,
                                ...data.products.map((x) =>
                                  activeSales
                                    .flatMap((s) => s.lines)
                                    .filter((l) => l.sku === x.sku)
                                    .reduce((n, l) => n + l.qty, 0),
                                ),
                              )}
                              value={p.sold}
                            />
                            <b>{p.sold}</b>
                          </div>
                        ))}
                    </section>
                    <section className="panel">
                      <h2>Resumen de inventario</h2>
                      <p>Capital a costo de catálogo</p>
                      <strong className="big">
                        {money(
                          data.products.reduce(
                            (s, p) => s + p.stock * p.cost,
                            0,
                          ),
                        )}
                      </strong>
                      <p>Margen bruto de ventas del período</p>
                      <strong className="big">
                        {money(
                          activeSales
                            .flatMap((s) => s.lines)
                            .reduce(
                              (n, l) => n + (l.price - l.cost) * l.qty,
                              0,
                            ),
                        )}
                      </strong>
                      <p className="muted">
                        No incluye gastos operativos ni representa utilidad
                        neta.
                      </p>
                    </section>
                  </div>
                  <section className="panel">
                    <h2>Resumen de compras</h2>
                    <p>
                      {data.orders.length} órdenes ·{" "}
                      {data.orders.filter((o) => o.state === "Recibida").length}{" "}
                      recibidas
                    </p>
                    <p>
                      Importe recibido:{" "}
                      {money(
                        data.orders
                          .filter((o) => o.state === "Recibida")
                          .reduce((s, o) => s + o.total, 0),
                      )}
                    </p>
                  </section>
                </>
              )}
              {page === "Configuración" && (
                <Settings
                  data={data}
                  onSave={(settings) => commit({ type: "settings", settings })}
                  onExport={exportData}
                />
              )}
            </>
          )}
        </main>
      </div>
      {modal && (
        <dialog
          ref={dialogRef}
          onCancel={() => {
            setModal(null);
            setError("");
          }}
          aria-modal="true"
          aria-labelledby="dialog-title"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setModal(null);
              setError("");
            }
          }}
        >
          <div className="dialog-heading">
            <h2 id="dialog-title">
              {
                {
                  product: "Producto y variante",
                  detail: "Detalle del producto",
                  count: "Conteo físico",
                  cancelSale: "Anular venta",
                  receive: "Recepción completa",
                  transaction: "Detalle de operación",
                }[modal.type]
              }
            </h2>
            <button
              aria-label="Cerrar ventana"
              onClick={() => {
                setModal(null);
                setError("");
              }}
            >
              ×
            </button>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {modal.type === "product" ? (
            <ProductForm
              product={modal.product}
              settings={data.settings}
              onSave={(product) =>
                commit({ type: "product", product, edit: !!modal.product })
              }
            />
          ) : modal.type === "detail" ? (
            <>
              <h3>{modal.product.name}</h3>
              <p>
                {modal.product.sku} · Talla {modal.product.size} ·{" "}
                {modal.product.color}
              </p>
              <p>
                Existencias: {modal.product.stock} · {status(modal.product)}
              </p>
              <p>
                Mínimo: {modal.product.min} · Máximo: {modal.product.max}
              </p>
              <p>
                Compra: {money(modal.product.cost)} · Venta:{" "}
                {money(modal.product.price)}
              </p>
            </>
          ) : modal.type === "transaction" ? (
            <>
              <p>
                Referencia: {modal.record.reference} · {modal.record.state}
              </p>
              {modal.record.lines.map((l, i) => (
                <p key={i}>
                  {l.sku} · {l.name} · {l.qty} × {money(l.price)}
                </p>
              ))}
              <strong>Total: {money(modal.record.total)}</strong>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = Object.fromEntries(new FormData(e.currentTarget));
                commit({
                  type: modal.type,
                  id: modal.record?.id,
                  sku: modal.product?.sku,
                  quantity: Number(f.quantity),
                  reason: f.reason,
                  reference: f.reference,
                });
              }}
            >
              {modal.type === "count" && (
                <>
                  <p>
                    {modal.product.name} · Cantidad registrada:{" "}
                    {modal.product.stock}
                  </p>
                  <Field
                    label="Cantidad contada"
                    name="quantity"
                    type="number"
                    min="0"
                    step="1"
                    required
                    defaultValue={modal.product.stock}
                  />
                </>
              )}
              {modal.type === "receive" ? (
                <>
                  <p>
                    Confirma que recibiste todas las unidades de la orden{" "}
                    {modal.record.reference}. Si hay faltantes o daños, no
                    confirmes esta recepción completa.
                  </p>
                  <Field
                    label="Factura o referencia de recepción"
                    name="reference"
                    required
                  />
                </>
              ) : (
                <Field label="Motivo obligatorio" name="reason" required />
              )}
              {modal.type === "cancelSale" && (
                <p>
                  La anulación devolverá todas las unidades al inventario. Úsala
                  únicamente si la mercancía vuelve a estar disponible.
                </p>
              )}
              <Button primary type="submit">
                Confirmar
              </Button>
            </form>
          )}
        </dialog>
      )}
      {modal && <div className="backdrop" />}
    </div>
  );
}
function ProductForm({ product, settings, onSave }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const p = Object.fromEntries(new FormData(e.currentTarget));
        for (const k of ["cost", "price", "stock", "min", "max"])
          p[k] = Number(p[k]);
        onSave(p);
      }}
    >
      <p className="muted">
        Una combinación de producto, talla y color por código.
      </p>
      <div className="form-grid">
        {[
          ["sku", "Código SKU", "text"],
          ["name", "Nombre", "text"],
          ["category", "Categoría", "text"],
          ["size", "Talla", "text"],
          ["color", "Color", "text"],
          ["cost", "Precio de compra", "number"],
          ["price", "Precio de venta", "number"],
          ["stock", "Existencias iniciales", "number"],
          ["min", "Stock mínimo", "number"],
          ["max", "Stock máximo", "number"],
        ].map(([key, label, type]) => (
          <Field
            key={key}
            label={label}
            name={key}
            type={type}
            required
            min={type === "number" ? 0 : undefined}
            step={
              ["cost", "price"].includes(key)
                ? ".01"
                : type === "number"
                  ? "1"
                  : undefined
            }
            readOnly={!!product && ["sku", "stock"].includes(key)}
            defaultValue={
              product?.[key] ??
              (key === "min"
                ? settings.min
                : key === "max"
                  ? settings.max
                  : type === "number"
                    ? 0
                    : "")
            }
          />
        ))}
      </div>
      <Button primary type="submit">
        Guardar producto
      </Button>
    </form>
  );
}
function TransactionForm({ type, initialLines, data, onSave, onCancel }) {
  const [lines, setLines] = useState(initialLines),
    [sku, setSku] = useState(data.products[0]?.sku || ""),
    [qty, setQty] = useState(1),
    [issue, setIssue] = useState("");
  const sale = type === "sale",
    total = lines.reduce(
      (n, l) =>
        n +
        l.qty *
          (data.products.find((p) => p.sku === l.sku)?.[
            sale ? "price" : "cost"
          ] || 0),
      0,
    );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const values = Object.fromEntries(new FormData(e.currentTarget));
        onSave({ type, lines, ...values });
      }}
    >
      <div className={sale ? "transaction-layout" : ""}>
        <div>
          <section className="panel">
            <h2>
              {sale ? "Información de la venta" : "Información de la orden"}
            </h2>
            <div className="form-grid">
              <Field
                label="Referencia única"
                name="reference"
                required
                placeholder={sale ? "Ticket de Caja" : "Número de orden"}
              />
              {sale ? (
                <Field label="Cliente (opcional)" name="customer" />
              ) : (
                <Field label="Proveedor">
                  <select name="supplier" required>
                    <option value="">Seleccionar proveedor</option>
                    {data.suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>
          </section>
          <section className="panel">
            <h2>{sale ? "Productos" : "Productos solicitados"}</h2>
            <div className="line-entry">
              <Field label="Producto, talla y color">
                <select value={sku} onChange={(e) => setSku(e.target.value)}>
                  {data.products.map((p) => (
                    <option key={p.sku} value={p.sku}>
                      {p.name} · {p.size} · {p.color} ({p.stock} disponibles)
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Cantidad">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
              </Field>
              <Button
                type="button"
                onClick={() => {
                  if (!sku || !Number.isSafeInteger(qty) || qty < 1) {
                    setIssue("Selecciona producto y cantidad entera positiva.");
                    return;
                  }
                  setLines([...lines, { sku, qty }]);
                  setIssue("");
                }}
              >
                Agregar
              </Button>
            </div>
            {issue && (
              <p role="alert" className="error">
                {issue}
              </p>
            )}
            {lines.map((l, i) => {
              const p = data.products.find((p) => p.sku === l.sku);
              return (
                <div className="line-item" key={i}>
                  <ProductIcon product={p} size={40} />
                  <div>
                    {p.name}
                    <small>
                      Talla {p.size} · Color {p.color}
                    </small>
                  </div>
                  <span>
                    {l.qty} × {money(p[sale ? "price" : "cost"])}
                  </span>
                  <button
                    type="button"
                    aria-label={`Quitar ${p.name}`}
                    onClick={() => setLines(lines.filter((_, j) => i !== j))}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            {!lines.length && (
              <p className="muted">Agrega productos para continuar.</p>
            )}
            <p className="total">Total: {money(total)}</p>
          </section>
          <section className="panel">
            <h2>{sale ? "Método de pago" : "Observaciones"}</h2>
            {sale ? (
              <Field label="Método de pago">
                <select name="payment">
                  <option>Efectivo</option>
                  <option>Tarjeta</option>
                  <option>Transferencia</option>
                </select>
              </Field>
            ) : (
              <textarea
                name="notes"
                aria-label="Observaciones"
                placeholder="Detalles de entrega o instrucciones para el proveedor"
              />
            )}
          </section>
        </div>
        {sale && (
          <section className="panel summary">
            <h2>Resumen de venta</h2>
            <p>
              Total <strong>{money(total)}</strong>
            </p>
            <p className="muted">
              Al confirmar, las unidades se descontarán del inventario.
            </p>
          </section>
        )}
      </div>
      <div className="form-actions">
        <Button type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button primary type="submit">
          {sale ? "Registrar venta" : "Guardar orden"}
        </Button>
      </div>
    </form>
  );
}
function SupplierForm({ onSave, onCancel }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(Object.fromEntries(new FormData(e.currentTarget)));
      }}
    >
      <section className="panel">
        <h2>Información del proveedor</h2>
        <div className="form-grid">
          {[
            ["name", "Nombre del proveedor"],
            ["contact", "Persona de contacto"],
            ["phone", "Teléfono"],
            ["email", "Correo electrónico"],
            ["address", "Dirección"],
            ["products", "Productos suministrados"],
          ].map(([name, label]) => (
            <Field
              key={name}
              label={label}
              name={name}
              required={name === "name"}
              type={name === "email" ? "email" : "text"}
            />
          ))}
        </div>
        <Field label="Observaciones" name="notes" />
      </section>
      <div className="form-actions">
        <Button type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button primary type="submit">
          Guardar proveedor
        </Button>
      </div>
    </form>
  );
}
function Settings({ data, onSave, onExport }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const s = Object.fromEntries(new FormData(e.currentTarget));
        for (const k of ["min", "max", "days"]) s[k] = Number(s[k]);
        onSave(s);
      }}
    >
      <section className="panel settings">
        <h2>Información de la tienda</h2>
        <p className="muted">
          Actualiza los datos y parámetros generales de Any Boutique.
        </p>
        <div className="form-grid">
          {[
            ["name", "Nombre comercial"],
            ["phone", "Teléfono"],
            ["address", "Dirección"],
            ["email", "Correo electrónico"],
          ].map(([name, label]) => (
            <Field
              key={name}
              label={label}
              name={name}
              required={name === "name"}
              type={name === "email" ? "email" : "text"}
              defaultValue={data.settings[name]}
            />
          ))}
        </div>
        <h2>Parámetros predeterminados de inventario</h2>
        <div className="form-grid">
          {[
            ["min", "Stock mínimo general"],
            ["max", "Stock máximo general"],
            ["days", "Días para evaluar baja rotación"],
          ].map(([name, label]) => (
            <Field
              key={name}
              label={label}
              name={name}
              type="number"
              min={name === "days" ? 1 : 0}
              step="1"
              required
              defaultValue={data.settings[name]}
            />
          ))}
        </div>
        <p className="muted">
          Mínimos y máximos se aplican a nuevos productos. La evaluación de baja
          rotación requiere historial suficiente y está pendiente.
        </p>
        <div className="form-actions">
          <Button type="button" onClick={onExport}>
            Descargar respaldo
          </Button>
          <Button primary type="submit">
            Guardar cambios
          </Button>
        </div>
      </section>
      <section className="panel">
        <h2>Conexión y usuarios</h2>
        <p>
          Esta versión usa datos locales de demostración. El inicio de sesión,
          los permisos seguros y la sincronización entre equipos requieren
          conectar Supabase.
        </p>
      </section>
    </form>
  );
}
export default App;



