import type Phaser from 'phaser';

export const MODAL_BACKDROP_ALPHA=.28;

/** Scenes reset their background targets before adding modal controls above this blocker. */
export function drawModalBackdrop(scene:Phaser.Scene,layer:Phaser.GameObjects.Container):void {
  const shade=scene.add.graphics();shade.fillStyle(0x000000,MODAL_BACKDROP_ALPHA).fillRect(0,0,360,640);layer.add(shade);
  const blocker=scene.add.zone(0,0,360,640).setOrigin(0).setInteractive();layer.add(blocker);
  scene.game.canvas.dataset.modalBackdrop=JSON.stringify({alpha:MODAL_BACKDROP_ALPHA});
}
