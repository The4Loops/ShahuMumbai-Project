const supabase = require("../config/supabaseClient");


exports.createOrder = async (req, res) => {
  try {
    const {
      customer,                  
      currency = "INR",
      items = [],                 
      discount_total = 0,
      tax_total = 0,
      shipping_total = 0,
      payment_method,
      meta: extraMeta = {}
    } = req.body;

    //  Basic validation 
    if (!customer?.name || !customer?.email) {
      return res.status(400).json({ error: "missing_customer" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "no_items" });
    }

    //  1) Fetch products (authoritative pricing) 
    const ids = items.map((it) => it.product_id).filter(Boolean);
    if (ids.length !== items.length) {
      return res.status(400).json({ error: "missing_product_id" });
    }

    const { data: dbProducts, error: prodErr } = await supabase
      .from("products")
      .select("id, name, price, discountprice, stock, isactive")
      .in("id", ids);

    if (prodErr) {
      return res.status(500).json({ error: "product_lookup_failed", details: prodErr });
    }
    if (!dbProducts || dbProducts.length !== ids.length) {
      return res.status(404).json({ error: "some_products_not_found" });
    }

    const byId = new Map(dbProducts.map((p) => [String(p.id), p]));

    // 2) Compute totals from DB (ignore client unit_price) 
    let subtotal = 0;
    const orderItemsPayload = [];

    for (const it of items) {
      const p = byId.get(String(it.product_id));
      if (!p) {
        return res.status(404).json({ error: "product_not_found", product_id: it.product_id });
      }

      if (p.isactive === false) {
        return res.status(400).json({ error: "product_inactive", product_id: p.id });
      }

      const qty = Math.max(1, Number(it.qty || 1));

      if (typeof p.stock === "number" && p.stock < qty) {
        return res.status(409).json({ error: "insufficient_stock", product_id: p.id });
      }

      const unit_price = Number(p.discountprice ?? p.price);
      if (!Number.isFinite(unit_price) || unit_price < 0) {
        return res.status(400).json({ error: "invalid_price", product_id: p.id });
      }

      const line_total = unit_price * qty;
      subtotal += line_total;

      orderItemsPayload.push({
        order_id: null,                         
        product_id: p.id,                       
        product_title: it.product_title || p.name,
        unit_price,
        qty,
        line_total,
        meta: it.meta ?? {},
      });
    }

    const toNum = (n) => Number(n || 0);
    const total = toNum(subtotal) - toNum(discount_total) + toNum(tax_total) + toNum(shipping_total);

    //  3) Insert order (force pending) 
    const orderInsert = {
      user_id: null,                           
      customer_name: customer.name,
      customer_email: customer.email,
      status: "pending",
      payment_status: "pending",
      currency,                                 
      subtotal,
      discount_total,
      tax_total,
      shipping_total,
      total,
      meta: {
        phone: customer.phone,
        address: customer.address,
        payment_method,
        cart: items,                            
        ...extraMeta,
      },
    };

    const { data: orderIns, error: orderErr } = await supabase
      .from("orders")
      .insert([orderInsert])
      .select("id, order_number")
      .single();

    if (orderErr) {
      return res.status(500).json({ error: "order_insert_failed", details: orderErr });
    }

    const orderId = orderIns.id;

    //  4) Insert order_items 
    const itemsForInsert = orderItemsPayload.map((oi) => ({ ...oi, order_id: orderId }));
    const { error: itemsErr } = await supabase.from("order_items").insert(itemsForInsert);
    if (itemsErr) {
      await supabase.from("orders").delete().eq("id", orderId);
      return res.status(500).json({ error: "items_insert_failed", details: itemsErr });
    }

    //  5) Decrement stock via RPC (you have this function) 
    for (const it of itemsForInsert) {
      if (!it.product_id) continue;
      const { error: decErr } = await supabase.rpc("decrement_stock", {
        p_id: it.product_id,
        p_qty: it.qty,
      });
      if (decErr) {
        await supabase.from("order_items").delete().eq("order_id", orderId);
        await supabase.from("orders").delete().eq("id", orderId);

        if (String(decErr.message || "").includes("insufficient_stock")) {
          return res.status(409).json({ error: "insufficient_stock", product_id: it.product_id });
        }
        return res.status(500).json({ error: "stock_decrement_failed", details: decErr });
      }
    }

    //  6) Success 
    return res.json({
      ok: true,
      order_id: orderId,
      order_number: orderIns.order_number,   
      total,
    });
  } catch (e) {
    console.error("checkout.createOrder error", e);
    return res.status(500).json({ error: "internal_error" });
  }
};
