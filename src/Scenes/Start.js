class Start extends Phaser.Scene {
    constructor() {
        super("startScene");
    }

    create() {
        this.add.image(810, 360, "start").setScale(0.5);

        this.spaceKey = this.input.keyboard.addKey('SPACE');

    }

    update() {
        
        if(Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.scene.start("platformerScene");
        }
    }
}