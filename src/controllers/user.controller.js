import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/FileUpload.js"
import {ApiResponse} from "../utils/ApiResponse.js"



// method for generating access and refresh token
const generateAccessAndRefreshToken = async (userId) => {
    try {

        const user = await User.findById(userId);

        const userAccessToken = await user.generateAccessToken()

        const userRefreshToken = await user.generateRefreshToken()

        user.refreshToken = userRefreshToken
        user.save({ validateBeforeSave : false})

        return {userAccessToken, userRefreshToken}

        
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
    const {username, fullname, password, email} = req.body



    // Validation for empty values :
    if (
        [username, fullname, password, email].some( (field) => field?.trim() === ""  ) // using some method to check for true condition on each field of the array
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
        fullName: fullname,
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


    // Login Algorithm

    // step - 1 = Get the user details i.e. username, password
    // step - 2 = Validation of inputs like fields should not be empty and so on ...
    // step - 3 = When you get the proper username & password , make a db call to verify that they are correct or not
    // step - 4 = if the details are correct and properly matching then login the user.
    // step - 5 = Now generate a jwt access token and refresh token, send the access token to the user and store the refresh token in the database.
    // ###### probably step 5 can be done before actually performing the step 4.
    // step - 6 = let the user access the authorized routes. 










    // getting data 
    const {username, email, password} = req.body



    // check if we got username & email
    if (!username || !email) {
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
    const {userAccessToken, userRefreshToken} = await generateAccessAndRefreshToken(existingUser._id)

    // send cookie

    const loggedInUser = await User.findById(existingUser._id).select("-password -refreshToken")

    const cookieOptions = {
        httpOnly: true,
        secure: true
    }


    return res
    .status(200)
    .cookie("Access Token", userAccessToken, cookieOptions)
    .cookie("Refresh Token", userRefreshToken, cookieOptions)
    .json(
        new ApiResponse(
        200,
        {
            user: loggedInUser, userAccessToken, userRefreshToken
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
    .clearCookie("Access Token", cookieOptions)
    .clearCookie("Refresh Token", cookieOptions)
    .json(
        new ApiResponse(200, {}, "user logged out successfully")
    )

} )



export {registerUser, loginUser, logoutUser};
