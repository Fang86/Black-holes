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
var gConst = 1;
var debug = true;
var cursorKeys;
var play = true;
var r1;
var initSep = 140;
var momentum;

function preload ()
{
    this.load.setBaseURL('http://labs.phaser.io');

    this.load.image('planet', 'assets/sprites/mushroom2.png');
    this.load.image('bg', 'assets/skies/background1.png');
    this.load.image('red', 'assets/sprites/red_ball.png');
    //this.load.image('blue', '../img/blue.png');
    this.load.scenePlugin('rexuiplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js', 'rexUI', 'rexUI');

}

function create ()
{
    this.physics.world.setBounds(0, 0, 2000, 2000);
    this.add.image(400, 300, 'bg');
    planet_a = this.add.sprite(400, 300, 'red');
    planet_b = this.add.sprite(400, planet_a.y - initSep, 'red');
    dbtext = this.add.text(0, 0, '');
    dbtext2 = this.add.text(0, 25, '');
    dbtext3 = this.add.text(0, 50, '');

    initPhys(planet_a, 0, 0, 5, 10);
    initPhys(planet_b, 0, 0, 50, 75);
    planet_b.xVel = vc(planet_b, planet_a);
    planet_a.xVel = -vc(planet_b, planet_a);

    //r1 = this.add.circle(200, 200, 25, 0xff2222);
    pl_a = this.add.circle(planet_a.x, planet_a.y, planet_a.radius, 0x0000ff);
    rl_a = this.add.circle(planet_a.x, planet_a.y, 25, 0xffffff, .2);
    pl_b = this.add.circle(planet_b.x, planet_b.y, planet_b.radius, 0xff2222);
    rl_b = this.add.circle(planet_b.x, planet_b.y, 25, 0x000000, .4);

    //planet_b.xAcc = 0;
   

    cursorKeys = this.input.keyboard.createCursorKeys();
    cursorKeys.space.isOn = false;
    cursorKeys.shift.isOn = false;
}

function update ()
{
    //orbit(planet_a, planet_b);
    
    if (play)
    {
        orbit(planet_b, planet_a);
        orbit(planet_a, planet_b);
        motion(planet_b);
        motion(planet_a);

    inputManager(this);
    //r1.Transform.x += 1;
    //dbtext.setText(this.scene.system.displayList.getChildren());
    //r1.x += 1;
    dbtext.setText(planet_b.mass + "TEST")
    rl_b.radius = roche_radius(planet_b, planet_a);
    rl_a.radius = roche_radius(planet_a, planet_b);
    pl_b.radius = planet_b.radius

    //overflow(planet_b, planet_a);
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
    
    bd.acc = (gConst * parent.mass * bd.mass) / (disp);
    bd.xAcc = bd.acc * Math.cos(angle * Math.PI/180);
    bd.yAcc = -bd.acc * Math.sin(angle * Math.PI/180);    
    
    
    if (debug) {
        /* dbtext.setText('Position: ' + bd.x + ', ' + bd.y + ', ' + subAngle + ', ' + angle);
        dbtext2.setText('Velocity: ' + xDiff + ', ' + yDiff);
        dbtext3.setText('Acceleration: ' + bd.xAcc + ', ' + bd.yAcc); */

        if (Math.abs(xDiff) < parent.radius && Math.abs(yDiff) < parent.radius)
        {
            dbtext.setText('HIT');
            collide(bd, parent);
        }
        else
            dbtext.setText('');
        dbtext2.setText('dx, dy, sep: ' + xDiff + ', ' + yDiff + ', ' + distance(bd, parent));
        dbtext3.setText('rad: ' + parent.radius);
    }

    
    
}

function motion(bd) // Change velocity and position of body from acceleration
{
    bd.xVel = bd.xVel - bd.xAcc;
    bd.yVel = bd.yVel - bd.yAcc;
    bd.setX(bd.x + bd.xVel);
    bd.setY(bd.y + bd.yVel);
    if (bd == planet_b) {
        rl_b.x = bd.x;
        rl_b.y = bd.y;
        pl_b.x = bd.x;
        pl_b.y = bd.y;
    } else if (bd == planet_a) {
        rl_a.x = bd.x;
        rl_a.y = bd.y;
        pl_a.x = bd.x;
        pl_a.y = bd.y;
    }
    
}

function getAngle(dx, dy, sub) // Get angle based on delta x, delta y, and subangle
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
    //parent.mass += bd.mass;
    //planet_b.destroy();

    
}

function keyPressed(key) // Activates only once when key is pressed
{
    if (key.isDown)
    {
        if (!key.isOn)
        {
            key.isOn = true;
            return true
        }
    } else if (key.isUp && key.isOn)
    {
        key.isOn = false;
    }

    return false
}

function inputManager(scn) // Handles inputs
{
    // Play/Pause
    if (keyPressed(cursorKeys.space))
    {
        //dbtext.setText(planet_b.mass)
        
        if (play)
            play = false;
        else
            play = true;
    }
    if (keyPressed(cursorKeys.shift))
    {
        //r1.radius = 100;
        planet_b.destroy();
    }

    // Camera Movement
    if (cursorKeys.up.isDown)
    {
        scn.cameras.main.y += 4;
    }
    else if (cursorKeys.down.isDown)
    {
        scn.cameras.main.y -= 4;
    }
    if (cursorKeys.left.isDown)
    {
        scn.cameras.main.x += 4;
    }
    else if (cursorKeys.right.isDown)
    {
        scn.cameras.main.x -= 4;
    }
}

function overflow(donor, rec) 
{ // Simulates roche lobe overflow with donor star and recipient star
    var mtr = .1
    if (donor.radius > rl_b.radius) {
        var d_area = Math.PI * Math.pow(donor.radius, 2); // Donor area
        var r_area = Math.PI * Math.pow(rl_b.radius, 2); // Roche lobe area
        var d_dens = donor.mass / d_area; // Donor density
        var of_area = d_area - r_area; // Overflow area
        var of_loss = of_area * d_dens; // Overflow loss
        //donor.mass -= .1 * of_loss;
        //d_area = donor.mass / d_dens
        //donor.radius -= Math.pow(d_area / Math.PI, 1/2);
        //rec.mass += mtr * of_loss;
    }
    
}

function roche_radius(donor, rec)
{
    var roche_scalar = .866;
    var q = donor.mass / rec.mass;
    var d = distance(donor, rec);
    return roche_scalar * d * (0.49 * Math.pow(q, 2/3)) / (0.6 * Math.pow(q, 2/3) + Math.log(1 + Math.pow(q, 1/3)));
}

function distance(a, b)
{
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.pow(Math.pow(dx, 2) + Math.pow(dy, 2), 1/2)
}

function vc(child, parent) // Velocity for circular orbit
{
    var scalar = 2; 
    var m = parent.mass + child.mass;
    return Math.pow((scalar * gConst * m) / distance(child, parent), 1/2)
}

function age(bd) {
    var growth_const = 1;
    bd.radius += growth_const;
}