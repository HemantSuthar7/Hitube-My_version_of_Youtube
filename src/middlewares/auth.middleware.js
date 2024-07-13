import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";


export const verifyJWT = asyncHandler( async (req, _, next) => {
    try {
        const token =  req.cookies?.AccessToken || req.header("Authorization")?.replace("Bearer ","");

        // the access token and refresh token names are not setting properly in cookies, there is a space added and a name that i did not wrote anywhere
    
        if(!token){
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        console.log(decodedToken)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while verifying JWT")
    }

} )