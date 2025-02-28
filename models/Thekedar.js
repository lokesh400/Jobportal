const mongoose = require("mongoose");

const projectsSchema = new mongoose.Schema(
    {
      thisProjectWorkers:{type:Array},  
      title: {type: String, required:true},
      address: {type: String , required:true},
      pincode: {type:String, required:true},
      photo:{type:String, required:true},
      description:{type:String, required:true},
    },
    { timestamps: true }
  ); //timestamp true krn se created at , updated at , etc functionalities kaam krn lgti h

const ThekedarSchema = new Schema(
  {
    name: {type: String , required:true },
    mobile: {type: String, required:true},
    address: {type: String , required:true},
    pincode: {type:String, required:true},
    photo:{type:String, required:true},
    projects:[projectsSchema],
    workers:{type:Array},
  },
  { timestamps: true }
); //timestamp true krn se created at , updated at , etc functionalities kaam krn lgti h

mongoose.models = {}; //isk bina product cant be overwrite ka error aa jyega
export default mongoose.model("Thekedar", ThekedarSchema);
