const prisma = require('../lib/prisma');
const { reviewSchema } = require('../lib/validators');

// POST /api/reviews — customer only. Upserts: submitting again edits their existing review.
// Only allowed for a product the customer has actually received (DELIVERED order) or a
// service booking that has been COMPLETED — this prevents fake/drive-by reviews.
async function createReview(req, res) {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { productId, serviceId, rating, comment } = parsed.data;

  if (productId) {
    const purchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { customerId: req.user.id, status: 'DELIVERED' },
      },
    });
    if (!purchased) {
      return res.status(403).json({
        error: 'You can only review products from an order that has been delivered to you',
      });
    }

    const existing = await prisma.review.findFirst({ where: { productId, userId: req.user.id } });
    const review = existing
      ? await prisma.review.update({
          where: { id: existing.id },
          data: { rating, comment: comment || null, isFlagged: false },
        })
      : await prisma.review.create({
          data: { productId, userId: req.user.id, rating, comment: comment || null },
        });

    return res.status(existing ? 200 : 201).json({
      message: existing ? 'Review updated' : 'Review submitted',
      review,
    });
  }

  // serviceId path
  const completedBooking = await prisma.booking.findFirst({
    where: { serviceId, customerId: req.user.id, status: 'COMPLETED' },
  });
  if (!completedBooking) {
    return res.status(403).json({
      error: 'You can only review services from a booking that has been completed',
    });
  }

  const existing = await prisma.review.findFirst({ where: { serviceId, userId: req.user.id } });
  const review = existing
    ? await prisma.review.update({
        where: { id: existing.id },
        data: { rating, comment: comment || null, isFlagged: false },
      })
    : await prisma.review.create({
        data: { serviceId, userId: req.user.id, rating, comment: comment || null },
      });

  return res.status(existing ? 200 : 201).json({
    message: existing ? 'Review updated' : 'Review submitted',
    review,
  });
}

// GET /api/reviews/eligibility?productId=1  or  ?serviceId=2
// Lets the UI know upfront whether to show the "write a review" form,
// and whether the customer already has a review to prefill/edit.
async function checkEligibility(req, res) {
  const productId = req.query.productId ? Number(req.query.productId) : undefined;
  const serviceId = req.query.serviceId ? Number(req.query.serviceId) : undefined;

  if (!productId && !serviceId) {
    return res.status(400).json({ error: 'Provide productId or serviceId' });
  }

  let eligible = false;
  if (productId) {
    eligible = !!(await prisma.orderItem.findFirst({
      where: { productId, order: { customerId: req.user.id, status: 'DELIVERED' } },
    }));
  } else {
    eligible = !!(await prisma.booking.findFirst({
      where: { serviceId, customerId: req.user.id, status: 'COMPLETED' },
    }));
  }

  const existingReview = await prisma.review.findFirst({
    where: { userId: req.user.id, ...(productId ? { productId } : { serviceId }) },
  });

  return res.json({ eligible, existingReview });
}

module.exports = { createReview, checkEligibility };
