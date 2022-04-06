//import Phaser from 'phaser'

var config = {
    parent: 'gameDiv',
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade'
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);
var planet_a;
var planet_b;
var dbtext, dbtext2, dbtext3;
var gConst;
var debug = false;
var cursorKeys;
var play = true;

function preload ()
{
    this.load.setBaseURL('http://labs.phaser.io');

    this.load.image('planet', 'assets/sprites/mushroom2.png');
    this.load.image('bg', 'assets/skies/background1.png');
    this.load.image('red',);
    this.load.image('blue', '../img/blue.png');
    this.load.scenePlugin('rexuiplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js', 'rexUI', 'rexUI');

}

function create ()
{
    this.physics.world.setBounds(0, 0, 2000, 2000);
    this.add.image(400, 300, 'bg');
    planet_a = this.add.sprite(400, 300, 'planet');
    planet_b = this.add.sprite(400, 100, 'planet');
    dbtext = this.add.text(0, 0, '');
    dbtext2 = this.add.text(0, 25, '');
    dbtext3 = this.add.text(0, 50, '');
    gConst = 1;

    //planet_b.xAcc = 0;
    initPhys(planet_a, 0, 0, 400, 50);
    initPhys(planet_b, 1, 1, .5, 10);

    cursorKeys = this.input.keyboard.createCursorKeys();
}

function update ()
{
    //orbit(planet_a, planet_b);
    if (cursorKeys.space.isDown)
    {
        if (play)
            play = false;
        else
            play = true;
    }
    if (play)
    {
        orbit(planet_b, planet_a);
        motion(planet_b);
    }
        

    //dbtext.setText('rad: ' + planet_a.radius);



    if (cursorKeys.up.isDown)
    {
        this.cameras.main.y += 4;
    }
    else if (cursorKeys.down.isDown)
    {
        this.cameras.main.y -= 4;
    }
    if (cursorKeys.left.isDown)
    {
        this.cameras.main.x += 4;
    }
    else if (cursorKeys.right.isDown)
    {
        this.cameras.main.x -= 4;
    }
    
}

function initPhys(bd, xv, yv, m, r) // body, init x-vel, init y-vel, mass, radius
{
    bd.acc = 0; // Acceleration scalar
    bd.xAcc = 0; // Acceleration direction * scalar
    bd.yAcc = 0;
    bd.xVel = xv; // Velocity
    bd.yVel = yv;
    bd.mass = m; // Mass of body
    bd.radius = r; // Radius of body
}

function orbit(bd, parent) // Gravity on bd by parent (acceleration)
{
    var xDiff = bd.x - parent.x; // delta x
    var yDiff = bd.y - parent.y; // delta y
    var disp = Math.pow(xDiff, 2) + Math.pow(yDiff, 2); // r^2
    var subAngle = -90;

    if (xDiff != 0) 
        subAngle = -Math.atan(yDiff / xDiff) * 180/(Math.PI);

    var angle = getAngle(xDiff, yDiff, subAngle);
    
    bd.acc = (gConst * parent.mass) / (disp * bd.mass);
    bd.xAcc = bd.acc * Math.cos(angle * Math.PI/180);
    bd.yAcc = -bd.acc * Math.sin(angle * Math.PI/180);    
    
    
    if (debug) {
        /* dbtext.setText('Position: ' + bd.x + ', ' + bd.y + ', ' + subAngle + ', ' + angle);
        dbtext2.setText('Velocity: ' + xDiff + ', ' + yDiff);
        dbtext3.setText('Acceleration: ' + bd.xAcc + ', ' + bd.yAcc); */

        if (Math.abs(xDiff) < parent.radius && Math.abs(yDiff) < parent.radius)
            dbtext.setText('HIT');
        else
            dbtext.setText('');
        dbtext2.setText('dx, dy: ' + xDiff + ', ' + yDiff);
        dbtext3.setText('rad: ' + parent.radius);
    }

    
    
}

function motion(bd) // Change velocity and position of body from acceleration
{
    bd.xVel = bd.xVel - bd.xAcc;
    bd.yVel = bd.yVel - bd.yAcc;
    bd.setX(bd.x + bd.xVel);
    bd.setY(bd.y + bd.yVel);
}

function getAngle(dx, dy, sub)
{
    if (dx > 0 && dy < 0) { // top right
        return sub;
    } else if (dx <= 0 && dy < 0) { // top left
        return sub + 180;
    } else if (dx < 0 && dy > 0) { // bottom left
        return sub + 180;
    } else if (dx >= 0 && dy > 0) { // bottom right
        return sub + 360;
    }
}

function collide(bd, parent) // Absorb matter into collided body
{
    
    parent.mass += bd.mass
    // Remove bd
}