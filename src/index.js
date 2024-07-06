import { app } from "./app.js"
import connectDB from "./db/index.js"
import dotenv from "dotenv"


dotenv.config({
    path: "./.env"
})



connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("ERROR",error)
        throw error
    })
    app.listen(process.env.PORT || 4000, ()=>{
        console.log(`Server is running on port ${process.env.PORT}`)
    })
    
})
.catch((err)=>{
    console.log("MonogoDB connection failed !!!",err)
})















/*

//NORMAL APPROACH FOR SAFELY CONNECTING TO DATABASE


import express from "express";

const app = express();

;(async()=>{
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

       app.on("error",(error)=>{
        console.log("ERROR",error)
        throw error
       })

    } catch (error) {
        console.error("ERROR",error);
        throw error
    }
})()
    
*/