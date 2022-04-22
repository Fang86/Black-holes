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
    },
    /*plugins: {
        global: [{
            key: 'rexSlider',
            plugin: SliderPlugin,
            start: true
        },
        ]
    }*/
};

var game = new Phaser.Game(config);
var planet_a;
var planet_b;
var dbtext, dbtext2, dbtext3;
var gConst = 1;
var debug = false;
var cursorKeys;
var play = true;
var r1;
var initSep = 140;
var momentum;
var solar_mass = 1;
var solar_radius = 1;
var density_limit = .001;
var gasses = [];
var mass_rate = .1;
var grow_rate = .05;
var scn;

function preload ()
{
    this.load.setBaseURL('http://labs.phaser.io');

    this.load.image('planet', 'assets/sprites/mushroom2.png');
    this.load.image('bg', 'assets/skies/background1.png');
    this.load.image('red', 'assets/sprites/red_ball.png');
    //this.load.image('blue', '../img/blue.png');
    this.load.scenePlugin('rexuiplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js', 'rexUI', 'rexUI');
    this.load.plugin('rexsliderplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexsliderplugin.min.js', true);

}

function create ()
{
    scn = this
    this.physics.world.setBounds(0, 0, 2000, 2000);
    this.add.image(400, 300, 'bg');
    planet_a = this.add.sprite(400, 300, 'red');
    planet_b = this.add.sprite(400, planet_a.y - initSep, 'red');
    dbtext = this.add.text(0, 0, '');
    dbtext2 = this.add.text(0, 25, '');
    dbtext3 = this.add.text(0, 50, '');

    initPhys(planet_a, 0, 0, 5, 5);
    initPhys(planet_b, 1.34, 0, 50, 65);

    // Accretion disk
    ad_outer = this.add.circle(planet_a.x, planet_a.y, 30, 0xff8800, 1);
    ad_mid = this.add.circle(planet_a.x, planet_a.y, 18, 0xffbb00, 1);
    ad_inner = this.add.circle(planet_a.x, planet_a.y, 10, 0xffffff, 1); // xray

    // Planet and roche lobe circles
    pl_a = this.add.circle(planet_a.x, planet_a.y, planet_a.radius, 0x000000);
    pl_b = this.add.circle(planet_b.x, planet_b.y, planet_b.radius, 0xff2222);
    rl_b = this.add.circle(planet_b.x, planet_b.y, 25, 0x000000, .4);

    test = this.add.circle(planet_b.x, planet_b.y, 5, 0x000000, .4);

    cursorKeys = this.input.keyboard.createCursorKeys();
    cursorKeys.space.isOn = false;
    cursorKeys.shift.isOn = false;

    //var slider = this.plugins.get('rexsliderplugin').add(gameObject, config);
    /*var slider = scene.plugins.get('rexSlider').add(gameObject, {
         endPoints: [
             {x:0, y:0},
             {x:200, y:100}
         ],
         value: 0,
         enable: true,
    
        // valuechangeCallback: null,
        // valuechangeCallbackScope: null
    });*/
}

function update ()
{
    //orbit(planet_a, planet_b);
    
    if (play)
    {
        orbit(planet_b, planet_a);
        //orbit(planet_a, planet_b);
        motion(planet_b);
        //motion(planet_a);

        dbtext.setText("Radius (actual, calculated): " + planet_b.radius + ", " + circle_radius(planet_b.mass/planet_b.density))
        dbtext2.setText(planet_b.mass + ", " + planet_b.density)
        //dbtext.setText("Masses (density): " + planet_b.mass + " (" + planet_b.density + "), " + planet_a.mass)
        rl_b.radius = roche_radius(planet_b, planet_a);
        //rl_a.radius = roche_radius(planet_a, planet_b);
        pl_b.radius = planet_b.radius

        if (planet_b.mass > 3) {
            overflow(planet_b, planet_a);
        }
        if (planet_b.density > density_limit) {
            age(planet_b);
        }

        //accrete(planet_a);
        gasses.forEach(gas => {
            orbit(gas, planet_a);
            motion(gas);
            gas.xVel *= .9999;
            gas.yVel *= .9999;
            // Friction
        });

        let xDiff = planet_b.x - planet_a.x; // delta x
        let yDiff = planet_b.y - planet_a.y; // delta y
        let subAngle = -Math.atan(yDiff / xDiff) * 180/(Math.PI);
        let angle = getAngle(xDiff, yDiff, subAngle) * Math.PI/180;
        test.x = planet_b.x - planet_b.radius * Math.cos(angle)
        test.y = planet_b.y + planet_b.radius * Math.sin(angle)
    }

    inputManager(this);
    
}

function initPhys(bd, xv, yv, m, r) // body, init x-vel, init y-vel, solar masses, solar radii
{
    bd.acc = 0; // Acceleration scalar
    bd.xAcc = 0; // Acceleration direction * scalar
    bd.yAcc = 0;
    bd.xVel = xv; // Velocity
    bd.yVel = yv;
    bd.mass = m * solar_mass; // Mass of body
    bd.radius = r * solar_radius; // Radius of body
    bd.density = bd.mass / (Math.PI * Math.pow(bd.radius, 2))
    bd.initmass = m
}

function orbit(bd, parent) // Gravity on bd by parent (acceleration)
{
    var xDiff = bd.x - parent.x; // delta x
    var yDiff = bd.y - parent.y; // delta y
    var subAngle = -90;
    if (xDiff != 0) 
        subAngle = -Math.atan(yDiff / xDiff) * 180/(Math.PI);
    var angle = getAngle(xDiff, yDiff, subAngle);
    var disp = Math.pow(xDiff, 2) + Math.pow(yDiff, 2); // r^2
    
    bd.acc = (gConst * parent.mass * 50) / (disp);
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
        mass_rate += .1
        //scn.cameras.main.y += 4;
    }
    else if (cursorKeys.down.isDown)
    {
        mass_rate -= .1
        //scn.cameras.main.y -= 4;
    }
    if (cursorKeys.left.isDown)
    {
        grow_rate += .01
        //scn.cameras.main.x += 4;
    }
    else if (cursorKeys.right.isDown)
    {
        grow_rate -= .01
        //scn.cameras.main.x -= 4;
    }
}

function overflow(donor, rec) 
{ // Simulates roche lobe overflow with donor star and recipient star
    var mtr = mass_rate
    if (donor.radius > rl_b.radius) {
        var d_area = Math.PI * Math.pow(donor.radius, 2); // Donor area
        var r_area = Math.PI * Math.pow(rl_b.radius, 2); // Roche lobe area
        var of_area = d_area - r_area; // Overflow area
        var of_loss = of_area * donor.density; // Overflow mass loss
        if (donor.mass > mtr * of_loss) {
            donor.mass -= mtr * of_loss;
            rec.mass += mtr * of_loss;
            donor.radius = circle_radius(donor.mass/donor.density) //Math.pow(r_area / Math.PI, 1/2);
            createGas(donor, of_area, of_loss)
        }

        //console.log("dens, actual: " + donor.density + ", " + donor.mass / (Math.PI * Math.pow(donor.radius, 2)))
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
    var init_rad = bd.radius
    var growth_const = grow_rate;
    bd.radius += growth_const;
    var init_area = Math.PI * Math.pow(init_rad, 2)
    var fin_area = Math.PI * Math.pow(bd.radius, 2)
    var d_area = fin_area - init_area;
    //dbtext3.setText(bd.mass / fin_area + " - " + bd.mass / init_area + " = " + ((bd.mass / fin_area) - (bd.mass / init_area)))
    //bd.density -= bd.mass / (Math.PI * Math.pow(d_area, 2))
    //bd.density = bd.mass / fin_area
}

function createGas(bd, area, mass) {
    var mass_per = .5
    var count = 3 * Math.floor(mass / mass_per);
    var rem = mass % mass_per;
    //console.log("mass: " + mass + ", " + bd.mass)
    //console.log ("count, rem: " + count + ", " + rem)

    let xDiff = planet_b.x - planet_a.x; // delta x
    let yDiff = planet_b.y - planet_a.y; // delta y
    let subAngle = -Math.atan(yDiff / xDiff) * 180/(Math.PI);
    let center = getAngle(xDiff, yDiff, subAngle) * Math.PI/180;
    var angle;

    for (let i = 0; i < count + 1; i++) {
        angle = center + center * .01 * (i - (count / 2))
        gasses.push(scn.add.circle(planet_b.x - planet_b.radius * Math.cos(angle), planet_b.y + planet_b.radius * Math.sin(angle), 2, 0xff0000))
        if (i==0) {
            initPhys(gasses[gasses.length - 1], planet_b.xVel, planet_b.yVel, 100, 1.5 + rem * 3);
        } else {
            initPhys(gasses[gasses.length - 1], planet_b.xVel, planet_b.yVel, 100, 1.5 + mass_per * 3);
        }
    }
}

function circle_area(r) {
    return Math.PI * Math.pow(r, 2);
}

function circle_radius(area) {
    return Math.pow(area / Math.PI, 1/2);
}

function accrete(bd) {
    return 1;
}