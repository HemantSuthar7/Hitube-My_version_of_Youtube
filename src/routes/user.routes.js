import { Router } from "express";

import {    registerUser,
            loginUser, 
            logoutUser, 
            refreshAccessToken, 
            changeCurrentPassword, 
            getCurrentUser,
            updateAccountDetails,
            updateUserAvatar,
            updateUserCoverImage,
            getUserChannelProfile,
            getWatchHistory
        } from "../controllers/user.controller.js";

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
userRouter.route("/update-account-details").patch(verifyJWT, updateAccountDetails)  // patch or post ?????????????????????????????????????????????


// UPDATE USER AVATAR
userRouter.route("/update-user-avatar").patch(verifyJWT, 
    upload.single("avatar"),
    updateUserAvatar
)  // patch or post ?????????????????????????????????????????????



// UPDATE USER COVER IMAGE
userRouter.route("/update-user-cover-image").patch(verifyJWT, 
    upload.single("coverImage"),
    updateUserCoverImage
)  // patch or post ?????????????????????????????????????????????



// GET USER CHANNEL PROFILE
userRouter.route("/channel/:username").get( verifyJWT, getUserChannelProfile )



// GET USER WATCH HISTORY
userRouter.route("/user-watch-history").get( verifyJWT, getWatchHistory )



export default userRouter;