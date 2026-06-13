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
        this.enemies = this.map.addTilesetImage("characters", "characters");


        // Create a layer
        this.groundLayer = this.map.createLayer("ground", [this.industrial, this.base], 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // Collision for closed gate
        this.groundLayer.setCollision(44, true);

        // Platform Collision
        this.groundLayer.setCollisionByProperty({
            platform: true
        });

        // Jumper Collision
        this.groundLayer.setCollisionByProperty({
            jumper: true
        });

        this.movingLeft = false;
        
        // Collision for top of clouds and jump pad
        this.groundLayer.forEachTile(tile => {
            if (tile.properties.platform) {
                tile.collideUp = true;
                tile.collideDown = false;
                tile.collideLeft = false;
                tile.collideRight = false;
            }
        });

        // Create coins
        this.coins = this.map.createFromObjects("collectables", {
            name: "coin",
            key: "base_sheet",
            frame: 151
        });
        
        // Create crates
        this.crates = this.map.createFromObjects("crates", {
            name: "crate",
            key: "base_sheet",
            frame: 26
        });
        
        // Create enemies
        this.movingEnemies = this.map.createFromObjects("enemies", {
            name: "mover",
            key: "character_sheet",
            frame: 15
        });

        this.moverGroup = this.physics.add.group();
        this.projectileGroup = this.physics.add.group();
        this.playerProjectileGroup = this.physics.add.group();

        this.movingEnemies.forEach(enemy => {
            this.physics.world.enable(enemy);
            enemy.body.setCollideWorldBounds(true);
            enemy.body.setImmovable(true);
            enemy.body.setAllowGravity(false);
            enemy.play('mover');
            enemy.moverTurn = false;
            enemy.moverVel = -12;
            enemy.body.setVelocityX(enemy.moverVel);
            this.moverGroup.add(enemy);
        });

        this.physics.add.collider(this.movingEnemies, this.groundLayer);

        
        this.shooterEnemies = this.map.createFromObjects("enemies", {
            name: "shooter",
            key: "character_sheet",
            frame: 21
        });

        this.shooterGroup = this.physics.add.group();

        this.shooterEnemies.forEach(enemy => {
            this.physics.world.enable(enemy);
            enemy.body.setCollideWorldBounds(true);
            enemy.body.setAllowGravity(false);
            enemy.shooterLeft = true;
            enemy.active = true;
            // set up projectiles
            let projectile = this.physics.add.sprite(enemy.x, enemy.y, "heartProjectile");
            projectile.body.setAllowGravity(false);
            projectile.body.setImmovable(true);
            projectile.angle = 180;
            projectile.firing = false;
            projectile.barrel = enemy.x;
            projectile.hover = enemy.y;
            projectile.shooter = enemy;
            this.projectileGroup.add(projectile);
            this.shooterGroup.add(enemy);
        });

        this.physics.add.collider(this.shooterEnemies, this.groundLayer);

        // Player coin count
        this.coinCount = 0;
        
        // If door to next level is open
        this.doorOpen = false;

        // If player has power-up
        this.jumpPowerUp = false;

        // Power Up
        this.jumpPower = this.map.createFromObjects("collectables", {
            name: "jumpPower",
            key: "base_sheet",
            frame: 67
        });

        this.powerGroup = this.physics.add.staticGroup();

        // Power Up interaction
        this.jumpPower.forEach(gemBody => {
            gemBody.setVisible(false);
            this.physics.world.enable(gemBody, Phaser.Physics.Arcade.STATIC_BODY);
            gemBody.body.enable = false;
            this.powerGroup.add(gemBody);
        });

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

        // Create interactable crates
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

        this.physics.add.collider(my.sprite.player, this.groundLayer, (player, tile) => {
            if (tile.properties.jumper) {
                player.setVelocityY(this.JUMP_VELOCITY * 1.25);
            }
        });

        // Determines whether the switch is triggered or not
        this.switchOn = false;

        // Death from Water, Level Clear, Jump Pad, and Switch Interactions
        this.physics.add.overlap(my.sprite.player, this.groundLayer, (player, tile) => {
            if (tile.properties.death) {
                this.sound.play('dies');
                this.scene.restart();
            }
            else if (tile.properties.door && (this.doorOpen == true)) {
                this.sound.play('door');
                this.scene.start("endScene");
            } else if (tile.properties.switch){
                if (tile.index === 177 && Phaser.Input.Keyboard.JustDown(cursors.down)){
                    tile.index = 179;
                    this.switchOn = true;
                } else if (tile.index === 179  && Phaser.Input.Keyboard.JustDown(cursors.down)){
                    tile.index = 177;
                    this.switchOn = false;
                }
            }
        });
        
        // Player touching enemies and projectiles
        this.physics.add.overlap(my.sprite.player, this.moverGroup, (player, enemy) => {
            this.sound.play('dies');
            this.scene.restart();
        });  
        this.physics.add.overlap(my.sprite.player, this.projectileGroup, (player, enemy) => {
            this.sound.play('dies');
            this.scene.restart();
        });

        // Animation frames
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

        // Enemy movement
        this.moverGroup.getChildren().forEach(enemy => {
            enemy.body.setVelocityY(0);
            const tile = this.groundLayer.getTileAtWorldXY(enemy.x, enemy.y);
            if (!tile) {
                enemy.body.setVelocityX(0);
            } else if (tile.properties.trackEnd && enemy.moverTurn == false) {
                enemy.moverTurn = true;
                enemy.moverVel = -enemy.moverVel;
                enemy.body.setVelocityX(enemy.moverVel);
            } else if (tile.properties.track) {
                enemy.moverTurn = false;
                enemy.body.setVelocityX(enemy.moverVel);
            }
            if (enemy.moverVel < 0){
                    enemy.setFlip(false, false);
            } else if (enemy.moverVel > 0){
                    enemy.setFlip(true, false)
            }
        });

        // Shooter movement
        this.shooterGroup.getChildren().forEach(enemy => {
            if(my.sprite.player.x < enemy.x){
                enemy.setFlip(false,false);
            } else if(my.sprite.player.x > enemy.x){
                enemy.setFlip(true,false);
            }
        });

        // Enemy shoot
        this.projectileGroup.getChildren().forEach(shot => {
            if(shot.shooter.active == false){
                shot.destroy();
            } else {
                shot.body.setVelocityY(-34);
                if(shot.firing == false && (my.sprite.player.x < shot.barrel)){
                    shot.body.setVelocityX(-72);
                    shot.firing = true;
                } else if(shot.firing == false && (my.sprite.player.x > shot.barrel)){
                    shot.body.setVelocityX(72);
                    shot.firing = true;
                }
                if (!this.cameras.main.worldView.contains(shot.x, shot.y)) {
                    shot.x = shot.barrel;
                    shot.y = shot.hover;
                    shot.firing = false;
                }
            }
        });
        
        // Stops crates from moving without player interaction
        this.crateGroup.children.iterate(crate => {
            if (!crate.pushed) {
            crate.body.setVelocityX(0);
            }
            crate.pushed = false;
        });

        // Determines whether the gates are open/closed, similar to Super Mario's 
        // "Dotted-Line Block" which toggles collisions based on input
        this.gateToggle = false;

        // Counts how many buttons are being pressed
        let pressedButtons = 0;

        // Checks if crate is on button
        this.crateGroup.getChildren().forEach(crate => {
            const tile = this.groundLayer.getTileAtWorldXY(crate.x, crate.y);
            if (tile && tile.properties.button) {
                pressedButtons++;
            }
        });

        // If both buttons are pressed, reveal power-up
        if (pressedButtons === 2 && !this.switchSoundPlayed) {
            this.switchSoundPlayed = true;
            this.sound.play('switch');
            this.powerGroup.children.iterate(gemBody => {
                gemBody.setVisible(true);
                gemBody.body.enable = true;
            });
        }

        this.physics.add.overlap(my.sprite.player, this.powerGroup, (obj1, obj2) => {
            this.sound.play('ding');
            this.jumpPowerUp = true;
            obj2.destroy(); // remove coin on overlap
        });


        // I had trouble on the switch and button interactions and used Microsoft Co-Pilot 
        // for assistance to help clear up the toggles because I over complicated the system
        // in my head. I was using multiple "if-then" scenarios which was too convoluted.
        if (this.switchOn) {
            this.gateToggle = false;
        }
        else if (pressedButtons > 0) {
            this.gateToggle = true;
        }
        else {
            this.gateToggle = false;
        }

        // Switches closed gates to open gates and vice-versa
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

        //Walking animation
        if(my.sprite.player.body.velocity.x != 0){
            this.stepCount -= delta;
            if(this.stepCount<=0 && (cursors.left.isDown || cursors.right.isDown) && my.sprite.player.body.blocked.down){
                this.sound.play('walking');
                this.stepCount = 200;
            }else{
                this.stepCool = 0;
            }
        }

        // Checks if player has collected all coins
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

        //Player movement

        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            this.movingLeft = true;
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            my.vfx.walking.start();


        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            this.movingLeft = false;
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
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            my.vfx.walking.start();
            if (this.jumpPowerUp == true){
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY * 1.25);
            } else {my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);}
            this.sound.play('jumping');
        }

        // player shooting

        if(my.sprite.player.body.blocked.down && (this.airborne == true)) {
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            my.vfx.walking.start();
            this.sound.play('walking');
        }
        
        // Determines if player is airborne
        this.airborne = !my.sprite.player.body.blocked.down;

        // Restart Shortcut
        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }

        // Next level shortcut
        if(Phaser.Input.Keyboard.JustDown(this.tKey)) {
            this.scene.start("endScene");
        }

        // Collect coins shortcut
        if(Phaser.Input.Keyboard.JustDown(this.cKey)) {
            this.coinCount = this.coins.length;
        }

        // player shoot
        if(Phaser.Input.Keyboard.JustDown(cursors.down) && (this.jumpPowerUp == true)) {
            if(this.playerProjectileGroup.getChildren().length < 1){
                let projectile = this.physics.add.sprite(my.sprite.player.x, my.sprite.player.y, "heartProjectile");
                projectile.body.setAllowGravity(false);
                projectile.body.setImmovable(true);
                projectile.firing = false;
                this.playerProjectileGroup.add(projectile);
            }
        }

        this.playerProjectileGroup.getChildren().forEach(shot => {
            shot.body.setVelocityY(-34);
            if(shot.firing == false && (this.movingLeft == true)){
                shot.body.setVelocityX(-72);
                shot.firing = true;
                this.sound.play('shoot');
            } else if(shot.firing == false && (this.movingLeft == false)){
                shot.body.setVelocityX(72);
                shot.firing = true;
                this.sound.play('shoot');
            }
            if (!this.cameras.main.worldView.contains(shot.x, shot.y)) {
                shot.firing = false;
                shot.destroy();
            }
        });

        this.physics.add.overlap(this.playerProjectileGroup, this.moverGroup, (shot, enemy) => {
            enemy.destroy();
            shot.destroy();
            shot.firing = false;
            this.sound.play('hit');
        }); 

        this.physics.add.overlap(this.playerProjectileGroup, this.shooterGroup, (shot, enemy) => {
            enemy.active = false;
            enemy.destroy();
            shot.destroy();
            shot.firing = false;
            this.sound.play('hit');
        }); 
    }
}