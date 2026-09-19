import { connectMongo } from "./infrastructure/database/ConnectMongoDB.js";
import express from "express";
import { createAuthRouter } from "./presentation/router/AuthRouter.js";
import { AuthController } from "./presentation/controller/AuthController.js";
import { SignUpUserRequestSchema } from "./presentation/utils/validators/zod/AuthSchema.js";
import { SignUpUserUseCase } from "./application/use-case/auth/SignUpUserUseCase.js";
import { MongoUserRepository } from "./infrastructure/repository/MongoUserRepository.js";
import { HashService } from "./infrastructure/services/HashingService.js";




async function startServer() {
    console.log("waiting for the connection...w")
    await connectMongo()

    let PORT = process.env.PORT||3000
    let app = express()
    app.use(express.json())
    app.use(express.urlencoded())
    console.log("this is the server")


    
    //--------------------------------------------------------------------
        // this is where we do wireup everyting togater and do the 
        // dependancy injection. 
        const userrepo = new MongoUserRepository()
        const hasher = new HashService()
        const signUpUsecase = new SignUpUserUseCase(userrepo,hasher)
        const authcontroller = new AuthController(signUpUsecase)
        const authRouter = createAuthRouter(authcontroller)
        app.use("/auth",authRouter)

        //--------------------------------------------------------------------




    app.listen(PORT, () =>
        console.log("server isrunnig in 3000")
    )
}
startServer().catch((err) => {
    console.log(err)
})