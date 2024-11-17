import sendEmail from "../config/sendEmail.js";
import UserModel from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import verifyEmailTemplate from "../utils/verifyEmailTemplate.js";
import generatedAcessToken from "../utils/generateAccessToken.js";
import generatedRefreshToken from "../utils/generatedRefreshToken.js";
import uploadImageCloudinary from "../utils/uploadimageCloudinary.js";
import uploadImageClodinary from "../utils/uploadimageCloudinary.js";

export async function registerUserController(request, response) {
  try {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return response.status(400).json({
        message: "provide email, name, password",
        error: true,
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findOne({ email });

    if (user) {
      return response.json({
        message: "Already register email",
        error: true,
        success: false,
      });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(password, salt);

    const payload = {
      name,
      email,
      password: hashPassword,
    };

    const newUser = new UserModel(payload);
    const save = await newUser.save();

    const verifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${save?._id}`;

    const verifyEmail = await sendEmail({
      sendTo: email,
      subject: "Verify email from Godam",
      html: verifyEmailTemplate({
        name,
        url: verifyEmailUrl,
      }),
    });

    return response.json({
      message: "user register successfully",
      error: false,
      success: true,
      data: save,
    });

  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success : false
    });
  }
}

export async function verifyEmailController(request, response) {
  try {
    const { code } = request.body;

    const user = await UserModel.findOne({ _id: code });

    if (!user) {
      return response.status(400).json({
        message: "Invalid",
        error: true,
        success: false,
      });
    }

    const updateUser = await UserModel.updateOne({ _id: code },{
        verify_email: true,
      });

    return response.json({
      message: "verify email done",
      success: "true",
      error: "false",
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: true,
    });
  }
}

//login controller
export async function loginController(request, response) {
  try {
    const { email, password } = request.body;

    if(!email || !password){
      return response.status(400).json({
        message : "provide email, password",
        error : true,
        success : false
      })
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return response.status(400).json({
        message: "user not registered",
        error: true,
        success: false,
      });
    }

    if (user.status !== "Active") {
      return response.status(400).json({
        message: "contact to Admin",
        error: true,
        success: false,
      });
    }

    const checkPassword = await bcryptjs.compare(password, user.password);

    if (!checkPassword) {
      return response.status(400).json({
        message: "Check your Password",
        error: true,
        success: false,
      });
    }

    const accesstoken = await generatedAcessToken(user._id)
    const refreshToken = await generatedRefreshToken(user._id)

    const cookiesOption = {
      httpOnly : true,
      secure : true,
      sameSite : "None"
    }
    response.cookie('accessToken',accesstoken, cookiesOption)
    response.cookie('refreshToken',refreshToken, cookiesOption)

    return response.json({
      message : "Login successfully",
      error : false,
      success : true,
      data: {
        accesstoken,     
        refreshToken                                                                                                                           
      }
    })

  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      success: false,
    });
  }
}

//logout controller
export async function logoutController(request,response){
  try {
    const userid = request.userId  //middleware

    const cookiesOption = {
      httpOnly : true,
      secure : true,
      sameSite : "None"
    }

      response.clearCookie("accessToken",cookiesOption)
      response.clearCookie("refreshToken",cookiesOption)

      const removeRefreshToken = await UserModel.findByIdAndUpdate(userid,{
        refresh_token : ""
      })


      return response.json({
        message : "Logout Successfully",
        error : false,
        success : true
      })
  } catch (error) {
    return response.status(500).json({
      message : error.message || error,
      error : true,
      success : false
    })
  }
}

//upload user avatar
export async  function uploadAvatar(request,response){
  try {
    const userId = request.userId //auth middleware
    const image = request.file  //multer middleware

    const upload  = await uploadImageClodinary(image)

    const updateUser = await UserModel.findByIdAndUpdate(userId,{
      avatar : upload.url
    })

    return response.json({
      message : "upload profile",
      data : {
        _id : userId,
        avatar : upload.url
      }
    })
  } catch (error) {
    return response.status(500).json({
      message : error.message || error,
      error : true,
      success : false 
    })
  }
}

//update user details
export async function updateUserDetails(request,response){
  try {
    const userId = request.userId //auth middleware
    const { name, email, mobile, password } = request.body

    let hashPassword = ""

    if (password){
      const salt = await bcryptjs.genSalt(10)
      hashPassword = await bcryptjs.hash(password,salt)
    }

    const updateUser = await UserModel.updateOne({ _id : userId},{
      ...(name && { name : name}),
      ...(email && { email : email}),
      ...(mobile && { mobile : mobile}),
      ...(password && { password : hashPassword})
    })

    return response.json({
      message : "updated user successfully",
      error : false,
      success : true,
      data : updateUser,
    })

  } catch (error) {
    return response.status(500).json({
      message : error.message || error,
      error : true,
      success : false 
    })
    
  }
}

