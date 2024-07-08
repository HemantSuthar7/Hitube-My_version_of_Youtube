import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"

const registerUser = asyncHandler( (req, res) => {
    console.log("ALERT !!! Someone visited /users/register ROUTE")


    // MY LOGIC FOR registerUser :
    // Step-1 = get the username, password, email, fullname, avatar(user profile picture). which should be sent in the headers or body of the request.

    // Step-2 = validate the input like is username unique, is email unique, does email is as it should be i.e. <someName>@gmail/yahoo/etc.com or not, is the avatar image too big for storage, etc

    // Step-3 = if the user is not sending details in the right manner then return some error messages

    // Step-4 = Now we need to check that the user already exists or not which will be checked in the first step but probably here we need to make a database call to find all the users and see it the user already exists or not. if it doesn't exists then move on to next step

    // Step-5 = once we have validated all the user inputs then we need to actually register the user in the database via some database queries


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






    const {username, fullname, password, email} = req.body

    // Validation for empty values :
    if (
        [username, fullname, password, email].some( (field) => field?.trim() === ""  ) // using some method to check for true condition on each field of the array
    ) {
        throw new ApiError(400, "You Cannot Provide Empty Fields")
    } // Tested successfully for empty values and values with just whitespaces

    // Add more validations here continuing with if statements


    // Check if the user already exists:
    const existedUser = User.findOne({
        $or : [{username},{email}]
    })

    console.log(existedUser);


    if (existedUser) {
        throw new ApiError(409, "The user with this username or email already exists")
    }

    // ************** TODO TASK : Separate the checking of username and email, give responses accordingly ********************************************

    res.json({
        message: "Request processed successfully, Check the console"
    })


} )

export {registerUser};