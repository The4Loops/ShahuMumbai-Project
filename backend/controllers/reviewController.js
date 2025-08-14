const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const supabase = require("../config/supabaseClient");

// Create Review
exports.createReview = async (req, res) => {
  try {
    const { userid, productid, rating, comment } = req.body;

    // Validate required fields
    if (!userid || !productid || !rating) {
      return res
        .status(400)
        .json({ message: "User ID, Product ID, and Rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // Check if a review already exists for this user and product
    const { data: existingReview, error: fetchError } = await supabase
      .from("reviews")
      .select("id")
      .eq("userid", parseInt(userid))
      .eq("productid", productid)
      .eq("is_active", true)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 means no rows found
      return res
        .status(400)
        .json({ message: "Error checking existing review", error: fetchError });
    }

    if (existingReview) {
      return res
        .status(400)
        .json({
          message: "A review for this product already exists by this user",
        });
    }

    // Insert review
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .insert([
        {
          userid: parseInt(userid),
          productid,
          rating: rating ? parseInt(rating) : null,
          comment,
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (reviewError) {
      return res
        .status(400)
        .json({ message: "Error inserting review", error: reviewError });
    }

    return res
      .status(201)
      .json({ message: "Review created successfully", review });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get Reviews by Product ID
exports.getReviewsByProductId = async (req, res) => {
  try {
    const { id } = req.params;

    let query = supabase
      .from("reviews")
      .select(
        `
        *,
        users!userid (
          id,
          full_name
        ),
        products!productid (
          id,
          name
        )
      `
      )
      .eq("is_active", true)
      .eq("productid", id);

    const { data, error } = await query;

    if (error) {
      return res
        .status(400)
        .json({ message: "Error fetching reviews", error });
    }

    if (!data || data.length === 0) {
      return res
        .status(200)
        .json({ message: "No reviews found for this product" });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Update Review
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // Fetch the review to check ownership
    const { data: existingReview, error: fetchError } = await supabase
      .from("reviews")
      .select("userid")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (fetchError || !existingReview) {
      return res
        .status(404)
        .json({ message: "Review not found", error: fetchError });
    }

    if (
      decoded.role !== "admin" &&
      parseInt(existingReview.userid) !== parseInt(decoded.id)
    ) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only update your own review" });
    }

    // Update review
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .update({
        rating: rating ? parseInt(rating) : undefined,
        comment,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (reviewError || !review) {
      return res
        .status(404)
        .json({ message: "Review not found", error: reviewError });
    }

    return res
      .status(200)
      .json({ message: "Review updated successfully", review });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete Review
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the review to check ownership
    const { data: existingReview, error: fetchError } = await supabase
      .from("reviews")
      .select("userid")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (fetchError || !existingReview) {
      return res
        .status(404)
        .json({ message: "Review not found", error: fetchError });
    }

    if (
      decoded.role !== "admin" &&
      parseInt(existingReview.userid) !== parseInt(decoded.id)
    ) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only delete your own review" });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from("reviews")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return res.status(404).json({ message: "Review not found", error });
    }

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
