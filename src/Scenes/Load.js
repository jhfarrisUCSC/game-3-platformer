class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet
        this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");

        // Load tilemap information
        this.load.image("industrial_tiles", "industrial_tiles.png");
        this.load.image("base_tiles", "base_tiles.png");
        this.load.image("characters", "tilemap-characters_packed.png");
        this.load.image("ending", "endscreen.png");

        this.load.tilemapTiledJSON("platformer-level-1", "platformer-level-1.tmj");   // Tilemap in JSON

        this.load.tilemapTiledJSON("game3bmap", "game3bmap.tmj");   // Tilemap in JSON
        this.load.tilemapTiledJSON("game3bmap1", "game3bmap1.tmj");   // Tilemap in JSON


        // audio
        this.load.audio('walking', 'footstep_carpet_003.ogg');
        this.load.audio('ding', 'impactMetal_light_000.ogg');
        this.load.audio('switch', 'switch_006.ogg');
        this.load.audio('door', 'open_001.ogg');
        this.load.audio('key', 'impactMetal_heavy_000.ogg');
        this.load.audio('jumping', 'drop_001.ogg');
        this.load.audio('dies', 'error_001.ogg');

        // Load the tilemap as a spritesheet
        this.load.spritesheet("base_sheet", "base_tiles.png", {
            frameWidth: 18,
            frameHeight: 18
        });
        this.load.spritesheet("industrial_sheet", "industrial_tiles.png", {
            frameWidth: 18,
            frameHeight: 18
        });
        this.load.spritesheet("character_sheet", "tilemap-characters_packed.png", {
            frameWidth: 24,
            frameHeight: 24
        });

        // Oooh, fancy. A multi atlas is a texture atlas which has the textures spread
        // across multiple png files, so as to keep their size small for use with
        // lower resource devices (like mobile phones).
        // kenny-particles.json internally has a list of the png files
        // The multiatlas was created using TexturePacker and the Kenny
        // Particle Pack asset pack.
        this.load.multiatlas("kenny-particles", "kenny-particles.json");
    }

    create() {
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 0,
                end: 1,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0000.png" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0001.png" }
            ],
        });

        // coin animation
        this.anims.create({
            key: 'coin',
            frames: this.anims.generateFrameNumbers('base_sheet', {
                start: 151,
                end: 152
            }),
            duration: 1600,
            repeat: -1
        });

        // mover animation
        this.anims.create({
            key: 'mover',
            frames: this.anims.generateFrameNames('character_sheet', {
                start: 15,
                end: 16
            }),
            duration: 1600,
            repeat: -1
        });

         // ...and pass to the next Scene
         this.scene.start("level2Scene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}