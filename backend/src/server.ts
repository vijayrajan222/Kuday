import { connectMongo } from "./infrastructure/database/ConnectMongoDB.js";
import express from "express";




async function startServer() {
    console.log("waiting for the connection...w")
    await connectMongo()

    let PORT = process.env.PORT||3000
    let app = express()
    console.log("this is the server")

    app.listen(PORT, () =>
        console.log("server isrunnig in 3000")
    )
}
startServer().catch((err) => {
    console.log(err)
})