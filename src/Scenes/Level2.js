class Level2 extends Phaser.Scene {
    constructor() {
        super("level2Scene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 300;
        this.DRAG = 600;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 2000;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
    }

    create() {
        // background
        this.cameras.main.setBackgroundColor('#5f7073');

        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("game3bmap1");

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.industrial = this.map.addTilesetImage("industrial_tiles", "industrial_tiles");
        this.base = this.map.addTilesetImage("base_tiles", "base_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("ground", [this.industrial, this.base], 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        this.groundLayer.setCollision(44, true);

        // Platform Collision
        this.groundLayer.setCollisionByProperty({
            platform: true
        });
        
        this.groundLayer.forEachTile(tile => {
            if (tile.properties.platform) {
                tile.collideUp = true;
                tile.collideDown = false;
                tile.collideLeft = false;
                tile.collideRight = false;
            }
        });


        // Find coins in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "coin"
        // Assign the coin texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects

        this.coins = this.map.createFromObjects("collectables", {
            name: "coin",
            key: "base_sheet",
            frame: 151
        });
        
        this.crates = this.map.createFromObjects("crates", {
            name: "crate",
            key: "base_sheet",
            frame: 26
        });
        

        this.coinCount = 0;
        this.doorOpen = false;

        // Key
        this.key = this.map.createFromObjects("collectables", {
            name: "key",
            key: "base_sheet",
            frame: 27
        });

        this.keyGroup = this.physics.add.staticGroup();

        this.key.forEach(keyBody => {
            keyBody.setVisible(false);
            this.physics.world.enable(keyBody, Phaser.Physics.Arcade.STATIC_BODY);
            keyBody.body.enable = false;
            this.keyGroup.add(keyBody);
        });

        



        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);

        

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(64, 320, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Crates
        this.physics.world.enable(this.crates, Phaser.Physics.Arcade.DYNAMIC_BODY);

        this.crateGroup = this.physics.add.group();

        this.crates.forEach(crate => {
            crate.body.setCollideWorldBounds(true);
            crate.body.setBounce(0);
            crate.body.setDrag(1000, 0);
            crate.body.setImmovable(false);
            crate.pushed = false;
            this.crateGroup.add(crate);
        });

        this.physics.add.collider(this.crateGroup, this.groundLayer);
        this.physics.add.collider(this.crateGroup, this.crateGroup);
        this.physics.add.collider(my.sprite.player, this.crateGroup, (player, crate) => {
            crate.pushed = true;
        }); 

        
        this.switchOn = false;

        // Death Poison and Level Clear
        this.physics.add.overlap(my.sprite.player, this.groundLayer, (player, tile) => {
            if (tile.properties.death) {
                this.sound.play('dies');
                this.scene.restart();
            }
            else if (tile.properties.door && (this.doorOpen == true)) {
                this.sound.play('door');
                this.scene.start("endScene");
            } else if (tile.properties.jumper) {
                player.setVelocityY(this.JUMP_VELOCITY * 1.25);
            } else if (tile.properties.switch){
                if (tile.index === 177 && Phaser.Input.Keyboard.JustDown(cursors.right)){
                    tile.index = 179;
                    this.switchOn = true;
                } else if (tile.index === 179  && Phaser.Input.Keyboard.JustDown(cursors.left)){
                    tile.index = 177;
                    this.switchOn = false;
                }
            }
        });

        this.tileFrames = [
            { frames: [14, 30], index: 0 },
            { frames: [79, 80], index: 0 },
            { frames: [95, 96], index: 0 }
        ];

        this.time.addEvent({
            delay: 800,
            loop: true,
            callback: () => {
                this.tileFrames.forEach(anim => {
                    anim.index = (anim.index + 1) % anim.frames.length;
                    this.groundLayer.forEachTile(tile => {
                        if (anim.frames.includes(tile.index)) {
                            tile.index = anim.frames[anim.index];
                        }
                    });
                    this.groundLayer.forEachTile(tile => {
                        if (anim.frames.includes(tile.index)) {
                            tile.index = anim.frames[anim.index];
                        }
                    });
                });
            }
        });

        this.coins.forEach(coin => {
            coin.play('coin');
        });

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            this.coinCount += 1;
            this.sound.play('ding');
            obj2.destroy(); // remove coin on overlap
        });
        
        this.physics.add.overlap(my.sprite.player, this.keyGroup, (obj1, obj2) => {
            if(obj2.body && obj2.body.enable){
                this.groundLayer.forEachTile(tile => {
                    if (tile.index === 29) {
                        tile.index = 45;
                    }
                });
                this.sound.play('key');
                obj2.destroy(); // remove key
                this.doorOpen = true;
            }
        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // Get coins
        this.cKey = this.input.keyboard.addKey('C');

        // Ending
        this.tKey = this.input.keyboard.addKey('T');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // movement vfx

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_04.png', 'smoke_06.png'],
            addRandom: true,
            scale: {start: 0.03, end: 0.1},
            maxAliveParticles: 5,
            lifespan: 400,
            gravityY: -500,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();
        

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
        
        this.stepCount = 200;
    }

    update(time, delta) {

        this.crateGroup.children.iterate(crate => {
            if (!crate.pushed) {
            crate.body.setVelocityX(0);
            }
            crate.pushed = false;
        });

        this.gateToggle = false;

let pressedButtons = 0;

this.crateGroup.getChildren().forEach(crate => {
    const tile = this.groundLayer.getTileAtWorldXY(crate.x, crate.y);

    if (tile && tile.properties.button) {
        pressedButtons++;
    }
});

// RULE 1: switch overrides everything
if (this.switchOn) {
    this.gateToggle = false; // gate open
}
// RULE 2: crates on buttons close gate
else if (pressedButtons > 0) {
    this.gateToggle = true; // gate closed
}
// RULE 3: default state
else {
    this.gateToggle = false; // or whatever default you want
}

        this.groundLayer.forEachTile(tile => {
            if (this.gateToggle) {
                if (tile.properties.openGate) {
                    tile.index = 44;
                    tile.setCollision(true);
                }
                else if (tile.properties.closedGate) {
                    tile.index = 28;
                    tile.setCollision(false);
                }
            } else {
                if (tile.properties.closedGate) {
                    tile.index = 44;
                    tile.setCollision(true);
                }
                else if (tile.properties.openGate) {
                    tile.index = 28;
                    tile.setCollision(false);
                }
            }
        });


        if(my.sprite.player.body.velocity.x != 0){
            this.stepCount -= delta;
            if(this.stepCount<=0 && (cursors.left.isDown || cursors.right.isDown) && my.sprite.player.body.blocked.down){
                this.sound.play('walking');
                this.stepCount = 200;
            }else{
                this.stepCool = 0;
            }
        }

        if (this.coinCount === this.coins.length) {
            this.sound.play('switch');
            this.groundLayer.forEachTile(tile => {
                if (tile.index === 10) {
                    tile.index = 11;
                }
            });
            this.keyGroup.children.iterate(keyBody => {
                keyBody.setVisible(true);
                keyBody.body.enable = true;
            });
            this.coinCount++;
        }

        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            my.vfx.walking.start();


        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            my.vfx.walking.start();

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            my.vfx.walking.start();
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.sound.play('jumping');
        }

        if(my.sprite.player.body.blocked.down && (this.airborne == true)) {
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            my.vfx.walking.start();
            this.sound.play('walking');
        }

        this.airborne = !my.sprite.player.body.blocked.down;


        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }

        if(Phaser.Input.Keyboard.JustDown(this.tKey)) {
            this.scene.start("endScene");
        }

        if(Phaser.Input.Keyboard.JustDown(this.cKey)) {
            this.coinCount = this.coins.length;
        }

    }
}