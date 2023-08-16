var canvas;
var gl;
var program ;

var near = 0.1;
var far = 5000;

var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;

var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0 );

var lightAmbient = vec4(0.1, 0.1, 0.1, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix ;
var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye = vec3(0, 0, 0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0 ;
var RY = 0 ;
var RZ = 0 ;

var MS = [] ; // The modeling matrix stack
var TIME = 0.0 ; // Realtime
var TIME = 0.0 ; // Realtime
var resetTimerFlag = true ;
var animFlag = false ;
var prevTime = 0.0 ;
var useTextures = 1 ;

// ------------ Images for textures stuff --------------
var texSize = 64;

var image1 = new Array()
for (var i =0; i<texSize; i++)  image1[i] = new Array();
for (var i =0; i<texSize; i++)
for ( var j = 0; j < texSize; j++)
image1[i][j] = new Float32Array(4);
for (var i =0; i<texSize; i++) for (var j=0; j<texSize; j++) {
    var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
    image1[i][j] = [c, c, c, 1];
}

// Convert floats to ubytes for texture

var image2 = new Uint8Array(4*texSize*texSize);

for ( var i = 0; i < texSize; i++ )
for ( var j = 0; j < texSize; j++ )
for(var k =0; k<4; k++)
image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];


var textureArray = [] ;

class Vector {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
    }
}

function isLoaded(im) {
    if (im.complete) {
        console.log("loaded") ;
        return true ;
    }
    else {
        console.log("still not loaded!!!!") ;
        return false ;
    }
}

function loadFileTexture(tex, filename)
{
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();
    tex.image.src = filename ;
    tex.isTextureReady = false ;
    tex.image.onload = function() { handleTextureLoaded(tex); }
    // The image is going to be loaded asyncronously (lazy) which could be
    // after the program continues to the next functions. OUCH!
}

function loadImageTexture(tex, image) {
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();
    //tex.image.src = "CheckerBoard-from-Memory" ;
    
    gl.bindTexture( gl.TEXTURE_2D, tex.textureWebGL );
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
                  gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                     gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);

    tex.isTextureReady = true ;

}

function initTextures() {
    
    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"subtexture.png") ;

    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"watertexture.jpg") ;

    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"stock.jpg") ;

    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"shark.jpg") ;
    
    textureArray.push({}) ;
    loadImageTexture(textureArray[textureArray.length-1],image2) ;
    
    
}


function handleTextureLoaded(textureObj) {
    gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // otherwise the image would be flipped upsdide down
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureObj.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);
    console.log(textureObj.image.src) ;
    
    textureObj.isTextureReady = true ;
}

//----------------------------------------------------------------

function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
                                        "shininess"),materialShininess );
}

function toggleTextures() {
    useTextures = 1 - useTextures ;
    gl.uniform1i( gl.getUniformLocation(program,
                                         "useTextures"), useTextures );
}

function waitForTextures1(tex) {
    setTimeout( function() {
    console.log("Waiting for: "+ tex.image.src) ;
    wtime = (new Date()).getTime() ;
    if( !tex.isTextureReady )
    {
        console.log(wtime + " not ready yet") ;
        waitForTextures1(tex) ;
    }
    else
    {
        console.log("ready to render") ;
        window.requestAnimFrame(render);
    }
               },5) ;
    
}

// Takes an array of textures and calls render if the textures are created
function waitForTextures(texs) {
    setTimeout( function() {
               var n = 0 ;
               for ( var i = 0 ; i < texs.length ; i++ )
               {
                    console.log("boo"+texs[i].image.src) ;
                    n = n+texs[i].isTextureReady ;
               }
               wtime = (new Date()).getTime() ;
               if( n != texs.length )
               {
               console.log(wtime + " not ready yet") ;
               waitForTextures(texs) ;
               }
               else
               {
               console.log("ready to render") ;
               window.requestAnimFrame(render);
               }
               },5) ;
    
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0, 0, 215, 1 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
 
    // Load canonical objects and their attributes
    Cube.init(program);
    Cylinder.init(9,program);
    Cone.init(9,program) ;
    Sphere.init(36,program) ;

    gl.uniform1i( gl.getUniformLocation(program, "useTextures"), useTextures );

    // record the locations of the matrices that are used in the shaders
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
    // set a default material
    setColor(materialDiffuse) ;
    
  
    
    // set the callbacks for the UI elements
    document.getElementById("sliderXi").oninput = function() {
        RX = this.value ;
        window.requestAnimFrame(render);
    };
    document.getElementById("sliderYi").oninput = function() {
        RY = this.value;
        window.requestAnimFrame(render);
    };
    document.getElementById("sliderZi").oninput = function() {
        RZ =  this.value;
        window.requestAnimFrame(render);
    };
    
    document.getElementById("animToggleButton").onclick = function() {
        if( animFlag ) {
            animFlag = false;
        }
        else {
            animFlag = true  ;
            resetTimerFlag = true ;
            window.requestAnimFrame(render);
        }
    };
    
    document.getElementById("textureToggleButton").onclick = function() {
        toggleTextures() ;
        window.requestAnimFrame(render);
    };

    var controller = new CameraController(canvas);
    controller.onchange = function(xRot,yRot) {
        RX = xRot ;
        RY = yRot ;
        window.requestAnimFrame(render); };
    
    // load and initialize the textures
    initTextures() ;
    
    // Recursive wait for the textures to load
    waitForTextures(textureArray) ;
    //setTimeout (render, 100) ;
    
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix) ;
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix) ;
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV() ;
    
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
function drawCube() {
    setMV() ;
    Cube.draw() ;
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawSphere() {
    setMV() ;
    Sphere.draw() ;
}
// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
function drawCylinder() {
    setMV() ;
    Cylinder.draw() ;
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawCone() {
    setMV() ;
    Cone.draw() ;
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modelview matrix with the result
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z])) ;
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modelview matrix with the result
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z])) ;
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modelview matrix with the result
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz)) ;
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop() ;
}

// pushes the current modelMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix) ;
}

var sceneTimes = [10, 7, 9, 4, 8, 3, 5.5, 5]; // [12, 7, 9, 4, 8, 3, 5.5, 5] for testing
var currTime = 0;
var scene = 0;
var timeDif = 0;
var sceneTime = 0;
var frameRate = 0;
var frames = 0;


function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    at = vec3(at[0], at[1], at[2]);
    eye = vec3(eye[0], eye[1], eye[2]);
    eye[1] = eye[1] + 0 ;
   
    // set the projection matrix
    projectionMatrix = perspective(90, 1, near, far); // changed to perspective

    
    // set the camera matrix
    viewMatrix = lookAt(eye, at , up);
    
    // initialize the modeling matrix stack
    MS= [] ;
    modelMatrix = mat4() ;
    
    // apply the slider rotations
    gRotate(RZ,0,0,1) ;
    gRotate(RY,0,1,0) ;
    gRotate(RX,1,0,0) ;
    
    // send all the matrices to the shaders
    setAllMatrices() ;
    
    // get real time
    var curTime ;
    if( animFlag )
    {
        curTime = (new Date()).getTime() /1000 ;
        if( resetTimerFlag ) {
            prevTime = curTime ;
            resetTimerFlag = false ;
        }
        TIME = TIME + curTime - prevTime ;
        timeDif = curTime - prevTime;
        currTime += timeDif;
        prevTime = curTime ;
    }
    
    if (sceneTimes[scene] <= sceneTime && sceneTimes[scene] !== -1) { //if scene is finished, go to next scene and reset scene time
        scene++;
        sceneTime = 0;
    }
   
    switch (scene) {
        case 0:
            scene0(sceneTime);  // Scene set-up
            break;
        case 1:
            scene1(sceneTime);
            break;
        case 2:
            scene2(sceneTime);
            break;
        case 3:
            scene3(sceneTime);
            break;
        case 4:
            scene4(sceneTime);
            break;
        case 5:
            scene5(sceneTime);
            break;
        case 6:
            scene6(sceneTime);
            break;
        case 7:
            scene7(sceneTime);
            break;
    }
    sceneTime += timeDif;
    frameRate += timeDif;
    renderBackground(); // Draw background right before begining scenes

    frames++;
    if (frameRate >= 2.0) {
        console.log("Frame Rate (FPS): " + (frames / frameRate).toFixed(1)); // Output frames to console every 2 seconds
        frameRate = 0;
        frames = 0;
    }

    
    
    if( animFlag )
        window.requestAnimFrame(render);
}


var sub = { // Creation of submarine
    pos: new Vector(),

    renderSub: function() {
        gPush(); { // Submarine
            gTranslate(this.pos.x, this.pos.y, this.pos.z) ;
            gScale(0.5, 0.5, 0.5);
           
            gPush();{//sub body
                    gScale(4, 1.7, 1.7);
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
                    gl.uniform1i(gl.getUniformLocation(program, "texture0"), 0);
                    
                
                drawSphere();
                
            }
            gPop();
            toggleTextures();
           
            gPush();{ // Sub windows
                gTranslate(-2.2, 0, 0.9);
                gScale(0.7, 0.7, 0.6);
                setColor(vec4(200, 200, 181));
                setColor(mult(lightDiffuse,vec4(0.8, 0.8, 0.8)));
                drawSphere();
                

                gTranslate(3, 0, 0.6);
                drawSphere();

                gTranslate(3, 0, -0.5);
                drawSphere();

                gTranslate(0,0, -3.2);
                drawSphere();

                gTranslate(-3, 0, -0.55);
                drawSphere();

                gTranslate(-3, 0, 0.5 );
                drawSphere();
                
            }
            gPop();
            toggleTextures();

            gPush();{//top tail
                gTranslate(0, 1.2, 0);
                gScale(1, 1, 0.5);
                drawCube();
                gTranslate(1, -0.4, 0);
                gRotate(45,0, 0, 1 );
                drawCube();
            }
            gPop();

            gPush();{//back tail1
                
                gScale(1.6,0.5,0.25)
                gTranslate(2.6, 1, 0);
                gRotate(90,0,1,0);
                gRotate(-20,1,0,0);
                drawCone();
            }
            gPop();

            gPush();{// backtail2
                gScale(1,0.5,0.25)
                gTranslate(4.1, -1, 0);
                gRotate(90,0,1,0);
                gRotate(20,1,0,0);
                drawCone();
            }
            gPop();

            gPush();{//  tail axel
                
                gTranslate(4.5, 0, 0);
                gScale(1.3, 0.3, 0.3);
                gRotate(90,0,1,0);
                drawCylinder();
            }
            gPop();

            gPush();{// rotating tail part
                gTranslate(5.2, 0, 0);
                gScale(0.16,0.3,0.3);
                gRotate(TIME * 1000 / 3.14159, 1, 0, 0);
                drawSphere();
                toggleTextures();
                gPush();{//flipers
                    gTranslate(0,1.5,0);
                    gScale(0.9, 1.1, 0.2)
                    drawSphere();
                    gTranslate(0,-3,0);
                    drawSphere();
                }
                gPop();
                toggleTextures();

                

            }
            gPop();

            gPush();{//scope
                
                gRotate(-(Math.sin(TIME) * 40), 0, 1, 0);

                gPush();{//first cylind
                    gTranslate(0, 2.6, 0);
                    gScale(0.4, 1.5, 0.4);
                    gRotate(90, 1, 0, 0);
                     drawCylinder();
                     
                }
                gPop();

                gPush();{//elbow
                     gTranslate(-0.3, 3.2, 0);
                     gScale(0.9, 0.4, 0.4);
                     gRotate(90, 0, 1, 0);
                     drawCylinder();

                }
                gPop();

                gPush();{//end
                    gTranslate(-0.8, 3.2, 0);
                    gScale(0.2, 0.4, 0.4);
                    drawSphere();
                    toggleTextures();
                    gPush();{//lens
                        setColor(mult(lightSpecular,vec4(1, 1, 0.1, 1)));
                        gTranslate(-0.2, 0, 0);
                        gScale(1, 0.8, 0.8)
                        drawSphere();
                        
                    }
                    gPop();
                    toggleTextures();
                }
                gPop();

            }
            gPop();

            

        }
        gPop();


    }


}

var meg = { // Creation of megalodon
    pos: new Vector(),
    
    renderMeg: function() {
     //  toggleTextures();
        gPush(); { // megalodon
            gTranslate(this.pos.x, this.pos.y, this.pos.z) ;
            gScale(2.5, 2, 2);
             gl.activeTexture(gl.TEXTURE0);
             gl.bindTexture(gl.TEXTURE_2D, textureArray[3].textureWebGL);
             gl.uniform1i(gl.getUniformLocation(program, "texture4"), 0);
            
            gPush();{//meg body
                gScale(7.2, 3, 3.5);    
                drawSphere();
            }
            gPop();
       
            gPush();{//shark tail
              gRotate(Math.sin(TIME*10) * 30 / 3.14159, 0, 1, 0);
               gPush();{//tail
                gTranslate(7, 0, 0);
                gScale(11, 2.7, 2.7);
                gTranslate(-1.5, 0 ,0);
                gTranslate(1.5, 0, 0);
                gRotate(90,0,1,0);
                drawCone();
               }
                gPop();
               

                gPush();{//talfin
               // gRotate(Math.sin(TIME / 0.1) * 10 / 3.14159, 0, 1, 0);
                gTranslate(12, 1.5, 0);
                gTranslate(-1, 0, 0);
                gRotate(Math.sin(TIME*10) * 60 / 3.14159, 0, 1, 0);
                gTranslate(1, 0, 0);
                gScale(1, 3, 0.3);
                gRotate(-90, 1, 0, 0);
                drawCone();
                gTranslate(0, 0, -1);
                gRotate(180, 1, 0, 0);
                drawCone();
                    }
                    gPop();
            }
            gPop();

            gPush();{//topfin
                gTranslate(0, 4, 0);
                gScale(2, 4, 0.8);
                gRotate(-90, 1, 0, 0);
                drawCone();

            }
            gPop();

            gPush();{//sidefin
                gTranslate(0, 0, 4);
                gScale(2, 0.8, 4);
                gRotate(20, 1, 0, 0);
                
                drawCone();
            }
            gPop();

            gPush();{//sidefin2
                gTranslate(0, 0, -4);
                gScale(2, 0.8, 4);
                gRotate(180, 1, 0, 0);
                
                drawCone();
            }
            gPop();
            toggleTextures();
            gPush();{//eye
                setColor(vec4(0, 0, 0, 1))
                gTranslate(-4, 1, 2.5);
                gScale(0.4, 0.3, 0.4);
                drawSphere();
            }
            gPop();

            gPush();{//eye2
                setColor(vec4(0, 0, 0, 1));
                gTranslate(-4, 1, -2.5);
                gScale(0.4, 0.3, 0.4);
                drawSphere();
            }
            gPop();
            
            gPush();{//mouth
                setColor(vec4(200, 200, 200, 1));
                gTranslate(-4.3, 0, 0);
                gScale(3, 1.5, 2.3);
                drawSphere();

                setColor(vec4(0, 0,0, 0));
                gTranslate(-0.28, 0, 0);
                gScale(0.75, 0.7, 0.85);
                drawSphere();
            }
            gPop();
            
            toggleTextures();
            
        }
        gPop();
       // toggleTextures();
    } 
}
 


function scene0(sceneTime){ //Sub on water
   if (sceneTime < 5) {
    sub.pos.x = 25 - TIME*2;
    sub.pos.y = 2000.3;
    sub.pos.z = 0 + Math.sin(TIME/1.5);
    at = vec3(sub.pos.x+0.5, sub.pos.y, sub.pos.z);
    eye = vec3(sub.pos.x+2, sub.pos.y+3, sub.pos.z+5);  
    
     
   }
   else if (sceneTime >= 5) { //Sub decends
    sub.pos.x = 25 - TIME*2;
    sub.pos.y = 2000.3 - (TIME-5)/3;
    sub.pos.z = 0 + Math.sin(TIME/1.5);
    at = vec3(sub.pos.x+0.5, sub.pos.y, sub.pos.z);
    eye = vec3(sub.pos.x+2, sub.pos.y+3+(TIME-5)/2, sub.pos.z+5);
    
}
sub.renderSub();
}

 function scene1(sceneTime){// Sub decends
     if (sceneTime < 7){
        sub.pos.x = 25 - 0.5*0.5*sceneTime*sceneTime ;
        sub.pos.y = 300 - sceneTime + 0.5*0.05*sceneTime*sceneTime;
        sub.pos.z = 0;
        at = vec3(sub.pos.x+0.5, sub.pos.y-2, sub.pos.z);
        eye = vec3(sub.pos.x+4, 300, sub.pos.z+5);
        
        sub.renderSub();
     }
     }
function scene2(sceneTime){ // follows sub for a short amount of time
    if (sceneTime < 2){
        sub.pos.x = 25 - 12.25 - (10*sceneTime - 0.5*0.05*sceneTime*sceneTime); //Position in time t: x(t) = x(t0) + v(t0)*t+0.5 a*t^2
        sub.pos.y = 300 - 36.75 + Math.sin(sceneTime*2);
        sub.pos.z = 0;
        at = vec3(sub.pos.x+1, sub.pos.y, sub.pos.z);
        eye = vec3(sub.pos.x+1, sub.pos.y+3, sub.pos.z+8);

        meg.pos.x = sub.pos.x + 500;
        meg.pos.y = sub.pos.y;
        meg.pos.z = 0;
    }
    else if (sceneTime <= 9){ //Camera 360 with meg in background
        sub.pos.x = 25 - 12.25 - (3*sceneTime - 0.5*0.5*sceneTime*sceneTime); //Position in time t: x(t) = x(t0) + v(t0)*t+0.5 a*t^2
        sub.pos.y = 300 - 36.75 + Math.sin(sceneTime*2);
        sub.pos.z = 0;
        at = vec3(sub.pos.x+1, sub.pos.y, sub.pos.z);
        eye = vec3(sub.pos.x + 3   + 6 * Math.cos(sceneTime), eye[1], sub.pos.z + 6 * Math.sin(sceneTime));

        meg.pos.x = sub.pos.x + 400;
        meg.pos.y = sub.pos.y;
        meg.pos.z = 5*Math.sin(TIME*10);
    }
        

    
     sub.renderSub(); 
     meg.renderMeg();
 }

 function scene3(sceneTime){// meg chasing
    meg.pos.x = sub.pos.x + 700 -200*sceneTime - 0.5*5*sceneTime*sceneTime ;
    meg.pos.y = sub.pos.y;
    meg.pos.z = 5*Math.sin(TIME*10);
    at = vec3(meg.pos.x+6, meg.pos.y, 0);
    eye = vec3(meg.pos.x-20+ 50 * Math.cos(sceneTime), meg.pos.y+10, 50);

    meg.renderMeg();
 }

 function scene4(sceneTime){// meg chasing closer and closer
    sub.pos.x = 25 + 700 -75*sceneTime - 0.5*1*sceneTime*sceneTime; //Position in time t: x(t) = x(t0) + v(t0)*t+0.5 a*t^2
    sub.pos.y = 300 - 36.75;
    sub.pos.z = 0;

    meg.pos.x = sub.pos.x + 360 -35*sceneTime - 0.5*1*sceneTime*sceneTime ;
    meg.pos.y = sub.pos.y;
    meg.pos.z = 5*Math.sin(TIME*5);

    at = vec3(sub.pos.x, sub.pos.y, sub.pos.z);
    eye = vec3(sub.pos.x-10, sub.pos.y+3,  sub.pos.z+5);
    sub.renderSub();
    meg.renderMeg();
 }

 function scene5(sceneTime){ // meg very close to sub
    sub.pos.x = -1750 + 700 -75*sceneTime - 0.5*1*sceneTime*sceneTime; //Position in time t: x(t) = x(t0) + v(t0)*t+0.5 a*t^2
    sub.pos.y = 300 - 36.75;
    sub.pos.z = 0;

    meg.pos.x = sub.pos.x +30 ;
    meg.pos.y = sub.pos.y;
    meg.pos.z = 5*Math.sin(TIME*3);
    at = vec3(sub.pos.x+6, sub.pos.y, sub.pos.z);
    eye = vec3(sub.pos.x+15, sub.pos.y+15,  sub.pos.z+20);
    sub.renderSub();
    meg.renderMeg();

 }

 function scene6(sceneTime){ //sub makes it throughc crack
    if (sceneTime == 0){
    sub.pos.x = -1975 + 700 -75*sceneTime - 0.5*1*sceneTime*sceneTime; //Position in time t: x(t) = x(t0) + v(t0)*t+0.5 a*t^2
    sub.pos.y = 300 - 36.75;
    sub.pos.z = 0;
    meg.pos.x = sub.pos.x +30 ;
    meg.pos.y = sub.pos.y;
    meg.pos.z = 5*Math.sin(TIME);
    

    at = vec3(sub.pos.x+6, sub.pos.y, sub.pos.z);
    eye = vec3(sub.pos.x+15, sub.pos.y+15,  sub.pos.z+20);
 }
    else if(sceneTime <=5.5){
        sub.pos.x = -2000 + 700 -75*sceneTime - 0.5*1*sceneTime*sceneTime; //Position in time t: x(t) = x(t0) + v(t0)*t+0.5 a*t^2
        sub.pos.y = 300 - 36.75;
        sub.pos.z = 0;
        meg.pos.x = sub.pos.x +30 ;
        meg.pos.y = sub.pos.y;
        meg.pos.z = 5*Math.sin(TIME);
        at = vec3(sub.pos.x+6, sub.pos.y, sub.pos.z);
        eye = vec3(-1500, sub.pos.y+15,  sub.pos.z+20);
    }
    sub.renderSub();
    meg.renderMeg();
 }

 function scene7(sceneTime){ // Sub exits while shark still stuck
    sub.pos.x = -1727.625-15*sceneTime;
    sub.pos.y = 300 - 36.75;
    sub.pos.z = 0;
    meg.pos.x = -1690.625;
    meg.pos.y = sub.pos.y;
    meg.pos.z = Math.sin(TIME*5)/2;
    at = vec3(-1727.625, sub.pos.y, sub.pos.z);
    eye = vec3(sub.pos.x-11, sub.pos.y+3,  sub.pos.z+5);

    sub.renderSub();
    meg.renderMeg();
 }



 function renderBackground(){ // All the background objects that are always rendered from begining
  
    gPush();{ // water
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
        gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);
        gTranslate(0, 2000, 0);
        gScale(100, 0.5, 100);
        drawCube();
    }
    gPop();

  
    gPush();{ // sea floor
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, textureArray[2].textureWebGL);
          gl.uniform1i(gl.getUniformLocation(program, "texture2"), 1);
        gTranslate(0, -100, 0);
        gScale(2000, 0.5, 1000);
        drawCube();

    }
    gPop();

    toggleTextures();
    var j;
    for (j = 0; j < 10; j++) {
    gPush() ;
    {   // seaweed1 base
        gTranslate(1000-40-j*300,-100,-50+Math.sin(j)*600) ;
        setColor(vec4(0.0,0.6,0.0,1)) ;
        gScale(5, 500, 5);
        
        drawSphere() ;
        

    }
    gPop() ;
}

    gPush();{ // trench left
        setColor(vec4(0.5, 0.5, 0.5, 1));
        gTranslate(-2000,-100, 105);
        gScale(300, 1000, 100);
        drawCube();
    }
    gPop();

    gPush();{ // trench right
        setColor(vec4(0.5, 0.5, 0.5, 1));
        gTranslate(-2000,-100, -405);
        gScale(300, 1000, 400);
        drawCube();
    }
    gPop();

    toggleTextures();
    
}

    


// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.
function CameraController(element) {
    var controller = this;
    this.onchange = null;
    this.xRot = 0;
    this.yRot = 0;
    this.scaleFactor = 3.0;
    this.dragging = false;
    this.curX = 0;
    this.curY = 0;
    
    // Assign a mouse down handler to the HTML element.
    element.onmousedown = function(ev) {
        controller.dragging = true;
        controller.curX = ev.clientX;
        controller.curY = ev.clientY;
    };
    
    // Assign a mouse up handler to the HTML element.
    element.onmouseup = function(ev) {
        controller.dragging = false;
    };
    
    // Assign a mouse move handler to the HTML element.
    element.onmousemove = function(ev) {
        if (controller.dragging) {
            // Determine how far we have moved since the last mouse move
            // event.
            var curX = ev.clientX;
            var curY = ev.clientY;
            var deltaX = (controller.curX - curX) / controller.scaleFactor;
            var deltaY = (controller.curY - curY) / controller.scaleFactor;
            controller.curX = curX;
            controller.curY = curY;
            // Update the X and Y rotation angles based on the mouse motion.
            controller.yRot = (controller.yRot + deltaX) % 360;
            controller.xRot = (controller.xRot + deltaY);
            // Clamp the X rotation to prevent the camera from going upside
            // down.
            if (controller.xRot < -90) {
                controller.xRot = -90;
            } else if (controller.xRot > 90) {
                controller.xRot = 90;
            }
            // Send the onchange event to any listener.
            if (controller.onchange != null) {
                controller.onchange(controller.xRot, controller.yRot);
            }
        }
    };
}
