import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const connectionInstence = await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);
        console.log(`Mongodb connection || DB Host: ${connectionInstence}`)
    } catch (err) {
        console.log("Mongodb connection error: ", err);
        process.exit(1);
    }
}

export default connectDB