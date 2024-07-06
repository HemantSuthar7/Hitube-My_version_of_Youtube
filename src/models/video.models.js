import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new Schema({

    videoFile:{
        type: String,//Cloudinary URL
        required: [true,"Video-file is required"],
    },
    thumbNail:{
        type: String, //Cloudinary URL
        required: [true,"Thumbnail is required"],
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref:"User"
    },
    title:{
        type: String,
        required: [true,"Video Title is required"]
    },
    description:{
        type: String,
        required: [true,"Video description is required"]
    },
    duration:{
        type: Number, //will source from cloudinary
        required: true,
    },
    views:{
        type: Number,
        default: 0

    },
    isPublished:{
        type: Boolean,
        default: true
    }

},{
    timestamps: true
});


videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema);