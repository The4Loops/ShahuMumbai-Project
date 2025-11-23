// controllers/waitlistController.js
const sql = require('mssql');
const sqlConfig = require('../config/db');
const jwt = require('jsonwebtoken');

exports.getAllWaitlist = async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig);

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, parseInt(req.query.pageSize, 10) || 20);
    const offset = (page - 1) * pageSize;
    const search = (req.query.search || '').trim();

    const request = pool.request()
      .input('search', sql.NVarChar, search ? `%${search}%` : null)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, pageSize);

    const baseCte = `
      WITH WaitlistBase AS (
        SELECT
          w.WaitlistId,
          w.ProductId,
          w.UserEmail,
          w.UserId,
          w.CreatedUtc,
          w.NotifiedUtc,
          p.Name AS ProductName,
          p.ProductId AS ProdId,
          p.IsActive,
          p.LaunchingDate,
          p.UpdatedAt,
          img.ImageUrl,
          CASE 
            WHEN p.IsActive = 'Y' AND (p.LaunchingDate IS NULL OR p.LaunchingDate <= SYSUTCDATETIME())
              THEN 'Available'
            WHEN p.IsActive = 'Y' AND p.LaunchingDate > SYSUTCDATETIME()
              THEN 'Upcoming'
            ELSE 'Out of Stock'
          END AS Status
        FROM dbo.Waitlist w
        JOIN dbo.Products p ON p.ProductId = w.ProductId
        OUTER APPLY (
          SELECT TOP 1 ImageUrl
          FROM dbo.ProductImages pi
          WHERE pi.ProductId = w.ProductId AND pi.IsHero = 'Y'
          ORDER BY pi.ProductImageId
        ) img
      ),
      WithPayments AS (
        SELECT
          b.*,
          dep.PaymentStatus AS DepositPaymentStatus,
          fin.PaymentStatus AS FinalPaymentStatus
        FROM WaitlistBase b
        OUTER APPLY (
          SELECT TOP 1 o.PaymentStatus
          FROM dbo.Orders o
          WHERE JSON_VALUE(o.Meta, '$.type') = 'WAITLIST_DEPOSIT'
            AND JSON_VALUE(o.Meta, '$.productId') = CONVERT(nvarchar(50), b.ProductId)
            AND (o.UserId = b.UserId OR o.Email = b.UserEmail)
          ORDER BY o.CreatedAt DESC
        ) dep
        OUTER APPLY (
          SELECT TOP 1 o.PaymentStatus
          FROM dbo.Orders o
          WHERE JSON_VALUE(o.Meta, '$.type') = 'WAITLIST_FINAL'
            AND JSON_VALUE(o.Meta, '$.productId') = CONVERT(nvarchar(50), b.ProductId)
            AND (o.UserId = b.UserId OR o.Email = b.UserEmail)
          ORDER BY o.CreatedAt DESC
        ) fin
      )
    `;

    const whereClause = `
      WHERE (
        @search IS NULL
        OR ProductName LIKE @search
        OR UserEmail LIKE @search
        OR CONVERT(nvarchar(50), ProductId) LIKE @search
      )
    `;

    const countQuery = `
      ${baseCte}
      SELECT COUNT(*) AS Total
      FROM WithPayments
      ${whereClause};
    `;

    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0]?.Total || 0;

    const dataQuery = `
      ${baseCte}
      SELECT
        WaitlistId,
        ProductId,
        UserEmail,
        UserId,
        CreatedUtc,
        NotifiedUtc,
        ProductName,
        Status,
        ImageUrl,
        UpdatedAt,
        DepositPaymentStatus,
        FinalPaymentStatus
      FROM WithPayments
      ${whereClause}
      ORDER BY CreatedUtc DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;

    const dataResult = await request.query(dataQuery);

    const items = dataResult.recordset.map((r) => {
      const depositPaid = r.DepositPaymentStatus === 'paid';
      const finalPaid = r.FinalPaymentStatus === 'paid';

      return {
        WaitlistId: r.WaitlistId,
        ProductId: r.ProductId,
        UserEmail: r.UserEmail,
        UserId: r.UserId,
        CreatedUtc: r.CreatedUtc,
        NotifiedUtc: r.NotifiedUtc,
        ProductName: r.ProductName,
        Status: r.Status,
        ImageUrl: r.ImageUrl || null,
        UpdatedAt: r.UpdatedAt,
        DepositPaymentStatus: r.DepositPaymentStatus || null,
        FinalPaymentStatus: r.FinalPaymentStatus || null,
        NeedsFinalPayment:
          r.Status === 'Available' &&
          depositPaid &&
          !finalPaid,
      };
    });

    res.json({ total, items });
  } catch (err) {
    console.error('getAllWaitlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getWaitlist = async (req, res) => {
  try {
    const email = (req.query.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const pool = await sql.connect(sqlConfig);
    const query = `
      WITH WaitlistBase AS (
        SELECT
          w.WaitlistId,
          w.ProductId,
          w.UserEmail,
          w.UserId,
          w.CreatedUtc,
          w.NotifiedUtc,
          p.Name AS ProductName,
          p.ProductId AS ProdId,
          p.IsActive,
          p.LaunchingDate,
          p.UpdatedAt,
          img.ImageUrl,
          CASE 
            WHEN p.IsActive = 'Y' AND (p.LaunchingDate IS NULL OR p.LaunchingDate <= SYSUTCDATETIME())
              THEN 'Available'
            WHEN p.IsActive = 'Y' AND p.LaunchingDate > SYSUTCDATETIME()
              THEN 'Upcoming'
            ELSE 'Out of Stock'
          END AS Status
        FROM dbo.Waitlist w
        JOIN dbo.Products p ON p.ProductId = w.ProductId
        OUTER APPLY (
          SELECT TOP 1 ImageUrl
          FROM dbo.ProductImages pi
          WHERE pi.ProductId = w.ProductId AND pi.IsHero = 'Y'
          ORDER BY pi.ProductImageId
        ) img
        WHERE w.UserEmail = @Email
      ),
      WithPayments AS (
        SELECT
          b.*,
          dep.PaymentStatus AS DepositPaymentStatus,
          fin.PaymentStatus AS FinalPaymentStatus
        FROM WaitlistBase b
        OUTER APPLY (
          SELECT TOP 1 o.PaymentStatus
          FROM dbo.Orders o
          WHERE JSON_VALUE(o.Meta, '$.type') = 'WAITLIST_DEPOSIT'
            AND JSON_VALUE(o.Meta, '$.productId') = CONVERT(nvarchar(50), b.ProductId)
            AND (o.UserId = b.UserId OR o.Email = b.UserEmail)
          ORDER BY o.CreatedAt DESC
        ) dep
        OUTER APPLY (
          SELECT TOP 1 o.PaymentStatus
          FROM dbo.Orders o
          WHERE JSON_VALUE(o.Meta, '$.type') = 'WAITLIST_FINAL'
            AND JSON_VALUE(o.Meta, '$.productId') = CONVERT(nvarchar(50), b.ProductId)
            AND (o.UserId = b.UserId OR o.Email = b.UserEmail)
          ORDER BY o.CreatedAt DESC
        ) fin
      )
      SELECT
        WaitlistId,
        ProductId,
        UserEmail,
        UserId,
        CreatedUtc,
        NotifiedUtc,
        ProductName,
        Status,
        ImageUrl,
        UpdatedAt,
        DepositPaymentStatus,
        FinalPaymentStatus
      FROM WithPayments
      ORDER BY ProductName;
    `;

    const result = await pool.request()
      .input('Email', sql.NVarChar, email)
      .query(query);

    const formatted = result.recordset.map((r) => {
      const depositPaid = r.DepositPaymentStatus === 'paid';
      const finalPaid = r.FinalPaymentStatus === 'paid';

      const nowUtc = new Date();
      let availableSince = null;
      if (r.Status === 'Available' && r.UpdatedAt) {
        availableSince = new Date(r.UpdatedAt).getTime();
      }

      return {
        id: r.ProductId,
        name: r.ProductName,
        status: r.Status,
        imageUrl: r.ImageUrl || null,
        updated: r.UpdatedAt ? new Date(r.UpdatedAt).toISOString() : null,
        availableSince,
        email: r.UserEmail,
        waitlistId: r.WaitlistId,
        userId: r.UserId,
        createdUtc: r.CreatedUtc ? new Date(r.CreatedUtc).toISOString() : null,
        notifiedUtc: r.NotifiedUtc ? new Date(r.NotifiedUtc).toISOString() : null,
        depositPaymentStatus: r.DepositPaymentStatus || null,
        finalPaymentStatus: r.FinalPaymentStatus || null,
        depositPaid,
        needsFinalPayment:
          r.Status === 'Available' &&
          depositPaid &&
          !finalPaid,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('getWaitlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.addToWaitlist = async (req, res) => {
  try {
    const { productId, email } = req.body;
    if (!productId || !email)
      return res.status(400).json({ error: 'productId and email are required' });

    let userId = null;
    try {
      const token = req.cookies.auth_token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id || decoded.userId || null;
      }
    } catch {
      userId = null;
    }

    const pool = await sql.connect(sqlConfig);
    await pool.request()
      .input('ProductId', sql.Int, productId)
      .input('Email', sql.NVarChar, email.trim().toLowerCase())
      .input('UserId', sql.NVarChar, userId)
      .query(`
        IF NOT EXISTS (
          SELECT 1
          FROM dbo.Waitlist
          WHERE ProductId = @ProductId AND UserEmail = @Email
        )
        INSERT INTO dbo.Waitlist (ProductId, UserEmail, UserId, CreatedUtc)
        VALUES (@ProductId, @Email, @UserId, SYSUTCDATETIME());
      `);

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('addToWaitlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.removeFromWaitlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const email = (req.query.email || '').trim().toLowerCase();

    if (!email || !productId)
      return res.status(400).json({ error: 'email and productId are required' });

    const pool = await sql.connect(sqlConfig);
    await pool.request()
      .input('ProductId', sql.Int, Number(productId))
      .input('Email', sql.NVarChar, email)
      .query(`
        DELETE FROM dbo.Waitlist
        WHERE ProductId = @ProductId AND UserEmail = @Email;
      `);

    res.json({ ok: true });
  } catch (err) {
    console.error('removeFromWaitlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createWaitlistDepositOrder = async (req, res) => {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: missing token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("JWT verify failed in createWaitlistDepositOrder:", err.message);
      return res.status(401).json({ error: "Invalid token" });
    }

    // --- 2) Extract user id + email from token ---
    const rawUserId = decoded.id ?? decoded.userId ?? null;
    if (rawUserId == null) {
      return res
        .status(401)
        .json({ error: "Invalid token: user id not found in payload" });
    }

    // Force to string and match createOrder's NVARCHAR(1000)
    const userId = String(rawUserId);

    const tokenEmail =
      decoded.email ||
      decoded.userEmail ||
      decoded.sub ||
      "";

    const bodyEmail = (req.body?.email || "").trim().toLowerCase();
    const finalEmail = (tokenEmail || bodyEmail || "").trim().toLowerCase();

    if (!finalEmail) {
      return res
        .status(400)
        .json({ error: "Email is required for waitlist deposit" });
    }

    // --- 3) productId from body ---
    const { productId } = req.body || {};
    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    const pool = await sql.connect(sqlConfig);

    // --- 4) Fetch product ---
    const productResult = await pool
      .request()
      .input("ProductId", sql.Int, productId)
      .query(`
        SELECT TOP 1
          ProductId,
          Name,
          CASE WHEN DiscountPrice IS NOT NULL THEN DiscountPrice ELSE Price END AS FinalPrice
        FROM dbo.Products
        WHERE ProductId = @ProductId AND IsActive = 'Y';
      `);

    if (!productResult.recordset.length) {
      return res.status(404).json({ error: "Product not found or inactive" });
    }

    const p = productResult.recordset[0];
    const finalPrice = Number(p.FinalPrice || 0);

    if (!finalPrice || Number.isNaN(finalPrice)) {
      return res.status(400).json({ error: "Invalid product price" });
    }

    const depositAmount = Number((finalPrice * 0.5).toFixed(2));

    // --- 5) Build totals like checkoutController (but simpler) ---
    const subtotal = depositAmount;
    const discount = 0;
    const tax = 0;
    const shipping = 0;
    const total = depositAmount;

    const metaJson = JSON.stringify({
      type: "WAITLIST_DEPOSIT",
      productId: p.ProductId,
      productName: p.Name,
      depositFraction: 0.5,
      currency: "INR",
      userId,
      userEmail: finalEmail,
    });

    const now = new Date();

    // --- 6) Insert Orders + OrderItems in a transaction ---
    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      // Match checkoutController.createOrder column list exactly
      const orderReq = new sql.Request(tx);
      orderReq
        .input("UserId", sql.NVarChar(1000), userId)
        .input("CustName", sql.NVarChar(255), "") // we can keep this empty or later accept name in body
        .input("CustEmail", sql.NVarChar(255), finalEmail)
        .input("CustPhoneNo", sql.NVarChar(255), "")   // optional
        .input("CustAddress", sql.NVarChar(255), "")   // optional
        .input("Status", sql.NVarChar(20), "pending")
        .input("PayStatus", sql.NVarChar(20), "unpaid")
        .input("Currency", sql.NVarChar(8), "INR")
        .input("Subtotal", sql.Decimal(18, 2), subtotal)
        .input("Discount", sql.Decimal(18, 2), discount)
        .input("Tax", sql.Decimal(18, 2), tax)
        .input("Shipping", sql.Decimal(18, 2), shipping)
        .input("Total", sql.Decimal(18, 2), total)
        .input("Meta", sql.NVarChar(sql.MAX), metaJson)
        .input("PlacedAt", sql.DateTime2, now);

      const orderIns = await orderReq.query(`
        INSERT INTO dbo.Orders
          (UserId, CustomerName, CustomerEmail, CustomerPhoneNo, CustomerAddress,
           Status, PaymentStatus, Currency,
           Subtotal, DiscountTotal, TaxTotal, ShippingTotal, Total, Meta, PlacedAt)
        OUTPUT INSERTED.OrderId, INSERTED.OrderNumber
        VALUES
          (@UserId, @CustName, @CustEmail, @CustPhoneNo, @CustAddress,
           @Status, @PayStatus, @Currency,
           @Subtotal, @Discount, @Tax, @Shipping, @Total, @Meta, @PlacedAt)
      `);

      const orderRow = orderIns.recordset?.[0];
      if (!orderRow) throw new Error("order_insert_failed");

      const orderId = orderRow.OrderId;
      const orderNumber = orderRow.OrderNumber;

      // Insert a single OrderItems row representing the deposit
      const itemReq = new sql.Request(tx);
      await itemReq
        .input("OrderId", sql.Int, orderId)
        .input("ProductId", sql.Int, p.ProductId)
        .input("Title", sql.NVarChar(255), p.Name)
        .input("UnitPrice", sql.Decimal(18, 2), depositAmount)
        .input("Qty", sql.Int, 1)
        .input("LineTotal", sql.Decimal(18, 2), depositAmount)
        .input(
          "Meta",
          sql.NVarChar(sql.MAX),
          JSON.stringify({ waitlistDeposit: true })
        )
        .query(`
          INSERT INTO dbo.OrderItems
            (OrderId, ProductId, ProductTitle, UnitPrice, Qty, LineTotal, Meta)
          VALUES
            (@OrderId, @ProductId, @Title, @UnitPrice, @Qty, @LineTotal, @Meta)
        `);

      await tx.commit();

      // --- 7) Response to frontend (used by /api/payments/create-order) ---
      return res.json({
        ok: true,
        order_number: orderNumber,
        amount: depositAmount,
        currency: "INR",
        product: {
          id: p.ProductId,
          name: p.Name,
        },
      });
    } catch (inner) {
      try {
        await tx.rollback();
      } catch (rbErr) {
        console.error("Rollback error in createWaitlistDepositOrder:", rbErr);
      }
      console.error("createWaitlistDepositOrder tx error:", inner);
      return res.status(500).json({
        error: "Internal server error",
        detail: inner?.message,
      });
    }
  } catch (err) {
    console.error("createWaitlistDepositOrder outer error:", err);
    const dbMsg =
      err?.originalError?.info?.message ||
      err?.originalError?.message ||
      err?.message;

    return res.status(500).json({
      error: "Internal server error",
      detail: dbMsg,
    });
  }
};

