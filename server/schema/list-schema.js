module.exports=function(Schema){
	const listItemSchema=new Schema({
		_id:Number,
		name:String,
		cg:String,
		date:Date,
		img:String
	}),
	branchSchema=new Schema({
		h:[listItemSchema],  //hot
		r:[listItemSchema],  //recommend
		_id:Number
	})
	,
	listMainSchema=new Schema({
		home:branchSchema,
		fictions:branchSchema,
		actions:branchSchema,
		horros:branchSchema,
		comeds:branchSchema,
		romances:branchSchema,
		dramas:branchSchema,
		wars:branchSchema,
		documentarys:branchSchema
	})
	return listMainSchema;
}