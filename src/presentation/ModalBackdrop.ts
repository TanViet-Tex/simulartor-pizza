import type Phaser from 'phaser';

export const MODAL_BACKDROP_ALPHA=.6;

/** Scenes reset their background targets before adding modal controls above this blocker. */
export function drawModalBackdrop(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,alpha=MODAL_BACKDROP_ALPHA):void {
  const shade=scene.add.graphics();shade.fillStyle(0x000000,alpha).fillRect(0,0,360,640);layer.add(shade);
  const blocker=scene.add.zone(0,0,360,640).setOrigin(0).setInteractive();layer.add(blocker);
  scene.game.canvas.dataset.modalBackdrop=JSON.stringify({alpha});
}
