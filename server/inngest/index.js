import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie=ticket-booking" });

//Inngest functionn to save user data to a database
const syncUserCreation = inngest.createFunction(
    {id: 'sync-user-from-clerk'},
    {event: 'clerk./users.created'},
    async ({event}) => {
        const {id , first_name, last_name, email_addresses , image_url} = event.data
        const userData = {
            _id: id, 
            email: email_addresses[0].email_address,
            name: first_name + ' ' + last_name,
            image: image_url
        }
        await User.create(userData)
    }
)


export const functions = [syncUserCreation];