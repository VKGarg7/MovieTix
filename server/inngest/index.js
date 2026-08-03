import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import Follow from "../models/Follow.js";
import sendEmail from "../configs/nodeMailer.js";
import { logger } from "../configs/logger.js";
import { buildBookingIcs } from "../utils/calendarEvent.js";
import { buildPickupQrPng } from "../utils/qrCode.js";
import { formatInZone } from "../utils/timezone.js";
import { SCREEN_WITH_THEATER } from "../utils/theaterScope.js";
import { releaseSeatsAtomic } from "../utils/seatOperations.js";
import { releaseCouponAtomic } from "../controllers/couponController.js";
import { refundRedeemedPoints } from "../utils/loyaltyPoints.js";
import { assignReferralCode, attributeReferral } from "../utils/referrals.js";
import { renderEmail, highlight } from "../utils/emailTemplate.js";

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
        await releaseSeatsAtomic(booking.show, booking.bookedSeats);
        if (booking.couponCode) {
          await releaseCouponAtomic(booking.couponCode);
        }
        if (booking.pointsRedeemed > 0) {
          await refundRedeemedPoints(booking.user, booking._id.toString());
        }
        await Booking.findByIdAndDelete(booking._id)
        logger.info({ bookingId }, 'Unpaid booking expired, seats released');
      }
    })
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

    const icsContent = buildBookingIcs({
      movieTitle: booking.show.movie.title,
      runtimeMinutes: booking.show.movie.runtime,
      showDateTime: booking.show.showDateTime,
      theater: booking.show.screen?.theater,
      bookingId: booking._id.toString(),
    });

    const { date: showDate, time: showTime } = formatInZone(booking.show.showDateTime, booking.show.screen?.theater?.timezone);

    const hasSnacks = booking.snacks.length > 0;
    const attachments = [{
      filename: `${booking.show.movie.title.replace(/[^a-z0-9]/gi, '_')}.ics`,
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
      subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
      body: renderEmail({
        greetingName: booking.user.name,
        bodyHtml: `
          <p>Your booking for ${highlight(`"${booking.show.movie.title}"`)} is confirmed.</p>
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

export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation, releaseSeatsAndDeleteBooking , sendBookingConfirmationEmail , sendShowReminders , sendNewShowNotification];
