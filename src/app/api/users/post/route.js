
import { connect } from "@/dbConfig/dbConnect";
import { Quote } from "@/models/post.model";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import mongoose,{Schema} from "mongoose";
import {writeFile} from "fs/promises"
//import { uploadOnCloudinary } from "@/helper/CloudinaryEnv";
import { User } from "@/models/user.model";
import { error } from "console";
import ImageKit from "imagekit";
import { v4 as uuid } from "uuid";
import { ImageKitUpload } from "@/helper/ImageKitUploader";
connect();
export async function POST(request){
  const token =cookies().get("Token");
      //console.log(token.value);
      const decodeUser=jwt.verify(token?.value,process.env.TOKEN_SECRET);
      const UserId=decodeUser._id;
      const reqBody=await request.formData();
      // const {quote,bgColor,TextCol}=reqBody;
      // console.log(reqBody);
//       //console.log(file);
      const quote = reqBody.get('quote');
const bgColor = reqBody.get('bgColor');
const textCol = reqBody.get('TextCol');
const catagory=reqBody.get('catagory');
// // Get file(s)
const file = reqBody.get('file');
let quotebgImage="";
if (file) {
  try {
    // Upload the file
    const uploadResult = await ImageKitUpload(file);
    // If upload is successful, set quotebgImage
    quotebgImage = uploadResult.url;
    // If upload is successful, set quotebgImage
  } catch (error) {
    console.error(error);
    // Handle error
  }
}
console.log(quotebgImage);
//console.log(quotebgImage);
//const file=files[0];
// // console.log(quote);
// // console.log(bgColor);
// // console.log(textCol);

//  if(!quotebgImage){
//   throw new error("quotebgImage is not uploaded")
//  }
// console.log(quotebgImage);
//   // if(!quotebgImage){
//   //   throw new Error("someting went wrong at image uplaoding")
//   // }
const quotes=await Quote.create(
  {
      title:"title",
      quote,
      catagory,
      BgImageUrl:quotebgImage || "",
      BgColor:bgColor,
      TextColor:textCol,
      Owner:UserId
  }
)
     
//     if(!quote){
//       throw new error("someting went to Quote generate")
//      }
    return NextResponse.json({
        quotes,
        message:"Post Created Successfully"
    })
}

export async function PATCH(request){
 // console.log(request);
   const reqBody=await request.json();
   const {id}=reqBody;
   //console.log(reqBody);
   const quote=await Quote.findById(id);
  return NextResponse.json({
    quote,
    message:"Patch request ready"
  })
}

export async function GET(){
  const token =cookies().get("Token");
  //console.log(token.value);
  const decodeUser=jwt.verify(token.value,process.env.TOKEN_SECRET);
  const UserId=decodeUser._id; // Replace with the actual user ID
  console.log(UserId);
  const quotes = await Quote.aggregate([
    // Match stage to filter quotes by owner ID
    {
      $match: {
        Owner: new mongoose.Types.ObjectId(UserId)
      }
    },
    // Lookup stage to get likes for each quote
    {
      $lookup: {
        from: "likes",
        let: { quoteId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$quoteId", "$$quoteId"] },
              LikedBy: new mongoose.Types.ObjectId(UserId) // Filter likes by current user
            }
          }
        ],
        as: "userLikes" // Store user's likes in a separate field
      }
    },
    // Add field to calculate number of likes for each quote
    {
      $addFields: {
        likeCount: { $size: "$userLikes" }, // Total likes
        isLikedByCurrentUser: { $cond: { if: { $gt: [{ $size: "$userLikes" }, 0] }, then: true, else: false } } // Check if current user has liked the post
      }
    },
    // Project stage to shape the output
    {
      $project: {
        quote: 1, // Keep the quote ID,
        BgImageUrl: 1,
        BgColor: 1,
        TextColor: 1,
        likeCount: 1, // Number of likes for each quote
        isLikedByCurrentUser: 1 // Field indicating if the current user has liked the post
      }
    }
  ]);




 // Replace with the actual user ID
 const userInfo = await User.aggregate([
  // Match stage to filter users by user ID
  {
    $match: {
      _id: new mongoose.Types.ObjectId(UserId) // Convert userId to ObjectId
    }
  },
 // Lookup stage to get follower count
  {
    $lookup: {
      from: "followers",
      localField: "_id",
      foreignField: "account",
      as: "followers"
    }
  },
  {
    $lookup: {
      from: "followers",
      localField: "_id",
      foreignField: "followedTo",
      as: "following"
    }
  },
  // Count the number of followers
  {
    $addFields: {
      followerCount: { $size: "$followers" },
      followingCount: { $size: "$following" }
    }
  },
  //Project stage to shape the output
  {
    $project: {
      _id: 1, // Exclude user ID from the output
      username:1,
      fullname:1,
      avatarImg:1,
      followerCount: 1, // Number of followers
      followingCount: 1 // Number of followings
    }
 }
]);
// const userInfo =await User.aggregate ([
//   // Match stage to filter quotes by user ID
//   {
//     $match: {
//       owner: new mongoose.Types.ObjectId(UserId) // Convert userId to ObjectId
//     }
//   },
//   // Group stage to group quotes by user ID and count the number of quotes
//   {
//     $group: {
//       _id: "$owner", // Group by user ID
//       totalQuotes: { $sum: 1 } // Count the number of quotes for each user
//     }
//   },
//   // Lookup stage to get follower count
//   {
//     $lookup: {
//       from: "followers",
//       localField: "_id",
//       foreignField: "followedTo",
//       as: "followers"
//     }
//   },
//   // Count the number of followers
//   {
//     $addFields: {
//       followerCount: { $size: "$followers" }
//     }
//   },
//   // Lookup stage to get following count
//   {
//     $lookup: {
//       from: "followers",
//       localField: "_id",
//       foreignField: "account",
//       as: "following"
//     }
//   },
//   // Count the number of followings
//   {
//     $addFields: {
//       followingCount: { $size: "$following" }
//     }
//   },
//   // Lookup stage to get user information
//   {
//     $lookup: {
//       from: "users",
//       localField: "_id",
//       foreignField: "_id",
//       as: "user"
//     }
//   },
//   // Project stage to shape the output
//   {
//     $project: {
//       _id: 0, // Exclude user ID from the output
//       totalQuotes: 1, // Total number of quotes
//       followerCount: 1, // Number of followers
//       followingCount: 1, // Number of followings
//       user: { $arrayElemAt: ["$user", 0] } // Get user information
//     }
//   }
// ]);
// console.log(userInfo);
//console.log(qutes.length);
return NextResponse.json({
   UserDetails:userInfo,
   quote:quotes,
  message:"done"
})

}
