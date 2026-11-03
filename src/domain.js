export const money = (n) =>
  new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(
    n,
  );
export const initialData = {
  version: 1,
  products: [
    ["BL-001", "Blusa de lino", "Blusas", "M", "Blanco", 250, 450, 18, 5],
    ["PA-002", "Pantalón clásico", "Pantalones", "L", "Negro", 400, 750, 3, 5],
    ["VE-003", "Vestido floral", "Vestidos", "S", "Beige", 500, 950, 0, 3],
    ["CA-004", "Camiseta básica", "Camisetas", "M", "Gris", 120, 250, 42, 10],
    ["FA-005", "Falda midi", "Faldas", "M", "Negro", 300, 600, 12, 4],
    ["BL-006", "Blusa satinada", "Blusas", "S", "Crema", 320, 650, 2, 5],
  ].map(([sku, name, category, size, color, cost, price, stock, min]) => ({
    sku,
    name,
    category,
    size,
    color,
    cost,
    price,
    stock,
    min,
    max: 60,
  })),
  suppliers: [
    {
      id: "P001",
      name: "Moda Textil",
      contact: "Contacto de demostración",
      phone: "",
      email: "",
      address: "",
      products: "Ropa",
      notes: "",
    },
  ],
  sales: [],
  orders: [],
  movements: [],
  settings: {
    name: "Any Boutique",
    phone: "",
    address: "Juigalpa, Nicaragua",
    email: "",
    min: 5,
    max: 60,
    days: 30,
  },
};
export const status = (p) =>
  p.stock === 0
    ? "Agotado"
    : p.stock <= p.min
      ? "Stock bajo"
      : p.stock > p.max
        ? "Exceso"
        : "Disponible";
const check = (ok, message) => {
  if (!ok) throw new Error(message);
};
const integer = (n) => Number.isSafeInteger(n) && n >= 0;
export function transact(data, action) {
  const d = structuredClone(data),
    now = new Date().toISOString(),
    id = crypto.randomUUID();
  const product = (sku) => {
    const p = d.products.find((p) => p.sku === sku);
    check(p, "Producto no encontrado.");
    return p;
  };
  const move = (p, delta, type, reference, reason = "") => {
    p.stock += delta;
    d.movements.unshift({
      id: crypto.randomUUID(),
      date: now,
      sku: p.sku,
      delta,
      type,
      reference,
      reason,
      actor: "Demostración local",
      balance: p.stock,
    });
  };
  if (action.type === "product") {
    const p = action.product;
    check(
      p.sku.trim() && p.name.trim() && p.size.trim() && p.color.trim(),
      "Completa código, nombre, talla y color.",
    );
    check(
      [p.stock, p.min, p.max].every(integer) && p.min <= p.max,
      "Las cantidades deben ser enteras y el mínimo no puede superar el máximo.",
    );
    check(
      [p.cost, p.price].every((n) => Number.isFinite(n) && n >= 0),
      "Los precios no son válidos.",
    );
    if (action.edit) {
      const old = product(p.sku);
      check(p.stock === old.stock, "Usa un ajuste para modificar existencias.");
      Object.assign(old, p);
    } else {
      check(
        !d.products.some((x) => x.sku.toLowerCase() === p.sku.toLowerCase()),
        "Ese código ya existe.",
      );
      d.products.push({ ...p, stock: 0 });
      move(product(p.sku), p.stock, "Inventario inicial", id);
    }
  } else if (action.type === "supplier") {
    check(action.supplier.name.trim(), "Escribe el nombre del proveedor.");
    d.suppliers.push({ ...action.supplier, id });
  } else if (action.type === "sale" || action.type === "order") {
    check(action.lines.length > 0, "Agrega al menos un producto.");
    check(action.reference?.trim(), "Escribe una referencia única.");
    const target = action.type === "sale" ? d.sales : d.orders;
    check(
      !target.some((x) => x.reference === action.reference.trim()),
      "La referencia ya está registrada.",
    );
    const quantities = {};
    const lines = action.lines.map((l) => {
      const p = product(l.sku);
      check(
        integer(l.qty) && l.qty > 0,
        "La cantidad debe ser un entero positivo.",
      );
      quantities[l.sku] = (quantities[l.sku] || 0) + l.qty;
      return {
        ...l,
        price: action.type === "sale" ? p.price : p.cost,
        cost: p.cost,
        name: p.name,
      };
    });
    if (action.type === "sale")
      for (const [sku, qty] of Object.entries(quantities))
        check(
          product(sku).stock >= qty,
          `Existencias insuficientes para ${sku}.`,
        );
    else
      check(
        d.suppliers.some((s) => s.id === action.supplier),
        "Selecciona un proveedor.",
      );
    const row = {
      id,
      date: now,
      reference: action.reference.trim(),
      lines,
      total: lines.reduce((s, l) => s + l.qty * l.price, 0),
      state: action.type === "sale" ? "Confirmada" : "Pendiente",
      customer: action.customer || "Cliente general",
      payment: action.payment || "Efectivo",
      supplier: action.supplier,
      notes: action.notes || "",
    };
    target.unshift(row);
    if (action.type === "sale")
      for (const l of lines)
        move(product(l.sku), -l.qty, "Venta", row.reference);
  } else if (action.type === "cancelSale") {
    const s = d.sales.find((s) => s.id === action.id);
    check(s?.state === "Confirmada", "La venta ya fue anulada o no existe.");
    check(action.reason?.trim(), "Indica el motivo de anulación.");
    s.state = "Anulada";
    s.reason = action.reason;
    for (const l of s.lines)
      move(
        product(l.sku),
        l.qty,
        "Anulación de venta",
        s.reference,
        action.reason,
      );
  } else if (action.type === "approve" || action.type === "reject") {
    const o = d.orders.find((o) => o.id === action.id);
    check(o?.state === "Pendiente", "La orden ya fue revisada.");
    o.state = action.type === "approve" ? "Aprobada" : "Rechazada";
  } else if (action.type === "receive") {
    const o = d.orders.find((o) => o.id === action.id);
    check(o?.state === "Aprobada", "Solo puedes recibir una orden aprobada.");
    check(
      action.reference?.trim(),
      "Indica la factura o documento de recepción.",
    );
    o.state = "Recibida";
    o.receipt = action.reference;
    o.receivedAt = now;
    for (const l of o.lines)
      move(product(l.sku), l.qty, "Recepción", action.reference);
  } else if (action.type === "count") {
    const p = product(action.sku);
    check(
      integer(action.quantity),
      "El conteo debe ser un entero no negativo.",
    );
    check(action.reason?.trim(), "Indica el motivo del ajuste.");
    move(p, action.quantity - p.stock, "Conteo físico", id, action.reason);
  } else if (action.type === "settings") {
    check(action.settings.name.trim(), "Escribe el nombre de la tienda.");
    check(
      integer(action.settings.min) &&
        integer(action.settings.max) &&
        action.settings.min <= action.settings.max,
      "Revisa los mínimos y máximos.",
    );
    check(
      integer(action.settings.days) && action.settings.days > 0,
      "El período debe ser un entero positivo.",
    );
    d.settings = action.settings;
  } else throw new Error("Operación no reconocida.");
  return d;
}
