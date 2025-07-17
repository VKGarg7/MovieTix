// // import { Inngest } from "inngest";
// // import User from "../models/User.js";

// // // Create a client to send and receive events
// // export const inngest = new Inngest({ id: "movie-ticket-booking" });

// // //Inngest functionn to save user data to a database
// // const syncUserCreation = inngest.createFunction(
// //     { id: 'sync-user-from-clerk' },
// //     { event: 'clerk/user.created' },
// //     async ({ event }) => {
// //         const { id, first_name, last_name, email_addresses, image_url } = event.data
// //         const userData = {
// //             _id: id,
// //             email: email_addresses[0].email_address,
// //             name: first_name + ' ' + last_name,
// //             image: image_url
// //         }
// //         await User.create(userData)
// //     }
// // )
// // //Inngest functionn to delete user data to a database
// // const syncUserDeletion = inngest.createFunction(
// //     { id: 'delete-user-from-clerk' },
// //     { event: 'clerk/user.deleted' },
// //     async ({ event }) => {
// //         const { id } = event.data
// //         await User.findByIdAndDelete(id)
// //     }
// // )
// // //Inngest functionn to update user data to a database
// // const syncUserUpdation = inngest.createFunction(
// //     { id: 'update-user-from-clerk' },
// //     { event: 'clerk/user.updated' },
// //     async ({ event }) => {
// //         const { id, first_name, last_name, email_addresses, image_url } = event.data
// //         const userData = {
// //             _id: id,
// //             email: email_addresses[0].email_address,
// //             name: first_name + ' ' + last_name,
// //             image: image_url
// //         }
// //         await User.findByIdAndUpdate(id, userData)
// //     }
// // )



// // export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];


// import { Inngest } from "inngest";
// import User from "../models/User.js";

// export const inngest = new Inngest({ id: "movie-ticket-booking" });

// // Create user
// const syncUserCreation = inngest.createFunction(
//   { id: "sync-user-from-clerk" },
//   { event: "clerk.user.created" },
//   async ({ event }) => {
//     const { id, first_name, last_name, email_addresses, image_url } = event.data;
//     const userData = {
//       _id: id,
//       email: email_addresses?.[0]?.email_address || "",
//       name: `${first_name} ${last_name}`,
//       image: image_url,
//     };
//     await User.create(userData);
//   }
// );

// // Delete user
// const syncUserDeletion = inngest.createFunction(
//   { id: "delete-user-from-clerk" },
//   { event: "clerk.user.deleted" },
//   async ({ event }) => {
//     const { id } = event.data;
//     await User.findByIdAndDelete(id);
//   }
// );

// // Update user
// const syncUserUpdation = inngest.createFunction(
//   { id: "update-user-from-clerk" },
//   { event: "clerk.user.updated" },
//   async ({ event }) => {
//     const { id, first_name, last_name, email_addresses, image_url } = event.data;
//     const userData = {
//       email: email_addresses?.[0]?.email_address || "",
//       name: `${first_name} ${last_name}`,
//       image: image_url,
//     };
//     await User.findByIdAndUpdate(id, userData);
//   }
// );

// export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];


import { Inngest } from "inngest";
import User from "../models/User.js";

export const inngest = new Inngest({ id: "movie-ticket-booking" });

// Create user
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk.user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;
    const userData = {
      _id: id,
      email: email_addresses?.[0]?.email_address || "",
      name: `${first_name} ${last_name}`,
      image: image_url,
    };
    await User.findByIdAndUpdate(id, userData, { upsert: true });
    console.log("User created or updated:", id);
  }
);

// Delete user
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk.user.deleted" },
  async ({ event }) => {
    const id = event.data?.id || event.data?.object?.id;
    if (!id) {
      console.error("User ID missing in delete event");
      return;
    }
    await User.findByIdAndDelete(id);
    console.log("User deleted:", id);
  }
);

// Update user
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk.user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;
    const userData = {
      email: email_addresses?.[0]?.email_address || "",
      name: `${first_name} ${last_name}`,
      image: image_url,
    };
    await User.findByIdAndUpdate(id, userData, { upsert: true });
    console.log("User updated:", id);
  }
);

export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];
