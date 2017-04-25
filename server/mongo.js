const mongoose=require('./mongodb.js');
let start=6127;
let end=6948,pos=0;
function run(){
	pos++;
	if(start>end)return;
	mongoose.movieColle.update({_id:start++},{$set:{id:pos}}).then(v=>{
		console.log(start);
		run();
	})
}
run();