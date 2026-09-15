import dotenv from "dotenv"
import { json } from "express";
import mongoose from "mongoose";
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config()


const MONGO_URI: string = String(process.env.MONGO_URI)


/**
 * this function will connect with the mongodb cluster if it failes the whole process will be terminated 
 * useing process. exist 
 * dot env configuration should be called to call take the value from the env file so that we take a function called
 * config for configuration and using the env data which is kept secret in the env file
 */
export async function connectMongo() {

try{
    console.log("connecting to ",MONGO_URI)
    await mongoose.connect(MONGO_URI);
    console.log("we conected with mongodb")
} catch(error : unknown){
    console.log("failed to connect with mongodb", error)
    process.exit(1)   // when there is the error found we write the process.exit for terminating the whole process so that the work will not be continued without mongodb .

}
}