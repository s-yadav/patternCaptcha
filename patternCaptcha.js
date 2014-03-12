var canvas = require('canvas'),
	canvasBlur=require('./blur'),
	crypto=require("crypto"),
	fs = require('fs');
	
//a variable to contain all patterns requested having key on their id
var patternContainer={};

//a null function
var nullFunc=function(){};

//function get random integer between range
function getRandomInt(start, end) {
    if(!end){
		end=start;
		start=0;
	}
    return start + Math.floor(Math.random() * (end - start + 1));
}

//function to create token
function createToken(){
			return crypto.randomBytes(16).toString("hex");
		}


//function to merge objects
function extend(){
		var arg=arguments,
			target=arg[0];
		
		for(var i=1,ln=arg.length; i<ln; i++ ){
				var obj=arg[i];
				for(var key in obj){
						if(obj.hasOwnProperty(key)){
								target[key]=obj[key];
							}
					}
			}
		return target;	
	}
	


var globalSettings={
		matrix:false	
	};

function PatternCaptcha(option,callback){
		var matrix=this.matrix=option.matrix || [getRandomInt(2,4),getRandomInt(2,4)];
		var spacing=this.spacing = getRandomInt(10,20);
		this.color = 'rgb(' + getRandomInt(0,100) + ',' + getRandomInt(0,255) + ',' +getRandomInt(0,255) + ')';
		this.blurCoff=this.spacing/6;
		if(this.blurCoff<1.5) this.blurCoff=1.5;
		this.width=(spacing*4) * matrix[1] + (spacing*2);
		this.height=(spacing*4) * matrix[0] + (spacing*2);
		
		this.callback=callback;
		
		this.canvas=new canvas(this.width,this.height);
		this.context=this.canvas.getContext('2d');
		var images=option.images;
		if(typeof images == "string"){
				this.image= images; 
			}
		else if(Array.isArray(images)){
				this.image= images[getRandomInt(0,images.length-1)];
			}	
	}

PatternCaptcha.prototype={
		constructor:PatternCaptcha,
		
		init:function(){
				"use strict";
				var pcanvas = this.canvas,
					self=this,
					context = self.context= this.context;
					
				if(this.image){
				//draw a image on it
					fs.readFile(this.image, function(err, imageData){
					  if (err) callback(err);
					  var img = new canvas.Image;
					  img.src = imageData;				
					
						context.drawImage(img,0,0,self.width,self.height);
						
						self.drawPattern();
	
					});
				}
				else{
					self.drawPattern();
				}
			},
		drawPattern:function(){
				"use strict";
				var pcanvas = this.canvas,
					self=this,
					spacing=self.spacing,
					matrix=self.matrix,
					context = self.context= this.context,
					pointLoc = {};

					//to draw dots
					for (var i = 0, ln = matrix[0]; i < ln; i++) {
						for (var j = 0, cln = matrix[1]; j < cln; j++) {
							var left = spacing + (spacing*4 * j) + spacing*2,
								top = spacing + (spacing*4 * i) + spacing*2,
								point = i * matrix[1] + j + 1;
							//store locations in a object
							pointLoc[point] = {
								left: left,
								top: top
							}
							//create path
							context.beginPath();
							context.arc(left, top, 5, 0, Math.PI * 2, false);
							context.closePath();
							context.fillStyle =self.color;
							context.fill();
						}
					}
				
					//get random pattern
					var pattern = self.getRandomPattern();
				
					//to draw line between dots
					context.beginPath();
					for (var i = 1, ln = pattern.length; i < ln; i++) {
						var point = pattern[i],
							prevPoint = pattern[i - 1],

							x1 = pointLoc[prevPoint].left,
							y1 = pointLoc[prevPoint].top,
							x2 = pointLoc[point].left,
							y2 = pointLoc[point].top;
			
						
						//to draw line
						context.moveTo(x1, y1);
						context.lineTo(x2, y2);
						//to draw arrow
						//get middle values
						var xm = (x2 + x1) / 2,
							ym = (y2 + y1) / 2,
							//get x an y cofficient
							xc = x2 - x1 > 0 ? 1 : x2 - x1 == 0 ? 0 : -1,
							yc = y2 - y1 > 0 ? 1 : y2 - y1 == 0 ? 0 : -1,
							//define cofficient
							c1, c2, c3;
						if (xc != 0 && yc != 0) {
							c1 = (xc - yc) / 2;
							c2 = (xc + yc) / 2;
							c3 = (yc - xc) / 2;
						} else {
							c1 = xc - yc;
							c2 = xc + yc;
							c3 = yc - xc;
						}
						//define points
						var p1x = x2 - ((x2 - x1) / 2 + c1 * 10),
							p1y = y2 - ((y2 - y1) / 2 + c2 * 10),
							p2x = x2 - ((x2 - x1) / 2 + c2 * 10),
							p2y = y2 - ((y2 - y1) / 2 + c3 * 10);
						//draw arrow
						context.moveTo(p1x, p1y);
						context.lineTo(xm, ym);
						context.lineTo(p2x, p2y);
					}
				
					context.strokeStyle =self.color;
					context.lineWidth = 3
					context.stroke();
					
					self.dirtyCanvas();
										
					//to make canvas dirty
					canvasBlur(context,0,0,self.width,self.height,self.blurCoff);
					
					//to generate data from canvas
					self.generateData();
				},	
		getRandomPattern:function(){
			"use strict";
			var x =this.matrix[0],
				y = this.matrix[1],
				totalPoints = x * y,
				pattrnLn = getRandomInt(4, 9),
				pattern = [getRandomInt(1,totalPoints)];
		
			for (var i = 1; i < pattrnLn; i++) {
				var adjacent = this.getAdjacent(pattern[pattern.length - 1]),
					checked = [],
					found = false;
				while (checked.length != adjacent.length && !found) {
					var point = adjacent[getRandomInt(adjacent.length - 1)];
					if (checked.indexOf(point) == -1) {
						checked.push(point);
						if (pattern.indexOf(point) == -1) {
							pattern.push(point);
							found = true;
						}
					}
				}
				if (!found) break;
			}
			this.pattern =pattern;
			return pattern;
		},
		getAdjacent:function getAdjacent(point) {
				"use strict";				
				var x = this.matrix[1],
					y = this.matrix[0],
					altPoint = [],
					possiblePoint;
				if (point % x == 1) {
					possiblePoint = [point - x, point - x + 1, point + 1, point + x, point + x + 1];
				} else if (point % x == 0) {
					possiblePoint = [point - x - 1, point - x, point - 1, point + x - 1, point + x];
				} else {
					possiblePoint = [point - x - 1, point - x, point - x + 1, point - 1, point + 1, point + x - 1, point + x, point + x + 1];
				}
				for (var i = 0, ln = possiblePoint.length; i < ln; i++) {
					var val = possiblePoint[i];
					if (altPoint.indexOf(val == -1) && val > 0 && val <= x * y) altPoint.push(val);
				}
				return altPoint;
		},
		generateData:function(){
				var data=this.canvas.toDataURL(),
					token=createToken();
				patternContainer[token] = this.pattern.join('');
				this.callback(null,{
						id:token,
						matrix:this.matrix,
						imageData:data
					});
		},
		dirtyCanvas:function dirtyCanvas(){
			var context=this.context,
				number=100*this.matrix[0]*this.matrix[1];
			for(var i=0; i<number; i++){
					var left=Math.ceil(Math.random()*(this.width-1)),
						top=Math.ceil(Math.random()*(this.height-1));
					
					this.context.fillRect(left,top,2,2); 	
				}
		}
	}



module.exports={
		new:function(option,callback){
					if(typeof option == "function"){
						callback=option;
						option={};
					}
					option=extend({},globalSettings,option);
					var lock=new PatternCaptcha(option,callback);
					lock.init();					
			},
		globalSettings:globalSettings,
		checkPattern:function(id,pattern){
				var matched= patternContainer[id] ?patternContainer[id] == pattern : false;
				if(patternContainer[id]) delete patternContainer[id];
				return matched;
			}		
	};
