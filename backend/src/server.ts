import { connectMongo } from "./infrastructure/database/ConnectMongoDB.js";
import express from "express";
import { createAuthRouter } from "./presentation/router/AuthRouter.js";
import { AuthController } from "./presentation/controller/AuthController.js";
import { SignUpUserRequestSchema } from "./presentation/utils/validators/zod/AuthSchema.js";
import { SignUpUserUseCase } from "./application/use-case/auth/SignUpUserUseCase.js";
import { MongoUserRepository } from "./infrastructure/repository/MongoUserRepository.js";
import { HashService } from "./infrastructure/services/HashingService.js";
import { MongoOtpRepository } from "./infrastructure/repository/MongoOtpRepository.js";
import { OtpService } from "./infrastructure/services/OtpServices.js";
import { NodemailerMailService } from "./infrastructure/services/NodemailerService.js";
import { VerifyOptUseCase } from "./application/use-case/auth/VerifyOtpUseCase.js";




async function startServer() {
    console.log("waiting for the connection...w")
    await connectMongo()

    let PORT = process.env.PORT||3000
    let app = express()
    app.use(express.json())
    app.use(express.urlencoded({extended :true}))
    console.log("this is the server")


    
    //--------------------------------------------------------------------
        // this is where we do wireup everyting togater and do the 
        // dependancy injection. 
        const userrepo = new MongoUserRepository()
        const hasher = new HashService()
        const otprepo = new MongoOtpRepository()
        const otpservice = new OtpService()
        const mailer = new NodemailerMailService()

        const signUpUsecase = new SignUpUserUseCase(userrepo,hasher,otprepo,otpservice,mailer)
         const verifyOtpUseCase = new VerifyOptUseCase(userrepo, otprepo);
        const authcontroller = new AuthController(signUpUsecase,verifyOtpUseCase)
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