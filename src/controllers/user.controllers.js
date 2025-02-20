import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResopnse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"



const genrateAccessAndRefreshTokens = (async (userId)  => {

   try {

    const user = await  User.findById(userId)

     const accessToken   = user.genrateAccessToken()
      const refreshToken = user.genratRefreshToken()

      user.refreshToken = refreshToken
     await user.save({ ValidateBeforeSave: false })


     return {accessToken,refreshToken}


    
   } catch (error) {
    
    throw new ApiError(500,"Something went wrong while genrating access and refresh token")
   }

} )


const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation not empty
  //check if user already exists:username,email
  //check for images,check for avatar
  //uplod them to cloudinary,avatar
  //create user object - create entry in db
  //remove password and refresh token field from response
  //check for user creation
  //return response

  const { username, fullName, password, email } = req.body;

  console.log("Email : ", email);

  //      if(fullName === ""){

  //         throw new ApiError(400,"fullName is required")
  //      }

  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  
   

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  // if (!existedUser) {
  //   throw new ApiError(409, "User with email or username already exist");
  // }


  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  //  console.log("Uploaded Files:", req.files);

  //  console.log("Avatar Path:", req.files?.avatar?.[0]?.path);

  let coverImageLocalPath;

  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
     { coverImageLocalPath = req.files.coverImage[0]. path}

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
    .status(201)
    .json(new ApiResopnse(200, createdUser, "User registerd successfully"));
});

const loginUser = asyncHandler(async(req,res) => {


    //req body ==> data
    //username || email
    //find the user
    //password check
    //access and efresh token 
   //send cookie
  
   const{username,email,password} = req.body

   console.log(email)

  //  if(!username || !email ){
  //  if(!username && !email){

  //   throw new ApiError(400,"username or email is required")
  //  }
  // }

  
 
  if(!(username && email)){

    throw new ApiError(400,"username or email is required")
   }

   
    const user =  await User.findOne({
    $or: [{email},{username}]
   })

   if (!user) {
    
    throw new ApiError(404,"User does not exit")
   }

     const isPasswordValid = await user.isPasswordCorrect(password)
    
     if (!isPasswordValid) {
      
      throw new ApiError(401,"invalid user credentials")
     }

       const {accessToken,refreshToken}  = await genrateAccessAndRefreshTokens(user._id)

    
       const loggedInUser = await User.findById(user._id)
       .select( "-password -refreshToken")


       const options = {

        httpOnly: true,
        sucure:true
       }

       return res
       .status(200)
       .cookie("accessToken",accessToken,options)
       .cookie("refreshToken",refreshToken,options)
      .json(

        new ApiResopnse(
          200,
          {
            user:loggedInUser,accessToken
          },
          "user logged is successfully"
        )
      )

})



const logoutUser = asyncHandler (async (req,res) => {


  await User.findByIdAndUpdate(

    req.findById,
    {
      $set:{
        refreshToken:undefined
      }
    },
    {
      new:true
    }

  )

  const options={
    httpOnly:true,
    secure:true
  }

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(

    new ApiResopnse(200,{},"User logout successfully")
  )

  



})


const refreshAccessToken = asyncHandler(async (req,res) => {

      const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken

      if(!incomingRefreshToken){

        throw new ApiError(401,"unauthorized request")
      }

     try {
         const decodedToken = jwt.verify(
 
       incomingRefreshToken,
       process.env.REFRESH_TOKEN_SECRET
      )
 
       const user =  await  User.findById(decodedToken?._id)
 
       if(!user){
         throw new ApiError(401,"invalid refresh token")
       }
 
       if (incomingRefreshToken !== user?.refreshToken) {
 
         throw new ApiError(401,"refresh token is expired or used")
         
       }
 
       const options = { 
         httpOnly:true,
         secure:true
       }
 
         const {accessToken,newRefreshToken}  = await  genrateAccessAndRefreshTokens(user._id)
 
       return res
       .status(200)
       .cookie("accessToken" ,accessToken,options) 
       .cookie("refreshToken",newRefreshToken,options)
       .json(
 
         new ApiResopnse(
           200,
           {accessToken, refreshToken:newRefreshToken},
           "Accesee token refreshed"
 
         ),
       )
 
     } catch (error) {

         throw new ApiError(401,error?.message || "invalid refresh token")
      
     }


})



export { registerUser,loginUser,logoutUser,refreshAccessToken};
