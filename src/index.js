// require('dotenv').config({path: "./env"})

import dotenv from 'dotenv'



// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import connectDB from "./db/index.js";
import { app } from './app.js';

dotenv.config({
  path:"./env"
})

connectDB()

.then(() => {

  app.listen(process.env.PORT || 8000 , () => {

    console.log(`Serving is running at port : ${process.env.PORT}`)
  })

})

.catch((error) => {

  console.log(`Mongodb connection failed !! `,error)
} )







// import express from 'express'

// const app = express()


// (async() => {

//  try {

//   await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)

//   app.on("error" ,(error) => {
//     console.log("Err :" ,error);
//     throw error
//   })

//   app.listen(process.env.PORT, () => {
//     console.log(`App is listening on port ${process.env.PORT}`)
//   })
  
//  } catch (error) {
//   console.log("error: " ,error)
//   throw error
//  }

// }) ()