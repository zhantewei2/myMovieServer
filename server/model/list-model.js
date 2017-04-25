module.exports=function(mongoose){
	const listSchema=require('../schema/list-schema.js')(mongoose.Schema);
	const listModel=mongoose.model('lists',listSchema);
	listModel.myMethod={
		findList:(cg)=>{
			let	opt={};
			opt[cg]=1;
			opt['_id']=0;
			return listModel.findOne({},opt).then(v=>v?v:0); //{cg:{r:[],h:[]}};
		}
	};
	return listModel;
}