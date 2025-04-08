/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
/* eslint-disable indent */
/* eslint-disable object-curly-spacing */
/* eslint-disable no-case-declarations */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import stripe from "stripe";

admin.initializeApp();

// Create Stripe checkout session
exports.createCheckoutSession = functions.https.onCall(
  async (data, context) => {
    // Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to make a purchase"
      );
    }

    try {
      const { orderId, items, customerEmail } = data;

      // Format line items for Stripe
      const lineItems = items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.title,
            description: `Condition: ${item.condition}`,
            metadata: {
              listingId: item.id,
              isbn: item.isbn,
            },
          },
          unit_amount: Math.round(item.price * 100), // Stripe uses cents
        },
        quantity: 1,
      }));

      // Create payment session with Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        customer_email: customerEmail,
        success_url: `https://yourapp.com/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
        cancel_url: `https://yourapp.com/payment-canceled?order_id=${orderId}`,
        metadata: {
          order_id: orderId,
          user_id: context.auth.uid,
        },
      });

      // Return the session URL to the app
      return { url: session.url, sessionId: session.id };
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

// Check payment status
exports.checkPaymentStatus = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to check payment status"
    );
  }

  try {
    const { orderId } = data;

    // Query Stripe for sessions with this order ID in metadata
    const sessions = await stripe.checkout.sessions.list({
      limit: 1,
      expand: ["data.payment_intent"],
      metadata: {
        order_id: orderId,
      },
    });

    if (sessions.data.length === 0) {
      return { status: "not_found" };
    }

    const session = sessions.data[0];
    const paymentStatus = session.payment_status;

    // Map Stripe status to app status
    let status;
    switch (paymentStatus) {
      case "paid":
        // Update the order in Firestore
        await updateOrderAfterPayment(orderId);
        status = "completed";
        break;
      case "unpaid":
        status = "pending";
        break;
      default:
        status = "failed";
    }

    return { status };
  } catch (error) {
    console.error("Error checking payment status:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Stripe webhook handler
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    // Verify webhook signature using your webhook secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle specific event types
  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        const orderId = session.metadata.order_id;

        // Update the order in Firestore
        await updateOrderAfterPayment(orderId);
        break;

      case "payment_intent.payment_failed":
        const failedPaymentIntent = event.data.object;
        const failedOrderId = failedPaymentIntent.metadata.order_id;

        // Mark order as failed
        await updateOrderStatus(failedOrderId, "payment_failed");
        break;
    }

    // Return 200 success response
    res.status(200).send({ received: true });
  } catch (error) {
    console.error(`Error handling webhook: ${error.message}`);
    res.status(500).send({ error: error.message });
  }
});

// Helper function to update Firestore after payment
async function updateOrderAfterPayment(orderId) {
  const db = admin.firestore();

  // Get the order document
  const orderRef = db.collection("orders").doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists()) {
    console.error(`Order ${orderId} not found`);
    return;
  }

  const orderData = orderDoc.data();

  // Skip if order is already processed
  if (orderData.status === "processing" || orderData.status === "completed") {
    return;
  }

  // Create a batch for atomic updates
  const batch = db.batch();

  // Update order status
  batch.update(orderRef, {
    status: "processing",
    paymentCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update all listings to "awaiting_dropoff"
  for (const item of orderData.items) {
    const listingRef = db.collection("listings").doc(item.listingId);
    batch.update(listingRef, {
      status: "awaiting_dropoff",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      buyerId: orderData.buyerId,
      orderId: orderId,
    });
  }

  // Update user's purchase records
  const userRef = db.collection("users").doc(orderData.buyerId);
  const userDoc = await userRef.get();

  if (userDoc.exists()) {
    const userData = userDoc.data();
    batch.update(userRef, {
      purchaseIds: admin.firestore.FieldValue.arrayUnion(orderId),
      numOfPurchases: (userData.numOfPurchases || 0) + 1,
    });
  }

  // Add notifications
  const notificationRef = db.collection("notifications").doc();
  batch.set(notificationRef, {
    userId: orderData.buyerId,
    type: "payment_success",
    title: "Payment Successful",
    message:
      "Your payment was successful. The seller has been notified to drop off your book(s).",
    orderId: orderId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    read: false,
  });

  // Commit all updates
  await batch.commit();
}

// Helper function to update order status
async function updateOrderStatus(orderId, status) {
  const db = admin.firestore();
  const orderRef = db.collection("orders").doc(orderId);

  await orderRef.update({
    status: status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
