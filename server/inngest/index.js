import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import GroupBooking from "../models/GroupBooking.js";
import ShowtimePoll from "../models/ShowtimePoll.js";
import Show from "../models/Show.js";
import Follow from "../models/Follow.js";
import sendEmail from "../configs/nodeMailer.js";
import { logger } from "../configs/logger.js";
import { buildBookingIcs } from "../utils/calendarEvent.js";
import { buildPickupQrPng } from "../utils/qrCode.js";
import { formatInZone } from "../utils/timezone.js";
import { SCREEN_WITH_THEATER, resolveTheaterContext } from "../utils/theaterScope.js";
import { releaseSeatsAtomic, releaseSeatsAndNotifyWaitlist } from "../utils/seatOperations.js";
import Waitlist from "../models/Waitlist.js";
import { offerSeatsToWaitlist, CLAIM_WINDOW_MINUTES } from "../utils/waitlistOffers.js";
import { releaseCouponAtomic } from "../controllers/couponController.js";
import { revertClaimsToUnclaimed } from "../utils/groupBookingClaims.js";
import { refundRedeemedPoints } from "../utils/loyaltyPoints.js";
import { assignReferralCode, attributeReferral } from "../utils/referrals.js";
import { renderEmail, highlight } from "../utils/emailTemplate.js";
import { isMysteryRevealed } from "../utils/mysteryMovie.js";
import PriceWatch from "../models/PriceWatch.js";
import { getComputedPriceForShow } from "../utils/dynamicPricing.js";
import { refundBingePassCredit } from "../controllers/subscriptionController.js";

export const inngest = new Inngest({ id: "movie-ticket-booking" });

const syncUserCreation = inngest.createFunction(
  { id: 'sync-user-from-clerk' },
  { event: 'clerk/user.created' },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url, unsafe_metadata } = event.data
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + ' ' + last_name,
      image: image_url
    }
    await User.create(userData)
    await assignReferralCode(id)

    const referralCode = unsafe_metadata?.referralCode;
    if (referralCode) {
      await attributeReferral(id, referralCode)
    }
  }
)


const syncUserDeletion = inngest.createFunction(
  { id: 'delete-user-from-clerk' },
  { event: 'clerk/user.deleted' },
  async ({ event }) => {
    const { id } = event.data
    await User.findByIdAndDelete(id)
  }
)


const syncUserUpdation = inngest.createFunction(
  { id: 'update-user-from-clerk' },
  { event: 'clerk/user.updated' },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + ' ' + last_name,
      image: image_url
    }
    await User.findByIdAndUpdate(id, userData)
  }
)

const releaseSeatsAndDeleteBooking = inngest.createFunction(
  { id: 'release-seats-date-booking' },
  { event: 'app/checkpayment' },
  async ({ event, step }) => {
    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
    await step.sleepUntil('wait-for-10-minutes', tenMinutesLater);

    await step.run('check-payment-status', async () => {
      const bookingId = event.data.bookingId;
      const booking = await Booking.findById(bookingId)

      if (!booking.isPaid) {
        await releaseSeatsAndNotifyWaitlist(booking.show, booking.bookedSeats);
        if (booking.groupBookingId) {
          // An abandoned group-claim checkout must revert its claims back to
          // unclaimed, otherwise the group's ledger keeps showing the seat as
          // claimed even though it was just released back to Show.occupiedSeats.
          await revertClaimsToUnclaimed(booking.groupBookingId, booking.bookedSeats);
        }
        if (booking.couponCode) {
          await releaseCouponAtomic(booking.couponCode);
        }
        if (booking.pointsRedeemed > 0) {
          await refundRedeemedPoints(booking.user, booking._id.toString());
        }
        if (booking.bingePassCreditUsed) {
          await refundBingePassCredit({ userId: booking.user, bookingId: booking._id });
        }
        await Booking.findByIdAndDelete(booking._id)
        logger.info({ bookingId }, 'Unpaid booking expired, seats released');
      }
    })
  }
)

const expireGroupBooking = inngest.createFunction(
  { id: 'expire-group-booking' },
  { event: 'app/group-booking.expire' },
  async ({ event, step }) => {
    const { groupBookingId, expiresAt } = event.data;
    await step.sleepUntil('wait-until-group-expiry', new Date(expiresAt));

    await step.run('release-unclaimed-and-unpaid-seats', async () => {
      const group = await GroupBooking.findById(groupBookingId);
      if (!group || group.status !== 'active') {
        logger.info({ groupBookingId }, 'Group booking already inactive at expiry time, skipping');
        return;
      }

      const unpaidClaims = group.claims.filter(c => !c.isPaid);
      const seatsToRelease = unpaidClaims.map(c => c.seat);

      const orphanedBookingIds = unpaidClaims.filter(c => c.bookingId).map(c => c.bookingId);
      if (orphanedBookingIds.length) {
        await Booking.updateMany(
          { _id: { $in: orphanedBookingIds }, isPaid: false },
          { $set: { status: 'cancelled' } }
        );
      }

      if (seatsToRelease.length) {
        await releaseSeatsAndNotifyWaitlist(group.show, seatsToRelease);
      }

      group.status = 'expired';
      await group.save();

      logger.info({ groupBookingId, releasedCount: seatsToRelease.length }, 'Group booking expired, unclaimed/unpaid seats released');
    })
  }
)

const expireShowtimePoll = inngest.createFunction(
  { id: 'expire-showtime-poll' },
  { event: 'app/showtime-poll.expire' },
  async ({ event, step }) => {
    const { pollId, expiresAt } = event.data;
    await step.sleepUntil('wait-until-poll-expiry', new Date(expiresAt));

    await step.run('mark-expired-if-still-active', async () => {
      const poll = await ShowtimePoll.findOneAndUpdate(
        { _id: pollId, status: 'active' },
        { $set: { status: 'expired' } },
        { new: true }
      ).populate({ path: 'candidateShows.show', populate: { path: 'movie' } });
      if (!poll) return;

      const organizer = await User.findById(poll.organizerId);
      if (!organizer) return;

      const manageUrl = `${process.env.CLIENT_URL}/showtime-poll/${poll._id}/manage`;

      await sendEmail({
        to: organizer.email,
        subject: 'Your Squad Sync poll expired without a clear winner',
        body: renderEmail({
          greetingName: organizer.name,
          bodyHtml: `
            <p>Your showtime poll for ${highlight(poll.candidateShows.map(c => c.show?.movie?.title).find(Boolean) || 'your movie night')}
               expired before a winner was reached.</p>
            <p><a href="${manageUrl}">Open the poll</a> to break the tie and start the group booking manually.</p>
          `,
          closingLine: 'No rush — the candidate shows are still there until you decide.',
        }),
      });

      logger.info({ pollId }, 'Showtime poll expired without quorum, organizer notified');
    });
  }
)

const notifyShowtimePollClosed = inngest.createFunction(
  { id: 'notify-showtime-poll-closed' },
  { event: 'app/showtime-poll.closed' },
  async ({ event }) => {
    const { pollId, groupBookingId } = event.data;

    const poll = await ShowtimePoll.findById(pollId).populate({ path: 'winningShow', populate: { path: 'movie' } });
    if (!poll) return;

    const organizer = await User.findById(poll.organizerId);
    if (!organizer) return;

    const manageUrl = `${process.env.CLIENT_URL}/group-booking/${groupBookingId}/manage`;
    const movieTitle = poll.winningShow?.movie?.title || 'your movie night';

    await sendEmail({
      to: organizer.email,
      subject: `The votes are in: "${movieTitle}" it is!`,
      body: renderEmail({
        greetingName: organizer.name,
        bodyHtml: `
          <p>Your Squad Sync poll closed — ${highlight(`"${movieTitle}"`)} won the vote, and a group booking has been created.</p>
          <p><a href="${manageUrl}">Manage the group booking</a> and share the join link with your friends so they can claim seats.</p>
        `,
        closingLine: 'See you at the movies!',
      }),
    });

    logger.info({ pollId, groupBookingId }, 'Showtime poll outcome notification sent to organizer');
  }
)

const sendWaitlistOffer = inngest.createFunction(
  { id: 'send-waitlist-offer' },
  { event: 'app/waitlist.offer' },
  async ({ event, step }) => {
    const { waitlistEntryId, showId, seat, offerExpiresAt } = event.data;

    await step.run('send-claim-email', async () => {
      const entry = await Waitlist.findById(waitlistEntryId);
      if (!entry || entry.status !== 'offered') return; 

      const [user, show] = await Promise.all([
        User.findById(entry.userId),
        Show.findById(showId).populate('movie').populate(SCREEN_WITH_THEATER),
      ]);
      if (!user || !show) return;

      const { date: showDate, time: showTime } = formatInZone(show.showDateTime, show.screen?.theater?.timezone);
      const claimUrl = `${process.env.CLIENT_URL}/waitlist/${entry._id}/claim`;
      const movieTitle = isMysteryRevealed(show, { isPaid: false }) ? show.movie.title : 'Mystery Movie';

      await sendEmail({
        to: user.email,
        subject: `A seat opened up for "${movieTitle}"!`,
        body: renderEmail({
          greetingName: user.name,
          bodyHtml: `
            <p>Good news, a seat (${highlight(seat)}) just became available for
               ${highlight(`"${movieTitle}"`)} on <strong>${showDate}</strong> at <strong>${showTime}</strong>.</p>
            <p>This offer is reserved for you for the next ${CLAIM_WINDOW_MINUTES} minutes only.</p>
            <p><a href="${claimUrl}">Click here to claim your seat</a> before the offer expires.</p>
          `,
          closingLine: 'First come, first served — claim fast!',
        }),
      });
    });

    await step.sleepUntil('wait-until-offer-expiry', new Date(offerExpiresAt));

    await step.run('expire-offer-if-unclaimed', async () => {
      const entry = await Waitlist.findOneAndUpdate(
        { _id: waitlistEntryId, status: 'offered' },
        { $set: { status: 'expired' } },
        { new: true }
      );
      if (!entry) return;

      await releaseSeatsAtomic(entry.showId, [entry.offeredSeat]);
      await offerSeatsToWaitlist(entry.showId, [entry.offeredSeat]);

      logger.info({ waitlistEntryId, showId: entry.showId, seat: entry.offeredSeat }, 'Waitlist offer expired, cycling to next entry');
    });
  }
)

const sendBookingConfirmationEmail = inngest.createFunction(
  { id: 'send-booking-confirmation-email' },
  { event: 'app/show.booked' },
  async ({ event }) => {
    const { bookingId } = event.data;

    const booking = await Booking.findById(bookingId).populate({
      path: "show",
      populate: [
        { path: "movie", model: "Movie" },
        SCREEN_WITH_THEATER,
      ]
    }).populate("user");

    const revealed = isMysteryRevealed(booking.show, { isPaid: booking.isPaid });
    const movieTitle = revealed ? booking.show.movie.title : 'Mystery Movie';
    const mysteryNote = !revealed
      ? `<p>${highlight('This is a Mystery Movie booking')} — the title will be revealed at the theater.</p>`
      : '';

    const icsContent = buildBookingIcs({
      movieTitle,
      runtimeMinutes: revealed ? booking.show.movie.runtime : null,
      showDateTime: booking.show.showDateTime,
      theater: booking.show.screen?.theater,
      bookingId: booking._id.toString(),
    });

    const { date: showDate, time: showTime } = formatInZone(booking.show.showDateTime, booking.show.screen?.theater?.timezone);

    const hasSnacks = booking.snacks.length > 0;
    const attachments = [{
      filename: `${movieTitle.replace(/[^a-z0-9]/gi, '_')}.ics`,
      content: icsContent,
      contentType: 'text/calendar',
    }];

    if (hasSnacks) {
      const qrPng = await buildPickupQrPng(booking._id.toString());
      attachments.push({
        filename: 'concession-pickup-qr.png',
        content: qrPng,
        contentType: 'image/png',
        cid: 'pickup-qr',
      });
    }

    const snacksHtml = hasSnacks ? `
          <p><strong>Concessions pre-ordered:</strong><br>
            ${booking.snacks.map(s => `${s.quantity} &times; ${s.name}`).join('<br>')}
          </p>
          <p>Show this QR code at the concession counter to pick up your order:</p>
          <p><img src="cid:pickup-qr" alt="Concession pickup QR code" width="200" height="200"></p>
        ` : '';

    await sendEmail({
      to: booking.user.email,
      subject: `Payment Confirmation: "${movieTitle}" booked!`,
      body: renderEmail({
        greetingName: booking.user.name,
        bodyHtml: `
          <p>Your booking for ${highlight(`"${movieTitle}"`)} is confirmed.</p>
          ${mysteryNote}
          <p>
            <strong>Date:</strong> ${showDate}<br>
            <strong>Time:</strong> ${showTime}
          </p>
          <p>An "Add to Calendar" invite (.ics) is attached to this email.</p>
          ${snacksHtml}
        `,
        closingLine: 'Thanks for booking with us! 🍿',
      }),
      attachments,
    })
  }
)


const sendShowReminders = inngest.createFunction(
  {id: 'send-show-reminders'},
  {cron: '0 */8 * * *'},
  async ({ step }) => {
    const now = new Date();
    const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000);

    const reminderTasks = await step.run('prepare-reminder-tasks', async () => {
      const shows = await Show.find({
        showDateTime: {$gte: windowStart, $lte: in8Hours},
      }).populate('movie').populate(SCREEN_WITH_THEATER);

      const tasks = [];

      for(const show of shows){
        if(!show.movie || !show.occupiedSeats)
            continue;

        const userIds = [...new Set(Object.values(show.occupiedSeats))]
        if(userIds.length === 0)
            continue;

        const users = await User.find({_id: {$in: userIds}}).select('name email');

        for(const user of users){
          tasks.push({
            userEmail: user.email,
            userName: user.name,
            movieTitle: show.movie.title,
            showTime: show.showDateTime,
            theaterTimezone: show.screen?.theater?.timezone,
          })
        }
      }
      return tasks;
    })

    if(reminderTasks.length === 0) {
      return {sent: 0 , message: 'No reminders to send'};
    }

    const results = await step.run('send-all-reminders', async () => {
      return await Promise.allSettled(
        reminderTasks.map(task => {
          const { date: showDate, time: showTime } = formatInZone(task.showTime, task.theaterTimezone);
          return sendEmail({
            to: task.userEmail,
            subject: `Reminder: Your movie "${task.movieTitle}"  starts soon!`,
            body: renderEmail({
              greetingName: task.userName,
              bodyHtml: `
                <p>This is a quick reminder that your movie ${highlight(`"${task.movieTitle}"`)} is scheduled for
                  <strong>${showDate}</strong> at <strong>${showTime}</strong>.</p>
                <p>It starts in approximately <strong>8 hours</strong> — make sure you're ready!</p>
              `,
            }),
          });
        })
      )
    })

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - sent;

    if (failed > 0) {
      logger.warn({ sent, failed }, 'Some show reminder emails failed to send');
    } else {
      logger.info({ sent }, 'Show reminder emails sent');
    }

    return {
      sent,
      failed,
      message: `Sent ${sent} reminders, ${failed} failed`
    }
  }
)


const sendNewShowNotification = inngest.createFunction(
  { id: 'send-new-show-notification' },
  { event: 'app/show.added' },
  async ({ event }) => {
    const { movieId, movieTitle } = event.data;

    const follows = await Follow.find({ movie: movieId });
    if (follows.length === 0) {
      return { message: 'No followers to notify' };
    }

    const users = await User.find({ _id: { $in: follows.map(f => f.user) } });

    for(const user of users) {
      await sendEmail({
        to: user.email,
        subject: `New Show Added: "${movieTitle}"`,
        body: renderEmail({
          greetingName: user.name,
          bodyHtml: `
            <p>We are excited to inform you that a new show for the movie ${highlight(`"${movieTitle}"`)} you're following has been added!</p>
            <p>Check it out now and book your tickets!</p>
          `,
          closingLine: 'Thanks for being a part of our community!',
        }),
      })
    }

    return { message: `Notification sent to ${users.length} follower(s)` }
  }
)

const PRICE_WATCH_CHECK_CRON = '*/30 * * * *';
const PRICE_WATCH_RENOTIFY_HOURS = 24;

const sendPriceDropAlerts = inngest.createFunction(
  { id: 'send-price-drop-alerts' },
  { cron: PRICE_WATCH_CHECK_CRON },
  async ({ step }) => {
    const clearedForShowStart = await step.run('clear-watches-for-started-shows', async () => {
      const startedShowIds = await Show.distinct('_id', { showDateTime: { $lte: new Date() } });
      const result = await PriceWatch.updateMany(
        { status: 'active', show: { $in: startedShowIds.map(id => id.toString()) } },
        { $set: { status: 'cleared' } }
      );
      return result.modifiedCount;
    });

    const alertTasks = await step.run('find-price-drops', async () => {
      const watches = await PriceWatch.find({ status: 'active' });
      if (watches.length === 0) return [];

      const shows = await Show.find({ _id: { $in: watches.map(w => w.show) }, isCancelled: { $ne: true } })
        .populate('movie')
        .populate(SCREEN_WITH_THEATER);
      const showById = new Map(shows.map(s => [s._id.toString(), s]));

      const tasks = [];
      for (const watch of watches) {
        const show = showById.get(watch.show);
        if (!show) continue; // show was deleted/cancelled — leave the watch, next run's start-filter or a future cleanup handles it

        const { theaterId, timezone } = resolveTheaterContext(show);
        const currentPrice = await getComputedPriceForShow(show, theaterId, timezone);

        const droppedBelowBaseline = currentPrice < watch.priceAtWatchTime;
        const droppedFurtherSinceLastNotify = watch.lastNotifiedPrice === null || currentPrice < watch.lastNotifiedPrice;
        const debounceElapsed = !watch.lastNotifiedAt
          || (Date.now() - watch.lastNotifiedAt.getTime()) >= PRICE_WATCH_RENOTIFY_HOURS * 60 * 60 * 1000;

        if (droppedBelowBaseline && droppedFurtherSinceLastNotify && debounceElapsed) {
          tasks.push({ watchId: watch._id.toString(), userId: watch.user, show, currentPrice, priceAtWatchTime: watch.priceAtWatchTime });
        }
      }
      return tasks;
    });

    if (alertTasks.length === 0) {
      return { sent: 0, clearedForShowStart, message: 'No price drops to notify' };
    }

    const results = await step.run('send-price-drop-emails', async () => {
      const userIds = [...new Set(alertTasks.map(t => t.userId))];
      const users = await User.find({ _id: { $in: userIds } }).select('name email');
      const userById = new Map(users.map(u => [u._id, u]));

      return Promise.allSettled(alertTasks.map(async (task) => {
        const user = userById.get(task.userId);
        if (!user) return;

        const revealed = isMysteryRevealed(task.show, { isPaid: false });
        const movieTitle = revealed ? task.show.movie.title : 'Mystery Movie';
        const { date: showDate, time: showTime } = formatInZone(task.show.showDateTime, task.show.screen?.theater?.timezone);
        const seatUrl = `${process.env.CLIENT_URL}/movies/${task.show.movie._id}/${task.show.showDateTime.toISOString().split('T')[0]}`;

        await sendEmail({
          to: user.email,
          subject: `Price drop: "${movieTitle}" is now cheaper!`,
          body: renderEmail({
            greetingName: user.name,
            bodyHtml: `
              <p>Good news — the price for ${highlight(`"${movieTitle}"`)} on <strong>${showDate}</strong> at <strong>${showTime}</strong>
                 just dropped to ${highlight(`$${task.currentPrice}`)} (was $${task.priceAtWatchTime} when you started watching).</p>
              <p><a href="${seatUrl}">Book now</a> before it changes again.</p>
            `,
            closingLine: "We'll keep watching in case it drops further.",
          }),
        });

        await PriceWatch.updateOne(
          { _id: task.watchId },
          { $set: { lastNotifiedPrice: task.currentPrice, lastNotifiedAt: new Date() } }
        );
      }));
    });

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - sent;

    if (failed > 0) {
      logger.warn({ sent, failed }, 'Some price-drop alert emails failed to send');
    } else {
      logger.info({ sent, clearedForShowStart }, 'Price-drop alerts sent');
    }

    return { sent, failed, clearedForShowStart };
  }
)

const POST_CREDITS_CHECK_CRON = '*/10 * * * *';
const POST_CREDITS_WINDOW_MINUTES = 10;

const sendPostCreditsAlerts = inngest.createFunction(
  { id: 'send-post-credits-alerts' },
  { cron: POST_CREDITS_CHECK_CRON },
  async ({ step }) => {
    const now = new Date();
    const windowStart = new Date(now.getTime() - POST_CREDITS_WINDOW_MINUTES * 60 * 1000);

    const alertTasks = await step.run('prepare-post-credits-tasks', async () => {
      const candidateShows = await Show.find({
        showDateTime: { $gte: new Date(now.getTime() - 6 * 60 * 60 * 1000), $lte: now },
        isCancelled: { $ne: true },
      }).populate('movie').populate(SCREEN_WITH_THEATER);

      const dueShowIds = [];
      for (const show of candidateShows) {
        if (!show.movie?.hasPostCreditsScene || !Number.isFinite(show.movie.runtime) || show.movie.runtime <= 0) {
          continue;
        }
        const creditsAt = new Date(show.showDateTime.getTime() + show.movie.runtime * 60 * 1000);
        if (creditsAt >= windowStart && creditsAt <= now) {
          dueShowIds.push(show);
        }
      }
      if (dueShowIds.length === 0) return [];

      const bookings = await Booking.find({
        show: { $in: dueShowIds.map(s => s._id.toString()) },
        isPaid: true,
        postCreditsAlertSent: false,
      });
      const showById = new Map(dueShowIds.map(s => [s._id.toString(), s]));

      return bookings.map(booking => ({
        bookingId: booking._id.toString(),
        userId: booking.user,
        show: showById.get(booking.show),
      }));
    });

    if (alertTasks.length === 0) {
      return { sent: 0, message: 'No post-credits alerts due' };
    }

    const results = await step.run('send-post-credits-emails', async () => {
      const userIds = [...new Set(alertTasks.map(t => t.userId))];
      const users = await User.find({ _id: { $in: userIds } }).select('name email');
      const userById = new Map(users.map(u => [u._id, u]));

      return Promise.allSettled(alertTasks.map(async (task) => {
        const user = userById.get(task.userId);
        if (!user) return;

        const revealed = isMysteryRevealed(task.show, { isPaid: true });
        const movieTitle = revealed ? task.show.movie.title : 'Mystery Movie';

        await sendEmail({
          to: user.email,
          subject: `Don't leave yet — "${movieTitle}" has a scene after the credits!`,
          body: renderEmail({
            greetingName: user.name,
            bodyHtml: `
              <p>${highlight('Heads up')} — ${highlight(`"${movieTitle}"`)} has a scene after the credits. Stick around!</p>
            `,
            closingLine: 'Enjoy the rest of the show! 🍿',
          }),
        });

        await Booking.updateOne({ _id: task.bookingId }, { $set: { postCreditsAlertSent: true } });
      }));
    });

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - sent;

    if (failed > 0) {
      logger.warn({ sent, failed }, 'Some post-credits alert emails failed to send');
    } else {
      logger.info({ sent }, 'Post-credits alerts sent');
    }

    return { sent, failed };
  }
)

export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation, releaseSeatsAndDeleteBooking , sendBookingConfirmationEmail , sendShowReminders , sendNewShowNotification, expireGroupBooking, sendWaitlistOffer, expireShowtimePoll, notifyShowtimePollClosed, sendPriceDropAlerts, sendPostCreditsAlerts];
