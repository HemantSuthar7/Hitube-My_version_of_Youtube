import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/FileUpload.js"
import {deleteFromCloudinary} from "../utils/FileDelete.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import JWT from "jsonwebtoken"



// method for generating access and refresh token
const generateAccessAndRefreshToken = async (userId) => {
    try {

        const user = await User.findById(userId);

        const accessToken = await user.generateAccessToken()

        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.save({ validateBeforeSave : false})

        return {accessToken, refreshToken}

        
    } catch (error) {
        throw new ApiError(500, "Access and Refresh token generation failed")
    }
}



const registerUser = asyncHandler( async (req, res) => {
    console.log("ALERT !!! Someone visited /users/register ROUTE")

    // LOGIC FOR registerUser:
    // 1. get user details from frontend
    // 2. perform validations like is any field empty, is email is in correct format, etc
    // 3. check if user already exists - if it already exists then don't let the user to create a new account with same credentials
    // 4. check for images - if the user has sent the avatar or not and also validate it like is it too big or not. Also if the avatar is uploaded successfully on cloudinary or not
    // 5. if image is ok - then upload the image on cloudinary and get the image URL from cloudinary
    // 6. create user object - create user in mongoDB 
    // 7. before sending the data to frontend make sure you don't include password and refresh token
    // 8. check if the user is created or not in mongoDB and what is the response we got back 
    // 9. if the response is ok then return it to the frontend


    // get user details
    const {username, fullName, password, email} = req.body

    console.log(username);
    console.log(fullName);
    console.log(password);
    console.log(email);



    // Validation for empty values :
    if (
        [username, fullName, password, email].some( (field) => field?.trim() === ""  ) // using some method to check for true condition on each field of the array
    ) {
        throw new ApiError(400, "You Cannot Provide Empty Fields")
    } // Tested successfully for empty values and values with just whitespaces




    // Add more validations here continuing with if statements




    // Check if the user already exists:
    const existedUser = await User.findOne({
        $or : [{username},{email}]
    })


    console.log(existedUser);

    if (existedUser) {
        throw new ApiError(409, "The user with this username or email already exists")
    }

    // ************** TODO TASK : Separate the checking of username and email, give responses accordingly ********************************************



    // we have to make sure that when handling images , we recieve only and only images and not any other file type like video or audio
    // However we can control this in frontend via pure HTML only, so just make sure the frontend dev meets this requirement



    // Handling files
    const avatarLocalPath = req.files?.avatar[0]?.path  

    const coverImageLocalPath = req.files?.coverImage[0]?.path 

    // The best method to check if coverImage exists or not. same can be done for avatar

    // let coverImageLocalPath;
    // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }

   
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
   
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }



    // create user
    const user = await User.create({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password,
        fullName: fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""

    })


    // check if user is created 
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    console.log(createdUser);

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }



    // if everything goes well, send the response
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered Successfully")
    )


} )




// Login logic for user

const loginUser = asyncHandler( async (req, res) => {

    console.log(`Someone requested for login`);


    // Login Algorithm

    // step - 1 = Get the user details i.e. username, password
    // step - 2 = Validation of inputs like fields should not be empty and so on ...
    // step - 3 = When you get the proper username & password , make a db call to verify that they are correct or not
    // step - 4 = if the details are correct and properly matching then login the user.
    // step - 5 = Now generate a jwt access token and refresh token, send the access token to the user and store the refresh token in the database.
    // ###### probably step 5 can be done before actually performing the step 4.
    // step - 6 = let the user access the authorized routes. 










    // getting data 
    const {username, password, email} = req.body // is not working when sending in form data, only working when sending in raw json data 

    console.log(username);
    console.log(email);
    console.log(password);



    // check if we got username & email
    if (!(username || email)) {
        throw new ApiError(400, "Username or email is required")
    }



    // find the email or username in the database 
    const existingUser = await User.findOne({
        $or : [{username},{email}]
    })

    if (!existingUser) {
        throw new ApiError(404, "User does not exists, Please register yourself first if you are new user")
    }



    // check the password
    const passwordCheck = existingUser.isPasswordCorrect(password)

    if (!password) {
        throw new ApiError(401, "Password is incorrect")
    }


    // genetate access token and refresh token 
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(existingUser._id)

    // send cookie

    const loggedInUser = await User.findById(existingUser._id).select("-password -refreshToken")

    const cookieOptions = {
        httpOnly: true,
        secure: true
    }


    return res
    .status(200)
    .cookie("AccessToken", accessToken, cookieOptions)
    .cookie("RefreshToken", refreshToken, cookieOptions)
    .json(
        new ApiResponse(
        200,
        {
            user: loggedInUser, accessToken, refreshToken
        },
        "User logged in successfully"
        )
    )

} )



// logout logic for user

const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )


    const cookieOptions = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("AccessToken", cookieOptions)
    .clearCookie("RefreshToken", cookieOptions)
    .json(
        new ApiResponse(200, {}, "user logged out successfully")
    )

} )




// Logic for refreshing access token 

const refreshAccessToken = asyncHandler(async (req, res)=> {

    console.log("SOMEONE REQUESTED FOR REFRESHING ACCESS TOKEN");

    const incomingRefreshToken = req.cookies.RefreshToken || req.body.RefreshToken

    console.log(incomingRefreshToken);

    if (!incomingRefreshToken) {
       throw new ApiError(401, "Unauthorized Request") 
    }

    try {
        const decodedToken = JWT.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid Refresh token")
        }
    
    
        if (incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is invalid or expired")
            
        }
    
    
        const cookieOptions = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("AccessToken", accessToken, cookieOptions)
        .cookie("RefreshToken", newRefreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken, refreshToken : newRefreshToken
                },
                "Access Token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})



// logic for changing current password of the user

const changeCurrentPassword = asyncHandler( async (req, res) => {

    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect =  await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Password is invalid")
    }


    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password changed successfully"
        )
    )


} )


// logic for retreiving the current user

const getCurrentUser = asyncHandler( async (req, res) => {

    const user = req.user

    if (!user) {
        throw new ApiError(201, "Unauthorized request for getting user")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                user: user
            },
            "User retrieved successfully"
        )
    )

} )



// logic for updating account details

const updateAccountDetails = asyncHandler( async (req, res) => {

    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "Fullname and email are required")
    }

    // Trim fullName
    const trimmedFullName = fullName.trim(); 

    if(trimmedFullName === ""){
        throw new ApiError(400, "You cannot provide an empty fullName")
    }

    // Trim email
    const trimmedEmail = email.trim();

    if (trimmedEmail === "") {
        throw new ApiError(400, "You cannot provide an empty email")
    }


    // Validate email pattern
    const pattern = "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}";
    const emailToBeMatched = trimmedEmail.match(pattern);
    
    if (emailToBeMatched === null) {
        throw new ApiError(400, "Email pattern is Invalid")
    }

    const matchedEmail = emailToBeMatched[0]

    // WE NEED TO CHECK IF DETAILS TO BE UPDATED ARE EXACTLY SAME AS THE DETAILS IN THE DATABASE.
    // if the they are same then we need to alert the user and do not proceed
   

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName: trimmedFullName,
                email: matchedEmail
            }
        },
        {new: true}
    
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                user
            },
            "Account details updated successfully"
        )
    )

} )



// logic for updating images or files

const updateUserAvatar = asyncHandler( async (req, res) => {

    const avatarLocalPath = req.files?.avatar[0]?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Please upload new avatar image")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(500, "Error occurred while uploading updated avatar")
    }

    const avatarUrl = avatar.url


    // first make a db call to get the user details and get the old URL and store it in a varible.
    
    const oldUserDetails = await User.findById(req.user?._id);

    const OldAvatarUrl = oldUserDetails.avatar



    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
               avatar: avatarUrl
            }
        },
        {new: true}
    ).select("-password")


    // TODO:  Now we want to delete old image from cloudinary - we can create an utility function for deleting images from cloudinary via its url
    // method : destroy method from cloudinary

    // we need public id to destroy the image. and the public id is already present in the avatar url in database
    // we would want to apply some regex on url and get the public id from it .
    // And then we would just delete the image via the public id.

    // LOGIC FOR DELETING THE OLD FILE FROM CLOUDINARY AFTER SUCCESSFULLY UPDATING THE IMAGE

    // THE URL IS : http://res.cloudinary.com/dscpmgvab/image/upload/v1720971474/w4ea80wfgmljorywh99j.jpg
    // HERE :                                                                    ^this is public_id ^        and i want just this section

    

    const regex = /\/upload\/[^\/]+\/([^\/]+)\./;
    const match = OldAvatarUrl.match(regex);
    const public_id = match[1];

    console.log(public_id);

    

    const deleteResponse = await deleteFromCloudinary(public_id, "image")

    console.log(deleteResponse);

    if (deleteResponse?.result === "ok") {
        return res
        .status(200)
        .json(
            new ApiResponse(
            200,
            {user},
            "Avatar updated successfully"
            )
        )
    } else {
        throw new ApiError(500, "There was an error while deleting the old avatar file")
    }

    


} )



// logic for updating images or files

const updateUserCoverImage = asyncHandler( async (req, res) => {

    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Please upload new avatar image")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(500, "Error occurred while uploading updated coverImage")
    }

    const coverImageUrl = coverImage.url


    const oldUserDetails = await User.findById(req.user?._id);

    const OldcoverImageUrl = oldUserDetails.coverImage


    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImageUrl
            }
        },
        {new: true}
    ).select("-password")




    const regex = /\/upload\/[^\/]+\/([^\/]+)\./;
    const match = OldcoverImageUrl.match(regex);
    const public_id = match[1];



    const deleteResponse = await deleteFromCloudinary(public_id, "image")


    if (deleteResponse?.result === "ok") {
        return res
        .status(200)
        .json(
            new ApiResponse(
            200,
            {user},
            "Cover Image updated successfully"
            )
        )
    } else {
        throw new ApiError(500, "There was an error while deleting the old Cover Image file")
    }
} )



export {
    registerUser,
    loginUser, 
    logoutUser, 
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser, 
    updateAccountDetails,
    updateUserAvatar, 
    updateUserCoverImage
};



// +++++++++++++++++++++++++++++++++++++++++IMPORTANT++++++++++++++++++++++++++++++++++++++++++

/* SOME MORE FEATURES TO IMPLEMENT: 


        1. Check for empty fields where you need input

        2. Check the email pattern where we are handling emails

        3. If we are updating some details from the database then we need to check that the details to be updated should not be equal to the details that already exists in the database. 

        4. when updating images make sure that you are deleting the old images after successfully updating the images.

        5. Do not let the user see the database errors. Handle as much errors as possible

        6. Try to implement a forgot password method
*/