import Phaser from 'phaser';


import {MainScene} from './scenes/main_scene';


// Phaser game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // Automatically choose WebGL or Canvas
  width: 1280/2,        // Width of the game canvas in pixels
  height: 1280/2,       // Height of the game canvas in pixels
  parent: 'game-container', // The ID of the HTML element to attach the canvas to
  backgroundColor: '#212121', // Background color if image doesn't cover everything
  scene: [MainScene], // The scene(s) to start the game with
};

// Create the Phaser game instance
const game = new Phaser.Game(config);