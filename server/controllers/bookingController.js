import Show from '../models/Show.js';
import Booking from '../models/Booking.js';


//Function to check the availability of selected seats for a movie
const checkSeatsAvailability = async(showId , selectedSeats) => {
    try {
        const showData = await showId.findbyId(showId)
        if(!showData) 
            return false;

        const occupiedSeats = showData.occupiedSeats;
        
        const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat]);

        return !isAnySeatTaken;

    } catch (error) {
        console.error(error.message)
        return false;
    }
}


// export const createBooking = async(req , res)=> {
//     try {
//         const {userId} = req.auth();
//         const {showId , selectedSeats} = req.body;
//         const {origin} =  req.headers;

//         //check if the seat is available for the selected show
//         const isAvailable = await checkSeatsAvailability(showId, selectedSeats);
//         if(!isAvailable) {
//             return res.json({success: false, message: "Selected seats are not available"});
//         }

//         // get the show details
//         const showData = await Show.findById(showId).populate('movie');

//         //create a new booking
//         const booking = await Booking.create({
//             user: userId,
//             show: showId,
//             amount: showData.showPrice * selectedSeats.length,
//             bookedSeats: selectedSeats
//         })

//         selectedSeats.mao((seat)=>{
//             showData.occupiedSeats[seat] = userId;
//         })

//         showData.markModified('occupiedSeats');

//         await showData.save();

//         // stripe gateway Initialize

//         res.json({success: true, message: "Booked Successfully" })
        
//     } catch (error) {
//         console.error(error.message);
//         res.json({success: false, message: error.message});
//     }
// }
export const createBooking = async(req, res) => {
    try {
        const { userId } = req.auth();
        const { showId, selectedSeats } = req.body;

        const updateQuery = {};
        selectedSeats.forEach(seat => {
            updateQuery[`occupiedSeats.${seat}`] = {$exists: false};
        });

        const updateSet = {};
        selectedSeats.forEach(seat => {
            updateSet[`occupiedSeats.${seat}`] = userId;
        });

        const showData = await Show.findOneAndUpdate(
            {
                _id: showId,
                ...updateQuery
            },
            {
                $set: updateSet
            },
            { new: true }
        );

        if(!showData) {
            return res.json({success: false, message: "Selected seats are not available"});
        }

        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats
        });

        res.json({success: true, message: "Booked Successfully"});
    } catch (error) {
        console.error(error.message);
        res.json({success: false, message: error.message});
    }
};



export const getOccupiedSeats = async(req, res) => {
    try {
        const {showId} = req.params;
        const showData = await Show.findById(showId)

        const occupiedSeats = Object.keys(showData.occupiedSeats)

        res.json({success: true, message: error.message})

    } catch (error) {
        console.error(error.message);
        res.json({success: false, message: error.message});   
    }
}