class End extends Phaser.Scene {
    constructor() {
        super("endScene");
    }

    create() {
        this.add.image(810, 360, "ending");

        this.rKey = this.input.keyboard.addKey('R');

    }

    update() {
        
        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.start("platformerScene");
        }
    }
}