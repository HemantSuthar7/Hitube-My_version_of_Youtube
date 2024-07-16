import { Router } from "express";
import { registerUser,
            loginUser, 
            logoutUser, 
            refreshAccessToken, 
            changeCurrentPassword, 
            getCurrentUser,
            updateAccountDetails,
            updateUserAvatar } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

//REGISTER
userRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ])
    ,registerUser
)


// LOGIN
userRouter.route("/login").post( loginUser )

// LOGOUT - secure route
userRouter.route("/logout").post( verifyJWT, logoutUser )


// REFRESH TOKEN
userRouter.route("/refresh-token").post(refreshAccessToken)



// CHANGE CURRENT PASSWORD - secure route 
// ++++++++++++++++++++++++++++++++++++++++++++++++
// RETHINK ON SECURING THIS ROUTE
userRouter.route("/change-password").post( verifyJWT, changeCurrentPassword )



// GET CURRENT USER
userRouter.route("/get-current-user").post(verifyJWT, getCurrentUser)



// UPDATE ACCOUNT DETAILS
userRouter.route("/update-account-details").post(verifyJWT, updateAccountDetails)


// UPDATE USER AVATAR
userRouter.route("/update-user-avatar").post(verifyJWT, 
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ])
    ,updateUserAvatar)


export default userRouter;