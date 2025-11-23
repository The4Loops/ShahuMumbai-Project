const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sql = require('mssql');

// VERIFY AUTHENTICATED USER
const verifyUser = (req) => {
  const token = req.cookies.auth_token;
  if (!token) return { error: 'Unauthorized: Token missing' };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { decoded };
  } catch (err) {
    return { error: 'Invalid Token' };
  }
};

// Create Review
exports.createReview = async (req, res) => {
  try {
    const { error: authError, decoded } = verifyUser(req);
    if (authError) return res.status(401).json({ message: authError });

    const { userid, productid, rating, comment } = req.body;

    // Validate required fields
    if (!userid || !productid || !rating) {
      return res.status(400).json({ message: 'User ID, Product ID, and Rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Ensure the user is creating a review for themselves
    if (userid !== decoded.id) {
      return res.status(403).json({ message: 'Forbidden: You can only create reviews for yourself' });
    }

    // Check if a review already exists for this user and product
    const existingReviewResult = await req.db.request()
      .input('UserId', sql.Int, userid)
      .input('ProductId', sql.Int, productid)
      .query(`
        SELECT ReviewId
        FROM reviews
        WHERE UserId = @UserId AND ProductId = @ProductId AND IsActive = 'Y'
      `);

    if (existingReviewResult.recordset[0]) {
      return res.status(400).json({
        message: 'A review for this product already exists by this user',
      });
    }

    // Insert review
    const insertResult = await req.db.request()
      .input('UserId', sql.Int, userid)
      .input('ProductId', sql.Int, productid)
      .input('Rating', sql.Int, parseInt(rating))
      .input('Comment', sql.NVarChar, comment)
      .input('CreatedAt', sql.DateTime, new Date())
      .input('UpdatedAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO reviews (UserId, ProductId, Rating, Comment, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.*
        VALUES (@UserId, @ProductId, @Rating, @Comment, @CreatedAt, @UpdatedAt)
      `);

    const review = insertResult.recordset[0];
    if (!review) {
      return res.status(400).json({ message: 'Error inserting review' });
    }

    return res.status(201).json({ message: 'Review created successfully', review });
  } catch (error) {
    console.error('createReview:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Reviews by Product ID
exports.getReviewsByProductId = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await req.db.request()
      .input('ProductId', sql.Int, id)
      .query(`
        SELECT 
          r.ReviewId,
          r.UserId,
          r.ProductId,
          r.Rating,
          r.Comment,
          r.CreatedAt,
          r.UpdatedAt,
          r.IsActive,
          u.FullName,
          p.Name AS ProductName
        FROM reviews r
        INNER JOIN users u ON r.UserId = u.UserId
        INNER JOIN products p ON r.ProductId = p.ProductId
        WHERE r.IsActive = 'Y' AND r.ProductId = @ProductId
      `);

    const data = result.recordset;
    if (!data || data.length === 0) {
      return res.status(200).json({ message: 'No reviews found for this product' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('getReviewsByProductId:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Review
exports.updateReview = async (req, res) => {
  try {
    const { error: authError, decoded } = verifyUser(req);
    if (authError) return res.status(401).json({ message: authError });

    const { ReviewId } = req.params;
    const { Rating, Comment } = req.body;

    // Validate rating if provided
    if (Rating && (Rating < 1 || Rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Fetch the review to check ownership
    const existingReviewResult = await req.db.request()
      .input('ReviewId', sql.Int, ReviewId)
      .query(`
        SELECT UserId
        FROM reviews
        WHERE ReviewId = @ReviewId AND IsActive = 1
      `);

    const existingReview = existingReviewResult.recordset[0];
    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (decoded.role !== 'Admin' && existingReview.UserId !== decoded.id) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own review' });
    }

    // Update review
    let updateQuery = `
      UPDATE reviews
      SET UpdatedAt = @UpdatedAt
      WHERE ReviewId = @ReviewId
    `;
    const parameters = [
      { name: 'ReviewId', type: sql.Int, value: ReviewId },
      { name: 'UpdatedAt', type: sql.DateTime, value: new Date().toISOString() }
    ];

    if (Rating !== undefined) {
      updateQuery += ', Rating = @Rating';
      parameters.push({ name: 'Rating', type: sql.Int, value: parseInt(Rating) });
    }
    if (Comment !== undefined) {
      updateQuery += ', Comment = @Comment';
      parameters.push({ name: 'Comment', type: sql.NVarChar, value: Comment });
    }

    const request = req.db.request();
    parameters.forEach(param => request.input(param.name, param.type, param.value));
    const updateResult = await request.query(updateQuery);

    if (updateResult.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const { data: review, error: reviewError } = await req.db.request()
      .input('ReviewId', sql.Int, ReviewId)
      .query(`
        SELECT *
        FROM reviews
        WHERE ReviewId = @ReviewId
      `);

    if (reviewError || !review.recordset[0]) {
      return res.status(404).json({ message: 'Review not found', error: reviewError });
    }

    return res.status(200).json({ message: 'Review updated successfully', review: review.recordset[0] });
  } catch (error) {
    console.error('updateReview:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Review
exports.deleteReview = async (req, res) => {
  try {
    const { error: authError, decoded } = verifyUser(req);
    if (authError) return res.status(401).json({ message: authError });

    const { ReviewId } = req.params;

    // Fetch the review to check ownership
    const existingReviewResult = await req.db.request()
      .input('ReviewId', sql.Int, ReviewId)
      .query(`
        SELECT UserId
        FROM reviews
        WHERE ReviewId = @ReviewId AND IsActive = 'Y'
      `);

    const existingReview = existingReviewResult.recordset[0];
    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (decoded.role !== 'Admin' && existingReview.UserId !== decoded.id) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own review' });
    }

    // Soft delete by setting IsActive to false
    const updateResult = await req.db.request()
      .input('ReviewId', sql.Int, ReviewId)
      .input('IsActive', sql.Char(1), 'N')
      .input('UpdatedAt', sql.DateTime, new Date().toISOString())
      .query(`
        UPDATE reviews
        SET IsActive = @IsActive, UpdatedAt = @UpdatedAt
        WHERE ReviewId = @ReviewId
      `);

    if (updateResult.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    return res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('deleteReview:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Reviews
exports.getAllReviews = async (req, res) => {
  try {
    const result = await req.db.request()
      .query(`
        SELECT 
          r.ReviewId,
          r.UserId,
          r.ProductId,
          r.Rating,
          r.Comment,
          r.CreatedAt,
          r.UpdatedAt,
          r.IsActive,
          u.FullName,
          p.Name AS ProductName
        FROM reviews r
        INNER JOIN users u ON r.UserId = u.UserId
        INNER JOIN products p ON r.ProductId = p.ProductId
        WHERE r.IsActive = 'Y'
      `);

    const data = result.recordset;
    if (!data || data.length === 0) {
      return res.status(200).json({ message: 'No reviews found' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('getAllReviews:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};