/*
Copyright 2022 giorkesk

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

class Renderer{
	constructor(){
		this.domElement=document.createElement("canvas");
		this.domElement.width=960;
		this.domElement.height=720;
		this.domElement.style.background="black";
		
		this.center=new Vector2(this.domElement.width/2,this.domElement.height/2);
		
		this.context=this.domElement.getContext("2d");
		
		this.render=function(scene,camera){
			this.context.clearRect(0,0,this.domElement.width,this.domElement.height);
			let objects=scene.children;
			objects.sort(function(a,b){
				if(a.line==undefined){
					let dist1=distanceMeasure(b.position,camera.position);
					let dist2=distanceMeasure(a.position,camera.position);
					return(dist1-dist2);
				}else{
					let dist1=distanceMeasure(b.position,camera.position);
					let dist2=distanceMeasure(a.start,camera.position);
					return(dist1-dist2);
				}
			});
			for(let i=0;i<objects.length;i++){
				if(objects[i].geometry!=undefined){
					this.draw(objects[i],camera,scene);
				}
				if(objects[i].line!=undefined){
					this.drawSimple(objects[i],camera,scene);
				}
			}
		};
		this.drawSimple=function(object,camera,scene){
			if(object.line){
				let pnt1=new Vector3(object.start.x,object.start.y,object.start.z);
				let pnt2=new Vector3(object.end.x,object.end.y,object.end.z);
				let p2d1=camera.project(pnt1,this.center);
				let p2d2=camera.project(pnt2,this.center);
				this.drawLine(p2d1,p2d2,object.color);
			}else{
				
			}
		}
		
		this.draw=function(object,camera,scene){
			let vertex=object.geometry.vertex;
			let tris=object.geometry.tris;
			let vertc=[];
			let vertc3d=[];
			for(let i=0;i<vertex.length;i++){
				let pnt=new Vector3(vertex[i].x,vertex[i].y,vertex[i].z);
				pnt=rotate(pnt,object.rotation);
				pnt.x+=object.position.x;
				pnt.y+=object.position.y;
				pnt.z+=object.position.z;
				vertc3d.push(pnt);
				vertc.push(camera.project(pnt,this.center));
			}
			tris.sort(function(a,b){
				try{
					let camloc=camera.position;
					let coord1=new Vector3(
						(vertc3d[b[0]].x+vertc3d[b[1]].x+vertc3d[b[2]].x+vertc3d[b[3]].x)/4,
						(vertc3d[b[0]].y+vertc3d[b[1]].y+vertc3d[b[2]].y+vertc3d[b[3]].y)/4,
						(vertc3d[b[0]].z+vertc3d[b[1]].z+vertc3d[b[2]].z+vertc3d[b[3]].z)/4
					);
					let coord2=new Vector3(
						(vertc3d[a[0]].x+vertc3d[a[1]].x+vertc3d[a[2]].x+vertc3d[a[3]].x)/4,
						(vertc3d[a[0]].y+vertc3d[a[1]].y+vertc3d[a[2]].y+vertc3d[a[3]].y)/4,
						(vertc3d[a[0]].z+vertc3d[a[1]].z+vertc3d[a[2]].z+vertc3d[a[3]].z)/4
					);
					let dist1=distanceMeasure(coord1,camloc);
					let dist2=distanceMeasure(coord2,camloc);
					return(dist1-dist2);
				}catch(err){return(-1);}
			});
			for(let i=0;i<tris.length;i++){
				try{
					let ttr=tris[i];
					let ttr2=[];
					for(let d=0;d<ttr.length;d++){
						ttr2.push(vertc3d[ttr[d]]);
					}
					this.context.fillStyle=object.material.getColor(generateNormal(ttr2,camera.position),vertc3d[tris[i][0]],scene).getCSS();
					this.context.beginPath();
					this.context.moveTo(vertc[tris[i][0]].x,vertc[tris[i][0]].y);
					for(let ii=0;ii<tris[i].length;ii++){
						try{
							this.context.lineTo(vertc[tris[i][ii]].x,vertc[tris[i][ii]].y);
						}catch(err){}
					}
					this.context.closePath();
					this.context.fill();
				}catch(err){}
			}
		};
		
		this.drawPoint=function(location){
			this.context.fillRect(location.x-5,location.y-5,10,10);
		}
		
		this.drawLine=function(location1,location2,color){
			this.context.strokeStyle=color.getCSS();
			this.context.beginPath();
			this.context.moveTo(location1.x,location1.y);
			this.context.lineTo(location2.x,location2.y);
			this.context.stroke();
		}
		
	}
	
}

class Scene{
	constructor(){
		this.children=[];
		
		this.add=function(child){
		
			if(child.isObject3D){
			
				this.children.push(child);
				
			}else{
			
				throw "Not an Object3D";
				
			}
			
		}
		
	}
	
}

class Vector2{
	constructor(x=0,y=0){
	
		this.x=x;
		this.y=y;
		
	}
	
	toString(){
	
		return(String(this.x)+" "+String(this.y));
		
	}
}

class Vector3{

	constructor(x=0,y=0,z=0){
	
		this.x=x;
		this.y=y;
		this.z=z;
		
	}
	toString(){
	
		return(String(this.x)+" "+String(this.y)+" "+String(this.z));
		
	}
}

class Object3D{

	constructor(){
	
		this.position=new Vector3();
		this.rotation=new Vector3();
		this.isObject3D=true;
		
	}
	
}

class Camera extends Object3D{

	constructor(){
	
		super();
		this.fov=150;
		this.project=function(point,center){
			point=new Vector3(point.x,point.y,point.z);
			point.x-=this.position.x;
			point.y-=this.position.y;
			point.z-=this.position.z;
			point=rotate(point,this.rotation);
			let point2d;
			if(point.z<0-this.fov){
				point2d=new Vector2(10000,10000);
			}else{
				point2d=this.perspective(point.x,point.y,point.z);
			}
			point2d.x+=center.x;
			point2d.y+=center.y;
			return(point2d);
		}
		
		this.perspective=function(x,y,z){
			return(new Vector2(x*(this.fov/(this.fov+z)),y*(this.fov/(this.fov+z))));
		}
		
	}
	
}

class Geometry{

	constructor(){
	
		this.vertex=[];
		this.tris=[];
		
	}
	
}

class PlaneGeometry extends Geometry{

	constructor(x=100,y=100){
	
		super();
		
		this.vertex=[
			new Vector3(x,y,0),
			new Vector3(-x,y,0),
			new Vector3(-x,-y,0),
			new Vector3(x,-y,0),
		];
		
		this.tris=[
			[0,1,2,3]
		];
		
	}
	
}

class CubeGeometry extends Geometry{

	constructor(x=100,y=100,z=100){
	
		super();
		
		x/=2;
		y/=2;
		z/=2;
		
		this.vertex=[
			new Vector3(x,y,z),//right down back
			new Vector3(-x,y,z),//left down back
			new Vector3(-x,-y,z),///left up back
			new Vector3(-x,-y,-z),//left up front
			new Vector3(x,-y,-z),//right up front
			new Vector3(x,y,-z),//right down front
			new Vector3(-x,y,-z),//left down front
			new Vector3(x,-y,z)//right up back
		];
		
		this.tris=[
			[0,1,2,7],
			[0,5,6,1],
			[2,3,4,7],
			[2,3,6,1],
			[7,4,5,0],
			[3,4,5,6]
		];
		
	}
	
}

class SphereGeometry extends Geometry{

	constructor(radius=100,horiz=32,vert=16){
	
		super();
		
		radius/=2;
		
		this.vertex=[];
		this.tris=[];
		let vinfo=[];
		
		for(let x=0;x<horiz;x++){
			let xd=x*(360/horiz);
			for(let y=0-vert;y<vert;y++){
			
				let yd=y*(180/vert);
				
				let vrt=rotate(new Vector3(0,radius,0),new Vector3(xd*rad,yd*rad,0));
				this.vertex.push(vrt);
				
				vinfo[String(x)+" "+String(y)]=this.vertex.length-1;
			}
		}
		
		for(let x=0;x<horiz;x++){
			for(let y=-vert;y<vert;y++){
			
				let vid1=vinfo[String(x)+" "+String(y)];
				let vid2=vinfo[String(x+1)+" "+String(y)];
				let vid3=vinfo[String(x+1)+" "+String(y+1)];
				let vid4=vinfo[String(x)+" "+String(y+1)];
				
				if(vid1!=undefined&&vid2!=undefined&&vid3!=undefined&&vid4!=undefined){
					this.tris.push([vid1,vid2,vid3,vid4]);
				}
			}
		}
	}
}

class CircleGeometry extends Geometry{

	constructor(radius=100,segments=16){
	
		super();
		
		radius/=2;
		
		this.vertex=[];
		this.tris=[[]];
		
		for(let y=0;y<segments;y++){
			let d=y*(360/segments);
			
			let vrt=rotate(new Vector3(radius,0,0),new Vector3(0,d*rad,0));
			this.vertex.push(vrt);
		}
		
		for(let x=0;x<this.vertex.length;x++){
			this.tris[0].push(x);
		}
	}
}

class SurfaceGeometry extends Geometry{

	constructor(x=100,y=100,segX=10,segY=10){
	
		super();
		
		this.vertex=[];
		this.tris=[];
		
		let offX=x/segX;
		let offY=y/segY;
		
		let vinfo=[];
		
		for(let dx=0;dx<segX;dx++){
			for(let dy=0;dy<segY;dy++){
			
				let cx=dx*offX;
				let cy=dy*offY;
				
				this.vertex.push(new Vector3(cx,cy,0));
				
				vinfo[String(dx)+" "+String(dy)]=this.vertex.length-1;
			}
		}
		
		for(let dx=0;dx<segX;dx++){
			for(let dy=0;dy<segY;dy++){
			
				let vid1=vinfo[String(dx)+" "+String(dy)];
				let vid2=vinfo[String(dx+1)+" "+String(dy)];
				let vid3=vinfo[String(dx+1)+" "+String(dy+1)];
				let vid4=vinfo[String(dx)+" "+String(dy+1)];
				
				if(vid1!=undefined&&vid2!=undefined&&vid3!=undefined&&vid4!=undefined){
					this.tris.push([vid1,vid2,vid3,vid4]);
				}
				
			}
			
		}
		
		for(let i=0;i<this.vertex.length;i++){
		
			this.vertex[i].x-=x/2;
			this.vertex[i].y-=y/2;
			
		}
		
	}
	
}

class Material{

	constructor(){
	
		this.getColor=function(normal){
		
			return(new Color(Math.random()*255,Math.random()*255,Math.random()*255));
			
		}
		
	}
	
}

class ColorMaterial extends Material{

	constructor(color=new Color(255,255,255)){
	
		super();
		this.color=color;
		this.getColor=function(normal){
		
			return(this.color);
			
		}
		
	}
	
}

class StandardColorMaterial extends Material{

	constructor(color=new Color(255,255,255)){
	
		super();
		
		this.color=color;
		
		this.getColor=function(normal){
		
			let norm=(normal.x+normal.y)/2;
			
			let procc=new Color(this.color.r*norm,this.color.g*norm,this.color.b*norm);
			return(procc);
		}
		
	}
	
}

class LightMaterial extends Material{

	constructor(color=new Color(255,255,255)){
	
		super();
		
		this.color=color;
		
		this.getColor=function(normal,position,scene){
			let norm=this.getLightImpact(position,scene);
			let procc=new Color(this.color.r*norm,this.color.g*norm,this.color.b*norm);
			return(procc);
		}
		
		this.getLightImpact=function(position,scene){
			let impact=0;
			for(let i=0;i<scene.children.length;i++){
				if(scene.children[i].emit!=undefined){
					impact+=(distanceMeasure(position,scene.children[i].position)/700)*scene.children[i].factor;
				}
			}
			impact=2-impact;
			return(impact);
		}
	}
	
}

class Mesh extends Object3D{

	constructor(geometry,material){
		super();
		
		this.geometry=geometry;
		this.material=material;
		
	}
	
}

class Light extends Object3D{

	constructor(factor=1){
	
		super();
		
		this.factor=factor;
		this.emit=true;
		
	}
	
}

class Line extends Object3D{

	constructor(start=new Vector3(0,0,0),end=new Vector3(0,-100,0),color=new Color(255,255,255)){
	
		super();
		
		this.position=start;
		this.rotation=undefined;
		
		this.start=start;
		
		this.end=end;
		
		this.color=color;
		
		this.line=true;
		
	}
	
}

class OrbitControls{

	constructor(camera,elem){
		this.camera=camera;
		this.elem=elem;
		this.move=false;
		this.mouse=new Vector2();
		this.prev=new Vector2();
		this.r=new Vector2();
		this.updateCamera=function(){
			//this.camera.position=rotate(new Vector3(0,0,400),new Vector3(this.r.x,this.r.y,0));
			this.camera.rotation=new Vector3(this.r.x,this.r.y,0);
		}
	}
	
	update(){
		if(this.move){
			let diff=new Vector2(this.mouse.x-this.prev.x,this.mouse.y-this.prev.y);
			this.prev=this.mouse;
			this.r.x+=diff.x*rad;
			this.r.y+=diff.y*rad;
			this.updateCamera();
		}
	}
	
}

class Color{

	constructor(r,g,b){
		this.r=r;
		this.g=g;
		this.b=b;
	}
	
	getCSS(){
		return("rgb("+String(this.r)+","+String(this.g)+","+String(this.b)+")");
	}
	
}

class Loader{

	constructor(){
	
		this.sendRequest=function(url,onLoad){
			let req=new XMLHttpRequest();
			req.addEventListener("load",onLoad);
			req.open("GET",url);
			req.send();
		};
		
		this.load=function(url="",completed=function(text){}){
			this.sendRequest(url,function(){
				completed(this.responseText);
			});
		}
		
	}
	
}

class OBJLoader extends Loader{

	constructor(){
	
		super();
		
		this.load=function(url="",completed=function(geometry){}){
		
			this.sendRequest(url,function(){
			
				function decode(text){
				
					let geo=new Geometry();
					let lines=text.split("\n");
					
					let factor=300;
					
					for(let i=0;i<lines.length;i++){
					
						let l=lines[i];
						
						if(l[0]!="#"){
						
							let lb=l.split(" ");
							
							if(lb[0]=="v"){
							
								geo.vertex.push(new Vector3(Number(lb[1])*factor,Number(lb[2])*factor,Number(lb[3])*factor));
								
							}
							
							if(lb[0]=="f"){
							
								let face=[];
								for(let ind=1;ind<lb.length;ind++){
									if(Number(lb[ind].split("/")[0])!=NaN){
										face.push(Number(lb[ind].split("/")[0])-1);
									}
								}
								geo.tris.push(face);
								
							}
							
						}
						
					}
					
					return(geo);
					
				}
				
				completed(decode(this.responseText));
				
			});
			
		}
		
	}
	
}

function rotate(base,rotation){

		let point=new Vector3(base.x,base.y,base.z);
		
		const sin=new Vector3(
		Math.sin(rotation.x),
		Math.sin(rotation.y),
		Math.sin(rotation.z));
		
		const cos=new Vector3(
		Math.cos(rotation.x),
		Math.cos(rotation.y),
		Math.cos(rotation.z));
		
		let temp1,temp2;
		
		temp1=cos.x*point.y+sin.x*point.z;
		temp2=-sin.x*point.y+cos.x*point.z;
		
		point.y=temp1;
		point.z=temp2;
		
		temp1=cos.y*point.x+sin.y*point.z;
		temp2=-sin.y*point.x+cos.y*point.z;
		
		point.x=temp1;
		point.z=temp2;
		
		temp1=cos.z*point.x+sin.z*point.y;
		temp2=-sin.z*point.x+cos.z*point.y;
		
		point.x=temp1;
		point.y=temp2;
		
		return(point);
		
}

function distanceMeasure(p1,p2){

	let a=Math.abs(p2.x-p1.x);
	let b=Math.abs(p2.y-p1.y);
	let c=Math.abs(p2.z-p1.z);
	
	return(Math.abs(Math.sqrt((a*a)+(b*b)+(c*c))));
}

function lookAt(x,y,z,x2,y2,z2){
	function la(x1,y1,x2,y2){
		return(Math.atan2(x2-x1,y2-y1));
	}
	
	let rx,ry,rz;
	
	rx=la(x,z,x2,z2);
	ry=la(y,z,y2,z2);
	rz=la(x,y,x2,y2);
	
	return([rx,ry,rx]);
}

function generateNormal(tris,cpos){
	let out=new Vector2(0,0);
	
	let las=0;
	let las2=0;
	let lasn=0;
	
	for(let i=0;i<tris.length;i++){
		las+=lookAt(
			tris[i].x,
			tris[i].y,
			tris[i].z,
			cpos.x,
			cpos.y,
			cpos.z
		)[0];
		
		las2+=lookAt(
			tris[i].x,
			tris[i].y,
			tris[i].z,
			cpos.x,
			cpos.y,
			cpos.z
		)[1];
		
		lasn++;
	}
	
	let la=[las/lasn,las2/lasn];
	
	la[0]+=1;
	la[1]+=1;
	
	out.x=la[0]/3;
	out.y=la[1]/3;
	
	return(out);
	
}

const rad=(Math.PI/180);
const deg=(180/Math.PI);

export {
	Renderer,//The core
	Scene,Camera,
	Object3D,Mesh,
	Geometry,Material,
	Vector2,Vector3,
	Color,
	ColorMaterial,//Materials
	StandardColorMaterial,
	LightMaterial,//Geometries
	CubeGeometry,
	SphereGeometry,
	PlaneGeometry,
	CircleGeometry,
	SurfaceGeometry,
	Light,//Misc
	Line,
	Loader,
	OBJLoader
};

