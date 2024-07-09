import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/FileUpload.js"
import {ApiResponse} from "../utils/ApiResponse.js"

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

export {registerUser};