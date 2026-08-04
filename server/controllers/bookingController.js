import Show from '../models/Show.js';
import Booking from '../models/Booking.js';
import Movie from '../models/Movie.js';
import MenuItem from '../models/MenuItem.js';
import PriceWatch from '../models/PriceWatch.js';
import stripe from 'stripe';
import { inngest } from '../inngest/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { buildSeatCapacityByRow, isSeatValidForScreen } from '../utils/seatId.js';
import { buildBookingIcs } from '../utils/calendarEvent.js';
import { buildPickupQrPng } from '../utils/qrCode.js';
import { verifyPickupToken } from '../utils/pickupToken.js';
import { occupySeatsAtomic, releaseSeatsAndNotifyWaitlist } from '../utils/seatOperations.js';
import { SCREEN_WITH_THEATER, assertScreenBelongsToTheater, resolveTheaterContext } from '../utils/theaterScope.js';
import { loadOwnedBooking } from '../utils/bookingOwnership.js';
import { redeemCouponAtomic, releaseCouponAtomic } from './couponController.js';
import { computeDiscount } from '../utils/couponPricing.js';
import { fetchApplicableRules, computeShowPrice } from '../utils/dynamicPricing.js';
import { redeemPointsAtomic, refundRedeemedPoints, reverseEarnedPoints } from '../utils/loyaltyPoints.js';
import { isMysteryRevealed } from '../utils/mysteryMovie.js';
import { redeemBingePassCredit, refundBingePassCredit } from './subscriptionController.js';
import { isShowBingePassEligible } from '../utils/bingePassEligibility.js';

const MAX_SNACK_QUANTITY_PER_ITEM = 10;

const resolveSnacks = async (requestedSnacks, theaterId) => {
    if (!Array.isArray(requestedSnacks) || requestedSnacks.length === 0) {
        return { snacks: [], snacksAmount: 0 };
    }

    const itemIds = requestedSnacks.map(s => s.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: itemIds }, theaterId });
    const menuItemById = new Map(menuItems.map(m => [m._id.toString(), m]));

    const snacks = [];
    let snacksAmount = 0;

    for (const requested of requestedSnacks) {
        const quantity = requested.quantity;
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_SNACK_QUANTITY_PER_ITEM) {
            throw new AppError('Invalid snack quantity', 400, 'INVALID_INPUT');
        }

        const menuItem = menuItemById.get(requested.menuItemId);
        if (!menuItem || !menuItem.isAvailable) {
            throw new AppError(`"${menuItem?.name || 'A selected item'}" is no longer available`, 409, 'SNACK_UNAVAILABLE');
        }

        snacks.push({ menuItem: menuItem._id, name: menuItem.name, price: menuItem.price, quantity });
        snacksAmount += menuItem.price * quantity;
    }

    return { snacks, snacksAmount };
};


export const MAX_SEATS_PER_BOOKING = 5;


export const runBookingCheckout = async ({
    userId, showId, selectedSeats, couponCode, requestedSnacks, redeemPoints, origin,
    skipSeatLock = false, extraBookingFields = {}, onSeatRollback, useBingePassCredit = false,
}) => {
    const rollbackSeats = onSeatRollback || (seats => releaseSeatsAndNotifyWaitlist(showId, seats));

    const showForSeatCheck = await Show.findById(showId).populate(SCREEN_WITH_THEATER);
    if (!showForSeatCheck || showForSeatCheck.isCancelled) {
        throw new AppError('Show not found', 404, 'SHOW_NOT_FOUND');
    }

    const seatCapacityByRow = buildSeatCapacityByRow(showForSeatCheck.screen);
    if (!selectedSeats.every(seat => isSeatValidForScreen(seat, seatCapacityByRow))) {
        throw new AppError('Invalid seat selection', 400, 'INVALID_SEATS');
    }

    const { theaterId, timezone: theaterTimezone } = resolveTheaterContext(showForSeatCheck);

    let showData;
    if (skipSeatLock) {
        showData = await Show.findById(showId).populate('movie');
        if (!showData) {
            throw new AppError('Show not found', 404, 'SHOW_NOT_FOUND');
        }
    } else {
        const seatConditions = selectedSeats.map(seat => ({ [`occupiedSeats.${seat}`]: { $exists: false } }));
        const seatUpdates = Object.fromEntries(selectedSeats.map(seat => [`occupiedSeats.${seat}`, userId]));

        showData = await Show.findOneAndUpdate(
            { _id: showId, $and: seatConditions },
            { $set: seatUpdates },
            { new: true }
        ).populate('movie');

        if(!showData) {
            const showExists = await Show.exists({ _id: showId });
            throw new AppError(
                showExists ? "Selected seats are not available" : "Show not found",
                showExists ? 409 : 404,
                showExists ? 'SEATS_UNAVAILABLE' : 'SHOW_NOT_FOUND'
            );
        }
    }

    const pricingRules = await fetchApplicableRules(theaterId);
    const computedSeatPrice = computeShowPrice(showData.showPrice, pricingRules, {
        showDateTime: showData.showDateTime,
        timezone: theaterTimezone,
    });

    const originalAmount = computedSeatPrice * selectedSeats.length;
    let finalAmount = originalAmount;
    let discountAmount = 0;
    let redeemedCoupon = null;
    let bingePassCreditAmount = 0;
    let bingePassUsage = null;

    if (couponCode) {
        try {
            redeemedCoupon = await redeemCouponAtomic(couponCode, theaterId);
        } catch (error) {
            await rollbackSeats(selectedSeats);
            throw error;
        }
        discountAmount = computeDiscount(redeemedCoupon, originalAmount);
        finalAmount = originalAmount - discountAmount;

        if (finalAmount <= 0) {
            await releaseCouponAtomic(redeemedCoupon.code);
            await rollbackSeats(selectedSeats);
            throw new AppError('Coupon discount cannot cover the full booking amount', 400, 'COUPON_INVALID');
        }
    }

    let snacks;
    let snacksAmount;
    try {
        ({ snacks, snacksAmount } = await resolveSnacks(requestedSnacks, theaterId));
    } catch (error) {
        await rollbackSeats(selectedSeats);
        if (redeemedCoupon) {
            await releaseCouponAtomic(redeemedCoupon.code);
        }
        throw error;
    }

    // --- Binge Pass credit redemption ---
    if (useBingePassCredit) {
        try {
            const showEligible = await isShowBingePassEligible(showData, theaterId, theaterTimezone);
            if (!showEligible) {
                throw new AppError('This showtime is not eligible for a Binge Pass credit (peak/premium show)', 400, 'BINGE_PASS_NOT_ELIGIBLE');
            }

            bingePassCreditAmount = Math.min(computedSeatPrice * selectedSeats.length, finalAmount);
            finalAmount = Math.max(0, finalAmount - bingePassCreditAmount);
        } catch (error) {
            await rollbackSeats(selectedSeats);
            if (redeemedCoupon) {
                await releaseCouponAtomic(redeemedCoupon.code);
            }
            throw error;
        }
    }

    const booking = await Booking.create({
        user: userId,
        show: showId,
        amount: finalAmount + snacksAmount,
        originalAmount,
        couponCode: redeemedCoupon ? redeemedCoupon.code : null,
        discountAmount,
        bookedSeats: selectedSeats,
        snacks,
        snacksAmount,
        bingePassCreditUsed: useBingePassCredit,
        bingePassCreditAmount,
        ...extraBookingFields,
    })

    if (useBingePassCredit) {
        try {
            bingePassUsage = await redeemBingePassCredit({ userId, bookingId: booking._id, showId });
        } catch (error) {
            await rollbackSeats(selectedSeats);
            if (redeemedCoupon) {
                await releaseCouponAtomic(redeemedCoupon.code);
            }
            await Booking.findByIdAndDelete(booking._id);
            throw error;
        }
    }

    await PriceWatch.deleteOne({ user: userId, show: showId, status: 'active' });

    let pointsDiscountAmount = 0;
    if (redeemPoints) {
        try {
            pointsDiscountAmount = await redeemPointsAtomic(userId, booking._id.toString(), redeemPoints, finalAmount);
        } catch (error) {
            await rollbackSeats(selectedSeats);
            if (redeemedCoupon) {
                await releaseCouponAtomic(redeemedCoupon.code);
            }
            await Booking.findByIdAndDelete(booking._id);
            throw error;
        }

        finalAmount -= pointsDiscountAmount;

        if (finalAmount <= 0) {
            await refundRedeemedPoints(userId, booking._id.toString());
            await rollbackSeats(selectedSeats);
            if (redeemedCoupon) {
                await releaseCouponAtomic(redeemedCoupon.code);
            }
            await Booking.findByIdAndDelete(booking._id);
            throw new AppError('Points discount cannot cover the full booking amount', 400, 'POINTS_INVALID');
        }

        booking.pointsRedeemed = redeemPoints;
        booking.pointsDiscountAmount = pointsDiscountAmount;
        booking.amount = finalAmount + snacksAmount;
        await booking.save();
    }

    // If the Binge Pass credit fully covers the ticket and there are no snacks,
    // the booking is free — mark it paid immediately without a Stripe session.
    if (useBingePassCredit && finalAmount <= 0 && snacksAmount === 0) {
        booking.isPaid = true;
        booking.status = 'confirmed';
        booking.paymentLink = "";
        await booking.save();

        await inngest.send({
            name: 'app/show.booked',
            data: { bookingId: booking._id.toString() }
        });

        return { booking, session: null };
    }

    try {
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        const lineItemName = showData.isMysteryMovie
            ? 'Mystery Movie Ticket'
            : showData.movie.title;

        const line_items = [];

        if (finalAmount > 0) {
            line_items.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: lineItemName
                    },
                    unit_amount: Math.round(finalAmount * 100)
                },
                quantity: 1
            });
        }

        for (const snack of snacks) {
            line_items.push({
                price_data: {
                    currency: 'usd',
                    product_data: { name: snack.name },
                    unit_amount: Math.round(snack.price * 100),
                },
                quantity: snack.quantity,
            });
        }

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-bookings?booking=${booking._id}`,
            cancel_url: `${origin}/my-bookings`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                bookingId: booking._id.toString(),
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        })

        booking.paymentLink = session.url
        await booking.save()

        await inngest.send({
            name: 'app/checkpayment',
            data: {
                bookingId: booking._id.toString()
            }
        })

        return { booking, session };

    } catch (error) {
        await rollbackSeats(selectedSeats);
        if (redeemedCoupon) {
            await releaseCouponAtomic(redeemedCoupon.code);
        }
        if (pointsDiscountAmount > 0) {
            await refundRedeemedPoints(userId, booking._id.toString());
        }
        if (bingePassUsage) {
            await refundBingePassCredit({ userId, bookingId: booking._id });
        }
        await Booking.findByIdAndDelete(booking._id);
        throw error;
    }
};

export const createBooking = asyncHandler(async(req , res)=> {
    const {userId} = req.auth();
    const {showId , selectedSeats, couponCode, snacks: requestedSnacks, redeemPoints, useBingePassCredit} = req.body;
    const {origin} =  req.headers;

    if (!showId || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
        throw new AppError('showId and selectedSeats are required', 400, 'INVALID_INPUT');
    }
    if (selectedSeats.length > MAX_SEATS_PER_BOOKING) {
        throw new AppError(`You can book at most ${MAX_SEATS_PER_BOOKING} seats`, 400, 'TOO_MANY_SEATS');
    }
    if (redeemPoints !== undefined && (!Number.isInteger(redeemPoints) || redeemPoints <= 0)) {
        throw new AppError('redeemPoints must be a positive integer', 400, 'INVALID_INPUT');
    }
    if (useBingePassCredit !== undefined && typeof useBingePassCredit !== 'boolean') {
        throw new AppError('useBingePassCredit must be a boolean', 400, 'INVALID_INPUT');
    }

    const { booking, session } = await runBookingCheckout({
        userId, showId, selectedSeats, couponCode, requestedSnacks, redeemPoints, origin, useBingePassCredit,
    });

    req.log.info({ bookingId: booking._id.toString(), showId, userId }, 'Booking created, checkout session started');
    res.json({success: true, url: session?.url || null, isPaid: booking.isPaid});
});


export const getBookingStatus = asyncHandler(async(req, res) => {
    const {userId} = req.auth();
    const booking = await loadOwnedBooking(req.params.bookingId, userId);

    res.json({success: true, isPaid: booking.isPaid});
});


export const getBookingPickupQr = asyncHandler(async(req, res) => {
    const {userId} = req.auth();
    const booking = await loadOwnedBooking(req.params.bookingId, userId);

    if (!booking.isPaid) {
        throw new AppError('Only paid bookings have a pickup QR code', 400, 'BOOKING_NOT_PAID');
    }
    if (booking.snacks.length === 0) {
        throw new AppError('This booking has no concession pre-order', 400, 'NO_SNACKS_ORDERED');
    }

    const qrPng = await buildPickupQrPng(booking._id.toString());

    res.set({
        'Content-Type': 'image/png',
        'Cache-Control': 'private, no-store',
    });
    res.send(qrPng);
});


export const verifyBookingPickup = asyncHandler(async(req, res) => {
    const { token } = req.body;

    const bookingId = verifyPickupToken(token);
    if (!bookingId) {
        throw new AppError('Invalid or tampered pickup code', 400, 'INVALID_PICKUP_TOKEN');
    }

    const booking = await Booking.findById(bookingId).populate({
        path: 'show',
        populate: SCREEN_WITH_THEATER,
    });
    if (!booking) {
        throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    assertScreenBelongsToTheater(booking.show?.screen, req.adminContext);

    if (!booking.isPaid) {
        throw new AppError('This booking has not been paid for', 400, 'BOOKING_NOT_PAID');
    }
    if (booking.snacks.length === 0) {
        throw new AppError('This booking has no concession pre-order', 400, 'NO_SNACKS_ORDERED');
    }

    const updated = await Booking.findOneAndUpdate(
        { _id: bookingId, concessionPickedUp: false },
        { $set: { concessionPickedUp: true } },
        { new: true }
    );

    if (!updated) {
        throw new AppError('Concession order has already been picked up', 409, 'ALREADY_PICKED_UP');
    }

    req.log.info({ bookingId }, 'Concession order picked up');
    res.json({ success: true, message: 'Pickup confirmed', snacks: updated.snacks });
});


export const getBookingCalendar = asyncHandler(async(req, res) => {
    const {userId} = req.auth();
    const booking = await loadOwnedBooking(req.params.bookingId, userId);

    if (!booking.isPaid) {
        throw new AppError('Only paid bookings have a calendar event', 400, 'BOOKING_NOT_PAID');
    }

    const show = await Show.findById(booking.show).populate(SCREEN_WITH_THEATER);
    if (!show) {
        throw new AppError('Show not found', 404, 'SHOW_NOT_FOUND');
    }

    const movie = await Movie.findById(show.movie);
    if (!movie) {
        throw new AppError('Movie not found', 404, 'MOVIE_NOT_FOUND');
    }

    const revealed = isMysteryRevealed(show, { isPaid: booking.isPaid });
    const movieTitle = revealed ? movie.title : 'Mystery Movie';

    const icsContent = buildBookingIcs({
        movieTitle,
        runtimeMinutes: revealed ? movie.runtime : null,
        showDateTime: show.showDateTime,
        theater: show.screen?.theater,
        bookingId: booking._id.toString(),
    });

    res.set({
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${movieTitle.replace(/[^a-z0-9]/gi, '_')}.ics"`,
    });
    res.send(icsContent);
});


export const cancelBooking = asyncHandler(async(req, res) => {
    const {userId} = req.auth();
    const {bookingId} = req.params;

    const booking = await loadOwnedBooking(bookingId, userId);

    if (booking.status === 'cancelled') {
        throw new AppError('Booking is already cancelled', 409, 'ALREADY_CANCELLED');
    }
    if (booking.status === 'pending-cancellation') {
        throw new AppError('Booking cancellation is already being processed, please contact support', 409, 'CANCELLATION_PENDING');
    }
    if (!booking.isPaid) {
        throw new AppError('Only paid bookings can be cancelled', 400, 'BOOKING_NOT_PAID');
    }

    const show = await Show.findById(booking.show).populate(SCREEN_WITH_THEATER);
    if (!show) {
        throw new AppError('Show not found', 404, 'SHOW_NOT_FOUND');
    }

    const cutoffHours = show.screen?.theater?.cancellationPolicy?.cutoffHoursBeforeShow ?? 2;
    const cutoffMs = cutoffHours * 60 * 60 * 1000;
    if (show.showDateTime.getTime() - Date.now() < cutoffMs) {
        throw new AppError(`Bookings can only be cancelled at least ${cutoffHours} hour(s) before the showtime`, 400, 'CANCELLATION_WINDOW_PASSED');
    }

    await releaseSeatsAndNotifyWaitlist(booking.show, booking.bookedSeats);

    try {
        if (booking.paymentIntentId) {
            const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
            await stripeInstance.refunds.create({ payment_intent: booking.paymentIntentId });
        }

        booking.status = 'cancelled';
        booking.isPaid = false;
        await booking.save();

        if (booking.couponCode) {
            await releaseCouponAtomic(booking.couponCode);
        }
        await reverseEarnedPoints(userId, bookingId);
        if (booking.pointsRedeemed > 0) {
            await refundRedeemedPoints(userId, bookingId);
        }
        if (booking.bingePassCreditUsed) {
            await refundBingePassCredit({ userId, bookingId });
        }

        req.log.info({ bookingId, userId }, 'Booking cancelled and refunded');
        res.json({ success: true, message: 'Booking cancelled and refund initiated' });
    } catch (error) {
        req.log.error({ err: error, bookingId }, 'Refund failed after seats released, re-occupying seats for manual review');
        await occupySeatsAtomic(booking.show, booking.bookedSeats, userId);
        booking.status = 'pending-cancellation';
        await booking.save();
        throw error;
    }
});


export const getOccupiedSeats = asyncHandler(async(req, res) => {
    const {showId} = req.params;
    const showData = await Show.findById(showId)

    if (!showData || showData.isCancelled) {
        throw new AppError('Show not found', 404, 'SHOW_NOT_FOUND');
    }

    const occupiedSeats = Object.keys(showData.occupiedSeats)

    req.log.debug({ showId, occupiedCount: occupiedSeats.length }, 'Seat availability polled');
    res.json({success: true, occupiedSeats})
});
