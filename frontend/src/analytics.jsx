const g = (...args) => (window.gtag ? window.gtag(...args) : undefined);
export const track = (name, params = {}) => g("event", name, params);
export const identify = (userId) => g("set", { user_id: String(userId) });

const toGaItem = (i) => ({
  item_id: String(i.id ?? i.item_id),
  item_name: i.title ?? i.item_name,
  item_category: i.category,
  price: Number(i.price),
  quantity: Number(i.quantity ?? 1),
});

export const Ecom = {
  viewItem: (item) =>
    track("view_item", { currency: "INR", items: [toGaItem(item)] }),
  viewItemList: (listName, items) =>
    track("view_item_list", { item_list_name: listName, items: items.map(toGaItem) }),
  selectItem: (listName, item) =>
    track("select_item", { item_list_name: listName, items: [toGaItem(item)] }),

  addToCart: (item) =>
    track("add_to_cart", { currency: "INR", value: Number(item.price) * (item.quantity ?? 1), items: [toGaItem(item)] }),
  removeFromCart: (item) =>
    track("remove_from_cart", { currency: "INR", value: Number(item.price) * (item.quantity ?? 1), items: [toGaItem(item)] }),
  viewCart: (items, value) =>
    track("view_cart", { currency: "INR", value: Number(value || 0), items: items.map(toGaItem) }),

  beginCheckout: (items, subtotal) =>
    track("begin_checkout", { currency: "INR", value: Number(subtotal || 0), items: items.map(toGaItem) }),
  addShippingInfo: (items, shippingTier = "Standard") =>
    track("add_shipping_info", { currency: "INR", shipping_tier: shippingTier, items: items.map(toGaItem) }),
  addPaymentInfo: (items, paymentType = "card") =>
    track("add_payment_info", { currency: "INR", payment_type: paymentType, items: items.map(toGaItem) }),
  purchase: ({ transactionId, items, value, tax = 0, shipping = 0, coupon }) =>
    track("purchase", {
      transaction_id: String(transactionId),
      currency: "INR",
      value: Number(value || 0),
      tax: Number(tax || 0),
      shipping: Number(shipping || 0),
      coupon,
      items: items.map(toGaItem),
    }),
};

export const UX = {
  search: (query) => track("search", { search_term: String(query || "") }),
  filterSort: (kind, value) => track("filter_sort", { kind, value }),
  addToWishlist: (item) => track("add_to_wishlist", toGaItem(item)),
  removeFromWishlist: (item) => track("remove_from_wishlist", toGaItem(item)),
  selectPromotion: (name, creative, position) =>
    track("select_promotion", { promotion_name: name, creative_name: creative, location_id: position }),
  generateLead: (formName) => track("generate_lead", { form_name: formName }),
};
