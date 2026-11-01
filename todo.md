[x] Move dependency injection in server.ts into a factory file
[ ] Move zod schema into shared folder / lib so that the frontend can also use it
[ ] Use DTO Mapping
[ ] Move error message, Http status code, etc to enum
[x] Create reusable function to call to send back response to user
[x] Add error handling middleware.


# Login Flow
    [ ] Add otp entity, repo, use cases etc for otp verification
    [ ] Update signup user use case to generate otp


Step 1: Create DTO              ──► Create VerifyOtpDTO.ts
Step 2: Create UseCase Contract ──► Create IVerifyOtpUseCase.ts
Step 3: Update User Repository  ──► Update IUserRepository & MongoUserRepository
Step 4: Create UseCase Impl     ──► Create VerifyOtpUseCase.ts
Step 5: Create Presentation     ──► Update AuthSchema.ts, AuthController.ts & AuthRouter.ts
Step 6: Composition Root        ──► Wire dependencies in server.ts

    
