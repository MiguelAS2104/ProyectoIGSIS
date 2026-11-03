import test from "node:test";
import assert from "node:assert/strict";
import { initialData, transact } from "../src/domain.js";
const base = () => structuredClone(initialData);
const sale = {
  type: "sale",
  reference: "V-1",
  lines: [{ sku: "BL-001", qty: 2 }],
};
test("venta y anulación conservan existencias y auditoría", () => {
  let d = transact(base(), sale);
  assert.equal(d.products[0].stock, 16);
  assert.equal(d.sales[0].total, 900);
  assert.equal(d.movements[0].delta, -2);
  d = transact(d, {
    type: "cancelSale",
    id: d.sales[0].id,
    reason: "Mercancía devuelta",
  });
  assert.equal(d.products[0].stock, 18);
  assert.equal(d.movements.length, 2);
  assert.throws(() =>
    transact(d, { type: "cancelSale", id: d.sales[0].id, reason: "Otra vez" }),
  );
});
test("no permite duplicados ni stock negativo ni cantidades fraccionarias", () => {
  const d = transact(base(), sale);
  assert.throws(() => transact(d, sale));
  assert.throws(() =>
    transact(base(), { ...sale, lines: [{ sku: "BL-001", qty: 19 }] }),
  );
  assert.throws(() =>
    transact(base(), {
      ...sale,
      lines: [
        { sku: "BL-001", qty: 10 },
        { sku: "BL-001", qty: 10 },
      ],
    }),
  );
  assert.throws(() =>
    transact(base(), { ...sale, lines: [{ sku: "BL-001", qty: 1.5 }] }),
  );
  assert.equal(base().products[0].stock, 18);
});
test("comprar y aprobar no aumenta stock; recepción única sí", () => {
  let d = transact(base(), {
    type: "order",
    reference: "O-1",
    supplier: "P001",
    lines: [{ sku: "BL-001", qty: 5 }],
  });
  const id = d.orders[0].id;
  assert.equal(d.products[0].stock, 18);
  assert.throws(() => transact(d, { type: "receive", id, reference: "F-1" }));
  d = transact(d, { type: "approve", id });
  assert.equal(d.products[0].stock, 18);
  d = transact(d, { type: "receive", id, reference: "F-1" });
  assert.equal(d.products[0].stock, 23);
  assert.throws(() => transact(d, { type: "receive", id, reference: "F-1" }));
});
test("ajuste exige motivo y registra diferencia", () => {
  assert.throws(() =>
    transact(base(), { type: "count", sku: "BL-001", quantity: 0 }),
  );
  const d = transact(base(), {
    type: "count",
    sku: "BL-001",
    quantity: 15,
    reason: "Conteo aprobado",
  });
  assert.equal(d.products[0].stock, 15);
  assert.equal(d.movements[0].delta, -3);
});
test("producto valida SKU único y mínimos; editar no cambia stock", () => {
  const p = { ...base().products[0] };
  assert.throws(() => transact(base(), { type: "product", product: p }));
  assert.throws(() =>
    transact(base(), {
      type: "product",
      product: { ...p, min: 100 },
      edit: true,
    }),
  );
  assert.throws(() =>
    transact(base(), {
      type: "product",
      product: { ...p, stock: 20 },
      edit: true,
    }),
  );
  const d = transact(base(), {
    type: "product",
    product: { ...p, sku: "NEW", stock: 3 },
  });
  assert.equal(d.products.at(-1).stock, 3);
  assert.equal(d.movements[0].delta, 3);
});
